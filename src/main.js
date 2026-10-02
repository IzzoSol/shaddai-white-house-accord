/* ==================== main.js — state machine, loop, input, UI, audio ==================== */

const canvas = document.getElementById('stage');
const ctx = canvas.getContext('2d');
let W = 1280, H = 720, DPR = 1;

function resize() {
  const scale = Math.min(window.innerWidth / 1280, window.innerHeight / 720);
  DPR = Math.min(2, window.devicePixelRatio || 1);
  canvas.width = Math.round(1280 * scale * DPR);
  canvas.height = Math.round(720 * scale * DPR);
  canvas.style.width = Math.round(1280 * scale) + 'px';
  canvas.style.height = Math.round(720 * scale) + 'px';
  ctx.setTransform(scale * DPR, 0, 0, scale * DPR, 0, 0);
  W = 1280; H = 720;
}

/* ---- state (scene graph: playerId, talksDone[], flags{}, typoChoice, endingId) ---- */
const G = {
  screen: 'title',        // title|cast|how|room|talk|mini|sign|gaggle|end
  playerId: null,
  talksDone: [],
  tomDone: false,
  flags: {},
  ledger: { rapport: 50, optics: 0, substance: 0, drama: 0, meme: 0, typoAlive: true, sam: false, mic: 'trump' },
  invitedMic: null,
  typoChoice: null,
  endingId: null,
  playerX: 0.5, vx: 0, vy: 0, walkPhase: 0, endTab: 'story',
  talk: null,
  signLine: 0, signPhase: 'lines',
  gaggleT: 0,
  roomT: 0,
  toast: null,
  paused: false,
  t: 0
};
let cam = 0;
let ROTATE_OK = false;
let lastDrawnScreen = 'title', fadeT = 1;   /* screen fade: 0 = black, 0.4 = clear */

/* Which screen changes fade through black. Opening a conversation or a micro-game does not. */
function needsFade(prev, next) {
  if (prev === next) return false;
  return !(next === 'talk' || prev === 'talk' || next === 'mini' || prev === 'mini');
}
let stateFlags = G.flags;   // alias used by mini.js
let UNLOCKED = { trump: false };
try {
  const raw = localStorage.getItem('wh_unlocks');
  if (raw) { const p = JSON.parse(raw); for (const k in p) if (UNLOCKED.hasOwnProperty(k)) UNLOCKED[k] = !!p[k]; }
} catch (e) {}

/* ---- input ---- */
const keys = {};
let MX = 0, MY = 0, MXY = null, MDOWN = false;
let CLICKS = [];
let HOTRECTS = [];

function hitTest(r) {
  for (const c of CLICKS) { if (c.x >= r.x && c.x <= r.x + r.w && c.y >= r.y && c.y <= r.y + r.h) return true; }
  return false;
}
function clicked(id) {
  const r = HOTRECTS.find(h => h.id === id);
  if (!r) return false;
  for (let i = 0; i < CLICKS.length; i++) {
    const c = CLICKS[i];
    if (c.x >= r.x && c.x <= r.x + r.w && c.y >= r.y && c.y <= r.y + r.h) { CLICKS.splice(i, 1); return true; }
  }
  return false;
}
function uiBtn(x, y, w, h, id, label, primary) {
  const hot2 = MX > x && MX < x + w && MY > y && MY < y + h;
  HOTRECTS.push({ x: x, y: y, w: w, h: h, id: id });
  ctx.fillStyle = primary ? (hot2 ? '#f4e3a1' : PAL.gold) : (hot2 ? '#1d2f4d' : '#16233c');
  rr(ctx, x, y, w, h, 8); ctx.fill();
  ctx.strokeStyle = primary ? '#101b2d' : (hot2 ? PAL.gold : '#3a4a68'); ctx.lineWidth = hot2 ? 2.5 : 1.5;
  rr(ctx, x, y, w, h, 8); ctx.stroke();
  ctx.fillStyle = primary ? '#101b2d' : PAL.cream;
  ctx.font = (primary ? 'bold 18px' : '15px') + ' Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText(label, x + w / 2, y + h / 2 + (primary ? 6 : 5));
}

/* ---- text helpers ---- */
function wrapCount(c, text, maxW) {
  const words = String(text).split(' ');
  let lines = 1, cur = '';
  for (const wd of words) {
    const test = cur ? cur + ' ' + wd : wd;
    if (c.measureText(test).width > maxW && cur) { lines++; cur = wd; } else { cur = test; }
  }
  return lines;
}
function wrapText(c, text, x, y, maxW, lineH, align) {
  /* Draws wrapped text and returns the y of its last line. lineH defaults to 18. align ('left'|'center'|'right')
     overrides the canvas alignment for this call only: x is then the left edge, centre, or right edge. */
  lineH = lineH || 18;
  const prev = c.textAlign;
  if (align) c.textAlign = align;
  const words = String(text).split(' ');
  let cur = '', yy = y;
  for (const wd of words) {
    const test = cur ? cur + ' ' + wd : wd;
    if (c.measureText(test).width > maxW && cur) { c.fillText(cur, x, yy); yy += lineH; cur = wd; } else { cur = test; }
  }
  if (cur) c.fillText(cur, x, yy);
  c.textAlign = prev;
  return yy;
}
function wrapTextLines(c, text, maxW) {
  const words = String(text).split(' ');
  const lines = []; let cur = '';
  for (const wd of words) {
    const test = cur ? cur + ' ' + wd : wd;
    if (c.measureText(test).width > maxW && cur) { lines.push(cur); cur = wd; } else { cur = test; }
  }
  if (cur) lines.push(cur);
  return lines;
}

/* ---- toast: one at a time, dies ---- */
function toast(t) { G.toast = { t: t, born: G.t }; }

/* ---- audio: tasteful and quiet ---- */
let AC = null, muted = false;
function ac() {
  if (!AC) { try { AC = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) {} }
  return AC;
}
function tone(f, dur, type, gain, delay) {
  const a = ac(); if (!a || muted) return;
  try {
    const o = a.createOscillator(), g = a.createGain();
    o.type = type || 'sine'; o.frequency.value = f; g.gain.value = gain || 0.06;
    o.connect(g); g.connect(a.destination);
    const t0 = a.currentTime + (delay || 0);
    o.start(t0); g.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
    o.stop(t0 + dur);
  } catch (e) {}
}
function noiseBurst(dur, gain, delay) {
  const a = ac(); if (!a || muted) return;
  try {
    const len = Math.floor(a.sampleRate * dur);
    const buf = a.createBuffer(1, len, a.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = a.createBufferSource(); src.buffer = buf;
    const g = a.createGain(); g.gain.value = gain || 0.08;
    src.connect(g); g.connect(a.destination);
    src.start(a.currentTime + (delay || 0));
  } catch (e) {}
}
function sfx(name) {
  if (muted) return;
  if (name === 'ui') tone(520, 0.06, 'sine', 0.04);
  else if (name === 'talk') tone(340, 0.05, 'sine', 0.035);
  else if (name === 'good') { tone(523, 0.09, 'sine', 0.05); tone(659, 0.12, 'sine', 0.045, 0.07); }
  else if (name === 'bad') tone(180, 0.16, 'sawtooth', 0.05);
  else if (name === 'shutter') noiseBurst(0.07, 0.1);
  else if (name === 'pen') noiseBurst(0.2, 0.03);
  else if (name === 'stamp') tone(140, 0.08, 'square', 0.06);
  else if (name === 'sign') { tone(392, 0.15, 'sine', 0.05); tone(494, 0.2, 'sine', 0.045, 0.1); }
}
function toggleMute() { muted = !muted; }

/* ---- run setup: ACT I is where your body is at the table ---- */
function resetRun(playerId) {
  G.playerId = playerId;
  G.talksDone = [];
  G.tomDone = false;
  G.flags = {}; stateFlags = G.flags;
  G.ledger = { rapport: 50, optics: 0, substance: 0, drama: 0, meme: 0, typoAlive: true, sam: false, mic: 'trump' };
  G.invitedMic = null;
  G.typoChoice = null;
  G.endingId = null;
  G.talk = null;
  G.signLine = 0; G.signPhase = 'lines';
  G.gaggleT = 0; G.roomT = 0;
  G.paused = false;
  cam = 0;
  const st = STARTS[playerId];
  if (st) {
    G.playerX = st.x;
    for (const k in st.ledger) G.ledger[k] += st.ledger[k];
    toast(st.toast);
  }
  worldReset(playerId);
  G.press = null; G.endTab = 'story';
}

function startGame(id) {
  resetRun(id);
  G.screen = 'room';
  sfx('sign');
}

/* ---- talk flow ---- */
function openTalk(id) {
  const tk = TALKS[id];
  if (!tk) return;
  const lines = tk.lines.slice();
  const ref = tk.ref ? tk.ref(G.flags) : null;
  if (ref && G.talksDone.indexOf(id) !== -1) lines.unshift(ref);
  G.talk = { id: id, lines: lines, lineIdx: 0, typeT: 0, phase: 'lines', replies: tk.replies, mini: tk.mini };
  G.screen = 'talk';
  sfx('talk');
}
function advanceTalk() {
  const tk = G.talk;
  if (!tk) return;
  const cur = tk.lines[tk.lineIdx] || '';
  if (tk.typeT * 34 < cur.length) { tk.typeT = cur.length / 34 + 0.01; return; }
  if (tk.lineIdx < tk.lines.length - 1) { tk.lineIdx++; tk.typeT = 0; sfx('talk'); }
}
function chooseReply(i) {
  const tk = G.talk;
  const rep = tk.replies[i];
  /* A second conversation is a callback, not a second helping: no effects, no micro-game. */
  if (G.talksDone.indexOf(tk.id) !== -1 || (tk.id === 'tombrown' && G.tomDone)) {
    if (rep.toast) toast(rep.toast);
    sfx('ui');
    endTalk();
    return;
  }
  addAura(auraScale(rep.a !== undefined ? rep.a : Math.round((rep.r || 0) * 0.6)), 'conversation', 'talks');
  G.ledger.rapport = Math.max(0, Math.min(100, G.ledger.rapport + (rep.r || 0)));
  if (rep.r >= 6) G.flags.flattered = true;
  if (rep.residue) for (const k in rep.residue) G.ledger[k] += rep.residue[k];
  if (rep.flag) G.flags[rep.flag] = true;
  if (rep.toast) toast(rep.toast);
  tk.react = rep.r >= 6 ? 'grin' : rep.r < 0 ? 'wince' : 'smile';   /* shown while the micro-game opens */
  if (rep.r >= 0) sfx('good'); else sfx('bad');
  if (tk.mini) { G.screen = 'mini'; startMini(tk.mini); }
  else endTalk();
}
function endTalk() {
  const tk = G.talk;
  const id = tk.id;
  G.talk = null;
  if (id === 'tombrown') G.tomDone = true;
  if (id !== 'tombrown' && G.talksDone.indexOf(id) === -1) {
    G.talksDone.push(id);
    G.auraStats.talks++;
    if (G.talksDone.length === 3) {
      G.endingId = computeEndingId(G);   /* provisional ending after Act II */
      toast('The pen is up. Walk to the President’s desk.');
      sfx('sign');
    }
  }
  G.screen = 'room';
}

/* ---- signing: you become Trump ---- */
function startSign() {
  G.flags.tomIgnored = !G.flags.tomSeen;
  G.signLine = 0; G.signPhase = 'lines';
  G.screen = 'sign';
  sfx('shutter');
}
function chooseSign(id) {
  G.typoChoice = id;
  if (id === 'fix') G.ledger.typoAlive = false;
  sfx('pen');
  G.signPhase = 'mic';
}
function pickMic(id) {
  G.invitedMic = id;
  G.ledger.mic = id === 'nobody' ? 'trump' : id;
  G.screen = 'gaggle';
  G.gaggleT = 0;
  sfx('shutter');
}

/* ---- ambient jokes: triggered by real things, one toast at a time ---- */
const AMBIENT_TRIGGERS = [
  { id: 'sacks',      when: () => G.playerX < 0.15 },
  { id: 'karp',       when: () => G.playerX > 0.08 && G.playerX < 0.28 },
  { id: 'bezos',      when: () => G.playerX > 0.86 },
  { id: 'lisaSu',     when: () => G.playerX > 0.42 && G.playerX < 0.62 },
  { id: 'protest',    when: () => G.playerX < 0.1 && G.roomT > 8 },
  { id: 'americaGov', when: () => G.roomT > 18 },
  { id: 'samText',    when: () => !!G.flags.samCall },
  { id: 'johnson',    when: () => !!G.flags.constitution }
];
let ambientDone = {};

/* ---- update ---- */
function update(dt) {
  fadeT += dt;              /* fades finish even if the game is paused mid-fade */
  if (G.paused) return;
  G.t += dt;
  if (G.screen === 'cutscene') { updateCutscene(dt); return; }
  if (G.screen === 'press') { updatePress(dt); return; }
  if (G.screen === 'room') {
    worldUpdate(dt);
    if (G.screen !== 'room') return;
    /* ambient jokes: one at a time (East Room only) */
    if (G.zone === 'eastroom' && (!G.toast || G.t - G.toast.born > 5)) {
      for (const trg of AMBIENT_TRIGGERS) {
        if (!ambientDone[trg.id] && trg.when()) {
          ambientDone[trg.id] = true;
          toast(AMBIENT[trg.id]);
          break;
        }
      }
    }
  } else if (G.screen === 'talk') {
    if (G.talk) G.talk.typeT += dt;
  } else if (G.screen === 'mini') {
    if (mini && !mini.done) MINI[mini.id].tick(dt);
    else if (mini && mini.done) {
      for (const k in mini.residue) G.ledger[k] += mini.residue[k];
      if (mini.residue && mini.residue.flag) G.flags[mini.residue.flag] = true;
      if (mini.toast) toast(mini.toast);
      sfx(mini.success ? 'good' : 'bad');
      endTalk();
    }
  } else if (G.screen === 'gaggle') {
    G.gaggleT += dt;
    const beats = gaggleBeats(G.flags, G.ledger);
    if (G.gaggleT > beats.length * 5.5 + 1) {
      G.endingId = computeEndingId(G);
      G.screen = 'end';
      sfx('sign');
    }
  }
}

/* ---- draw ---- */
function draw() {
  if (G.screen !== lastDrawnScreen) { if (needsFade(lastDrawnScreen, G.screen)) fadeT = 0; lastDrawnScreen = G.screen; }
  HOTRECTS.length = 0;
  ctx.clearRect(0, 0, W, H);
  switch (G.screen) {
    case 'title': drawTitle(ctx, G.t); break;
    case 'cast': drawCast(ctx, G.t); break;
    case 'how': drawHow(ctx, G.t); break;
    case 'room': drawRoom(ctx, G.t, lastDt); break;
    case 'talk': drawTalk(ctx, G.t, lastDt); break;
    case 'mini':
      drawRoom(ctx, G.t, lastDt);
      if (mini) { MINI[mini.id].draw(ctx, G.t); }
      break;
    case 'sign': drawSign(ctx, G.t, lastDt); break;
    case 'gaggle': drawGaggle(ctx, G.t, lastDt); break;
    case 'cutscene': drawCutscene(ctx, G.t); break;
    case 'press': drawPress(ctx, G.t); break;
    case 'end': drawEnd(ctx, G.t); break;
  }
  if (G.paused && (G.screen === 'room' || G.screen === 'talk')) drawPause(ctx, G.t);
  if (fadeT < 0.4) { ctx.fillStyle = 'rgba(5,7,13,' + (1 - fadeT / 0.4) + ')'; ctx.fillRect(0, 0, W, H); }
  /* portrait phones: the stage is landscape, so say so (once) */
  if (!ROTATE_OK && window.innerHeight > window.innerWidth * 1.15) {
    ctx.fillStyle = 'rgba(7,10,18,0.9)'; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = PAL.gold2; ctx.font = '600 44px Georgia, serif'; ctx.textAlign = 'center';
    ctx.fillText('Best played sideways', W / 2, H / 2 - 40);
    ctx.fillStyle = PAL.cream; ctx.font = '26px Georgia, serif';
    ctx.fillText('Rotate your phone for the full room.', W / 2, H / 2 + 8);
    uiBtn(W / 2 - 130, H / 2 + 50, 260, 56, 'rotate_ok', 'PLAY ANYWAY', true);
  }
  /* mute toggle in the corner */
  const mb = { x: W - 34, y: H - 30, w: 24, h: 22 };
  HOTRECTS.push({ x: mb.x, y: mb.y, w: mb.w, h: mb.h, id: 'mute' });
  ctx.fillStyle = 'rgba(7,10,18,0.6)'; rr(ctx, mb.x, mb.y, mb.w, mb.h, 5); ctx.fill();
  ctx.strokeStyle = 'rgba(232,201,106,0.5)'; ctx.lineWidth = 1; rr(ctx, mb.x, mb.y, mb.w, mb.h, 5); ctx.stroke();
  ctx.fillStyle = muted ? 'rgba(245,239,221,0.4)' : 'rgba(232,201,106,0.9)';
  ctx.font = 'bold 11px Georgia, serif'; ctx.textAlign = 'center';
  ctx.fillText(muted ? '×' : '♪', mb.x + 12, mb.y + 15);
}

/* ---- click handling (immediate mode, after draw registers rects) ---- */
function handleClicks() {
  if (!ROTATE_OK && window.innerHeight > window.innerWidth * 1.15) {
    if (clicked('rotate_ok')) ROTATE_OK = true;
    return;
  }
  if (G.screen === 'cutscene') { if (CLICKS.length) skipCutscene(); return; }
  if (G.paused) {
    if (clicked('resume')) { G.paused = false; sfx('ui'); }
    else if (clicked('quit_title')) { G.paused = false; G.screen = 'title'; G.talk = null; sfx('ui'); }
    return;
  }
  if (G.screen === 'title') {
    if (clicked('PLAY')) { if (introSeen()) G.screen = 'cast'; else startCutscene('arrival'); sfx('ui'); }
    if (clicked('INTRO')) { startCutscene('arrival'); sfx('ui'); }
    if (clicked('CAST')) { G.screen = 'cast'; sfx('ui'); }
    if (clicked('HOW')) { G.screen = 'how'; sfx('ui'); }
  } else if (G.screen === 'cast') {
    for (const k of CAST) {
      if (k.starter && clicked('pick_' + k.id)) { startGame(k.id); return; }
      if (k.locked && UNLOCKED.trump && clicked('pick_' + k.id)) { startGame(k.id); return; }
    }
    if (clicked('back_title')) { G.screen = 'title'; sfx('ui'); }
  } else if (G.screen === 'how') {
    if (clicked('back_title')) { G.screen = 'title'; sfx('ui'); }
  } else if (G.screen === 'room') {
    if (clicked('mute')) { toggleMute(); return; }
    while (CLICKS.length) { const ck = CLICKS.shift(); worldClick(ck.x, ck.y); }
  } else if (G.screen === 'press') {
    for (let i = 0; i < 3; i++) if (clicked('ans_' + i)) { pressAnswer(i); return; }
  } else if (G.screen === 'talk') {
    const tk = G.talk;
    if (!tk) return;
    const cur = tk.lines[tk.lineIdx] || '';
    const allShown = tk.lineIdx >= tk.lines.length - 1 && tk.typeT * 34 >= cur.length;
    if (tk.phase === 'lines' && allShown) tk.phase = 'replies';
    if (tk.phase === 'replies') {
      for (let i = 0; i < tk.replies.length; i++) {
        if (clicked('reply_' + i)) { chooseReply(i); return; }
      }
    } else {
      advanceTalk();
    }
  } else if (G.screen === 'sign') {
    if (G.signPhase === 'lines') {
      if (G.signLine < SIGN_LINES.length - 1) { G.signLine++; sfx('talk'); }
      else G.signPhase = 'choices';
    } else if (G.signPhase === 'choices') {
      for (const ch of SIGN_CHOICES) {
        if (clicked('sign_' + ch.id)) { chooseSign(ch.id); return; }
      }
    } else if (G.signPhase === 'mic') {
      const talked = G.talksDone.slice(0, 3);
      for (let i = 0; i < talked.length; i++) {
        if (clicked('mic_' + talked[i])) { pickMic(talked[i]); return; }
      }
      if (clicked('mic_nobody')) { pickMic('nobody'); return; }
    }
  } else if (G.screen === 'end') {
    if (clicked('again')) { UNLOCKED.trump = true; saveUnlocks(); startGame(G.playerId); return; }
    if (clicked('another')) { UNLOCKED.trump = true; saveUnlocks(); G.screen = 'cast'; return; }
    if (clicked('tab_aura')) { G.endTab = G.endTab === 'aura' ? 'story' : 'aura'; sfx('ui'); return; }
  }
  if (clicked('mute')) toggleMute();
}
function saveUnlocks() {
  try { localStorage.setItem('wh_unlocks', JSON.stringify(UNLOCKED)); } catch (e) {}
}

/* ---- keyboard ---- */
window.addEventListener('keydown', function (e) {
  const k = e.key.toLowerCase();
  keys[k] = true;
  if (G.screen === 'room' && ['arrowleft', 'arrowright', 'arrowup', 'arrowdown', ' '].indexOf(k) >= 0) e.preventDefault();
  if (k === 'p') {
    if (G.screen === 'room' || G.screen === 'talk') G.paused = !G.paused;
  }
  if (k === 'm') toggleMute();
  if (G.screen === 'room' && !G.paused) {
    if (k === 'e' || k === 'enter' || k === ' ') { e.preventDefault(); interactPrimary(); }
    else if (k === 'f') interactHandshake();
  }
  if (G.screen === 'press' && (k === '1' || k === '2' || k === '3')) pressAnswer(+k - 1);
  if (G.screen === 'cutscene' && (k === ' ' || k === 'enter' || k === 'escape')) { e.preventDefault(); skipCutscene(); }
  if (G.screen === 'talk' && G.talk && !G.paused) {
    if ((k === '1' || k === '2') && G.talk.phase === 'replies' && G.talk.replies[+k - 1]) chooseReply(+k - 1);
    else if (k === ' ' || k === 'enter') { e.preventDefault(); CLICKS.push({ x: 2, y: 2 }); }
  } else if (G.screen === 'sign' && !G.paused && (k === ' ' || k === 'enter')) { e.preventDefault(); CLICKS.push({ x: 2, y: 2 }); }
  if (k === 'escape' && G.screen === 'talk') { if (G.talk && G.talk.phase === 'replies') addAura(-3, 'walked out mid-talk', 'talks'); G.talk = null; G.screen = 'room'; }
});
window.addEventListener('keyup', function (e) { keys[e.key.toLowerCase()] = false; });

/* ---- pointer ---- */
canvas.addEventListener('pointermove', function (e) {
  const r = canvas.getBoundingClientRect();
  MX = (e.clientX - r.left) / r.width * W;
  MY = (e.clientY - r.top) / r.height * H;
  MXY = { x: MX, y: MY };
});
canvas.addEventListener('pointerdown', function (e) {
  MDOWN = true;
  const r = canvas.getBoundingClientRect();
  CLICKS.push({ x: (e.clientX - r.left) / r.width * W, y: (e.clientY - r.top) / r.height * H });
});
window.addEventListener('pointerup', function () { MDOWN = false; });

/* ---- loop ---- */
let lastTs = 0, lastDt = 0.016;
function loop(ts) {
  const dt = Math.min(0.05, lastTs ? (ts - lastTs) / 1000 : 0.016);
  lastTs = ts;
  lastDt = dt;
  update(dt);
  draw();
  handleClicks();
  CLICKS.length = 0;
  requestAnimationFrame(loop);
}

/* ---- test hooks (deterministic QA, per threejs-game-skills discipline) ---- */
window.__GAME_TEST_HOOKS__ = {
  reset(seed) { RND = mulberry32(seed || 20260929); ambientDone = {}; },
  setKey(k, v) { keys[k] = v; },
  state: () => G,
  ledger: () => G.ledger,
  flags: () => G.flags,
  goto(screen) { G.screen = screen; },
  startGame, openTalk, chooseReply, startSign, chooseSign, pickMic,
  endMiniForce(success, residue, msg) { if (mini) finishMini(success, residue || {}, msg || ''); },
  mini: () => mini,
  advanceTalk,
  tick(dt) { update(dt || 0.016); draw(); handleClicks(); CLICKS.length = 0; },
  tickLight(dt) { update(dt || 0.016); handleClicks(); CLICKS.length = 0; },
  drawFrame() { draw(); },
  click(x, y) { CLICKS.push({ x: x, y: y }); },
  rects: () => HOTRECTS
};

/* ---- boot ---- */
worldReset('musk');
resize();
window.addEventListener('resize', resize);
requestAnimationFrame(loop);
