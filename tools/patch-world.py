import re

def read(p):
    s = open(p, encoding='utf-8', newline='').read()
    return s.replace('\r\n', '\n'), '\r\n' in s

def write(p, s, crlf):
    open(p, 'w', encoding='utf-8', newline='').write(s.replace('\n', '\r\n') if crlf else s)

def edit(path, pairs):
    s, crlf = read(path)
    for a, b in pairs:
        assert a in s, (path, a[:90])
        s = s.replace(a, b, 1)
    write(path, s, crlf)

def replace_func(src, name, new):
    m = re.search(r'^function ' + name + r'\(', src, re.M)
    assert m, name
    i = src.index('{', m.start()); depth = 0; j = i
    while True:
        ch = src[j]
        if ch == '{': depth += 1
        elif ch == '}':
            depth -= 1
            if depth == 0: break
        j += 1
    return src[:m.start()] + new.strip('\n') + src[j + 1:]

PARTS_OLD = "'assets.list.js', 'assets.js', 'cutscene.js', 'main.js', 'agent.js'"
PARTS_NEW = "'assets.list.js', 'assets.js', 'cutscene.js', 'world.js', 'press.js', 'main.js', 'agent.js'"
edit('build.js', [(PARTS_OLD, PARTS_NEW)])
edit('agents/harness.js', [(PARTS_OLD, PARTS_NEW)])

# ---------------------------------------------------------------- art: extra people
edit('src/art.js', [(
 "  player:   { face:'oval',",
 """  rep1:     { skin:'#e6b898', hair:'long',  hairC:'#5a3a22', suit:'#3a3f55', shirt:'#e8e4da', tie:null,      exp:'smile',   face:'heart',  build:'slim' },
  rep2:     { skin:'#b8794a', hair:'short', hairC:'#1a1410', suit:'#2e3a3a', shirt:'#dcd8cc', tie:'#8a3a2a', exp:'flat',    face:'square', build:'stocky', glasses:true },
  rep3:     { skin:'#d9a077', hair:'neat',  hairC:'#15110e', suit:'#4a2f4a', shirt:'#ece6f0', tie:null,      exp:'smile',   face:'oval',   build:'slim' },
  rep4:     { skin:'#e4b08a', hair:'curls', hairC:'#2a2018', suit:'#33383f', shirt:'#d8d4ca', tie:'#2a5a6a', exp:'deadpan', face:'round',  build:'avg', beard:true },
  guard:    { skin:'#c8946a', hair:'buzz',  hairC:'#14110e', suit:'#14181f', shirt:'#e6e4de', tie:'#14181f', exp:'flat',    face:'square', build:'broad', glasses:true },
  docent:   { skin:'#eac4a6', hair:'neat',  hairC:'#b8b8b8', suit:'#4a3a5a', shirt:'#efe8f2', tie:null,      exp:'smile',   face:'heart',  build:'slim', glasses:true },
  pres_washington:{ skin:'#e8c4a6', hair:'curls', hairC:'#ece8de', suit:'#1c2230', shirt:'#f3eddc', tie:null, exp:'stiff', face:'long',  build:'avg' },
  pres_jefferson: { skin:'#e8c0a0', hair:'neat',  hairC:'#b8683c', suit:'#2a2a3a', shirt:'#f3eddc', tie:null, exp:'smile', face:'oval',  build:'slim' },
  pres_lincoln:   { skin:'#d8b08c', hair:'short', hairC:'#1a1511', suit:'#16181e', shirt:'#f0ece0', tie:'#16181e', exp:'flat', face:'long', build:'slim', beard:true },
  pres_troosevelt:{ skin:'#e8b894', hair:'short', hairC:'#6a5638', suit:'#2e3a2a', shirt:'#f0ece0', tie:'#6a3a2a', exp:'grin', face:'round', build:'stocky', glasses:true },
  pres_fdr:       { skin:'#ecc6a8', hair:'side',  hairC:'#8a8a8a', suit:'#26303c', shirt:'#f0ece0', tie:'#3a4a6a', exp:'smile', face:'long', build:'avg', glasses:true },
  pres_ike:       { skin:'#eac0a0', hair:'bald',  hairC:'#8a8478', suit:'#2a2e24', shirt:'#f0ece0', tie:'#5a3a2a', exp:'smile', face:'round', build:'stocky' },
  pres_jfk:       { skin:'#ecc2a2', hair:'side',  hairC:'#6a4a2e', suit:'#1f2a3a', shirt:'#f4f0e6', tie:'#2a3a5a', exp:'smile', face:'heart', build:'slim' },
  pres_reagan:    { skin:'#eabf9f', hair:'neat',  hairC:'#3e2e22', suit:'#2a2f3a', shirt:'#f4f0e6', tie:'#7a2a2a', exp:'smile', face:'oval',  build:'avg' },
  player:   { face:'oval',"""
)])

# ---------------------------------------------------------------- data: the faded ending
edit('src/data.js', [
 ("  perfect: {\n    title:'THE GOLDEN AGE',",
  "  faded: {\n    title:'FADED INTO THE WALLPAPER',\n    art:'faded',\n    lines:[\n      'Nobody noticed you leave. That is the whole story.',\n      'The photo has a gap where a person was.',\n      'The Accord is signed. Someone asks who you were.',\n      'The answer: “the one by the curtain.”',\n      'Your aura went out like a phone at one percent.',\n      'Next time: shake a hand, admire a portrait, be seen.'\n    ]\n  },\n  perfect: {\n    title:'THE GOLDEN AGE',"),
 ("  const L = state.ledger, f = state.flags, e = ENDINGS[state.endingId];\n  const lines = e.lines.slice();",
  "  const L = state.ledger, f = state.flags, e = ENDINGS[state.endingId];\n  const lines = e.lines.slice();\n  if (state.endingId === 'faded') return lines.slice(0, 6);"),
 ("    perfect: 'The Golden Age of Super Intelligence has begun. Tremendous.'","    perfect: 'The Golden Age of Super Intelligence has begun. Tremendous.',\n    faded: 'Who was standing by the curtain?'"),
])

# ---------------------------------------------------------------- scenes
s, crlf = read('src/scenes.js')
s = s.replace("function drawTable(c, t) {\n  /* carpet */\n  const cg = c.createLinearGradient(0, 560, 0, H);",
              "function drawTable(c, t, zh) {\n  zh = zh || H;\n  /* carpet */\n  const cg = c.createLinearGradient(0, 560, 0, zh);")
s = s.replace("c.fillStyle = cg; c.fillRect(0, 560, W, H - 560);", "c.fillStyle = cg; c.fillRect(0, 560, W, zh - 560);")
s = s.replace("for (let x = 0; x < W; x += 90) c.fillRect(x, 566, 45, H - 566);", "for (let x = 0; x < W; x += 90) c.fillRect(x, 566, 45, zh - 566);")
s = replace_func(s, 'drawRoom', '''
function drawRoom(c, t, dt) {
  worldDraw(c, t, dt);
  drawHUD(c);
}''')
s = replace_func(s, 'drawHUD', '''
function drawHUD(c) {
  /* 1. who you are + the AURA meter + rapport; 2. side goals (drawn by drawAuraMeter) */
  drawAuraMeter(c, G.t);
  /* 3. objective: the box fits its text */
  const obj = G.talksDone.length >= 3
    ? 'The pen is up. Walk to the President’s desk.'
    : 'Objective: talk to 3 people at the table (' + G.talksDone.length + '/3)';
  c.font = '14px Georgia, serif';
  const ow = Math.min(W - 700, c.measureText(obj).width + 40);
  c.fillStyle = 'rgba(7,10,18,0.7)';
  rr(c, W / 2 - ow / 2, 14, ow, 30, 8); c.fill();
  c.fillStyle = PAL.gold2; c.textAlign = 'center';
  c.fillText(obj, W / 2, 34);
  /* pause hint */
  c.fillStyle = 'rgba(7,10,18,0.7)';
  rr(c, W - 96, 14, 82, 30, 8); c.fill();
  c.fillStyle = 'rgba(245,239,221,0.8)'; c.font = '12px Georgia, serif'; c.textAlign = 'center';
  c.fillText('P = MENU', W - 55, 34);
  /* toast: one at a time, centred under the objective so it never covers a window or a button */
  if (G.toast && G.t - G.toast.born < 5.2) {
    const a = Math.min(1, (5.2 - (G.t - G.toast.born)) / 1.2) * Math.min(1, (G.t - G.toast.born) / 0.18 + 0.2);
    c.font = '15px Georgia, serif';
    const tw2 = Math.min(640, W - 120);
    const lines2 = wrapTextLines(c, G.toast.t, tw2 - 36);
    const th2 = 22 * lines2.length + 18;
    const tx2 = W / 2 - tw2 / 2, ty2 = 54;
    c.fillStyle = 'rgba(7,10,18,' + (0.86 * a) + ')';
    rr(c, tx2, ty2, tw2, th2, 10); c.fill();
    c.strokeStyle = 'rgba(201,162,39,' + (0.7 * a) + ')'; c.lineWidth = 1.2; rr(c, tx2, ty2, tw2, th2, 10); c.stroke();
    c.fillStyle = 'rgba(245,239,221,' + a + ')'; c.textAlign = 'center';
    lines2.forEach((l, i) => c.fillText(l, W / 2, ty2 + 27 + i * 22));
  }
}''')
s = replace_func(s, 'drawEnd', '''
function drawAuraReport(c, rx, rw) {
  const R = auraReport();
  const col = { S: '#7ef0a8', A: '#c9e86a', B: PAL.gold2, C: '#f0b070', D: '#ff9a90' }[R.rank];
  c.fillStyle = PAL.gold2; c.font = '600 22px Georgia, serif'; c.textAlign = 'left';
  c.fillText('YOUR AURA REPORT', rx, 142);
  c.fillStyle = '#16233c'; rr(c, rx, 160, 150, 152, 16); c.fill();
  c.strokeStyle = col; c.lineWidth = 3; rr(c, rx, 160, 150, 152, 16); c.stroke();
  c.fillStyle = col; c.font = '800 96px Georgia, serif'; c.textAlign = 'center'; c.fillText(R.rank, rx + 75, 246);
  c.fillStyle = PAL.cream; c.font = 'bold 14px Georgia, serif'; c.fillText(R.title, rx + 75, 284);
  c.textAlign = 'left'; c.fillStyle = PAL.gold2; c.font = '600 44px Georgia, serif'; c.fillText(R.score + ' pts', rx + 178, 214);
  c.fillStyle = 'rgba(245,239,221,0.75)'; c.font = '15px Georgia, serif';
  c.fillText('Peak aura ' + Math.round(G.auraPeak) + '   ·   lowest ' + Math.round(G.auraStats.lowest), rx + 178, 244);
  c.fillText('Everything you did counted. Here is where it came from.', rx + 178, 270);
  const maxPts = 360;
  R.parts.forEach((p, i) => {
    const y = 344 + i * 30;
    c.fillStyle = PAL.cream; c.font = 'bold 14px Georgia, serif'; c.textAlign = 'left'; c.fillText(p.label, rx, y);
    c.fillStyle = 'rgba(245,239,221,0.6)'; c.font = '13px Georgia, serif'; c.fillText(p.detail, rx + 170, y);
    const bw = Math.min(150, Math.abs(p.pts) / maxPts * 150);
    c.fillStyle = 'rgba(245,239,221,0.1)'; rr(c, rx + rw - 230, y - 11, 150, 10, 5); c.fill();
    c.fillStyle = p.pts >= 0 ? PAL.gold : '#ff7d70'; rr(c, rx + rw - 230, y - 11, Math.max(4, bw), 10, 5); c.fill();
    c.fillStyle = p.pts >= 0 ? PAL.gold2 : '#ff9a90'; c.font = 'bold 14px Georgia, serif'; c.textAlign = 'right'; c.fillText((p.pts > 0 ? '+' : '') + p.pts, rx + rw, y);
  });
}

function drawEnd(c, t) {
  const e = ENDINGS[G.endingId];
  const g = c.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, '#0c1220'); g.addColorStop(1, '#101b2d');
  c.fillStyle = g; c.fillRect(0, 0, W, H);
  /* left: the still, art variant */
  const fx = 56, fy = 84, fw = 430, fh = 300;
  c.fillStyle = '#080a10'; rr(c, fx - 14, fy - 14, fw + 28, fh + 28, 6); c.fill();
  c.strokeStyle = PAL.gold; c.lineWidth = 3; rr(c, fx - 14, fy - 14, fw + 28, fh + 28, 6); c.stroke();
  c.save(); rr(c, fx, fy, fw, fh, 3); c.clip();
  const still = ASSETS.img('end-' + G.endingId);
  if (still) drawCover(c, still, fx, fy, fw, fh); else drawEndingArt(c, t, e.art, fx, fy, fw, fh);
  c.restore();
  c.fillStyle = 'rgba(245,239,221,0.6)'; c.font = '12px Georgia, serif'; c.textAlign = 'center';
  c.fillText(e.art.toUpperCase() + ' — ' + e.title, fx + fw / 2, fy + fh + 36);
  /* title */
  const rx = fx + fw + 56, rw = W - rx - 56;
  c.fillStyle = PAL.gold2; c.font = '600 38px Georgia, serif'; c.textAlign = 'left';
  if (G.endTab !== 'aura') c.fillText(e.title, rx, 112);
  if (G.endTab === 'aura') {
    drawAuraReport(c, rx, rw);
  } else {
    /* the story: each line starts where the last one ended, so wrapped lines never overlap */
    let y = 152;
    c.font = '16px Georgia, serif';
    endLines(G).forEach((l, i) => {
      c.fillStyle = i === 5 ? 'rgba(232,201,106,0.95)' : PAL.cream;
      y = wrapText(c, l, rx, y, rw, 22, 'left') + 36;
    });
    /* share card: fake X post, placed under the story */
    const sc = shareCard(G);
    const sw2 = Math.min(460, rw), sh2 = 96, sx2 = rx, sy2 = Math.max(y - 8, 392);
    c.fillStyle = '#0c1320'; rr(c, sx2, sy2, sw2, sh2, 10); c.fill();
    c.strokeStyle = '#26365a'; c.lineWidth = 1.5; rr(c, sx2, sy2, sw2, sh2, 10); c.stroke();
    c.fillStyle = '#e8c96a'; c.font = 'bold 13px Georgia, serif'; c.textAlign = 'left';
    c.fillText(sc.who, sx2 + 16, sy2 + 26);
    c.fillStyle = '#dfe5f5'; c.font = 'italic 14px Georgia, serif';
    wrapText(c, sc.txt, sx2 + 16, sy2 + 48, sw2 - 32, 18, 'left');
    c.fillStyle = '#8a9bb0'; c.font = '12px Georgia, serif';
    c.fillText('♥ ' + sc.likes + '   the internet reacts', sx2 + 16, sy2 + sh2 - 12);
  }
  /* buttons */
  const by = 632;
  uiBtn(rx, by, 160, 44, 'again', 'PLAY AGAIN');
  uiBtn(rx + 172, by, 200, 44, 'another', 'TRY ANOTHER CEO');
  uiBtn(rx + 384, by, 190, 44, 'tab_aura', G.endTab === 'aura' ? 'SHOW THE STORY' : 'AURA REPORT', G.endTab !== 'aura');
}''')
# the faded ending's still: one empty chair, going out
s = s.replace("  if (art === 'pulitzer') {", """  if (art === 'faded') {
    c.fillStyle = '#0c1018'; c.fillRect(x, y, w, h);
    const sp = c.createRadialGradient(x + w / 2, y + h * 0.55, 10, x + w / 2, y + h * 0.55, 190);
    sp.addColorStop(0, 'rgba(255,230,170,0.35)'); sp.addColorStop(1, 'rgba(255,230,170,0)'); c.fillStyle = sp; c.fillRect(x, y, w, h);
    c.fillStyle = '#241a10'; rr(c, x + w / 2 - 40, y + 70, 80, 130, 10); c.fill(); rr(c, x + w / 2 - 54, y + 190, 108, 22, 6); c.fill();
    c.fillStyle = 'rgba(201,162,39,0.35)'; rr(c, x + w / 2 - 30, y + 80, 60, 8, 3); c.fill();
    c.fillStyle = 'rgba(12,16,24,0.55)'; c.fillRect(x, y, w, h);
    c.fillStyle = PAL.gold; c.font = 'bold 13px Georgia, serif'; c.textAlign = 'center'; c.fillText('THE ONE BY THE CURTAIN', x + w / 2, y + h - 18);
  } else if (art === 'pulitzer') {""", 1)
write('src/scenes.js', s, crlf)

# ---------------------------------------------------------------- cutscene: the rocket launch
edit('src/cutscene.js', [
 ("  } else if (id === 'desk') {\n    startSign();\n  } else {",
  "  } else if (id === 'desk') {\n    startSign();\n  } else if (id === 'launch') {\n    G.auraStats.rocket = true;\n    addAura(auraScale(5), 'rocket launch', 'rocket');\n    G.screen = 'room';\n    toast('The rocket is gone. Several reporters write “tremendous” with a rocket emoji.');\n  } else {"),
 ("const CUTSCENES = {", """const CUTSCENES = {
  /* ---- THE LAUNCH: the lawn demo, a countdown, lift-off ---- */
  launch: {
    dur: 9,
    draw(c, t) {
      const lift = Math.max(0, t - 3.4), y = 640 - lift * lift * 62;
      const shake = t > 3.2 && t < 7 ? Math.sin(t * 90) * Math.min(6, (t - 3.2) * 5) : 0;
      c.save(); c.translate(shake * 0.6, shake);
      const sky = c.createLinearGradient(0, 0, 0, H); sky.addColorStop(0, '#070b18'); sky.addColorStop(0.7, '#3a3060'); sky.addColorStop(1, '#f0924f');
      c.fillStyle = sky; c.fillRect(-20, -20, W + 40, H + 40);
      for (let i = 0; i < 70; i++) { c.fillStyle = 'rgba(245,239,221,' + (0.25 + 0.3 * Math.sin(t + i)) + ')'; c.fillRect((i * 211) % W, (i * 97) % 380, 2, 2); }
      c.fillStyle = '#0d1a14'; for (let x = -20; x < W + 40; x += 44) { const h = 40 + ((x * 7) % 30); c.beginPath(); c.moveTo(x, 620); c.lineTo(x + 22, 620 - h); c.lineTo(x + 44, 620); c.fill(); }
      c.fillStyle = '#173a22'; c.fillRect(-20, 620, W + 40, 120);
      /* smoke blooms from the pad */
      if (t > 3.2) for (let i = 0; i < 16; i++) {
        const k = Math.min(1, (t - 3.2) / 4), a = (1 - k) * 0.5, sx = 640 + Math.sin(i * 2.1) * (60 + k * 300), sr = 30 + k * 90 + (i % 4) * 14;
        c.fillStyle = 'rgba(235,225,210,' + a + ')'; c.beginPath(); c.arc(sx, 636 - (i % 3) * 8, sr, 0, 7); c.fill();
      }
      drawRocket(c, 640, y, 1.6 + lift * 0.02, t, t > 3.4 ? Math.min(1, (t - 3.4) / 1.2) : 0);
      c.restore();
      /* countdown, then the word */
      const cd = ['3', '2', '1'];
      for (let i = 0; i < 3; i++) cutTitle(c, cd[i], 300, t, 0.2 + i * 0.95, 0.2 + i * 0.95 + 0.9, 140, false);
      cutTitle(c, 'LIFT-OFF', 200, t, 3.5, 7.5, 64, false);
      cutTitle(c, 'SPACEX · SOUTH LAWN DEMO', 120, t, 0.3, 3.1, 24, true);
      if (t > 8) { c.fillStyle = 'rgba(5,7,13,' + Math.min(1, (t - 8)) + ')'; c.fillRect(0, 0, W, H); }
      if (G.cut && G.cut.flashed < 0 && t > 3.4) { G.cut.flashed = 1; sfx('shutter'); }
    }
  },
"""),
])

# ---------------------------------------------------------------- main
edit('src/main.js', [
 # state
 ("  playerX: 0.5, vx: 0, walkPhase: 0,", "  playerX: 0.5, vx: 0, vy: 0, walkPhase: 0, endTab: 'story',"),
 ("  const st = STARTS[playerId];\n  if (st) {\n    G.playerX = st.x;\n    for (const k in st.ledger) G.ledger[k] += st.ledger[k];\n    toast(st.toast);\n  }\n}",
  "  const st = STARTS[playerId];\n  if (st) {\n    G.playerX = st.x;\n    for (const k in st.ledger) G.ledger[k] += st.ledger[k];\n    toast(st.toast);\n  }\n  worldReset(playerId);\n  G.press = null; G.endTab = 'story';\n}"),
 # replies move the aura, and walking out of a conversation is rude
 ("  G.ledger.rapport = Math.max(0, Math.min(100, G.ledger.rapport + (rep.r || 0)));\n  if (rep.r >= 6) G.flags.flattered = true;",
  "  addAura(auraScale(rep.a !== undefined ? rep.a : Math.round((rep.r || 0) * 0.6)), 'conversation', 'talks');\n  G.ledger.rapport = Math.max(0, Math.min(100, G.ledger.rapport + (rep.r || 0)));\n  if (rep.r >= 6) G.flags.flattered = true;"),
 ("  if (id !== 'tombrown' && G.talksDone.indexOf(id) === -1) {\n    G.talksDone.push(id);",
  "  if (id !== 'tombrown' && G.talksDone.indexOf(id) === -1) {\n    G.talksDone.push(id);\n    G.auraStats.talks++;"),
 # the room: the world updates itself
 ("  if (G.screen === 'room') {\n    G.roomT += dt;\n    const left = keys['arrowleft'] || keys['a'], right = keys['arrowright'] || keys['d'];\n    G.vx = (right ? 160 : 0) - (left ? 160 : 0);\n    G.playerX = Math.max(0.04, Math.min(0.96, G.playerX + G.vx * dt / W));\n    /* ambient jokes: one at a time */\n    if (!G.toast || G.t - G.toast.born > 5) {",
  "  if (G.screen === 'press') { updatePress(dt); return; }\n  if (G.screen === 'room') {\n    worldUpdate(dt);\n    if (G.screen !== 'room') return;\n    /* ambient jokes: one at a time (East Room only) */\n    if (G.zone === 'eastroom' && (!G.toast || G.t - G.toast.born > 5)) {"),
 ("    case 'cutscene': drawCutscene(ctx, G.t); break;", "    case 'cutscene': drawCutscene(ctx, G.t); break;\n    case 'press': drawPress(ctx, G.t); break;"),
 # clicks
 ("  } else if (G.screen === 'room') {\n    for (const s of SEATS) {\n      if (s.id === G.playerId) continue;\n      if (clicked('npc_' + s.id)) {\n        if (s.id === 'trump') {\n          if (G.talksDone.length >= 3) startCutscene('desk');\n          else toast('The pen comes at the signing. Mingle first.');\n        } else if (G.talksDone.length >= 3 && G.talksDone.indexOf(s.id) === -1) {\n          toast('Three conversations is the rule. The pen is up.');\n        } else openTalk(s.id);\n        return;\n      }\n    }\n    if (clicked('npc_tombrown')) { openTalk('tombrown'); return; }\n  } else if (G.screen === 'talk') {",
  "  } else if (G.screen === 'room') {\n    if (clicked('mute')) { toggleMute(); return; }\n    while (CLICKS.length) { const ck = CLICKS.shift(); worldClick(ck.x, ck.y); }\n  } else if (G.screen === 'press') {\n    for (let i = 0; i < 3; i++) if (clicked('ans_' + i)) { pressAnswer(i); return; }\n  } else if (G.screen === 'talk') {"),
 ("    if (clicked('another')) { UNLOCKED.trump = true; saveUnlocks(); G.screen = 'cast'; return; }\n  }",
  "    if (clicked('another')) { UNLOCKED.trump = true; saveUnlocks(); G.screen = 'cast'; return; }\n    if (clicked('tab_aura')) { G.endTab = G.endTab === 'aura' ? 'story' : 'aura'; sfx('ui'); return; }\n  }"),
 # keyboard
 ("  if (k === 'm') toggleMute();\n  if (G.screen === 'cutscene'",
  "  if (k === 'm') toggleMute();\n  if (G.screen === 'room' && !G.paused) {\n    if (k === 'e' || k === 'enter' || k === ' ') { e.preventDefault(); interactPrimary(); }\n    else if (k === 'f') interactHandshake();\n  }\n  if (G.screen === 'press' && (k === '1' || k === '2' || k === '3')) pressAnswer(+k - 1);\n  if (G.screen === 'cutscene'"),
 ("  if (k === 'escape' && G.screen === 'talk') { G.talk = null; G.screen = 'room'; }",
  "  if (k === 'escape' && G.screen === 'talk') { if (G.talk && G.talk.phase === 'replies') addAura(-3, 'walked out mid-talk', 'talks'); G.talk = null; G.screen = 'room'; }"),
 ("  reset(seed) { RND = mulberry32(seed || 20260929); ambientDone = {}; },", "  reset(seed) { RND = mulberry32(seed || 20260929); ambientDone = {}; },\n  setKey(k, v) { keys[k] = v; },"),
 ("resize();\nwindow.addEventListener('resize', resize);", "worldReset('musk');\nresize();\nwindow.addEventListener('resize', resize);"),
])
print('world patched')
