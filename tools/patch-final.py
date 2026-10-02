def read(p):
    s = open(p, encoding='utf-8', newline='').read()
    return s.replace('\r\n', '\n'), '\r\n' in s

def edit(path, pairs):
    s, crlf = read(path)
    for a, b in pairs:
        assert a in s, (path, a[:80])
        s = s.replace(a, b, 1)
    open(path, 'w', encoding='utf-8', newline='').write(s.replace('\n', '\r\n') if crlf else s)

# ------------------------------------------------------------ world: doors you can actually find, and the clock
edit('src/world.js', [
 # clicking anywhere on a door (it is drawn on the wall) walks you to it
 ("  for (const t of targets) {\n    const body = t.person ? 70 : (t.kind === 'portrait' ? 130 : 90);",
  "  for (const t of targets) {\n    if (t.kind === 'portal' && Math.abs(wx - t.x) < 90 && wy > t.y - 520 && wy < t.y + 80) { hit = t; bd = 0; break; }\n    const body = t.person ? 70 : (t.kind === 'portrait' ? 130 : 90);"),
 # walking into a door is enough
 ("Math.hypot(best.x - G.px, best.y - G.py) < 30) { enterZone",
  "Math.hypot(best.x - G.px, (best.y - G.py) * 0.8) < 48) { enterZone"),
 # the press clock ticks only while you are free to roam
 ("  /* what is in front of you */\n  const targets = worldTargets();",
  "  if (G.human && !G.sealed) {\n    G.clock -= dt;\n    if (G.clock <= 0) { G.clock = 0; G.sealed = true; toast('The press conference is starting. Everyone to the lawn!'); startPressConference(true); return; }\n  }\n  if (G.human && !G.doorHint && G.roomT > 7) { G.doorHint = true; toast('Doors: far left = the Gallery, far right = the South Lawn. Click one or walk into it.'); }\n  /* what is in front of you */\n  const targets = worldTargets();"),
])

# ------------------------------------------------------------ press: the final one
edit('src/press.js', [
 ("function startPressConference() {\n  G.press = G.press || { used: {}, sessions: 0 };\n  const fresh = PRESS_QUESTIONS.filter((q) => !G.press.used[q.id]);",
  "function startPressConference(final) {\n  G.press = G.press || { used: {}, sessions: 0 };\n  if (final) {\n    /* the finale: four questions, full value, unused ones first */\n    const pool = PRESS_QUESTIONS.slice().sort((a, b) => ((G.press.used[a.id] ? 1 : 0) - (G.press.used[b.id] ? 1 : 0)) || (idHash(a.id + 'f' + G.t) - idHash(b.id + 'f' + G.t)));\n    const mine = pool.filter((q) => q.home === G.playerId && !G.press.used[q.id]).slice(0, 1);\n    const qs = mine.concat(pool.filter((q) => mine.indexOf(q) < 0)).slice(0, 4);\n    G.press.session = { qs: qs, i: 0, t: 0, answered: null, total: 0, mult: 1, final: true };\n    G.press.sessions++;\n    G.sealed = true; G.screen = 'press'; sfx('shutter');\n    return;\n  }\n  const fresh = PRESS_QUESTIONS.filter((q) => !G.press.used[q.id]);"),
 ("  if (ses.i >= ses.qs.length) { G.screen = 'room'; G.press.session = null;",
  "  if (ses.i >= ses.qs.length && ses.final) { G.press.session = null; finishRun(); return; }\n  if (ses.i >= ses.qs.length) { G.screen = 'room'; G.press.session = null;"),
 ("  c.fillStyle = '#6a5a44'; c.font = 'bold 12px Georgia'; c.textAlign = 'left'; c.fillText('QUESTION '",
  "  if (ses.final) { c.fillStyle = PAL.gold2; c.font = 'bold 15px Georgia, serif'; c.textAlign = 'center'; c.fillText('★  THE FINAL PRESS CONFERENCE  ★  your score is decided here', W / 2, 104); }\n  c.fillStyle = '#6a5a44'; c.font = 'bold 12px Georgia'; c.textAlign = 'left'; c.fillText('QUESTION '"),
])

# ------------------------------------------------------------ main: flow, clicks
edit('src/main.js', [
 ("  worldReset(playerId);\n  G.press = null; G.endTab = 'story';\n}",
  "  worldReset(playerId);\n  G.press = null; G.endTab = 'story';\n  G.clock = ROUND_SECONDS; G.sealed = false; G.scored = false; G.share = null; G.postPick = 0; G.human = false; G.doorHint = false;\n}"),
 ("    if (G.gaggleT > beats.length * 5.5 + 1) {\n      G.endingId = computeEndingId(G);\n      G.screen = 'end';\n      sfx('sign');\n    }",
  "    if (G.gaggleT > beats.length * 5.5 + 1) {\n      G.endingId = computeEndingId(G);\n      sfx('sign');\n      if (G.human) { G.screen = 'room'; G.zone = 'lawn'; enterZone('lawn', { x: 640, y: 1330 }); startPressConference(true); }\n      else G.screen = 'end';\n    }"),
 ("      if (k.starter && clicked('pick_' + k.id)) { startGame(k.id); return; }\n      if (k.locked && UNLOCKED.trump && clicked('pick_' + k.id)) { startGame(k.id); return; }",
  "      if (k.starter && clicked('pick_' + k.id)) { startGame(k.id); G.human = true; return; }\n      if (k.locked && UNLOCKED.trump && clicked('pick_' + k.id)) { startGame(k.id); G.human = true; return; }"),
 ("startGame(G.playerId); return; }\n    if (clicked('another'))", "startGame(G.playerId); G.human = true; return; }\n    if (clicked('another'))"),
 ("    if (clicked('tab_aura')) { G.endTab = G.endTab === 'aura' ? 'story' : 'aura'; sfx('ui'); return; }",
  "    if (clicked('tab_aura')) { G.endTab = G.endTab === 'aura' ? 'story' : 'aura'; sfx('ui'); return; }\n    if (clicked('tab_board')) { G.endTab = G.endTab === 'board' ? 'story' : 'board'; sfx('ui'); return; }\n    for (let i = 0; i < 3; i++) if (clicked('post_' + i)) { G.postPick = i; sfx('ui'); return; }\n    if (clicked('post_go')) { openXPost(); return; }\n    if (clicked('post_copy')) { copyXPost(); return; }"),
])

# ------------------------------------------------------------ scenes: clock, board, posts
edit('src/scenes.js', [
 ("  /* pause hint */\n  c.fillStyle = 'rgba(7,10,18,0.7)';",
  "  /* the press clock */\n  if (G.human && !G.sealed) {\n    const m = Math.floor(G.clock / 60), sec = Math.floor(G.clock % 60), low = G.clock < 30;\n    c.fillStyle = low ? 'rgba(120,20,20,0.85)' : 'rgba(7,10,18,0.7)'; rr(c, W - 262, 14, 156, 30, 8); c.fill();\n    c.fillStyle = low ? '#ffb0a8' : PAL.gold2; c.font = 'bold 13px Georgia, serif'; c.textAlign = 'center';\n    c.fillText('PRESS IN ' + m + ':' + (sec < 10 ? '0' : '') + sec, W - 184, 34);\n  }\n  /* pause hint */\n  c.fillStyle = 'rgba(7,10,18,0.7)';"),
 ("function drawEnd(c, t) {\n  const e = ENDINGS[G.endingId];",
  "function drawEnd(c, t) {\n  if (!G.scored) finishRun();\n  const e = ENDINGS[G.endingId];"),
 ("  if (G.endTab !== 'aura') c.fillText(e.title, rx, 112);\n  if (G.endTab === 'aura') {\n    drawAuraReport(c, rx, rw);\n  } else {",
  "  if (G.endTab === 'story') c.fillText(e.title, rx, 112);\n  if (G.endTab === 'aura') {\n    drawAuraReport(c, rx, rw);\n  } else if (G.endTab === 'board') {\n    drawBoard(c, rx, rw);\n  } else {"),
 ("    const sc = shareCard(G);\n    const sw2 = Math.min(460, rw), sh2 = 96, sx2 = rx, sy2 = Math.max(y - 8, 392);",
  "    const sc = currentPost();\n    const sw2 = Math.min(560, rw), sh2 = 96, sx2 = rx, sy2 = Math.max(y - 8, 380);"),
 ("    c.fillText('♥ ' + sc.likes + '   the internet reacts', sx2 + 16, sy2 + sh2 - 12);\n  }",
  "    c.fillText('♥ ' + sc.likes + '   the internet reacts', sx2 + 16, sy2 + sh2 - 12);\n    /* pick your post */\n    c.fillStyle = PAL.gold2; c.font = 'bold 13px Georgia, serif'; c.textAlign = 'left';\n    c.fillText('CHOOSE YOUR POST', rx, sy2 + sh2 + 28);\n    const ow = Math.floor((rw - 24) / 3);\n    POST_TONES.forEach((p, i) => uiBtn(rx + i * (ow + 12), sy2 + sh2 + 38, ow, 38, 'post_' + i, p.label, G.postPick === i));\n    uiBtn(rx, sy2 + sh2 + 86, 190, 38, 'post_go', 'POST TO X  ↗', true);\n    uiBtn(rx + 202, sy2 + sh2 + 86, 150, 38, 'post_copy', G.copied ? 'COPIED' : 'COPY TEXT');\n  }"),
 ("  uiBtn(rx, by, 160, 44, 'again', 'PLAY AGAIN');\n  uiBtn(rx + 172, by, 200, 44, 'another', 'TRY ANOTHER CEO');\n  uiBtn(rx + 384, by, 190, 44, 'tab_aura', G.endTab === 'aura' ? 'SHOW THE STORY' : 'AURA REPORT', G.endTab !== 'aura');",
  "  uiBtn(rx, by, 120, 44, 'again', 'PLAY AGAIN');\n  uiBtn(rx + 130, by, 170, 44, 'another', 'ANOTHER CEO');\n  uiBtn(rx + 310, by, 170, 44, 'tab_aura', G.endTab === 'aura' ? 'THE STORY' : 'AURA REPORT', G.endTab !== 'aura');\n  uiBtn(rx + 490, by, 170, 44, 'tab_board', G.endTab === 'board' ? 'THE STORY' : 'LEADERBOARD', G.endTab !== 'board');"),
])
print('final patched')
