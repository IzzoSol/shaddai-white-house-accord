'use strict';
/* node --test test/assets.test.js — the art tool's key rotation, safety rules and file handling (no network). */
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');

let T;   // the ES module, loaded once
const load = async () => T || (T = await import('../tools/hf-assets.mjs'));
const tmp = () => fs.mkdtempSync(path.join(os.tmpdir(), 'wh-assets-'));
const PNG = Buffer.from('89504e470d0a1a0a', 'hex');

/* a fake fetch that answers from a script: each entry is (token) => response-ish */
function fakeFetch(script, log = []) {
  let i = 0;
  return async (url, init) => {
    const token = init.headers.Authorization.replace('Bearer ', '');
    log.push(token);
    const r = script[Math.min(i++, script.length - 1)](token);
    const h = new Map(Object.entries(r.headers || {}));
    return { ok: r.status === 200, status: r.status, headers: { get: (k) => h.get(k.toLowerCase()) ?? null },
             arrayBuffer: async () => (r.body || PNG).buffer.slice(0), text: async () => r.text || '' };
  };
}
const ok = () => ({ status: 200, headers: { 'content-type': 'image/png' }, body: PNG });
const err = (status, headers = {}) => () => ({ status, headers, text: 'nope' });

test('keys are read from HF_TOKEN_1..6 and HF_TOKEN, de-duplicated', async () => {
  const { KeyRing } = await load();
  const ring = KeyRing.fromEnv({ HF_TOKEN_1: 'a', HF_TOKEN_2: 'b', HF_TOKEN_6: 'c', HF_TOKEN: 'a' });
  assert.equal(ring.size, 3);
});

test('keys rotate round-robin, and the status line never contains a key', async () => {
  const { KeyRing } = await load();
  const ring = KeyRing.fromEnv({ HF_TOKEN_1: 'secret-one', HF_TOKEN_2: 'secret-two' });
  assert.deepEqual([ring.next().n, ring.next().n, ring.next().n], [1, 2, 1]);
  assert.ok(!ring.status().includes('secret'));
});

test('a rejected key is dropped for good; a rate-limited key comes back after its wait; credits wait longer', async () => {
  const { KeyRing } = await load();
  let now = 1000;
  const ring = new KeyRing(['a', 'b', 'c'], () => now);
  const [a, b, c] = ring.slots;
  ring.fail(a, 401); ring.fail(b, 429, 5000); ring.fail(c, 402);
  assert.equal(ring.next(), null);                 // all unavailable right now
  now += 6000;
  assert.equal(ring.next().n, 2);                  // b is back after its 5s; a is dead; c is waiting for credits
  now += 7 * 3600 * 1000;
  assert.equal(ring.next().n, 3);                  // c is back after hours
  assert.ok(a.dead && /rejected/.test(a.why));
});

test('prompts must say "no people" and may not name anyone in the cast', async () => {
  const { checkPrompt, blockedTerms } = await load();
  assert.equal(checkPrompt('an empty dining room at dusk, no people, no text'), true);
  assert.throws(() => checkPrompt('an empty dining room at dusk'), /no people/);
  assert.throws(() => checkPrompt('portrait of Elon Musk, no people'), /no real people/);
  assert.throws(() => checkPrompt('a dramatic scene with Brockman at a desk, no people'), /no real people/);
  assert.ok(blockedTerms().includes('amodei'), 'cast names are read from src/data.js');
});

test('a rate-limited key rotates to the next; the image and a provenance sidecar are written; no key is stored', async () => {
  const { KeyRing, generateAsset } = await load();
  const dir = tmp(), log = [];
  const ring = new KeyRing(['KEY-ONE', 'KEY-TWO']);
  const res = await generateAsset({ asset: { id: 'title-bg', prompt: 'an empty hall, no people' }, defaults: { model: 'm/x', url: 'https://hf.example/{model}', width: 64, height: 64 },
    ring, outDir: dir, fetchImpl: fakeFetch([err(429), ok], log), env: {} });
  assert.equal(res.status, 'made'); assert.deepEqual(log, ['KEY-ONE', 'KEY-TWO']); assert.equal(res.keySlot, 2);
  const prov = fs.readFileSync(path.join(dir, 'title-bg.provenance.json'), 'utf8');
  assert.ok(!prov.includes('KEY-'));
  assert.equal(JSON.parse(prov).host, 'hf.example');
  assert.ok(fs.existsSync(path.join(dir, 'title-bg.png')));
});

test('existing art is kept unless --force; HF_ASSET_URL overrides the endpoint', async () => {
  const { KeyRing, generateAsset } = await load();
  const dir = tmp(), seen = [];
  const ring = new KeyRing(['k']), defaults = { model: 'm/x', url: 'https://one.example/{model}', width: 8, height: 8 };
  const fetchImpl = async (url, init) => { seen.push(url); return fakeFetch([ok])(url, init); };
  const asset = { id: 'a', prompt: 'a room, no people' };
  await generateAsset({ asset, defaults, ring, outDir: dir, fetchImpl, env: { HF_ASSET_URL: 'https://two.example/{model}' } });
  assert.equal(seen[0], 'https://two.example/m/x');
  const again = await generateAsset({ asset, defaults, ring, outDir: dir, fetchImpl, env: {} });
  assert.equal(again.status, 'kept'); assert.equal(seen.length, 1);
  await generateAsset({ asset, defaults, ring, outDir: dir, fetchImpl, env: {}, force: true });
  assert.equal(seen.length, 2);
});

test('if every key fails the tool says so clearly, without printing a key', async () => {
  const { KeyRing, generateAsset } = await load();
  const ring = new KeyRing(['AAA-SECRET', 'BBB-SECRET']);
  await assert.rejects(
    generateAsset({ asset: { id: 'x', prompt: 'a room, no people' }, defaults: { model: 'm', url: 'https://h.example/{model}', width: 8, height: 8 }, ring, outDir: tmp(), fetchImpl: fakeFetch([err(401)]), env: {} }),
    (e) => /no key available|could not make/.test(e.message) && !/SECRET/.test(e.message));
});

test('a model that is still loading (503) is retried with another key', async () => {
  const { KeyRing, generateAsset } = await load();
  const ring = new KeyRing(['a', 'b']);
  const r = await generateAsset({ asset: { id: 'y', prompt: 'a room, no people' }, defaults: { model: 'm', url: 'https://h.example/{model}', width: 8, height: 8 }, ring, outDir: tmp(), fetchImpl: fakeFetch([err(503), ok]), env: {} });
  assert.equal(r.status, 'made');
});

test('assets.list.js is rebuilt from what is on disk', async () => {
  const { writeAssetList } = await load();
  const dir = tmp(), list = path.join(dir, 'list.js');
  fs.writeFileSync(path.join(dir, 'a.png'), PNG);
  fs.writeFileSync(path.join(dir, 'a.provenance.json'), JSON.stringify({ id: 'a', file: 'a.png' }));
  fs.writeFileSync(path.join(dir, 'gone.provenance.json'), JSON.stringify({ id: 'gone', file: 'gone.png' }));   // image missing: not listed
  assert.deepEqual(writeAssetList(dir, list), { a: 'a.png' });
  assert.match(fs.readFileSync(list, 'utf8'), /const ASSET_FILES = \{\s*"a": "a\.png"\s*\};/);
});

test('every prompt in the manifest passes the safety rules, and a dry run needs no keys', async () => {
  const { runAssets } = await load();
  const manifest = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'tools', 'assets-manifest.json'), 'utf8'));
  const res = await runAssets({ manifest, dryRun: true, env: {} });
  assert.equal(res.length, manifest.assets.length);
  assert.ok(res.every((r) => r.status === 'would make'));
});

test('without any key a real run explains what to do', async () => {
  const { runAssets } = await load();
  const manifest = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'tools', 'assets-manifest.json'), 'utf8'));
  await assert.rejects(runAssets({ manifest, env: {} }), /HF_TOKEN_1/);
});
