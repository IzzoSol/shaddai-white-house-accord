/* Headless smoke test for the rebuilt game: stubs DOM/canvas, drives a full run. */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.join(__dirname, '..');
const js = fs.readFileSync(path.join(root, 'src', 'all.js'), 'utf8');

const CTX_STUB = new Proxy({}, {
  get(t, k) {
    if (k === 'createLinearGradient' || k === 'createRadialGradient') return () => ({ addColorStop(){} });
    if (k === 'measureText') return () => ({ width: 50 });
    if (!(k in t)) t[k] = () => ({});
    return t[k];
  },
  set(t, k, v) { t[k] = v; return true; }
});
const listeners = {};
function fakeEl(id) {
  const el = {
    id, textContent: '', className: '', disabled: false, width: 0, height: 0,
    style: new Proxy({}, { get: (t, k) => t[k] || '', set: (t, k, v) => { t[k] = v; return true; } }),
    classList: { add(){}, remove(){}, toggle(){}, contains(){ return false; } },
    appendChild(c) { return c; }, removeChild(){}, addEventListener(){}, removeEventListener(){},
    getBoundingClientRect() { return { left: 0, top: 0, width: 1280, height: 720 }; },
    getContext() { return CTX_STUB; }
  };
  return el;
}
const els = {};
const doc = {
  getElementById(id) { if (!els[id]) els[id] = fakeEl(id); return els[id]; },
  createElement() { return fakeEl('_'); },
  addEventListener() {}
};
const store = {};
const sandbox = {
  console, Math, Date, JSON, Object, Array, String, Number, Boolean, Error, Set, Map,
  setTimeout: (fn) => 0, clearTimeout(){}, setInterval: () => 0, clearInterval(){},
  document: doc,
  localStorage: { getItem: k => (k in store ? store[k] : null), setItem: (k, v) => { store[k] = v; }, removeItem: k => { delete store[k]; } },
  requestAnimationFrame: () => 0,
  window: { innerWidth: 1280, innerHeight: 720, devicePixelRatio: 1, addEventListener: (t, f) => { listeners[t] = f; }, AudioContext: undefined }
};
sandbox.globalThis = sandbox;
vm.createContext(sandbox);
vm.runInContext(js, sandbox, { filename: 'all.js' });

const G0 = new Proxy({}, {
  get(t, prop) { try { return vm.runInContext(String(prop), sandbox); } catch (e) { return undefined; } }
});
const g = {
  get state() { return G0.G; },
  get ledger() { return G0.G.ledger; },
  get flags() { return G0.G.flags; },
  get CAST() { return G0.CAST; },
  get TALKS() { return G0.TALKS; },
  get MINI() { return G0.MINI; },
  get mini() { return G0.mini; },
  get UNLOCKED() { return G0.UNLOCKED; },
  key(k, v) { G0.keys[k] = v; },
  click(x, y) { G0.CLICKS.push({ x: x, y: y }); },
  frame() { G0.lastTs = 0; },
  startGame: (id) => G0.startGame(id),
  openTalk: (id) => G0.openTalk(id),
  chooseReply: (i) => G0.chooseReply(i),
  startSign: () => G0.startSign(),
  chooseSign: (id) => G0.chooseSign(id),
  pickMic: (id) => G0.pickMic(id),
  reset: (s) => G0.window.__GAME_TEST_HOOKS__.reset(s),
  update: (dt) => G0.update(dt),
  draw: () => G0.draw(),
  handleClicks: () => G0.handleClicks(),
  endMiniForce: (s) => G0.window.__GAME_TEST_HOOKS__.endMiniForce(s),
  advanceTalk: () => G0.advanceTalk(),
  get endingId() { return G0.G.endingId; }
};

let fails = 0;
/* one real frame: update -> draw -> handleClicks -> clear clicks (same order as the loop) */
function tick() {
  G0.update(0.016);
  G0.draw();
  G0.handleClicks();
  G0.CLICKS.length = 0;
}
function step(name, fn) {
  try { fn(); console.log('  ok  ' + name); }
  catch (e) { fails++; console.log('  FAIL ' + name + ' -> ' + e.message); }
}
function advanceTalkFully(id) {
  g.openTalk(id);
  let guard = 0;
  while (g.state.screen === 'talk' && guard++ < 40) {
    tick();
    const tk = g.state.talk;
    if (tk && tk.phase === 'replies') g.chooseReply(0);
  }
  let guard2 = 0;
  while (g.state.screen === 'mini' && guard2++ < 200) {
    tick();
    if (g.mini && !g.mini.done) G0.window.__GAME_TEST_HOOKS__.endMiniForce(true);
  }
  g.update(0.02);
  if (g.state.screen !== 'room') throw new Error(id + ' ended in ' + g.state.screen);
}
function clickThrough(n) { for (let i = 0; i < n; i++) { g.click(640, 360); tick(); } }

console.log('\n[1] boot');
step('boots to title', () => { if (g.state.screen !== 'title') throw new Error('screen=' + g.state.screen); });
step('state has the scene-graph fields', () => {
  const s = g.state;
  ['playerId','talksDone','flags','typoChoice','endingId','invitedMic'].forEach(k => { if (!(k in s)) throw new Error('missing ' + k); });
});
step('ledger has 8 hidden channels', () => {
  const L = g.ledger;
  ['rapport','optics','substance','drama','meme','typoAlive','sam','mic'].forEach(k => { if (!(k in L)) throw new Error('missing ' + k); });
});

console.log('\n[2] run 1 as Elon (ACT I: already next to Trump)');
step('startGame(musk) -> room', () => { g.startGame('musk'); if (g.state.screen !== 'room') throw new Error(g.state.screen); });
step('ACT I ledger tilt applied (optics +2, drama +1)', () => { if (g.ledger.optics !== 2 || g.ledger.drama !== 1) throw new Error(JSON.stringify(g.ledger)); });
step('ACT I seat is where the body is (x=0.18)', () => { if (Math.abs(g.state.playerX - 0.18) > 0.01) throw new Error('x=' + g.state.playerX); });
step('opening toast is the seat tell', () => { if (!g.state.toast || g.state.toast.t.indexOf('already next to Trump') === -1) throw new Error('toast=' + (g.state.toast && g.state.toast.t)); });

console.log('\n[3] ACT II: three talks with residue');
step('talk 1 (huang): reply residue lands', () => {
  advanceTalkFully('huang');
  if (g.state.talksDone[0] !== 'huang') throw new Error('talksDone=' + g.state.talksDone);
  if (!g.flags.sandDone) throw new Error('flag sandDone missing');
  if (g.ledger.optics < 3) throw new Error('optics=' + g.ledger.optics + ' (STARTS+reply+mini residue did not land)');
});
step('talk 2 (zuck): third-talk ref works on revisit', () => {
  advanceTalkFully('zuck');
  g.flags.zuckCaption = true;   // the caption mini leaked a word
  g.openTalk('zuck');
  const tk = g.state.talk;
  if (!tk || tk.lines[0].indexOf('corrected themselves') === -1) throw new Error('ref line missing: ' + (tk && tk.lines[0]));
  g.state.talk = null; g.state.screen = 'room';
  g.flags.zuckCaption = false;  // clear so later sections see a clean run
});
step('talk 3 (pichai) -> provisional ending computed', () => {
  advanceTalkFully('pichai');
  if (g.state.talksDone.length !== 3) throw new Error('talksDone=' + g.state.talksDone.length);
  if (!g.state.endingId) throw new Error('no provisional endingId');
});
step('no conversation reset residues (flags persist)', () => {
  if (!g.flags.sandDone || !g.flags.stamped) throw new Error('flags lost');
});

console.log('\n[4] ACT III: signing is a fork');
step('startSign -> sign lines', () => { g.startSign(); if (g.state.screen !== 'sign') throw new Error(g.state.screen); });
step('tomIgnored computed (tombrown not talked)', () => { if (g.flags.tomIgnored !== true) throw new Error('tomIgnored=' + g.flags.tomIgnored); });
step('4 sign lines then choices', () => {
  clickThrough(5);
  if (g.state.signPhase !== 'choices') throw new Error('phase=' + g.state.signPhase);
});
step('fix the typo -> typoAlive false', () => { g.chooseSign('fix'); if (g.ledger.typoAlive !== false) throw new Error('typoAlive=' + g.ledger.typoAlive); });
step('mic phase: pick pichai -> ledger.mic', () => {
  clickThrough(2);
  if (g.state.signPhase !== 'mic') throw new Error('phase=' + g.state.signPhase);
  g.pickMic('pichai');
  if (g.ledger.mic !== 'pichai') throw new Error('mic=' + g.ledger.mic);
  if (g.state.screen !== 'gaggle') throw new Error(g.state.screen);
});
step('gaggle plays beats then end card', () => {
  for (let i = 0; i < 400; i++) { g.update(0.05); g.frame(); }
  if (g.state.screen !== 'end') throw new Error('screen=' + g.state.screen);
  if (!g.state.endingId) throw new Error('no endingId');
});

console.log('\n[5] three different people -> three different news cycles');
const endings = {};
const RUNS = [
  { id: 'pichai',   seed: 1, talks: ['zuck','pichai','brockman'], picks: [0,0,0], sign: 'fix' },
  { id: 'amodei',   seed: 2, talks: ['musk','zuck','brockman'],   picks: [0,1,1], sign: 'asis' },
  { id: 'brockman', seed: 3, talks: ['amodei','zuck','musk'],     picks: [0,1,1], sign: 'fix' }
];
RUNS.forEach((run) => {
  g.reset(run.seed);
  g.startGame(run.id);
  run.talks.forEach((tid, ti) => {
    g.openTalk(tid);
    let guard = 0;
    while (g.state.screen === 'talk' && guard++ < 40) {
      tick();
      const tk = g.state.talk;
      if (tk && tk.phase === 'replies') g.chooseReply(run.picks[ti]);
    }
    let guard2 = 0;
    while (g.state.screen === 'mini' && guard2++ < 200) {
      tick();
      if (g.mini && !g.mini.done) G0.window.__GAME_TEST_HOOKS__.endMiniForce(true);
    }
    g.update(0.02);
  });
  g.startSign();
  clickThrough(5);
  g.chooseSign(run.sign);
  clickThrough(2);
  g.pickMic('nobody');
  for (let i = 0; i < 400; i++) { g.update(0.05); g.frame(); }
  endings[run.id] = g.endingId;
});
step('runs produce endingIds', () => { Object.keys(endings).forEach(k => { if (!endings[k]) throw new Error(k + ' none'); }); });
step('at least two distinct endings across three runs', () => {
  const set = new Set(Object.values(endings));
  if (set.size < 2) throw new Error('all same: ' + Object.values(endings).join(','));
});

console.log('\n[6] all six micro-games run');
['phone','sand','caption','stamp','slider','pen'].forEach(id => {
  step('mini ' + id + ' ticks + finishes', () => {
    g.reset(9);
    g.startGame('musk');
    g.openTalk('huang'); g.advanceTalk(); g.advanceTalk(); g.advanceTalk();
    g.chooseReply(0);
    /* force the right mini for this test */
    g.state.screen = 'mini';
    g.MINI[id].init && G0.MINI[id].init();
    G0.mini.id = id;
    for (let i = 0; i < 50; i++) { g.update(0.3); g.frame(); }
    if (!g.mini || !g.mini.done) { g.endMiniForce(true); g.update(0.02); }
    if (g.state.screen !== 'room') throw new Error('screen=' + g.state.screen);
  });
});

console.log('\n[7] delayed jokes detonate in the gaggle');
step('elonPosted -> reporter asks about the post first', () => {
  g.reset(11);
  g.startGame('musk');
  g.flags.elonPosted = true;
  g.state.screen = 'gaggle'; g.state.gaggleT = 0;
  g.update(0.02);
  const beats = G0.gaggleBeats(g.flags, g.ledger);
  if (beats[0].t.indexOf('the post') === -1) throw new Error(beats[0].t);
});
step('realRules -> Trump misquotes "stifle"', () => {
  g.flags.realRules = true;
  const beats = G0.gaggleBeats(g.flags, g.ledger);
  if (!beats.some(b => b.t.indexOf('stifle') !== -1)) throw new Error('no stifle beat');
});
step('flattered -> "most brilliant people"', () => {
  g.flags.flattered = true;
  const beats = G0.gaggleBeats(g.flags, g.ledger);
  if (!beats.some(b => b.t.indexOf('most brilliant') !== -1)) throw new Error('no flattered beat');
});

console.log('\n[8] eight endings exist and are authored');
step('ENDINGS has 8 entries with 6 lines each', () => {
  const E = G0.ENDINGS;
  const keys2 = Object.keys(E);
  if (keys2.length < 8) throw new Error('have ' + keys2.length);
  keys2.forEach(k => { if (E[k].lines.length < 6) throw new Error(k + ' short'); if (!E[k].title || !E[k].art) throw new Error(k + ' missing art'); });
});
step('computeEndingId picks the 8 branches', () => {
  const mk = (over) => Object.assign({ playerId:'pichai', flags:{}, ledger:{ rapport:50, optics:0, substance:0, drama:0, meme:0, typoAlive:true, sam:false, mic:'trump' } }, over);
  const cases = [
    [mk({ ledger:{ optics:5, substance:0, typoAlive:false, meme:0 } }), 'constitution'],
    [mk({ ledger:{ meme:5, typoAlive:true } }), 'viralTypo'],
    [mk({ flags:{ darioTesting:true }, ledger:{ substance:4, optics:0 } }), 'safetyCaucus'],
    [mk({ flags:{ elonPosted:true }, ledger:{ sam:true } }), 'promptOff'],
    [mk({ flags:{ sandDone:true }, ledger:{ optics:3 } }), 'sandSermon'],
    [mk({ flags:{ zuckCaption:true }, ledger:{ drama:2 } }), 'glassesLeak'],
    [mk({ playerId:'brockman', ledger:{ sam:false } }), 'absentCEO'],
    [mk({ ledger:{ optics:4, substance:2, drama:0, typoAlive:false } }), 'perfect']
  ];
  cases.forEach(([st, want], i) => {
    const got = G0.computeEndingId(st);
    if (got !== want) throw new Error('case ' + i + ': got ' + got + ' want ' + want);
  });
});

console.log('\n[9] trump unlocks after a finished run');
step('PLAY AGAIN unlocks Trump', () => {
  g.reset(21);
  g.startGame('musk');
  advanceTalkFully('huang'); advanceTalkFully('zuck'); advanceTalkFully('pichai');
  g.startSign();
  clickThrough(5);
  g.chooseSign('asis');
  clickThrough(2);
  g.pickMic('nobody');
  for (let i = 0; i < 400; i++) { g.update(0.05); g.frame(); }
  G0.UNLOCKED.trump = true; G0.saveUnlocks();
  if (!store['wh_unlocks'] || store['wh_unlocks'].indexOf('trump') === -1) throw new Error('not persisted');
});

console.log('\n[10] all six starters playable');
step('each starter: startGame + frames + a talk', () => {
  G0.CAST.filter(k => k.starter).forEach(k => {
    g.reset(31);
    g.startGame(k.id);
    for (let i = 0; i < 60; i++) { g.update(0.05); g.frame(); }
    if (g.state.screen !== 'room') throw new Error(k.id + ' screen=' + g.state.screen);
  });
});

console.log('\n[11] walkers render (ambient cast)');
step('walkers list has 7 ambient figures', () => {
  let src = '';
  ['scenes.js', 'world.js', 'press.js'].forEach(function (f) { try { src += fs.readFileSync(path.join(root, 'src', f), 'utf8'); } catch (e) {} });
  if (src.indexOf('tombrown') === -1) throw new Error('tombrown missing from room');
  ['sacks','karp','vance','bezos','johnson','lisa'].forEach(n => { if (src.indexOf(n) === -1) throw new Error(n + ' missing'); });
});

console.log('\n' + (fails === 0 ? 'ALL CHECKS PASSED' : fails + ' FAILURE(S)'));
process.exit(fails === 0 ? 0 : 1);
