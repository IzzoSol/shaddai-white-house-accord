/* ==================== world.js — zones, free movement, interactions, aura ====================
   Three connected zones: the East Room (the lunch), the Presidential Gallery (portraits to admire) and the
   South Lawn (rocket, press, fountain). You walk in two directions, with depth: people higher up are smaller.
   AURA is the visible meter you have to keep up. It drains, and it feeds on where you stand, who you shake
   hands with, how you talk, what you admire, and how you handle the press. Everything is scored.      */

/* ------------------------------------------------------------------ data */
const PORTRAITS = [
  { id: 'washington', name: 'George Washington', years: '1789–1797', char: 'pres_washington', quip: 'Washington declined a third term. The portrait has never recovered from the humility.' },
  { id: 'jefferson',  name: 'Thomas Jefferson',  years: '1801–1809', char: 'pres_jefferson',  quip: 'Jefferson wrote the Declaration, then built a house with a dumbwaiter. Range.' },
  { id: 'lincoln',    name: 'Abraham Lincoln',   years: '1861–1865', char: 'pres_lincoln',    quip: 'Lincoln’s two-minute speech outlasted every keynote in this building.' },
  { id: 'troosevelt', name: 'Theodore Roosevelt',years: '1901–1909', char: 'pres_troosevelt', quip: 'Teddy would have asked what the rocket weighed. And then charged it.' },
  { id: 'fdr',        name: 'Franklin D. Roosevelt', years: '1933–1945', char: 'pres_fdr',    quip: 'FDR gave fireside chats. You are about to give a gaggle.' },
  { id: 'ike',        name: 'Dwight D. Eisenhower', years: '1953–1961', char: 'pres_ike',     quip: 'Eisenhower warned about the military-industrial complex. This lunch has a sponsor.' },
  { id: 'jfk',        name: 'John F. Kennedy',   years: '1961–1963', char: 'pres_jfk',        quip: 'Kennedy chose the Moon “not because it is easy.” The rocket outside agrees.' },
  { id: 'reagan',     name: 'Ronald Reagan',     years: '1981–1989', char: 'pres_reagan',     quip: '“Trust, but verify.” Today’s version: sign, then verify.' }
];

/* what ambient people say when you chat (and what a handshake with them is worth) */
const AMBIENT_PEOPLE = {
  sacks:   { name: 'David Sacks', co: 'Special Advisor', rank: 2, chat: ['“This is the Bretton Woods of Super Intelligence.”', '“Frameworks, not fear. Write that down.”'] },
  karp:    { name: 'Alex Karp',   co: 'Palantir',        rank: 2, chat: ['“We must take responsibility for the dangers we know about.”', '“I like a table with a dress code.”'] },
  vance:   { name: 'J.D. Vance',  co: 'Vice President',  rank: 3, chat: ['“Great turnout. Lot of microphones.”', '“Everyone is very supportive of America.”'] },
  bezos:   { name: 'Jeff Bezos',  co: 'Observer',        rank: 3, chat: ['…', '“Delivered. Not the lunch. The silence.”'] },
  johnson: { name: 'Speaker Johnson', co: 'Congress',    rank: 3, chat: ['“It is voluntary. Voluntary. Say it with me.”', '“Please do not say constitution.”'] },
  lisa:    { name: 'Lisa Su',     co: 'AMD',             rank: 2, chat: ['“Nice jacket.” (She is looking at Jensen.)', '“Chips are policy. Quietly.”'] },
  rep1:    { name: 'Dana Whitlock', co: 'Daily Ledger', rank: 1, chat: ['“Is this biosecurity or bandwidth?”', '“Off the record: who typed Unites?”'] },
  rep2:    { name: 'Marcus Oyelaran', co: 'Wire Service', rank: 1, chat: ['“I have four questions and a very small battery.”', '“Who is Dots?”'] },
  rep3:    { name: 'Priya Venkat', co: 'Morning Stream', rank: 1, chat: ['“We are live. Please hold that smile.”', '“Is the rocket included in the budget?”'] },
  rep4:    { name: 'Tomás Ibarra', co: 'Late Edition',  rank: 1, chat: ['“Be quotable. I need a headline.”', '“Say the word ‘tremendous’. Anything.”'] },
  guard:   { name: 'Agent Pruitt', co: 'Secret Service', rank: 1, chat: ['“Sir, ma’am — please keep moving.”', '“Nice portrait of the portrait. Move along.”'] },
  docent:  { name: 'Mrs. Alder',  co: 'Gallery Docent',  rank: 1, chat: ['“Mind the frames. They are older than the Internet.”', '“Most guests admire for two seconds. The portraits notice.”'] }
};
const SIGNER_RANK = { trump: 6, pichai: 4, amodei: 4, zuck: 4, brockman: 4, musk: 4, huang: 4 };
const TALKER_NAME = { tombrown: { name: 'Tom Brown', co: 'Designer · far end of the table' } };

/* ------------------------------------------------------------------ zones */
const SEAT_Y = 500;                                  /* hips of the seated signers */
const seatX = (s) => 60 + s.x * (W - 140);

const ZONES = {
  eastroom: {
    name: 'EAST ROOM', w: 1280, h: 960,
    floor: { x0: 48, y0: 632, x1: 1232, y1: 936 },
    obstacles: [{ x: 190, y: 800, w: 170, h: 70 }, { x: 930, y: 828, w: 170, h: 70 }],
    scale: (y) => 1.22 + (y - 632) / 304 * 0.6,
    portals: [
      { id: 'to-gallery', x: 72, y: 676, r: 54, to: 'hallway', at: { x: 2240, y: 640 }, label: 'THE GALLERY' },
      { id: 'to-lawn', x: 1212, y: 676, r: 54, to: 'lawn', at: { x: 1100, y: 1380 }, label: 'THE SOUTH LAWN' }
    ],
    people: [
      { id: 'sacks', x: 250, y: 860, wander: 30 }, { id: 'karp', x: 330, y: 872, wander: 30 },
      { id: 'vance', x: 1010, y: 884, wander: 30 }, { id: 'bezos', x: 1090, y: 900, wander: 24 },
      { id: 'johnson', x: 940, y: 898, wander: 30 }, { id: 'lisa', x: 640, y: 780, wander: 220 },
      { id: 'tombrown', x: 1190, y: 790, wander: 18, talkId: 'tombrown' }
    ],
    field: (x, y) => {                               /* where the power is */
      const tx = seatX(SEATS.find((q) => q.id === 'trump'));
      const d = Math.abs(x - tx);
      if (y < 760 && d < 190) return { rate: 0.95, why: 'power position' };
      if (d < 420 && y < 840) return { rate: 0.2, why: 'near the head of the table' };
      if (y > 890 || x < 120 || x > 1160) return { rate: -0.5, why: 'outer orbit' };
      return { rate: 0, why: '' };
    }
  },
  hallway: {
    name: 'THE GALLERY', w: 2400, h: 720,
    floor: { x0: 60, y0: 470, x1: 2340, y1: 688 },
    obstacles: [{ x: 1180, y: 540, w: 120, h: 40 }],
    scale: (y) => 1.28 + (y - 470) / 218 * 0.5,
    portals: [
      { id: 'to-eastroom', x: 2352, y: 600, r: 56, to: 'eastroom', at: { x: 120, y: 700 }, label: 'THE EAST ROOM' },
      { id: 'to-lawn-h', x: 48, y: 600, r: 56, to: 'lawn', at: { x: 300, y: 1390 }, label: 'THE SOUTH LAWN' }
    ],
    people: [{ id: 'guard', x: 2100, y: 600, wander: 20 }, { id: 'docent', x: 1450, y: 620, wander: 60 }],
    field: () => ({ rate: 0.05, why: '' })
  },
  lawn: {
    name: 'THE SOUTH LAWN', w: 1280, h: 1500,
    floor: { x0: 56, y0: 600, x1: 1224, y1: 1456 },
    obstacles: [{ x: 540, y: 880, w: 200, h: 92 }, { x: 380, y: 1020, w: 520, h: 70 }, { x: 470, y: 590, w: 340, h: 70 }],
    scale: (y) => 0.95 + (y - 600) / 856 * 0.8,
    portals: [{ id: 'to-gallery-l', x: 220, y: 1462, r: 60, to: 'hallway', at: { x: 150, y: 600 }, label: 'THE GALLERY' },
              { id: 'to-eastroom-l', x: 1130, y: 1462, r: 60, to: 'eastroom', at: { x: 1140, y: 700 }, label: 'THE EAST ROOM' }],
    people: [
      { id: 'rep1', x: 470, y: 1130, wander: 40 }, { id: 'rep2', x: 640, y: 1150, wander: 40 },
      { id: 'rep3', x: 800, y: 1130, wander: 40 }, { id: 'rep4', x: 330, y: 1160, wander: 40 },
      { id: 'sacks_l', ref: 'sacks', x: 960, y: 1250, wander: 50, off: true }
    ],
    field: (x, y) => {
      const d = Math.hypot(x - 640, y - 1140);
      if (d < 280) return { rate: 0.8, why: 'on camera' };
      return { rate: 0, why: '' };
    }
  }
};
ZONES.lawn.people = ZONES.lawn.people.filter((p) => !p.off);

const AURA_START = 55;

/* ------------------------------------------------------------------ state */
function worldReset(playerId) {
  const st = STARTS[playerId];
  G.zone = 'eastroom';
  G.px = st ? 60 + st.x * (W - 140) : 640; G.py = 720;
  G.cam = { x: 0, y: 0 };
  G.facing = 1; G.moveTo = null; G.focus = null; G.admiring = null; G.hs = null;
  G.aura = AURA_START; G.auraPeak = AURA_START; G.auraFloat = [];
  G.auraStats = { handshakes: {}, portraits: {}, chats: {}, talks: 0, presence: 0, alone: 0, rocket: false, press: 0, pressAsked: 0, lowest: AURA_START, log: {} };
  G.faded = 0; G.aloneT = 0; G.fieldWhy = '';
  G.npcs = {};
  for (const zid of Object.keys(ZONES)) for (const p of ZONES[zid].people) G.npcs[p.id] = { x: p.x, y: p.y, tx: p.x, ty: p.y, wait: 1 + (idHash(p.id) % 30) / 10, zone: zid, face: 1 };
}

function addAura(delta, why, key) {
  if (!delta) return;
  const before = G.aura;
  G.aura = Math.max(0, Math.min(100, G.aura + delta));
  G.auraPeak = Math.max(G.auraPeak, G.aura);
  G.auraStats.lowest = Math.min(G.auraStats.lowest, G.aura);
  const k = key || why;
  G.auraStats.log[k] = (G.auraStats.log[k] || 0) + (G.aura - before);
  G.auraFloat.push({ text: (delta > 0 ? '+' : '') + Math.round(delta * 10) / 10 + ' ' + why, t: 0, good: delta > 0 });
  if (G.auraFloat.length > 6) G.auraFloat.shift();
}
/* the meter changes how people treat you */
function auraTier() { return G.aura >= 80 ? 'radiant' : G.aura <= 25 ? 'fading' : 'steady'; }
function auraScale(base) {
  if (base > 0 && G.aura >= 80) return Math.round(base * 1.25);
  if (base > 0 && G.aura <= 25) return Math.round(base * 0.75);
  if (base < 0 && G.aura <= 25) return Math.round(base * 1.25);
  return base;
}

/* ------------------------------------------------------------------ geometry */
function rectHit(r, x, y, pad) { return x > r.x - pad && x < r.x + r.w + pad && y > r.y - pad && y < r.y + r.h + pad; }
function walkable(z, x, y) {
  const f = z.floor;
  if (x < f.x0 || x > f.x1 || y < f.y0 || y > f.y1) return false;
  for (const o of z.obstacles) if (rectHit(o, x, y, 14)) return false;
  return true;
}
function stepToward(z, x, y, dx, dy) {
  /* axis-separated so you slide along walls and furniture instead of sticking */
  let nx = x + dx, ny = y;
  if (!walkable(z, nx, ny)) nx = x;
  ny = y + dy;
  if (!walkable(z, nx, ny)) ny = y;
  return { x: nx, y: ny };
}
function npcDef(id) { return AMBIENT_PEOPLE[id] || TALKER_NAME[id] || null; }
function npcPos(zone, id) { const n = G.npcs[id]; return n && n.zone === zone ? n : null; }

/* what you can interact with here, nearest first */
function worldTargets() {
  const z = ZONES[G.zone], out = [];
  if (G.zone === 'eastroom') {
    for (const s of SEATS) {
      if (s.id === G.playerId) continue;
      const sx = seatX(s);
      out.push({ kind: 'signer', id: s.id, x: sx, y: 650, r: 118, label: s.id === 'trump' ? 'THE PRESIDENT' : CAST.find((k) => k.id === s.id).name.toUpperCase(), person: true });
    }
  }
  for (const p of z.people) {
    const n = G.npcs[p.id];
    const def = npcDef(p.id);
    out.push({ kind: p.talkId ? 'talker' : 'ambient', id: p.id, x: n.x, y: n.y, r: 96, label: def.name.toUpperCase(), person: true });
  }
  if (G.zone === 'hallway') for (let i = 0; i < PORTRAITS.length; i++) out.push({ kind: 'portrait', id: PORTRAITS[i].id, x: portraitX(i), y: 586, r: 96, label: PORTRAITS[i].name.toUpperCase() });
  if (G.zone === 'lawn') {
    out.push({ kind: 'rocket', id: 'rocket', x: 640, y: 690, r: 130, label: 'THE ROCKET' });
    out.push({ kind: 'press', id: 'press', x: 640, y: 1090, r: 130, label: 'THE PODIUM' });
  }
  for (const p of z.portals) out.push({ kind: 'portal', id: p.id, x: p.x, y: p.y, r: p.r, label: p.label, portal: p });
  return out;
}
const portraitX = (i) => 250 + i * 270;

/* ------------------------------------------------------------------ update */
function worldUpdate(dt) {
  const z = ZONES[G.zone];
  G.roomT += dt;
  const k = keys;
  const left = k['arrowleft'] || k['a'], right = k['arrowright'] || k['d'], up = k['arrowup'] || k['w'], down = k['arrowdown'] || k['s'];
  const busy = !!G.hs || !!G.admiring;
  let dx = (right ? 1 : 0) - (left ? 1 : 0), dy = (down ? 1 : 0) - (up ? 1 : 0);
  if (busy && (dx || dy)) { G.admiring = null; if (G.hs && G.hs.t > 0.15) G.hs = null; }
  const SPEED = 215;
  if (dx || dy) { G.moveTo = null; const m = Math.hypot(dx, dy); dx /= m; dy /= m; }
  else if (G.moveTo && !busy) {
    const tx = G.moveTo.x - G.px, ty = G.moveTo.y - G.py, d = Math.hypot(tx, ty);
    if (d < 8) { const cb = G.moveTo.then; G.moveTo = null; if (cb) cb(); }
    else { dx = tx / d; dy = ty / d; }
  }
  let vx = 0, vy = 0;
  if ((dx || dy) && !G.hs) {
    const p = stepToward(z, G.px, G.py, dx * SPEED * dt, dy * SPEED * dt);
    vx = (p.x - G.px) / Math.max(dt, 1e-6); vy = (p.y - G.py) / Math.max(dt, 1e-6);
    if (Math.abs(vx) + Math.abs(vy) < 8 && G.moveTo) G.moveTo = null;          /* pinned against something */
    G.px = p.x; G.py = p.y;
  }
  G.vx = vx; G.vy = vy;
  const moving = Math.abs(vx) + Math.abs(vy) > 6;
  G.walkPhase = moving ? G.walkPhase + Math.hypot(vx, vy) * 0.036 * dt * 60 / 60 * 1.2 : 0;
  if (Math.abs(vx) > 6) G.facing = vx < 0 ? -1 : 1;
  G.playerX = G.px / z.w;                                                          /* kept for the ambient jokes */

  /* camera */
  const tcx = Math.max(0, Math.min(z.w - W, G.px - W / 2)), tcy = Math.max(0, Math.min(z.h - H, G.py - H * 0.62));
  G.cam.x += (tcx - G.cam.x) * Math.min(1, dt * 5); G.cam.y += (tcy - G.cam.y) * Math.min(1, dt * 5);

  /* people wander a little */
  for (const p of z.people) {
    const n = G.npcs[p.id];
    n.wait -= dt;
    if (n.wait <= 0) {
      const h = idHash(p.id + ':' + Math.floor(G.t / 3));
      const a = (h % 628) / 100, r = ((h >> 10) % 100) / 100 * p.wander;
      const tx = p.x + Math.cos(a) * r, ty = p.y + Math.sin(a) * r * 0.45;
      if (walkable(z, tx, ty)) { n.tx = tx; n.ty = ty; }
      n.wait = 2.5 + (h % 40) / 10;
    }
    const ddx = n.tx - n.x, ddy = n.ty - n.y, dd = Math.hypot(ddx, ddy);
    if (dd > 3) { const sp = Math.min(dd, 38 * dt); n.x += ddx / dd * sp; n.y += ddy / dd * sp; n.walking = true; if (Math.abs(ddx) > 2) n.face = ddx < 0 ? -1 : 1; } else n.walking = false;
  }

  if (G.human && !G.sealed) {
    G.clock -= dt;
    if (G.clock <= 0) { G.clock = 0; G.sealed = true; toast('The press conference is starting. Everyone to the lawn!'); startPressConference(true); return; }
  }
  if (G.human && !G.doorHint && G.roomT > 7) { G.doorHint = true; toast('Doors: far left = the Gallery, far right = the South Lawn. Click one or walk into it.'); }
  /* what is in front of you */
  const targets = worldTargets();
  let best = null, bd = 1e9;
  for (const t of targets) {
    const d = Math.hypot(t.x - G.px, (t.y - G.py) * 1.6);
    if (d < t.r && d < bd) { best = t; bd = d; }
  }
  G.focus = best;
  if (best && best.kind === 'portal' && !busy && Math.hypot(best.x - G.px, (best.y - G.py) * 0.8) < 48) { enterZone(best.portal.to, best.portal.at); return; }

  /* handshake timing window */
  if (G.hs) updateHandshake(dt);
  /* admiring a portrait */
  if (G.admiring) {
    G.admiring.t += dt;
    if (!G.focus || G.focus.id !== G.admiring.id) G.admiring = null;
    else if (G.admiring.t >= 2.0) finishAdmire(G.admiring.id);
  }

  /* ---------- aura dynamics ---------- */
  let rate = -0.35;                                                                 /* it drains: keep it up */
  const f = z.field(G.px, G.py);
  rate += f.rate; G.fieldWhy = f.why;
  if (f.rate > 0.4) G.auraStats.presence += dt;
  let near = false;
  for (const t of targets) if (t.person && Math.hypot(t.x - G.px, t.y - G.py) < 190) { near = true; break; }
  G.aloneT = near ? 0 : G.aloneT + dt;
  if (G.aloneT > 6) { rate -= 0.5; G.auraStats.alone += dt; G.fieldWhy = 'lingering alone'; }
  G.aura = Math.max(0, Math.min(100, G.aura + rate * dt));
  G.auraStats.lowest = Math.min(G.auraStats.lowest, G.aura);
  G.auraPeak = Math.max(G.auraPeak, G.aura);
  if (G.aura <= 0) { G.faded += dt; if (G.faded > 4) { G.endingId = 'faded'; G.screen = 'end'; sfx('bad'); } } else G.faded = 0;
  for (const fl of G.auraFloat) fl.t += dt;
  G.auraFloat = G.auraFloat.filter((fl) => fl.t < 2.4);
  if (auraTier() === 'radiant' && !G.flags.__radiant) { G.flags.__radiant = true; toast('Your aura is radiant. People lean in. Gains are bigger.'); }
  if (auraTier() === 'fading' && !G.flags.__fading) { G.flags.__fading = true; toast('Your aura is fading. People look past you. Go be seen.'); }
  if (auraTier() === 'steady') { G.flags.__radiant = false; G.flags.__fading = false; }
}

function enterZone(zid, at) {
  G.zone = zid; G.px = at.x; G.py = at.y; G.moveTo = null; G.focus = null; G.admiring = null;
  G.cam.x = Math.max(0, Math.min(ZONES[zid].w - W, G.px - W / 2)); G.cam.y = Math.max(0, Math.min(ZONES[zid].h - H, G.py - H * 0.62));
  fadeT = 0;
  toast(ZONES[zid].name);
  sfx('ui');
}

/* ------------------------------------------------------------------ interactions */
function interactPrimary() {
  const f = G.focus;
  if (!f || G.hs || G.admiring) { if (G.hs) handshakePress(); return; }
  if (f.kind === 'signer') {
    if (f.id === 'trump') { if (G.talksDone.length >= 3) startCutscene('desk'); else toast('The pen comes at the signing. Mingle first — three conversations.'); return; }
    if (G.talksDone.length >= 3 && G.talksDone.indexOf(f.id) === -1) { toast('Three conversations is the rule. The pen is up.'); return; }
    openTalk(f.id);
  } else if (f.kind === 'talker') { openTalk('tombrown'); }
  else if (f.kind === 'ambient') chatWith(f.id);
  else if (f.kind === 'portrait') G.admiring = { id: f.id, t: 0 };
  else if (f.kind === 'portal') enterZone(f.portal.to, f.portal.at);
  else if (f.kind === 'rocket') { if (G.auraStats.rocket) toast('The rocket has already left. The pad is still warm.'); else startCutscene('launch'); }
  else if (f.kind === 'press') startPressConference();
}
function interactHandshake() {
  const f = G.focus;
  if (G.hs) { handshakePress(); return; }
  if (!f || !f.person || G.admiring) return;
  startHandshake(f.id);
}

/* a quick chat with someone who is not at the table */
function chatWith(id) {
  const def = AMBIENT_PEOPLE[id]; if (!def) return;
  const st = G.auraStats.chats;
  const n = (st[id] || 0);
  toast(def.name + ': ' + def.chat[n % def.chat.length]);
  st[id] = n + 1;
  if (n === 0) addAura(auraScale(def.rank >= 3 ? 3 : 2), 'chat with ' + def.name.split(' ').pop().toLowerCase(), 'chats');
  else if (n >= 3) addAura(-1, 'overstayed', 'chats');
  sfx('talk');
}

/* ---- handshake: a ring closes on the hand; press F/E/Space/click when it meets the circle ---- */
function startHandshake(id) {
  const rank = SIGNER_RANK[id] || (AMBIENT_PEOPLE[id] ? AMBIENT_PEOPLE[id].rank : 1);
  G.hs = { id: id, t: 0, dur: 1.5, ideal: 1.05, rank: rank, done: null };
  G.moveTo = null;
}
function handshakePress() {
  const h = G.hs; if (!h || h.done) return;
  const e = Math.abs(h.t - h.ideal);
  const first = !G.auraStats.handshakes[h.id];
  if (e < 0.11) h.done = { q: 'perfect', d: first ? h.rank + 2 : 0, text: 'firm, brief, perfect' };
  else if (e < 0.26) h.done = { q: 'good', d: first ? Math.max(1, Math.round(h.rank * 0.6)) : 0, text: 'solid shake' };
  else h.done = { q: 'miss', d: -2, text: h.t < h.ideal ? 'too eager' : 'left hanging' };
  finishHandshake();
}
function updateHandshake(dt) {
  const h = G.hs; if (!h) return;
  h.t += dt;
  if (!h.done && h.t > h.dur) { h.done = { q: 'miss', d: -2, text: 'left hanging' }; finishHandshake(); }
  if (h.done) { h.hold = (h.hold || 0) + dt; if (h.hold > 0.7) G.hs = null; }
}
function finishHandshake() {
  const h = G.hs, first = !G.auraStats.handshakes[h.id];
  if (first && h.done.q !== 'miss') G.auraStats.handshakes[h.id] = h.done.q;
  else if (!first && h.done.q !== 'miss') h.done = { q: 'repeat', d: -1, text: 'again? weird' };
  if (h.done.d) addAura(auraScale(h.done.d), 'handshake: ' + h.done.text, 'handshakes');
  sfx(h.done.q === 'miss' || h.done.q === 'repeat' ? 'bad' : 'good');
}

function finishAdmire(id) {
  G.admiring = null;
  const idx = PORTRAITS.findIndex((p) => p.id === id);
  if (idx < 0 || G.auraStats.portraits[id]) { toast('You have admired this one. It remembers.'); return; }
  G.auraStats.portraits[id] = true;
  toast(PORTRAITS[idx].name + ' — ' + PORTRAITS[idx].quip);
  addAura(auraScale(3), 'admired ' + PORTRAITS[idx].name.split(' ').pop(), 'portraits');
  sfx('good');
  if (Object.keys(G.auraStats.portraits).length === PORTRAITS.length) { addAura(10, 'connoisseur bonus', 'portraits'); toast('You admired every president. Aura earned. The docent nods once.'); }
}

/* ---- click-to-move: click the ground to walk there, click a person or a thing to walk up and use it ---- */
function worldClick(sx, sy) {
  if (G.hs) { handshakePress(); return; }
  const wx = sx + G.cam.x, wy = sy + G.cam.y, z = ZONES[G.zone];
  const targets = worldTargets();
  let hit = null, bd = 1e9;
  for (const t of targets) {
    if (t.kind === 'portal' && Math.abs(wx - t.x) < 90 && wy > t.y - 520 && wy < t.y + 80) { hit = t; bd = 0; break; }
    const body = t.person ? 70 : (t.kind === 'portrait' ? 130 : 90);
    const cy = t.person ? t.y - 60 : (t.kind === 'portrait' ? 330 : t.y - 40);
    const d = Math.hypot(t.x - wx, (cy - wy) * (t.kind === 'portrait' ? 0.6 : 1));
    if (d < body && d < bd) { hit = t; bd = d; }
  }
  if (hit) {
    const dist = Math.hypot(hit.x - G.px, (hit.y - G.py) * 1.6);
    if (dist < hit.r) { G.focus = hit; interactPrimary(); return; }
    const spot = nearestWalkable(z, hit.x, hit.y + (hit.kind === 'portrait' ? 0 : 36));
    G.moveTo = { x: spot.x, y: spot.y, then: () => { const t2 = worldTargets().find((q) => q.id === hit.id); if (t2) { G.focus = t2; interactPrimary(); } } };
    return;
  }
  const f = z.floor;
  if (wx > f.x0 - 40 && wx < f.x1 + 40 && wy > f.y0 - 40 && wy < f.y1 + 40) {
    const spot = nearestWalkable(z, Math.max(f.x0, Math.min(f.x1, wx)), Math.max(f.y0, Math.min(f.y1, wy)));
    G.moveTo = { x: spot.x, y: spot.y };
  }
}
function nearestWalkable(z, x, y) {
  if (walkable(z, x, y)) return { x: x, y: y };
  for (let r = 10; r < 260; r += 10) for (let a = 0; a < 6.28; a += 0.5) { const px = x + Math.cos(a) * r, py = y + Math.sin(a) * r; if (walkable(z, px, py)) return { x: px, y: py }; }
  return { x: G.px, y: G.py };
}

/* ------------------------------------------------------------------ the report */
function auraReport() {
  const S = G.auraStats;
  const hs = Object.keys(S.handshakes).length, ps = Object.keys(S.portraits).length;
  const parts = [
    { id: 'presence',  label: 'Presence',        detail: Math.round(S.presence) + 's in power positions', pts: Math.round(S.presence * 3) },
    { id: 'hands',     label: 'Handshakes',      detail: hs + ' good ones',                                 pts: hs * 45 },
    { id: 'art',       label: 'Art appreciation',detail: ps + ' of ' + PORTRAITS.length + ' portraits',     pts: ps * 40 + (ps === PORTRAITS.length ? 80 : 0) },
    { id: 'talk',      label: 'Conversations',   detail: S.talks + ' real talks',                           pts: S.talks * 60 },
    { id: 'press',     label: 'Press handling',  detail: S.pressAsked + ' questions answered',              pts: Math.round(S.press) },
    { id: 'rocket',    label: 'The rocket',      detail: S.rocket ? 'watched it leave' : 'never looked up', pts: S.rocket ? 70 : 0 },
    { id: 'aura',      label: 'Final aura',      detail: Math.round(G.aura) + ' (peak ' + Math.round(G.auraPeak) + ')', pts: Math.round(G.aura * 4) },
    { id: 'alone',     label: 'Lingering alone', detail: Math.round(S.alone) + 's by yourself',             pts: -Math.round(S.alone * 3) }
  ];
  const score = Math.max(0, parts.reduce((a, p) => a + p.pts, 0));
  const rank = score >= 1100 ? 'S' : score >= 850 ? 'A' : score >= 600 ? 'B' : score >= 380 ? 'C' : 'D';
  const title = { S: 'UNTOUCHABLE', A: 'MAGNETIC', B: 'WELL-KNOWN', C: 'FORGETTABLE-ISH', D: 'BACKGROUND EXTRA' }[rank];
  return { parts: parts, score: score, rank: rank, title: title };
}

/* ------------------------------------------------------------------ drawing */
function drawGalleryPortrait(c, p, i, t, seen) {
  const x = portraitX(i), fy = 168, fw = 170, fh = 212;
  /* spotlight */
  const sg = c.createRadialGradient(x, fy + fh / 2, 20, x, fy + fh / 2, 190);
  sg.addColorStop(0, 'rgba(255,230,170,0.28)'); sg.addColorStop(1, 'rgba(255,230,170,0)');
  c.fillStyle = sg; c.fillRect(x - 200, fy - 40, 400, 340);
  /* frame */
  c.fillStyle = '#6b4a14'; rr(c, x - fw / 2 - 12, fy - 12, fw + 24, fh + 24, 6); c.fill();
  c.fillStyle = '#c9a227'; rr(c, x - fw / 2 - 8, fy - 8, fw + 16, fh + 16, 4); c.fill();
  c.fillStyle = '#7d5a1a'; rr(c, x - fw / 2 - 2, fy - 2, fw + 4, fh + 4, 2); c.fill();
  /* canvas + bust */
  c.save(); rr(c, x - fw / 2, fy, fw, fh, 2); c.clip();
  const bg = c.createLinearGradient(0, fy, 0, fy + fh); bg.addColorStop(0, '#3a2a1a'); bg.addColorStop(1, '#17100a');
  c.fillStyle = bg; c.fillRect(x - fw / 2, fy, fw, fh);
  drawFigure(c, p.char, x, fy + fh + 14, 3.0, { pose: 'stand', t: 0 });
  c.globalCompositeOperation = 'multiply'; c.fillStyle = 'rgba(176,132,70,0.55)'; c.fillRect(x - fw / 2, fy, fw, fh);
  c.globalCompositeOperation = 'source-over';
  const vg = c.createRadialGradient(x, fy + fh * 0.45, 30, x, fy + fh * 0.45, 140); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,0.55)');
  c.fillStyle = vg; c.fillRect(x - fw / 2, fy, fw, fh);
  c.restore();
  /* plaque */
  c.fillStyle = '#b08a2a'; rr(c, x - 78, fy + fh + 22, 156, 40, 3); c.fill();
  c.fillStyle = '#2a1d08'; c.font = 'bold 12px Georgia, serif'; c.textAlign = 'center';
  c.fillText(p.name.toUpperCase().length > 24 ? p.name.split(' ').slice(-1)[0].toUpperCase() : p.name.toUpperCase(), x, fy + fh + 40);
  c.font = '11px Georgia, serif'; c.fillText(p.years, x, fy + fh + 55);
  if (seen) { c.fillStyle = '#7ef0a8'; c.beginPath(); c.arc(x + fw / 2 + 4, fy - 4, 11, 0, 7); c.fill(); c.fillStyle = '#0b1a10'; c.font = 'bold 14px Georgia'; c.fillText('✓', x + fw / 2 + 4, fy + 1); }
}

function drawGallery(c, t) {
  const z = ZONES.hallway;
  /* wall */
  const wg = c.createLinearGradient(0, 0, 0, 470); wg.addColorStop(0, '#2b1c12'); wg.addColorStop(1, '#3e2a1a');
  c.fillStyle = wg; c.fillRect(0, 0, z.w, 470);
  for (let x = 0; x < z.w; x += 90) { c.fillStyle = 'rgba(0,0,0,0.12)'; c.fillRect(x, 0, 3, 470); }
  c.fillStyle = '#c9a227'; c.fillRect(0, 56, z.w, 6); c.fillStyle = '#7d5a1a'; c.fillRect(0, 62, z.w, 12);       /* crown molding */
  c.fillStyle = '#4a3220'; c.fillRect(0, 430, z.w, 44); c.fillStyle = '#c9a227'; c.fillRect(0, 430, z.w, 4);     /* chair rail */
  /* floor: marble + a long red runner */
  const fg = c.createLinearGradient(0, 474, 0, z.h); fg.addColorStop(0, '#2a2622'); fg.addColorStop(1, '#16130f');
  c.fillStyle = fg; c.fillRect(0, 474, z.w, z.h - 474);
  for (let x = 0; x < z.w; x += 120) { c.fillStyle = 'rgba(255,255,255,0.03)'; c.fillRect(x, 474, 60, z.h - 474); }
  c.fillStyle = '#5d1327'; c.fillRect(40, 500, z.w - 80, 150);
  c.strokeStyle = '#c9a227'; c.lineWidth = 3; c.strokeRect(46, 506, z.w - 92, 138);
  c.strokeStyle = 'rgba(201,162,39,0.35)'; c.lineWidth = 1.5; c.strokeRect(58, 518, z.w - 116, 114);
  /* portraits */
  PORTRAITS.forEach((p, i) => drawGalleryPortrait(c, p, i, t, !!(G.auraStats && G.auraStats.portraits[p.id])));
  /* the reserved frame at the end */
  const rx = portraitX(PORTRAITS.length) + 20;
  c.fillStyle = '#c9a227'; rr(c, rx - 70, 176, 140, 196, 5); c.fill(); c.fillStyle = '#17100a'; rr(c, rx - 62, 184, 124, 180, 3); c.fill();
  c.fillStyle = 'rgba(245,239,221,0.5)'; c.font = 'italic 13px Georgia, serif'; c.textAlign = 'center'; c.fillText('RESERVED', rx, 282);
  /* bench in the middle */
  c.fillStyle = '#3a2412'; rr(c, 1180, 548, 120, 22, 4); c.fill(); c.fillStyle = '#c9a227'; c.fillRect(1186, 570, 6, 16); c.fillRect(1288, 570, 6, 16);
  /* doors */
  for (const side of [0, 1]) {
    const dx = side ? z.w - 96 : 12;
    c.fillStyle = '#1a1008'; rr(c, dx, 250, 84, 226, 4); c.fill(); c.strokeStyle = '#c9a227'; c.lineWidth = 3; rr(c, dx, 250, 84, 226, 4); c.stroke();
    c.fillStyle = 'rgba(245,239,221,0.65)'; c.font = 'bold 11px Georgia'; c.textAlign = 'center';
    c.fillText(side ? 'EAST ROOM' : 'SOUTH LAWN', dx + 42, 238);
    const dg = c.createLinearGradient(dx, 0, dx + (side ? -60 : 84), 0); dg.addColorStop(0, 'rgba(255,214,140,0.35)'); dg.addColorStop(1, 'rgba(255,214,140,0)');
    c.fillStyle = dg; c.fillRect(dx - (side ? 60 : 0), 476, 144, 210);
  }
}

function drawRocket(c, x, y, s, t, flame) {
  c.save(); c.translate(x, y); c.scale(s, s);
  /* launch tower */
  c.fillStyle = '#2a2f3a'; c.fillRect(70, -340, 18, 340); c.fillRect(70, -340, 54, 8); c.fillRect(70, -250, 50, 6); c.fillRect(70, -150, 50, 6);
  for (let i = 0; i < 8; i++) { c.strokeStyle = '#3a4150'; c.lineWidth = 2; c.beginPath(); c.moveTo(70, -340 + i * 42); c.lineTo(88, -298 + i * 42); c.stroke(); }
  /* legs + pad */
  c.fillStyle = '#20242c'; c.beginPath(); c.moveTo(-70, 0); c.lineTo(70, 0); c.lineTo(58, -14); c.lineTo(-58, -14); c.closePath(); c.fill();
  c.fillStyle = '#9aa3b4'; c.beginPath(); c.moveTo(-34, -14); c.lineTo(-62, 0); c.lineTo(-52, 0); c.lineTo(-24, -14); c.fill(); c.beginPath(); c.moveTo(34, -14); c.lineTo(62, 0); c.lineTo(52, 0); c.lineTo(24, -14); c.fill();
  /* fins */
  c.fillStyle = '#c9ced8'; c.beginPath(); c.moveTo(-26, -90); c.lineTo(-58, -26); c.lineTo(-26, -34); c.closePath(); c.fill();
  c.beginPath(); c.moveTo(26, -90); c.lineTo(58, -26); c.lineTo(26, -34); c.closePath(); c.fill();
  /* body */
  const bg = c.createLinearGradient(-30, 0, 30, 0); bg.addColorStop(0, '#aeb6c6'); bg.addColorStop(0.45, '#f4f6fa'); bg.addColorStop(1, '#8c95a8');
  c.fillStyle = bg; c.beginPath(); c.moveTo(-30, -14); c.lineTo(-30, -250); c.quadraticCurveTo(-30, -330, 0, -352); c.quadraticCurveTo(30, -330, 30, -250); c.lineTo(30, -14); c.closePath(); c.fill();
  c.fillStyle = '#1a1d24'; c.fillRect(-30, -240, 60, 54);                                                       /* heat-shield band */
  c.fillStyle = '#f4f6fa'; c.font = 'bold 11px Georgia'; c.textAlign = 'center'; c.fillText('SPACEX', 0, -208);
  c.fillStyle = '#6a7388'; for (let i = 0; i < 6; i++) c.fillRect(-30, -170 + i * 22, 60, 1.5);                  /* panel lines */
  c.fillStyle = 'rgba(120,170,230,0.85)'; c.beginPath(); c.arc(0, -290, 7, 0, 7); c.fill();                       /* window */
  if (flame > 0) {                                                                                                 /* engines */
    const fl = 40 + flame * 160 + Math.sin(t * 40) * 10;
    const fg = c.createLinearGradient(0, -14, 0, -14 + fl); fg.addColorStop(0, 'rgba(255,255,230,0.95)'); fg.addColorStop(0.35, 'rgba(255,190,80,0.85)'); fg.addColorStop(1, 'rgba(255,90,40,0)');
    c.fillStyle = fg; c.beginPath(); c.moveTo(-24, -14); c.lineTo(24, -14); c.lineTo(10, -14 + fl); c.lineTo(-10, -14 + fl); c.closePath(); c.fill();
  }
  c.restore();
}

function drawLawn(c, t) {
  const z = ZONES.lawn;
  /* dusk sky, treeline, the far horizon */
  const sky = c.createLinearGradient(0, 0, 0, 640); sky.addColorStop(0, '#101c3c'); sky.addColorStop(0.55, '#4a3a6a'); sky.addColorStop(1, '#f0924f');
  c.fillStyle = sky; c.fillRect(0, 0, z.w, 640);
  for (let i = 0; i < 60; i++) { c.fillStyle = 'rgba(245,239,221,' + (0.2 + 0.3 * Math.sin(t + i)) + ')'; c.fillRect((i * 211) % z.w, (i * 97) % 300, 2, 2); }
  c.fillStyle = '#0d1a14'; for (let x = -20; x < z.w + 40; x += 44) { const h = 46 + ((x * 7) % 34); c.beginPath(); c.moveTo(x, 640); c.lineTo(x + 22, 640 - h); c.lineTo(x + 44, 640); c.fill(); }
  /* grass with mowing stripes */
  const gg = c.createLinearGradient(0, 600, 0, z.h); gg.addColorStop(0, '#244a2c'); gg.addColorStop(1, '#173a22');
  c.fillStyle = gg; c.fillRect(0, 600, z.w, z.h - 600);
  for (let y = 600; y < z.h; y += 56) { c.fillStyle = 'rgba(255,255,255,' + ((y / 56) % 2 ? 0.035 : 0) + ')'; c.fillRect(0, y, z.w, 28); }
  /* gravel path from the portico to the podium */
  c.fillStyle = '#8f8a7a'; c.beginPath(); c.moveTo(540, z.h); c.lineTo(740, z.h); c.lineTo(690, 1100); c.lineTo(590, 1100); c.closePath(); c.fill();
  /* rocket on its pad, far lawn */
  c.fillStyle = 'rgba(0,0,0,0.25)'; c.beginPath(); c.ellipse(640, 664, 150, 22, 0, 0, 7); c.fill();
  if (!G.auraStats || !G.auraStats.rocket) drawRocket(c, 640, 660, 1.15, t, 0);
  else { c.fillStyle = 'rgba(255,255,255,0.18)'; c.beginPath(); c.ellipse(640, 640, 120, 30, 0, 0, 7); c.fill(); }
  c.fillStyle = '#3a3a30'; rr(c, 480, 678, 320, 26, 6); c.fill(); c.fillStyle = '#c9a227'; c.font = 'bold 12px Georgia'; c.textAlign = 'center'; c.fillText('SPACEX · LAWN DEMO — NOT TO SCALE', 640, 696);
  /* fountain */
  c.fillStyle = '#6a7080'; c.beginPath(); c.ellipse(640, 930, 100, 40, 0, 0, 7); c.fill();
  c.fillStyle = '#2a5a8a'; c.beginPath(); c.ellipse(640, 926, 86, 32, 0, 0, 7); c.fill();
  c.fillStyle = 'rgba(190,225,255,0.8)'; for (let i = 0; i < 5; i++) { const a = t * 2 + i * 1.3; c.beginPath(); c.arc(640 + Math.sin(a) * 6, 880 - Math.abs(Math.sin(a * 1.4)) * 26 - i * 4, 3, 0, 7); c.fill(); }
  /* hedges + flags */
  c.fillStyle = '#12301c'; for (const hx of [90, 1010]) { rr(c, hx, 780, 180, 40, 12); c.fill(); rr(c, hx, 1280, 180, 40, 12); c.fill(); }
  for (const fx of [120, 1160]) { c.fillStyle = '#c9ced8'; c.fillRect(fx, 760, 4, 220); c.fillStyle = '#b02a20'; c.fillRect(fx + 4, 764, 56, 10); c.fillStyle = '#f5efdd'; c.fillRect(fx + 4, 774, 56, 10); c.fillStyle = '#1d3f7a'; c.fillRect(fx + 4, 764, 20, 20); }
  /* press riser: lectern with seals, camera tripods and the cameras' lights */
  c.fillStyle = '#2a2018'; rr(c, 380, 1020, 520, 62, 6); c.fill(); c.fillStyle = '#7a5535'; rr(c, 380, 1020, 520, 12, 4); c.fill();
  c.fillStyle = '#5d3f28'; rr(c, 590, 1000, 100, 54, 4); c.fill(); c.fillStyle = '#c9a227'; c.beginPath(); c.arc(640, 1026, 14, 0, 7); c.fill();
  c.fillStyle = 'rgba(245,239,221,0.7)'; c.font = 'bold 12px Georgia'; c.textAlign = 'center'; c.fillText('PRESS', 640, 1074);
  for (const cx of [300, 410, 870, 980]) {
    c.fillStyle = '#0a0c12'; c.fillRect(cx - 2, 1180, 4, 60); rr(c, cx - 22, 1160, 44, 28, 4); c.fill(); c.beginPath(); c.arc(cx + 24, 1174, 9, 0, 7); c.fill();
    if (Math.sin(t * 1.7 + cx) > 0.93) { const fg = c.createRadialGradient(cx, 1170, 2, cx, 1170, 70); fg.addColorStop(0, 'rgba(255,255,255,0.8)'); fg.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = fg; c.fillRect(cx - 80, 1090, 160, 160); }
  }
  /* south portico: columns and steps */
  c.fillStyle = '#d8d2c0'; c.fillRect(0, 1438, z.w, 62);
  c.fillStyle = '#b9b29c'; for (let i = 0; i < 4; i++) c.fillRect(0, 1438 + i * 16, z.w, 4);
  c.fillStyle = '#ece7d8'; for (const px of [150, 360, 920, 1130]) { c.fillRect(px, 1330, 34, 110); c.fillStyle = '#c9c3ae'; c.fillRect(px - 6, 1324, 46, 10); c.fillStyle = '#ece7d8'; }
  c.fillStyle = 'rgba(245,239,221,0.7)'; c.font = 'bold 11px Georgia'; c.textAlign = 'center'; c.fillText('THE GALLERY', 220, 1428); c.fillText('THE EAST ROOM', 1130, 1428);
}

/* the East Room, taller than it was: the floor now runs to y=936 */
function drawEastWorld(c, t) {
  drawEastRoomBg(c, t, 'room');
  drawTable(c, t, ZONES.eastroom.h);
  /* a rug under the open floor + two cocktail tables */
  c.fillStyle = 'rgba(201,162,39,0.14)'; rr(c, 150, 700, 980, 200, 14); c.fill(); c.strokeStyle = 'rgba(201,162,39,0.4)'; c.lineWidth = 2; rr(c, 160, 710, 960, 180, 10); c.stroke();
  for (const o of ZONES.eastroom.obstacles) {
    c.fillStyle = 'rgba(0,0,0,0.3)'; c.beginPath(); c.ellipse(o.x + o.w / 2, o.y + o.h - 4, o.w / 2, 14, 0, 0, 7); c.fill();
    c.fillStyle = '#7a5535'; c.beginPath(); c.ellipse(o.x + o.w / 2, o.y + 24, o.w / 2 - 8, 20, 0, 0, 7); c.fill(); c.fillStyle = '#936b42'; c.beginPath(); c.ellipse(o.x + o.w / 2, o.y + 20, o.w / 2 - 8, 20, 0, 0, 7); c.fill();
    c.fillStyle = '#3a2412'; c.fillRect(o.x + o.w / 2 - 5, o.y + 38, 10, 30);
  }
  /* doors */
  for (const side of [0, 1]) {
    const dx = side ? W - 100 : 18;
    c.fillStyle = '#1a1008'; rr(c, dx, 560, 82, 150, 4); c.fill(); c.strokeStyle = '#c9a227'; c.lineWidth = 3; rr(c, dx, 560, 82, 150, 4); c.stroke();
    c.fillStyle = 'rgba(245,239,221,0.7)'; c.font = 'bold 10px Georgia'; c.textAlign = 'center'; c.fillText(side ? 'SOUTH LAWN' : 'GALLERY', dx + 41, 552);
  }
}

function drawEastSeated(c, t) {
  for (const s of SEATS) {
    if (s.id === G.playerId) continue;
    const px2 = seatX(s), isTrump = s.id === 'trump', talked = G.talksDone.indexOf(s.id) !== -1;
    const speaking = isSpeaking(s.id);
    drawFigure(c, s.id, px2, SEAT_Y, 1.6, {
      pose: isTrump ? 'point' : 'sit',
      look: Math.max(-1, Math.min(1, (G.px - px2) / 260)),
      blink: Math.sin(t * 0.9 + s.x * 9) > 0.985, t: t, talk: speaking, exp: G.talk && G.talk.id === s.id ? G.talk.react : null
    });
    if (talked && !isTrump) { c.fillStyle = PAL.green; c.beginPath(); c.arc(px2 + 24, 420, 7, 0, 7); c.fill(); c.fillStyle = '#fff'; c.font = 'bold 9px Georgia'; c.textAlign = 'center'; c.fillText('✓', px2 + 24, 423); }
  }
}

function drawPerson(c, id, x, feetY, s, opts) {
  drawFigure(c, id, x, feetY - 32 * s, s, opts);
}

function worldDraw(c, t, dt) {
  const z = ZONES[G.zone];
  c.save();
  c.translate(-Math.round(G.cam.x), -Math.round(G.cam.y));
  if (G.zone === 'eastroom') { drawEastWorld(c, t); drawEastSeated(c, t); }
  else if (G.zone === 'hallway') drawGallery(c, t);
  else drawLawn(c, t);

  /* everybody who stands on the floor, sorted by depth */
  const ents = [];
  for (const p of z.people) {
    const n = G.npcs[p.id], def = npcDef(p.id);
    ents.push({ y: n.y, draw: () => {
      const s = z.scale(n.y);
      const speaking = p.talkId && isSpeaking(p.talkId);
      drawPerson(c, p.id, n.x, n.y, s, { pose: n.walking ? 'walk' : 'stand', phase: t * 5 + idHash(p.id) % 7, flip: n.face < 0, look: Math.max(-1, Math.min(1, (G.px - n.x) / 300)), blink: Math.sin(t * 1.1 + n.x) > 0.99, t: t, talk: speaking });
      if (G.focus && G.focus.id === p.id) { c.fillStyle = 'rgba(7,10,18,0.78)'; const w = c.measureText(def.name).width; c.font = 'bold 11px Georgia'; const tw = c.measureText(def.name).width + 18; rr(c, n.x - tw / 2, n.y - 100 * s - 14, tw, 20, 10); c.fill(); c.fillStyle = PAL.gold2; c.textAlign = 'center'; c.fillText(def.name, n.x, n.y - 100 * s); }
    } });
  }
  const pbounce = G.hs ? 0 : 0;
  ents.push({ y: G.py, draw: () => {
    const s = z.scale(G.py), moving = Math.abs(G.vx) + Math.abs(G.vy) > 6;
    /* the focus ring under whatever you could use */
    drawPerson(c, G.playerId || 'player', G.px, G.py, s, { pose: moving ? 'walk' : 'stand', phase: G.walkPhase, flip: G.facing < 0, look: Math.sin(t * 0.8) * 0.4, blink: Math.sin(t * 1.1) > 0.99, t: t });
    for (const fl of G.auraFloat) { const a = 1 - fl.t / 2.4; c.fillStyle = (fl.good ? 'rgba(126,240,168,' : 'rgba(255,140,130,') + a + ')'; c.font = 'bold 15px Georgia'; c.textAlign = 'center'; c.fillText(fl.text, G.px, G.py - 118 * s - fl.t * 26 - (G.auraFloat.indexOf(fl) % 3) * 4); }
  } });
  ents.sort((a, b) => a.y - b.y);
  for (const e of ents) e.draw();

  /* focus ring + click-to-move marker */
  const f = G.focus;
  if (f && !G.hs) { const s = z.scale(f.y); c.strokeStyle = 'rgba(232,201,106,0.85)'; c.lineWidth = 2.5; c.beginPath(); c.ellipse(f.x, f.y + (f.person ? 2 : 0), 34 * s * (f.person ? 1 : 1.6), 10 * s * (f.person ? 1 : 1.2), 0, 0, 7); c.stroke(); }
  if (G.moveTo) { const a = 0.5 + 0.4 * Math.sin(t * 8); c.strokeStyle = 'rgba(245,239,221,' + a + ')'; c.lineWidth = 2; c.beginPath(); c.ellipse(G.moveTo.x, G.moveTo.y, 12, 5, 0, 0, 7); c.stroke(); }
  /* handshake ring, over the two of you */
  if (G.hs) drawHandshake(c, t);
  if (G.admiring) { const i = PORTRAITS.findIndex((p) => p.id === G.admiring.id); const x = portraitX(i), p = Math.min(1, G.admiring.t / 2.0); c.strokeStyle = 'rgba(232,201,106,0.95)'; c.lineWidth = 6; c.beginPath(); c.arc(x, 520, 30, -Math.PI / 2, -Math.PI / 2 + p * 6.28); c.stroke(); c.fillStyle = 'rgba(7,10,18,0.7)'; rr(c, x - 60, 556, 120, 24, 12); c.fill(); c.fillStyle = PAL.gold2; c.font = 'bold 12px Georgia'; c.textAlign = 'center'; c.fillText('ADMIRING…', x, 573); }
  c.restore();
  drawWorldOverlay(c, t);
}

function drawHandshake(c, t) {
  const h = G.hs;
  const tgt = worldTargets().find((q) => q.id === h.id);
  const tx = tgt ? tgt.x : G.px + 60, ty = tgt ? tgt.y : G.py;
  const mx = (G.px + tx) / 2, my = Math.min(G.py, ty) - 74;
  const p = Math.min(1, h.t / h.ideal);
  const R = 62 - 40 * p;                                    /* the ring closes onto a 22px circle */
  c.save();
  c.fillStyle = 'rgba(7,10,18,0.74)'; c.beginPath(); c.arc(mx, my, 76, 0, 7); c.fill();
  c.strokeStyle = 'rgba(232,201,106,0.9)'; c.lineWidth = 3; c.beginPath(); c.arc(mx, my, 22, 0, 7); c.stroke();
  const good = Math.abs(h.t - h.ideal) < 0.11;
  if (!h.done) { c.strokeStyle = good ? '#7ef0a8' : 'rgba(245,239,221,0.95)'; c.lineWidth = 4; c.beginPath(); c.arc(mx, my, Math.max(14, R + (h.t > h.ideal ? (h.t - h.ideal) * -40 : 0)), 0, 7); c.stroke(); }
  c.fillStyle = PAL.cream; c.font = 'bold 13px Georgia'; c.textAlign = 'center';
  c.fillText(h.done ? h.done.text.toUpperCase() : 'PRESS F / SPACE / CLICK', mx, my + 62);
  if (h.done) { c.fillStyle = h.done.q === 'perfect' ? '#7ef0a8' : h.done.q === 'good' ? PAL.gold2 : '#ff9a90'; c.font = 'bold 22px Georgia'; c.fillText(h.done.q === 'perfect' ? 'PERFECT' : h.done.q === 'good' ? 'GOOD' : h.done.q === 'repeat' ? 'AGAIN?' : 'MISS', mx, my + 8); }
  else { c.fillStyle = 'rgba(245,239,221,0.9)'; c.font = '26px Georgia'; c.fillText('🤝', mx, my + 9); }
  c.restore();
}

/* screen-space parts: aura meter, side goals, prompt, minimap, zone name */
function drawWorldOverlay(c, t) {
  const z = ZONES[G.zone];
  /* interaction prompt */
  const f = G.focus;
  if (f && !G.hs && !G.admiring) {
    const sx = f.x - G.cam.x, sy = (f.person ? f.y - 130 * z.scale(f.y) : f.kind === 'portrait' ? 470 : f.y - 150) - G.cam.y;
    let text = '';
    if (f.kind === 'signer') text = f.id === 'trump' ? (G.talksDone.length >= 3 ? 'E · go to the desk' : 'E · the pen comes later') : (G.talksDone.length >= 3 && G.talksDone.indexOf(f.id) === -1 ? 'three talks is the rule' : 'E · talk     F · shake hands');
    else if (f.kind === 'talker') text = 'E · talk     F · shake hands';
    else if (f.kind === 'ambient') text = 'E · chat     F · shake hands';
    else if (f.kind === 'portrait') text = 'E · admire';
    else if (f.kind === 'rocket') text = G.auraStats.rocket ? 'the pad is quiet' : 'E · watch the demo';
    else if (f.kind === 'press') text = 'E · take the podium';
    else if (f.kind === 'portal') text = 'E · go to ' + f.label.toLowerCase();
    c.font = 'bold 13px Georgia, serif';
    const tw = c.measureText(text).width + 26;
    const bx = Math.max(10, Math.min(W - tw - 10, sx - tw / 2)), by = Math.max(70, Math.min(H - 60, sy));
    c.fillStyle = 'rgba(245,239,221,0.95)'; rr(c, bx, by, tw, 26, 13); c.fill();
    c.fillStyle = '#101b2d'; c.textAlign = 'center'; c.fillText(text, bx + tw / 2, by + 18);
  }
  /* zone name + why your aura is moving */
  c.fillStyle = 'rgba(245,239,221,0.6)'; c.font = '600 13px Georgia, serif'; c.textAlign = 'left';
  c.fillText(z.name, 20, H - 18);
  if (G.fieldWhy) { const good = z.field(G.px, G.py).rate > 0; c.fillStyle = good ? 'rgba(126,240,168,0.9)' : 'rgba(255,150,140,0.9)'; c.font = 'italic 13px Georgia, serif'; c.fillText(G.fieldWhy, 20 + c.measureText(z.name).width + 18, H - 18); }
  /* mini-map: the three rooms and where you are */
  const mx = 20, my = H - 92;
  c.fillStyle = 'rgba(7,10,18,0.66)'; rr(c, mx - 6, my - 6, 142, 62, 8); c.fill();
  const rooms = [{ id: 'lawn', x: 0, y: 0, w: 46, h: 50, l: 'LAWN' }, { id: 'hallway', x: 48, y: 17, w: 40, h: 16, l: 'GALLERY' }, { id: 'eastroom', x: 90, y: 6, w: 46, h: 40, l: 'EAST RM' }];
  for (const r of rooms) { c.fillStyle = r.id === G.zone ? 'rgba(232,201,106,0.35)' : 'rgba(245,239,221,0.12)'; rr(c, mx + r.x, my + r.y, r.w, r.h, 4); c.fill(); c.strokeStyle = r.id === G.zone ? PAL.gold2 : 'rgba(245,239,221,0.3)'; c.lineWidth = 1; rr(c, mx + r.x, my + r.y, r.w, r.h, 4); c.stroke(); c.fillStyle = 'rgba(245,239,221,0.55)'; c.font = '7px Georgia'; c.textAlign = 'center'; c.fillText(r.l, mx + r.x + r.w / 2, my + r.y + r.h - 3); }
  const cur = rooms.find((r) => r.id === G.zone);
  c.fillStyle = '#fff'; c.beginPath(); c.arc(mx + cur.x + (G.px / z.w) * cur.w, my + cur.y + (G.py / z.h) * cur.h, 2.4, 0, 7); c.fill();
}

/* the aura meter and the side goals (drawn with the HUD on every screen that has them) */
function drawAuraMeter(c, t) {
  const a = G.aura, tier = auraTier();
  c.fillStyle = 'rgba(7,10,18,0.72)'; rr(c, 14, 14, 262, 66, 8); c.fill();
  c.fillStyle = PAL.cream; c.font = 'bold 14px Georgia, serif'; c.textAlign = 'left';
  c.fillText('YOU ARE: ' + CAST.find((k) => k.id === G.playerId).name.toUpperCase(), 26, 33);
  c.fillStyle = 'rgba(245,239,221,0.16)'; rr(c, 26, 42, 238, 14, 7); c.fill();
  const col = tier === 'radiant' ? '#7ef0a8' : tier === 'fading' ? '#ff7d70' : PAL.gold;
  const glow = tier === 'radiant' ? 0.4 + 0.3 * Math.sin(t * 5) : tier === 'fading' && a < 15 ? 0.3 + 0.3 * Math.sin(t * 9) : 0;
  if (glow) { c.fillStyle = col; c.globalAlpha = glow; rr(c, 22, 38, 246, 22, 11); c.fill(); c.globalAlpha = 1; }
  c.fillStyle = col; rr(c, 26, 42, Math.max(8, 238 * a / 100), 14, 7); c.fill();
  c.fillStyle = '#101b2d'; c.font = 'bold 11px Georgia'; c.textAlign = 'left'; c.fillText('AURA ' + Math.round(a), 34, 53);
  c.fillStyle = col; c.font = 'bold 11px Georgia'; c.textAlign = 'right'; c.fillText(tier.toUpperCase(), 264, 73);
  c.fillStyle = 'rgba(245,239,221,0.6)'; c.font = '10px Georgia'; c.textAlign = 'left'; c.fillText('RAPPORT ' + Math.round(G.ledger.rapport), 26, 73);
  if (G.screen === 'press') return;
  /* side goals */
  const S = G.auraStats;
  const goals = [
    ['Talk to 3 people', G.talksDone.length >= 3, G.talksDone.length + '/3'],
    ['Shake 3 hands', Object.keys(S.handshakes).length >= 3, Object.keys(S.handshakes).length + '/3'],
    ['Admire 3 portraits', Object.keys(S.portraits).length >= 3, Object.keys(S.portraits).length + '/3'],
    ['Handle the press', S.pressAsked >= 3, S.pressAsked + '/3'],
    ['Watch the rocket', S.rocket, S.rocket ? 'done' : '—']
  ];
  c.fillStyle = 'rgba(7,10,18,0.66)'; rr(c, W - 236, 52, 222, 22 + goals.length * 19, 8); c.fill();
  c.textAlign = 'left';
  goals.forEach((g, i) => {
    c.fillStyle = g[1] ? '#7ef0a8' : 'rgba(245,239,221,0.85)'; c.font = '12px Georgia';
    c.fillText((g[1] ? '☑ ' : '☐ ') + g[0], W - 226, 76 + i * 19);
    c.textAlign = 'right'; c.fillStyle = 'rgba(245,239,221,0.6)'; c.fillText(g[2], W - 24, 76 + i * 19); c.textAlign = 'left';
  });
}
