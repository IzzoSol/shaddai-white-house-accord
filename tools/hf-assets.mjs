// node tools/hf-assets.mjs [--list] [--dry-run] [--only id,id] [--force]
//
// Generates the game's optional art (menu/intro and cutscene backgrounds, ending stills) with your own
// Hugging Face keys, at build time. Keys are read from the environment or a git-ignored .env.local:
//     HF_TOKEN_1 ... HF_TOKEN_6   (or just HF_TOKEN)
// They are never written to a file, a log, or the game. If a key is rejected or hits its limit the tool
// moves on to the next one. Output goes to assets/gen/ with a provenance sidecar per image, and
// src/assets.list.js is rewritten so the game knows what exists. Then run: node build.js
//
// Safety: every prompt must say "no people" and must not name anyone in the cast. This tool makes
// places and objects only — never likenesses of real people.
import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

// ── key ring ────────────────────────────────────────────────────────────────
export class KeyRing {
  constructor(keys, now = Date.now) {
    const seen = new Set();
    this.slots = [];
    keys.forEach((key) => { if (key && !seen.has(key)) { seen.add(key); this.slots.push({ key, n: this.slots.length + 1, until: 0, dead: false, why: '' }); } });
    this.i = 0; this.now = now;
  }
  static fromEnv(env = process.env) {
    const keys = [];
    for (let n = 1; n <= 6; n++) keys.push((env['HF_TOKEN_' + n] || '').trim());
    keys.push((env.HF_TOKEN || '').trim());
    return new KeyRing(keys.filter(Boolean));
  }
  get size() { return this.slots.length; }
  /** Next usable key (round-robin), or null if every key is dead or cooling down. */
  next() {
    for (let k = 0; k < this.slots.length; k++) {
      const slot = this.slots[(this.i + k) % this.slots.length];
      if (!slot.dead && slot.until <= this.now()) { this.i = (this.i + k + 1) % this.slots.length; return slot; }
    }
    return null;
  }
  /** Record a failure: 401/403 = the key is no good; 402/429 = out of quota, wait; anything else = brief pause. */
  fail(slot, status, retryAfterMs) {
    if (status === 401 || status === 403) { slot.dead = true; slot.why = 'rejected (HTTP ' + status + ')'; }
    else if (status === 402) { slot.until = this.now() + (retryAfterMs || 6 * 3600 * 1000); slot.why = 'out of credits'; }
    else if (status === 429) { slot.until = this.now() + (retryAfterMs || 90 * 1000); slot.why = 'rate limited'; }
    else { slot.until = this.now() + (retryAfterMs || 15 * 1000); slot.why = 'error ' + (status || 'network'); }
  }
  /** Never contains a key — safe to print. */
  status() {
    return this.slots.map((s) => `key #${s.n}: ${s.dead ? 'dead — ' + s.why : s.until > this.now() ? 'cooling down — ' + s.why : 'ready'}`).join('; ') || 'no keys set';
  }
}

// ── prompt safety ───────────────────────────────────────────────────────────
const STATIC_BLOCK = ['trump', 'musk', 'zuckerberg', 'pichai', 'amodei', 'huang', 'brockman', 'altman', 'bezos', 'vance', 'likeness', 'lookalike', 'celebrity', 'portrait of', 'photo of a man', 'photo of a woman', 'face of'];
const NEGATIVE = 'people, person, human, face, portrait, real person, celebrity, text, letters, watermark, logo, signature';

export function castNames(dataJs = join(ROOT, 'src', 'data.js')) {
  try { return [...readFileSync(dataJs, 'utf8').matchAll(/name:\s*'([^']+)'/g)].map((m) => m[1]).filter((n) => !/^\?+$/.test(n)); } catch { return []; }
}
export function blockedTerms(dataJs) {
  const words = new Set(STATIC_BLOCK);
  for (const name of castNames(dataJs)) for (const w of name.toLowerCase().split(/\s+/)) if (w.length >= 4 && !['president', 'united', 'states'].includes(w)) words.add(w);
  return [...words];
}
export function checkPrompt(prompt, dataJs) {
  const p = String(prompt || '').toLowerCase();
  if (!/\bno people\b/.test(p)) throw new Error('prompt must say "no people" — this tool makes places and objects only');
  const hit = blockedTerms(dataJs).find((w) => p.includes(w));
  if (hit) throw new Error(`prompt mentions "${hit}" — no real people, names or likenesses`);
  return true;
}

// ── one request ─────────────────────────────────────────────────────────────
const retryMs = (h) => { const n = Number(h); return Number.isFinite(n) && n > 0 ? n * 1000 : 0; };

export async function requestImage({ url, token, body, fetchImpl = globalThis.fetch }) {
  let res;
  try {
    res = await fetchImpl(url, { method: 'POST', headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json', Accept: 'image/*' }, body: JSON.stringify(body) });
  } catch (e) { return { ok: false, status: 0, detail: 'network: ' + e.message }; }
  const type = (res.headers.get('content-type') || '').toLowerCase();
  if (res.ok && type.startsWith('image/')) return { ok: true, bytes: Buffer.from(await res.arrayBuffer()), type };
  let detail = ''; try { detail = (await res.text()).slice(0, 160); } catch {}
  return { ok: false, status: res.status, retryAfterMs: retryMs(res.headers.get('retry-after')), detail };
}

const EXT = { 'image/png': '.png', 'image/jpeg': '.jpg', 'image/jpg': '.jpg', 'image/webp': '.webp' };

export async function generateAsset({ asset, defaults, ring, outDir, force = false, fetchImpl, env = process.env, dataJs }) {
  checkPrompt(asset.prompt, dataJs);
  const existing = ['.png', '.jpg', '.webp'].map((e) => join(outDir, asset.id + e)).find(existsSync);
  if (existing && !force) return { id: asset.id, status: 'kept', file: existing };

  const model = asset.model || defaults.model;
  const url = (env.HF_ASSET_URL || defaults.url).replace('{model}', model);
  const width = asset.width || defaults.width, height = asset.height || defaults.height;
  const body = { inputs: asset.prompt, parameters: { negative_prompt: NEGATIVE + (asset.negative ? ', ' + asset.negative : ''), width, height } };

  let last = 'no attempt made';
  for (let attempt = 0; attempt < Math.max(2, ring.size * 2); attempt++) {
    const slot = ring.next();
    if (!slot) throw new Error(`no key available for "${asset.id}" (${ring.status()})`);
    const r = await requestImage({ url, token: slot.key, body, fetchImpl });
    if (r.ok) {
      const ext = EXT[r.type.split(';')[0]] || '.png';
      mkdirSync(outDir, { recursive: true });
      const file = join(outDir, asset.id + ext);
      writeFileSync(file, r.bytes);
      writeFileSync(join(outDir, asset.id + '.provenance.json'), JSON.stringify({
        id: asset.id, file: asset.id + ext, prompt: asset.prompt, negative: body.parameters.negative_prompt, model, host: new URL(url).host,
        width, height, keySlot: slot.n, sha256: createHash('sha256').update(r.bytes).digest('hex'), bytes: r.bytes.length,
        generatedAt: new Date().toISOString(), tool: 'tools/hf-assets.mjs'
      }, null, 2));
      return { id: asset.id, status: 'made', file, keySlot: slot.n };
    }
    ring.fail(slot, r.status, r.retryAfterMs);
    last = `key #${slot.n}: HTTP ${r.status || 'network error'}${r.detail ? ' — ' + r.detail : ''}`;
  }
  throw new Error(`could not make "${asset.id}" after trying the keys. Last: ${last}`);
}

/** Rewrite src/assets.list.js from the provenance sidecars on disk. */
export function writeAssetList(outDir, listFile) {
  const files = {};
  if (existsSync(outDir)) for (const f of readdirSync(outDir).filter((n) => n.endsWith('.provenance.json')).sort()) {
    try { const p = JSON.parse(readFileSync(join(outDir, f), 'utf8')); if (p.id && p.file && existsSync(join(outDir, p.file))) files[p.id] = p.file; } catch { /* skip a damaged sidecar */ }
  }
  writeFileSync(listFile, '/* generated by tools/hf-assets.mjs — do not edit by hand */\nconst ASSET_FILES = ' + JSON.stringify(files, null, 2) + ';\n');
  return files;
}

export async function runAssets({ manifest, only, force, dryRun, env = process.env, fetchImpl, root = ROOT }) {
  const outDir = join(root, 'assets', 'gen');
  const dataJs = join(root, 'src', 'data.js');
  const wanted = manifest.assets.filter((a) => !only || only.includes(a.id));
  const results = [];
  if (dryRun) { for (const a of wanted) { checkPrompt(a.prompt, dataJs); results.push({ id: a.id, status: 'would make' }); } return results; }
  const ring = KeyRing.fromEnv(env);
  if (!ring.size) throw new Error('no keys found. Put HF_TOKEN_1 … HF_TOKEN_6 (or HF_TOKEN) in your environment or a git-ignored .env.local');
  for (const a of wanted) {
    try { results.push(await generateAsset({ asset: a, defaults: manifest.defaults, ring, outDir, force, fetchImpl, env, dataJs })); }
    catch (e) { results.push({ id: a.id, status: 'failed', error: e.message }); if (/no key available/.test(e.message)) break; }
  }
  writeAssetList(outDir, join(root, 'src', 'assets.list.js'));
  return results;
}

// ── command line ────────────────────────────────────────────────────────────
function loadDotEnv(file) {
  if (!existsSync(file)) return;
  for (const line of readFileSync(file, 'utf8').split(String.fromCharCode(10))) {
    const m = /^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/.exec(line);
    if (m && !(m[1] in process.env)) process.env[m[1]] = m[2].replace(/^['"]|['"]$/g, '');
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  loadDotEnv(join(ROOT, '.env.local'));
  const arg = (k) => { const i = process.argv.indexOf('--' + k); return i > -1 ? process.argv[i + 1] : undefined; };
  const manifest = JSON.parse(readFileSync(join(ROOT, 'tools', 'assets-manifest.json'), 'utf8'));
  if (process.argv.includes('--list')) { manifest.assets.forEach((a) => console.log(a.id.padEnd(16), (a.width || manifest.defaults.width) + 'x' + (a.height || manifest.defaults.height), '—', a.use)); process.exit(0); }
  try {
    const results = await runAssets({ manifest, only: arg('only') ? arg('only').split(',') : null, force: process.argv.includes('--force'), dryRun: process.argv.includes('--dry-run') });
    results.forEach((r) => console.log(r.status.padEnd(10), r.id, r.error ? '— ' + r.error : r.keySlot ? '(key #' + r.keySlot + ')' : ''));
    if (!process.argv.includes('--dry-run')) console.log('\nNow run: node build.js');
    process.exit(results.some((r) => r.status === 'failed') ? 1 : 0);
  } catch (e) { console.error('error: ' + e.message); process.exit(2); }
}
