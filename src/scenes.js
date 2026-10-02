/* ==================== scenes.js — title, cast, room, talk, sign, gaggle, end ==================== */

/* ---- shared East Room background ---- */
function drawEastRoomBg(c, t, variant) {
  const g = c.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, '#0b1220'); g.addColorStop(0.55, '#16233c'); g.addColorStop(1, '#1d2f4d');
  c.fillStyle = g; c.fillRect(0, 0, W, H);
  /* wainscoting */
  c.fillStyle = '#141d30'; c.fillRect(0, 330, W, H - 330);
  c.fillStyle = '#1a2740'; c.fillRect(0, 330, W, 8);
  for (let x = 10; x < W; x += 64) { c.fillStyle = 'rgba(232,201,106,0.06)'; c.fillRect(x, 346, 2, 120); }
  /* chandelier with bloom */
  const chx = W / 2, chy = 74 + Math.sin(t * 0.6) * 3;
  const bloom = c.createRadialGradient(chx, chy, 4, chx, chy, 150);
  bloom.addColorStop(0, 'rgba(244,227,161,0.5)'); bloom.addColorStop(1, 'rgba(244,227,161,0)');
  c.fillStyle = bloom; c.fillRect(chx - 160, chy - 100, 320, 260);
  c.strokeStyle = '#c9a227'; c.lineWidth = 2;
  c.beginPath(); c.moveTo(chx, 0); c.lineTo(chx, chy - 34); c.stroke();
  c.beginPath(); c.ellipse(chx, chy, 52, 15, 0, 0, 7); c.stroke();
  c.beginPath(); c.ellipse(chx, chy - 16, 30, 10, 0, 0, 7); c.stroke();
  for (let i = -2; i <= 2; i++) {
    c.fillStyle = '#f4e3a1';
    c.beginPath(); c.arc(chx + i * 22, chy + 2 + Math.abs(i) * 5, 3.4, 0, 7); c.fill();
  }
  /* gold curtains, drifting */
  for (const side of [0, 1]) {
    const cx = side ? W - 130 : 0;
    const drift = Math.sin(t * 0.4 + side * 2) * 4;
    c.fillStyle = '#7a1f1f';
    c.beginPath();
    c.moveTo(cx + drift, 0);
    c.bezierCurveTo(cx + 90 + drift, H * 0.3, cx + 30 + drift, H * 0.7, cx + 70 + drift, H);
    c.lineTo(cx + (side ? 130 : -20) + drift, H);
    c.bezierCurveTo(cx + (side ? 60 : 60) + drift, H * 0.6, cx + (side ? 110 : 20) + drift, H * 0.25, cx + (side ? 130 : -20), 0);
    c.closePath(); c.fill();
    c.fillStyle = 'rgba(201,162,39,0.22)';
    for (let i = 0; i < 4; i++) c.fillRect(cx + 12 + i * 22 + drift, 0, 5, H);
  }
  /* tall windows with protest dots outside */
  for (const wx of [170, W - 300]) {
    c.fillStyle = '#0e1830';
    rr(c, wx, 96, 130, 220, 4); c.fill();
    c.strokeStyle = '#c9a227'; c.lineWidth = 3; rr(c, wx, 96, 130, 220, 4); c.stroke();
    c.beginPath(); c.moveTo(wx + 65, 96); c.lineTo(wx + 65, 316); c.moveTo(wx, 206); c.lineTo(wx + 130, 206); c.stroke();
    /* night outside */
    c.fillStyle = 'rgba(232,201,106,0.05)';
    c.beginPath(); c.arc(wx + 30, 140, 16, 0, 7); c.fill();
    /* protest dots bobbing */
    c.fillStyle = '#e8c96a';
    for (let i = 0; i < 7; i++) {
      const px2 = wx + 18 + i * 16, py2 = 268 + Math.sin(t * 2 + i * 1.7) * 4;
      c.beginPath(); c.arc(px2, py2, 2.6, 0, 7); c.fill();
    }
  }
}

/* ---- long table + placards ---- */
const SEATS = [
  { id:'brockman', x: 0.06 },
  { id:'pichai',   x: 0.22 },
  { id:'zuck',     x: 0.38 },
  { id:'trump',    x: 0.52 },
  { id:'huang',    x: 0.66 },
  { id:'musk',     x: 0.80 },
  { id:'amodei',   x: 0.94 }
];
function drawTable(c, t) {
  /* carpet */
  const cg = c.createLinearGradient(0, 560, 0, H);
  cg.addColorStop(0, '#5d1327'); cg.addColorStop(1, '#2e0a16');
  c.fillStyle = cg; c.fillRect(0, 560, W, H - 560);
  c.fillStyle = 'rgba(201,162,39,0.5)'; c.fillRect(0, 560, W, 5);
  c.fillStyle = 'rgba(201,162,39,0.14)';
  for (let x = 0; x < W; x += 90) c.fillRect(x, 566, 45, H - 566);
  /* table top */
  c.fillStyle = PAL.wood2;
  rr(c, -20, 470, W + 40, 92, 6); c.fill();
  c.fillStyle = PAL.wood3; rr(c, -20, 470, W + 40, 14, 4); c.fill();
  c.fillStyle = 'rgba(0,0,0,0.18)'; c.fillRect(-20, 552, W + 40, 10);
  /* gold runner */
  c.fillStyle = 'rgba(201,162,39,0.4)'; c.fillRect(-20, 492, W + 40, 8);
  /* placards + glasses of water */
  for (const s of SEATS) {
    const px2 = 60 + s.x * (W - 140);
    c.fillStyle = PAL.cream; rr(c, px2 - 22, 452, 44, 15, 2); c.fill();
    c.fillStyle = '#5a4a38'; c.font = 'bold 6.5px Georgia'; c.textAlign = 'center';
    c.fillText(s.id === 'trump' ? 'THE PRESIDENT' : CAST.find(k => k.id === s.id).name.split(' ').pop().toUpperCase(), px2, 462);
    c.fillStyle = 'rgba(200,220,240,0.75)';
    rr(c, px2 + 28, 448, 9, 17, 2); c.fill();
  }
  /* chairs behind */
  for (const s of SEATS) {
    const px2 = 60 + s.x * (W - 140);
    c.fillStyle = '#241a10';
    rr(c, px2 - 26, 400, 52, 74, 8); c.fill();
    c.fillStyle = 'rgba(201,162,39,0.25)'; rr(c, px2 - 20, 404, 40, 6, 3); c.fill();
  }
}

/* ---- title ---- */
function drawTitle(c, t) {
  drawEastRoomBg(c, t, 'title');
  drawTable(c, t);
  /* tiny standing silhouettes */
  for (let i = 0; i < 6; i++) {
    const sx = 240 + i * 150 + Math.sin(t * 0.5 + i) * 3;
    c.fillStyle = 'rgba(10,12,20,0.85)';
    c.beginPath(); c.ellipse(sx, 428, 9, 26, 0, 0, 7); c.fill();
    c.beginPath(); c.arc(sx, 394, 7, 0, 7); c.fill();
  }
  /* dusk vignette */
  c.fillStyle = 'rgba(7,9,15,0.55)'; c.fillRect(0, 0, W, H);
  /* title */
  c.textAlign = 'center';
  c.fillStyle = PAL.gold2;
  c.font = '600 58px Georgia, serif';
  c.fillText('WHITE HOUSE ACCORD', W / 2, 200);
  c.fillStyle = PAL.cream;
  c.font = 'italic 21px Georgia, serif';
  c.fillText('Super Intelligence Signing Simulator', W / 2, 236);
  c.fillStyle = 'rgba(245,239,221,0.55)';
  c.font = '13px Georgia, serif';
  c.fillText('East Room luncheon · September 29, 2026 · then the driveway gaggle', W / 2, 262);
  /* buttons */
  uiBtn(W / 2 - 110, 320, 220, 52, 'PLAY', 'PLAY', true);
  uiBtn(W / 2 - 110, 386, 220, 44, 'CAST', 'CAST');
  uiBtn(W / 2 - 110, 442, 220, 44, 'HOW', 'HOW TO PLAY');
  c.fillStyle = 'rgba(245,239,221,0.35)'; c.font = '11px Georgia, serif';
  c.fillText('A satire. Any resemblance to actual accords is purely tremendous.', W / 2, H - 22);
}

/* ---- cast ---- */
function drawCast(c, t) {
  c.fillStyle = PAL.dusk; c.fillRect(0, 0, W, H);
  c.fillStyle = PAL.gold2; c.font = '600 30px Georgia, serif'; c.textAlign = 'center';
  c.fillText('WHO ARE YOU AT THE TABLE?', W / 2, 52);
  c.fillStyle = 'rgba(245,239,221,0.5)'; c.font = '13px Georgia, serif';
  c.fillText('Six signatories. Your seat is already a choice.', W / 2, 76);
  const cards = CAST.filter(k => k.starter || k.id === 'trump');
  const rows = [cards.slice(0, 4), cards.slice(4)];
  const cw = 226, chh = 232, gap = 20;
  rows.forEach((row, ri) => {
    const totalW = row.length * cw + (row.length - 1) * gap;
    const x0 = (W - totalW) / 2;
    const yR = 96 + ri * (chh + 18);
    row.forEach((k, i) => {
    const x = x0 + i * (cw + gap), y = yR;
    const isLocked = !!k.locked && !UNLOCKED.trump;
    const hot2 = !isLocked && MX > x && MX < x + cw && MY > y && MY < y + chh;
    c.fillStyle = hot2 ? '#1d2f4d' : '#16233c';
    rr(c, x, y, cw, chh, 10); c.fill();
    c.strokeStyle = hot2 ? PAL.gold : '#26365a'; c.lineWidth = hot2 ? 2.5 : 1.5;
    rr(c, x, y, cw, chh, 10); c.stroke();
    /* portrait medallion */
    c.fillStyle = '#0e1830';
    c.beginPath(); c.arc(x + cw / 2, y + 62, 40, 0, 7); c.fill();
    c.strokeStyle = PAL.gold; c.lineWidth = 2; c.beginPath(); c.arc(x + cw / 2, y + 62, 40, 0, 7); c.stroke();
    c.save();
    c.beginPath(); c.arc(x + cw / 2, y + 62, 38, 0, 7); c.clip();
    drawFigure(c, k.id, x + cw / 2, y + 108, 0.9, { pose: 'stand' });
    c.restore();
    c.fillStyle = PAL.gold2; c.font = 'bold 15px Georgia, serif'; c.textAlign = 'center';
    c.fillText(k.name, x + cw / 2, y + 128);
    c.fillStyle = '#9db2cc'; c.font = '11px Georgia, serif';
    c.fillText(k.co, x + cw / 2, y + 145);
    c.fillStyle = '#c9d4e6'; c.font = 'italic 11px Georgia, serif';
    wrapText(c, k.quote, x + 16, y + 163, cw - 32, 12);
    /* seat tell */
    const st = STARTS[k.id];
    c.fillStyle = 'rgba(232,201,106,0.8)'; c.font = '10px Georgia, serif';
    c.fillText(st && st.toast ? st.toast.split('.')[0] + '.' : '', x + cw / 2, y + 196);
    /* click START */
    if (isLocked) {
      c.fillStyle = 'rgba(16,20,28,0.7)'; rr(c, x + cw / 2 - 46, y + 200, 92, 26, 8); c.fill();
      c.fillStyle = 'rgba(245,239,221,0.5)'; c.font = '10px Georgia, serif'; c.textAlign = 'center';
      c.fillText('LOCKED', x + cw / 2, y + 217);
    } else {
      uiBtn(x + cw / 2 - 46, y + 200, 92, 26, 'pick_' + k.id, 'START', hot2);
    }
    c.fillStyle = k.signed ? '#7ef0a8' : '#ffb4b4'; c.font = '8px Georgia, serif';
    c.fillText(k.signed ? 'SIGNED: YES' : 'SIGNED: NO', x + cw / 2, y + chh - 4);
    });
  });
  uiBtn(W / 2 - 70, H - 44, 140, 34, 'back_title', 'BACK');
}

/* ---- how to play (4 lines max) ---- */
function drawHow(c, t) {
  c.fillStyle = PAL.dusk; c.fillRect(0, 0, W, H);
  c.fillStyle = PAL.gold2; c.font = '600 30px Georgia, serif'; c.textAlign = 'center';
  c.fillText('HOW TO PLAY', W / 2, 130);
  c.fillStyle = PAL.cream; c.font = '16px Georgia, serif';
  const lines = [
    'A/D or arrows to walk the table. Click a person to talk.',
    'Talk to three people. Each talk ends in their micro-game.',
    'Then the signing. You become Trump. One typo. Three choices.',
    'Rapport only flavors the ending. The story is the score.'
  ];
  lines.forEach((l, i) => c.fillText(l, W / 2, 190 + i * 36));
  uiBtn(W / 2 - 70, H - 90, 140, 36, 'back_title', 'BACK');
}

/* ---- THE ROOM (playable) ---- */
function drawRoom(c, t, dt) {
  /* camera eases toward the player */
  const target = G.playerX * W - W / 2;
  cam += (target - cam) * Math.min(1, dt * 3);
  cam = Math.max(-W * 0.18, Math.min(W * 0.18, cam));
  c.save();
  c.translate(-cam * 0.5, 0);
  drawEastRoomBg(c, t, 'room');
  c.restore();
  c.save();
  c.translate(-cam, 0);
  drawTable(c, t);
  /* ambient walkers: Sacks, Karp, Johnson, Vance, Bezos, Lisa passing + Tom Brown at the far end */
  const walkers = [
    { id:'sacks', x: 40,  y: 640 },
    { id:'karp',  x: 130, y: 648 },
    { id:'vance', x: 1180, y: 644 },
    { id:'bezos', x: 1230, y: 640 },
    { id:'johnson', x: 1120, y: 646 },
    { id:'lisa',  x: 640 + Math.sin(t * 0.22) * 420, y: 636 },
    { id:'tombrown', x: 1262, y: 644, talk: true }
  ];
  for (const wd of walkers) {
    drawFigure(c, wd.id, wd.x, wd.y, 1.15, { pose: 'stand', look: Math.sin(t * 0.7 + wd.x) });
    if (wd.talk) {
      HOTRECTS.push({ x: wd.x - 30, y: wd.y - 130, w: 60, h: 140, id: 'npc_tombrown' });
      const near = Math.abs(G.playerX * W - wd.x) < 80;
      if (near && G.screen === 'room' && !G.tomDone) {
        c.fillStyle = 'rgba(245,239,221,0.92)';
        rr(c, wd.x - 44, wd.y - 158, 88, 22, 11); c.fill();
        c.fillStyle = '#101b2d'; c.font = 'bold 10px Georgia'; c.textAlign = 'center';
        c.fillText('TALK', wd.x, wd.y - 143);
      }
    }
  }
  /* seated signers */
  for (const s of SEATS) {
    if (s.id === G.playerId) continue;
    const px2 = 60 + s.x * (W - 140);
    const isTrump = s.id === 'trump';
    const talked = G.talksDone.indexOf(s.id) !== -1;
    drawFigure(c, s.id, px2, 500, 1.6, {
      pose: isTrump ? 'point' : 'sit',
      look: Math.max(-1, Math.min(1, (G.playerX * W - px2) / 200)),
      blink: Math.sin(t * 0.9 + s.x * 9) > 0.985
    });
    /* talked badge */
    if (talked && !isTrump) {
      c.fillStyle = PAL.green;
      c.beginPath(); c.arc(px2 + 24, 420, 7, 0, 7); c.fill();
      c.fillStyle = '#fff'; c.font = 'bold 9px Georgia'; c.textAlign = 'center';
      c.fillText('✓', px2 + 24, 423);
    }
    /* interaction hit rect: includes the TALK bubble above the head + proximity hint */
    const r = { x: px2 - 34, y: 262, w: 68, h: 258 };
    HOTRECTS.push({ x: r.x, y: r.y, w: r.w, h: r.h, id: 'npc_' + s.id, npc: s.id });
    const near = Math.abs(G.playerX * W - px2) < 80;
    if (near && G.screen === 'room') {
      c.fillStyle = 'rgba(245,239,221,0.92)';
      rr(c, px2 - 44, 276, 88, 22, 11); c.fill();
      c.fillStyle = '#101b2d'; c.font = 'bold 10px Georgia'; c.textAlign = 'center';
      c.fillText(isTrump ? (G.talksDone.length >= 3 ? 'THE DESK' : 'AT THE SIGNING') : (talked ? 'AGAIN' : (G.talksDone.length >= 3 ? 'PEN IS UP' : 'TALK')), px2, 291);
    }
  }
  /* press cameras in the dark */
  for (let i = 0; i < 3; i++) {
    const cx2 = 200 + i * 380 + Math.sin(t * 0.3 + i * 2) * 14;
    c.fillStyle = '#0a0c12';
    rr(c, cx2, 588, 54, 30, 4); c.fill();
    rr(c, cx2 + 16, 574, 22, 16, 3); c.fill();
    c.fillStyle = '#1a2030';
    c.beginPath(); c.arc(cx2 + 27, 582, 6, 0, 7); c.fill();
    /* flash bursts */
    const fl = Math.sin(t * 1.7 + i * 2.4);
    if (fl > 0.93) {
      const fg = c.createRadialGradient(cx2 + 27, 582, 2, cx2 + 27, 582, 60);
      fg.addColorStop(0, 'rgba(255,255,255,0.75)'); fg.addColorStop(1, 'rgba(255,255,255,0)');
      c.fillStyle = fg; c.fillRect(cx2 - 40, 530, 140, 120);
    }
  }
  /* the player */
  const pxx = G.playerX * W;
  const walking = Math.abs(G.vx) > 4;
  G.walkPhase = walking ? G.walkPhase + Math.abs(G.vx) * 0.045 : 0;
  drawFigure(c, 'player', pxx, 662, 1.5, {
    pose: walking ? 'walk' : 'stand',
    phase: G.walkPhase,
    flip: G.vx < -4,
    look: Math.sin(t * 0.8) * 0.5,
    blink: Math.sin(t * 1.1) > 0.99
  });
  c.restore();
  drawHUD(c);
}

/* ---- HUD: exactly four things ---- */
function drawHUD(c) {
  /* 1. who you are + 2. rapport bar */
  c.fillStyle = 'rgba(7,10,18,0.66)';
  rr(c, 14, 14, 240, 46, 8); c.fill();
  c.fillStyle = PAL.cream; c.font = 'bold 13px Georgia, serif'; c.textAlign = 'left';
  c.fillText('YOU ARE: ' + CAST.find(k => k.id === G.playerId).name.toUpperCase(), 26, 32);
  const frac = G.ledger.rapport / 100;
  c.fillStyle = 'rgba(245,239,221,0.16)'; rr(c, 26, 42, 216, 8, 4); c.fill();
  c.fillStyle = PAL.gold; rr(c, 26, 42, 216 * frac, 8, 4); c.fill();
  c.fillStyle = 'rgba(245,239,221,0.55)'; c.font = '9px Georgia, serif';
  c.fillText('RAPPORT', 26 + 216 * frac + 6, 49);
  /* 3. objective */
  const obj = G.talksDone.length >= 3
    ? 'The pen is up. Walk to the President’s desk.'
    : 'Objective: talk to 3 people at the table (' + G.talksDone.length + '/3)';
  c.fillStyle = 'rgba(7,10,18,0.66)';
  const tw = c.measureText(obj).width;
  rr(c, W / 2 - 160, 14, 320, 26, 8); c.fill();
  c.fillStyle = PAL.gold2; c.font = '12px Georgia, serif'; c.textAlign = 'center';
  c.fillText(obj, W / 2, 31);
  /* pause hint */
  c.fillStyle = 'rgba(7,10,18,0.66)';
  rr(c, W - 74, 14, 60, 26, 8); c.fill();
  c.fillStyle = 'rgba(245,239,221,0.7)'; c.font = '11px Georgia, serif'; c.textAlign = 'center';
  c.fillText('P = MENU', W - 44, 31);
  /* toast: one at a time, dies */
  if (G.toast && G.t - G.toast.born < 4.6) {
    const a = Math.min(1, (4.6 - (G.t - G.toast.born)) / 1.2);
    const lines2 = wrapTextLines(c, G.toast.t, W - 376);
    const th2 = 20 * lines2.length + 20;
    c.fillStyle = 'rgba(7,10,18,' + (0.78 * a) + ')';
    rr(c, W - 348, H - th2 - 18, 334, th2, 8); c.fill();
    c.strokeStyle = 'rgba(201,162,39,' + (0.5 * a) + ')'; c.lineWidth = 1; rr(c, W - 348, H - th2 - 18, 334, th2, 8); c.stroke();
    c.fillStyle = 'rgba(245,239,221,' + a + ')';
    c.font = '12.5px Georgia, serif'; c.textAlign = 'left';
    lines2.forEach((l, i) => c.fillText(l, W - 334, H - th2 - 4 + 14 + i * 20));
  }
}

/* ---- dialogue (talk) ---- */
function drawTalk(c, t, dt) {
  drawRoom(c, t, dt);
  /* darken */
  c.fillStyle = 'rgba(7,10,18,0.45)'; c.fillRect(0, 0, W, H);
  const tk = G.talk;
  const who = CAST.find(k => k.id === tk.id);
  const panelW = 560, panelH = 190, px2 = 60, py2 = H - panelH - 30;
  c.fillStyle = PAL.cream; rr(c, px2, py2, panelW, panelH, 10); c.fill();
  c.strokeStyle = PAL.gold; c.lineWidth = 2.5; rr(c, px2, py2, panelW, panelH, 10); c.stroke();
  /* speaker */
  c.fillStyle = PAL.ink; c.font = 'bold 16px Georgia, serif'; c.textAlign = 'left';
  c.fillText(who.name.toUpperCase() + ' — ' + who.co, px2 + 22, py2 + 34);
  /* lines so far, current line typed */
  c.font = 'italic 14.5px Georgia, serif';
  const shown = tk.lines.slice(0, tk.lineIdx + 1);
  const cur = shown[shown.length - 1] || '';
  const typed = cur.slice(0, Math.floor(tk.typeT * 34));
  let yy = py2 + 62;
  shown.slice(0, -1).forEach(l => { c.fillStyle = 'rgba(16,20,28,0.45)'; wrapText(c, l, px2 + 22, yy, panelW - 44); yy += 19 * wrapCount(c, l, panelW - 44); });
  c.fillStyle = PAL.ink;
  wrapText(c, typed + (Math.sin(t * 6) > 0 ? '|' : ''), px2 + 22, yy, panelW - 44, 17);
  /* choices or advance */
  const allShown = tk.lineIdx >= tk.lines.length - 1 && tk.typeT * 34 >= cur.length;
  if (!allShown) {
    c.fillStyle = 'rgba(16,20,28,0.5)'; c.font = '11px Georgia, serif';
    c.fillText('click to continue', px2 + panelW - 130, py2 + panelH - 14);
  }
  if (tk.phase === 'replies') {
    tk.replies.forEach((rep, i) => {
      const bw2 = (panelW - 56) / 2, bx2 = px2 + 22 + i * (bw2 + 12), by2 = py2 + panelH - 62;
      const hot2 = MX > bx2 && MX < bx2 + bw2 && MY > by2 && MY < by2 + 44;
      c.fillStyle = hot2 ? '#16233c' : '#1d2f4d';
      rr(c, bx2, by2, bw2, 44, 8); c.fill();
      c.strokeStyle = hot2 ? PAL.gold : '#3a4a68'; c.lineWidth = hot2 ? 2.5 : 1.5;
      rr(c, bx2, by2, bw2, 44, 8); c.stroke();
      c.fillStyle = PAL.cream; c.font = '12.5px Georgia, serif'; c.textAlign = 'center';
      wrapText(c, rep.t, bx2 + 10, by2 + 19, bw2 - 20, 14);
      HOTRECTS.push({ x: bx2, y: by2, w: bw2, h: 44, id: 'reply_' + i });
    });
  }
}

/* ---- the signing: you become Trump ---- */
function drawSign(c, t, dt) {
  /* driveway warm light through windows */
  const g = c.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, '#1a1208'); g.addColorStop(0.5, '#2a1c0c'); g.addColorStop(1, '#0f0a06');
  c.fillStyle = g; c.fillRect(0, 0, W, H);
  /* warm lamps */
  for (const lx of [180, W - 180]) {
    const lg = c.createRadialGradient(lx, 120, 8, lx, 120, 220);
    lg.addColorStop(0, 'rgba(240,146,79,0.32)'); lg.addColorStop(1, 'rgba(240,146,79,0)');
    c.fillStyle = lg; c.fillRect(lx - 230, -60, 460, 380);
  }
  /* Trump at the desk (you) */
  drawFigure(c, 'trump', W / 2 - 260, 470, 2.6, { pose: 'point', look: 0.4, blink: Math.sin(t) > 0.98 });
  /* the desk + document */
  c.fillStyle = PAL.wood;
  rr(c, W / 2 - 90, 400, 470, 150, 8); c.fill();
  c.fillStyle = PAL.wood3; rr(c, W / 2 - 90, 400, 470, 18, 6); c.fill();
  c.fillStyle = 'rgba(0,0,0,0.2)'; c.fillRect(W / 2 - 90, 536, 470, 14);
  /* document fills the desk */
  const dx = W / 2 - 60, dy = 372, dw = 410, dh = 176;
  c.fillStyle = '#faf6ea'; rr(c, dx, dy, dw, dh, 3); c.fill();
  c.strokeStyle = '#d8cba0'; c.lineWidth = 2; rr(c, dx, dy, dw, dh, 3); c.stroke();
  c.fillStyle = '#1a1a1a'; c.font = 'bold 13px Georgia, serif'; c.textAlign = 'center';
  c.fillText('WHITE HOUSE ACCORD', dx + dw / 2, dy + 26);
  c.font = '10px Georgia, serif';
  c.fillText('Joint Commitment on Frontier Responsibilities', dx + dw / 2, dy + 42);
  /* signature block */
  c.font = '11px Georgia, serif'; c.textAlign = 'left';
  const names = ['Sundar Pichai — Google / Alphabet', 'Dario Amodei — Anthropic', 'Mark Zuckerberg — Meta',
                 'Greg Brockman — OpenAI', 'Elon Musk — xAI', 'Jensen Huang — Nvidia'];
  names.forEach((n2, i) => c.fillText(n2, dx + 30, dy + 66 + i * 15));
  /* the typo line */
  const ty = dy + 66 + 6 * 15;
  c.fillStyle = '#1a1a1a'; c.font = 'bold 12.5px Georgia, serif';
  const line = 'Donald J. Trump, President of the Unites States';
  c.fillText(line, dx + 30, ty);
  const tw2 = c.measureText(line).width;
  c.strokeStyle = PAL.red; c.lineWidth = 1.6;
  c.beginPath(); c.moveTo(dx + 30, ty + 4); c.lineTo(dx + 30 + tw2, ty + 4); c.stroke();
  /* camera flash */
  const fl = Math.sin(t * 2.2);
  if (fl > 0.9) {
    const fg = c.createRadialGradient(W / 2, 300, 4, W / 2, 300, 200);
    fg.addColorStop(0, 'rgba(255,255,255,0.5)'); fg.addColorStop(1, 'rgba(255,255,255,0)');
    c.fillStyle = fg; c.fillRect(0, 100, W, 400);
  }
  /* sign line narration */
  c.fillStyle = 'rgba(245,239,221,0.92)';
  const sl = SIGN_LINES[Math.min(G.signLine, SIGN_LINES.length - 1)];
  c.font = 'italic 15px Georgia, serif'; c.textAlign = 'left';
  wrapText(c, sl, W / 2 - 330, H - 130, 660, 20);
  /* choices: giant, readable */
  if (G.signPhase === 'choices') {
    SIGN_CHOICES.forEach((ch, i) => {
      const bw2 = 250, bx2 = W / 2 - 395 + i * 265, by2 = H - 92;
      const hot2 = MX > bx2 && MX < bx2 + bw2 && MY > by2 && MY < by2 + 54;
      c.fillStyle = hot2 ? PAL.gold : 'rgba(16,20,28,0.85)';
      rr(c, bx2, by2, bw2, 54, 8); c.fill();
      c.strokeStyle = PAL.gold; c.lineWidth = 2; rr(c, bx2, by2, bw2, 54, 8); c.stroke();
      c.fillStyle = hot2 ? '#101b2d' : PAL.gold2; c.font = 'bold 15px Georgia, serif'; c.textAlign = 'center';
      c.fillText(ch.t, bx2 + bw2 / 2, by2 + 33);
      HOTRECTS.push({ x: bx2, y: by2, w: bw2, h: 54, id: 'sign_' + ch.id });
    });
  } else if (G.signPhase === 'mic') {
    /* who got the mic: invisible ledger, visible as a real choice */
    c.fillStyle = 'rgba(245,239,221,0.92)';
    c.font = 'italic 15px Georgia, serif'; c.textAlign = 'center';
    c.fillText('Trump points at the room: “Who says a word?”', W / 2, H - 150);
    const talked = G.talksDone.slice(0, 3);
    const all = talked.concat(['nobody']);
    const bw2 = Math.min(180, (W - 120) / all.length - 12);
    const totalW = all.length * bw2 + (all.length - 1) * 12;
    all.forEach((id, i) => {
      const bx2 = W / 2 - totalW / 2 + i * (bw2 + 12), by2 = H - 118;
      const label = id === 'nobody' ? 'NO ONE' : CAST.find(k => k.id === id).name.split(' ')[0].toUpperCase();
      const hot2 = MX > bx2 && MX < bx2 + bw2 && MY > by2 && MY < by2 + 44;
      c.fillStyle = hot2 ? PAL.gold : 'rgba(16,20,28,0.85)';
      rr(c, bx2, by2, bw2, 44, 8); c.fill();
      c.strokeStyle = PAL.gold; c.lineWidth = 2; rr(c, bx2, by2, bw2, 44, 8); c.stroke();
      c.fillStyle = hot2 ? '#101b2d' : PAL.gold2; c.font = 'bold 13px Georgia, serif'; c.textAlign = 'center';
      c.fillText(label, bx2 + bw2 / 2, by2 + 27);
      HOTRECTS.push({ x: bx2, y: by2, w: bw2, h: 44, id: 'mic_' + id });
    });
  } else {
    c.fillStyle = 'rgba(245,239,221,0.5)'; c.font = '11px Georgia, serif'; c.textAlign = 'center';
    c.fillText('click to continue', W / 2, H - 30);
  }
  drawHUD(c);
}

/* ---- the gaggle: driveway, 20 seconds ---- */
function drawGaggle(c, t, dt) {
  /* orange outdoor light */
  const g = c.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, '#160e06'); g.addColorStop(0.6, '#3a2410'); g.addColorStop(1, '#120a06');
  c.fillStyle = g; c.fillRect(0, 0, W, H);
  for (const lx of [140, 420, 860, 1140]) {
    const lg = c.createRadialGradient(lx, 90, 6, lx, 90, 180);
    lg.addColorStop(0, 'rgba(240,146,79,0.4)'); lg.addColorStop(1, 'rgba(240,146,79,0)');
    c.fillStyle = lg; c.fillRect(lx - 190, -60, 380, 320);
  }
  /* white house behind, more orange */
  c.fillStyle = '#f0924f';
  c.globalAlpha = 0.16;
  c.beginPath(); c.moveTo(W / 2 - 320, 470); c.lineTo(W / 2 - 320, 300); c.lineTo(W / 2, 210); c.lineTo(W / 2 + 320, 300); c.lineTo(W / 2 + 320, 470); c.closePath(); c.fill();
  c.globalAlpha = 1;
  for (let i = 0; i < 8; i++) { c.fillStyle = 'rgba(245,239,221,0.12)'; c.fillRect(W / 2 - 280 + i * 76, 340, 18, 130); }
  /* execs shoulder to shoulder */
  const ids = ['musk', 'huang', 'zuck', 'pichai', 'amodei', 'brockman'];
  const shoulders = 96;
  const x0 = W / 2 - (ids.length - 1) * shoulders / 2 - 40;
  ids.forEach((id, i) => {
    const sx = x0 + i * shoulders + Math.sin(t * 0.6 + i) * 2;
    drawFigure(c, id, sx, 620, 1.7, { pose: 'stand', look: Math.sin(t * 0.9 + i * 1.3) * 0.6, blink: Math.sin(t + i * 3) > 0.98 });
  });
  /* camera flashes */
  for (let i = 0; i < 5; i++) {
    const fl = Math.sin(t * 2.6 + i * 1.9);
    if (fl > 0.86) {
      const fx = 120 + i * 260, fy = 200 + Math.sin(i * 2) * 60;
      const fg = c.createRadialGradient(fx, fy, 2, fx, fy, 90);
      fg.addColorStop(0, 'rgba(255,255,255,0.7)'); fg.addColorStop(1, 'rgba(255,255,255,0)');
      c.fillStyle = fg; c.fillRect(fx - 100, fy - 100, 200, 200);
    }
  }
  /* beats: 2 flag-driven + 1 random, one at a time */
  const beats = gaggleBeats(G.flags, G.ledger);
  const idx = Math.min(beats.length - 1, Math.floor(G.gaggleT / 5.5));
  const beat = beats[idx];
  const a = Math.min(1, (5.5 - (G.gaggleT % 5.5)) / 0.9);
  c.fillStyle = 'rgba(7,10,18,' + (0.8 * a) + ')';
  const bw2 = 620, bh2 = 74, bx2 = W / 2 - bw2 / 2, by2 = H - bh2 - 26;
  rr(c, bx2, by2, bw2, bh2, 10); c.fill();
  c.strokeStyle = 'rgba(201,162,39,' + (0.6 * a) + ')'; c.lineWidth = 1.5; rr(c, bx2, by2, bw2, bh2, 10); c.stroke();
  c.fillStyle = 'rgba(232,201,106,' + a + ')'; c.font = 'bold 12px Georgia, serif'; c.textAlign = 'left';
  c.fillText(beat.who, bx2 + 20, by2 + 26);
  c.fillStyle = 'rgba(245,239,221,' + a + ')'; c.font = 'italic 14px Georgia, serif';
  wrapText(c, beat.t, bx2 + 20, by2 + 46, bw2 - 40, 17);
  c.fillStyle = 'rgba(245,239,221,0.4)'; c.font = '11px Georgia, serif'; c.textAlign = 'right';
  c.fillText('the driveway gaggle', W - 24, 30);
  drawHUD(c);
}

/* ---- end card ---- */
function drawEnd(c, t) {
  const e = ENDINGS[G.endingId];
  const g = c.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, '#0c1220'); g.addColorStop(1, '#101b2d');
  c.fillStyle = g; c.fillRect(0, 0, W, H);
  /* left: the still, art variant */
  const fx = 60, fy = 90, fw = 430, fh = 300;
  c.fillStyle = '#080a10'; rr(c, fx - 14, fy - 14, fw + 28, fh + 28, 6); c.fill();
  c.strokeStyle = PAL.gold; c.lineWidth = 3; rr(c, fx - 14, fy - 14, fw + 28, fh + 28, 6); c.stroke();
  c.save(); rr(c, fx, fy, fw, fh, 3); c.clip();
  drawEndingArt(c, t, e.art, fx, fy, fw, fh);
  c.restore();
  /* artifact caption under the still */
  c.fillStyle = 'rgba(245,239,221,0.5)'; c.font = '11px Georgia, serif'; c.textAlign = 'center';
  c.fillText(e.art.toUpperCase() + ' — ' + e.title, fx + fw / 2, fy + fh + 34);
  /* title */
  c.fillStyle = PAL.gold2; c.font = '600 34px Georgia, serif'; c.textAlign = 'left';
  c.fillText(e.title, fx + fw + 60, 120);
  /* 6 lines */
  c.fillStyle = PAL.cream; c.font = '14px Georgia, serif';
  endLines(G).forEach((l, i) => {
    c.fillStyle = i === 5 ? 'rgba(232,201,106,0.85)' : PAL.cream;
    wrapText(c, l, fx + fw + 60, 152 + i * 30, W - (fx + fw + 60) - 60, 19);
  });
  /* share card: fake X post */
  const sc = shareCard(G);
  const sx2 = fx + fw + 60, sy2 = 370, sw2 = 330, sh2 = 92;
  c.fillStyle = '#0c1320'; rr(c, sx2, sy2, sw2, sh2, 10); c.fill();
  c.strokeStyle = '#26365a'; c.lineWidth = 1.5; rr(c, sx2, sy2, sw2, sh2, 10); c.stroke();
  c.fillStyle = '#e8c96a'; c.font = 'bold 11px Georgia, serif'; c.textAlign = 'left';
  c.fillText(sc.who, sx2 + 14, sy2 + 24);
  c.fillStyle = '#dfe5f5'; c.font = 'italic 12px Georgia, serif';
  wrapText(c, sc.txt, sx2 + 14, sy2 + 42, sw2 - 28, 15);
  c.fillStyle = '#7a8ba0'; c.font = '10px Georgia, serif';
  c.fillText('♥ ' + sc.likes + '   the internet reacts', sx2 + 14, sy2 + sh2 - 10);
  /* buttons */
  uiBtn(sx2, sy2 + sh2 + 16, 150, 40, 'again', 'PLAY AGAIN');
  uiBtn(sx2 + 162, sy2 + sh2 + 16, 180, 40, 'another', 'TRY ANOTHER CEO');
}

/* ---- ending art variants ---- */
function drawEndingArt(c, t, art, x, y, w, h) {
  if (art === 'pulitzer') {
    c.fillStyle = '#2a1c0c'; c.fillRect(x, y, w, h);
    for (let i = 0; i < 6; i++) drawFigure(c, ['musk','huang','zuck','pichai','amodei','brockman'][i], x + 50 + i * 66, y + h - 30, 0.9, { pose: 'stand' });
    drawFigure(c, 'trump', x + w / 2, y + h - 34, 1.05, { pose: 'point' });
    c.fillStyle = PAL.gold; c.font = 'bold 12px Georgia, serif'; c.textAlign = 'center';
    c.fillText('★ AWARD ★', x + w / 2, y + 22);
  } else if (art === 'monologue') {
    c.fillStyle = '#0c0e14'; c.fillRect(x, y, w, h);
    c.fillStyle = '#16233c'; rr(c, x + 40, y + 30, w - 80, 110, 4); c.fill();
    c.fillStyle = PAL.gold2; c.font = 'bold 22px Georgia, serif'; c.textAlign = 'center';
    c.fillText('UNITES STATES.', x + w / 2, y + 92);
    c.fillStyle = '#0c0e14'; rr(c, x + w / 2 - 60, y + h - 90, 120, 50, 6); c.fill();
    c.fillStyle = '#e8c96a'; c.beginPath(); c.arc(x + w / 2, y + h - 80, 8, 0, 7); c.fill();
  } else if (art === 'cold') {
    c.fillStyle = '#0e1420'; c.fillRect(x, y, w, h);
    for (let i = 0; i < 4; i++) { c.fillStyle = '#1a2230'; rr(c, x + 40 + i * 90, y + 80, 60, 140, 6); c.fill(); }
    drawFigure(c, 'amodei', x + w - 90, y + h - 30, 0.95, { pose: 'stand' });
    c.fillStyle = 'rgba(140,170,220,0.2)'; c.fillRect(x, y, w, h);
    c.fillStyle = PAL.cream; c.font = 'italic 12px Georgia, serif'; c.textAlign = 'center';
    c.fillText('“Testing regimes, actual ones.”', x + w / 2, y + 40);
  } else if (art === 'split') {
    c.fillStyle = '#101b2d'; c.fillRect(x, y, w, h);
    c.fillStyle = '#0c1320'; c.fillRect(x, y, w / 2, h);
    c.fillStyle = PAL.gold2; c.font = 'bold 26px Georgia, serif'; c.textAlign = 'center';
    c.fillText('GROK', x + w * 0.25, y + h / 2);
    c.fillStyle = '#3f7d4e'; c.font = 'bold 26px Georgia, serif';
    c.fillText('DOTS', x + w * 0.75, y + h / 2);
    c.strokeStyle = PAL.gold; c.lineWidth = 2; c.beginPath(); c.moveTo(x + w / 2, y + 14); c.lineTo(x + w / 2, y + h - 14); c.stroke();
    drawFigure(c, 'trump', x + w / 2, y + h - 16, 0.72, { pose: 'stand' });
  } else if (art === 'wafer') {
    c.fillStyle = '#1a1c22'; c.fillRect(x, y, w, h);
    /* giant vial */
    c.fillStyle = 'rgba(240,220,150,0.9)'; rr(c, x + w / 2 - 26, y + 40, 52, 130, 14); c.fill();
    c.fillStyle = '#d9c07a'; rr(c, x + w / 2 - 22, y + 120, 44, 46, 10); c.fill();
    c.fillStyle = '#b09a54'; c.fillRect(x + w / 2 - 26, y + 30, 52, 12);
    c.fillStyle = '#cfd6de'; rr(c, x + w / 2 + 60, y + 150, 60, 24, 3); c.fill();
    c.fillStyle = PAL.cream; c.font = 'italic 12px Georgia, serif'; c.textAlign = 'center';
    c.fillText('sand → wafer → GPU', x + w / 2, y + h - 16);
  } else if (art === 'caption') {
    c.fillStyle = '#0c0e14'; c.fillRect(x, y, w, h);
    c.fillStyle = '#16233c'; rr(c, x + 30, y + 40, w - 60, 120, 4); c.fill();
    c.fillStyle = '#fff'; c.font = 'bold 20px monospace'; c.textAlign = 'center';
    c.fillText('"morally bidding"', x + w / 2, y + 106);
    c.fillStyle = PAL.red; c.font = '10px monospace';
    c.fillText('LIVE CAPTION · META GLASSES', x + w / 2, y + 180);
    c.strokeStyle = PAL.gold; c.lineWidth = 2; rr(c, x + 30, y + 40, w - 60, 120, 4); c.stroke();
  } else if (art === 'goblin') {
    c.fillStyle = '#2a1c0c'; c.fillRect(x, y, w, h);
    drawFigure(c, 'brockman', x + w / 2 - 60, y + h - 30, 1.0, { pose: 'stand' });
    drawFigure(c, 'trump', x + w / 2 + 60, y + h - 32, 1.05, { pose: 'point' });
    /* goblin shirt in the corner */
    c.fillStyle = '#3f7d4e';
    c.beginPath(); c.arc(x + w - 40, y + 40, 24, 0, 7); c.fill();
    c.fillStyle = '#fff'; c.font = 'bold 9px Georgia, serif'; c.textAlign = 'center';
    c.fillText('DOTS', x + w - 40, y + 44);
  } else {
    /* golden */
    c.fillStyle = '#2a2410'; c.fillRect(x, y, w, h);
    const g2 = c.createRadialGradient(x + w / 2, y + h / 2, 10, x + w / 2, y + h / 2, w * 0.7);
    g2.addColorStop(0, 'rgba(244,227,161,0.5)'); g2.addColorStop(1, 'rgba(244,227,161,0)');
    c.fillStyle = g2; c.fillRect(x, y, w, h);
    c.strokeStyle = PAL.gold2; c.lineWidth = 3;
    rr(c, x + 50, y + 50, w - 100, h - 100, 4); c.stroke();
    c.fillStyle = PAL.gold2; c.font = 'italic 15px Georgia, serif'; c.textAlign = 'center';
    c.fillText('THE GOLDEN AGE', x + w / 2, y + h / 2 + 5);
  }
}

/* ---- pause (controls live here) ---- */
function drawPause(c, t) {
  c.fillStyle = 'rgba(7,10,18,0.82)'; c.fillRect(0, 0, W, H);
  c.fillStyle = PAL.gold2; c.font = '600 28px Georgia, serif'; c.textAlign = 'center';
  c.fillText('PAUSED', W / 2, 200);
  c.fillStyle = PAL.cream; c.font = '14px Georgia, serif';
  const lines = [
    'A/D or arrows — walk the table',
    'click a person — talk',
    'P — pause / resume   ·   M — mute'
  ];
  lines.forEach((l, i) => c.fillText(l, W / 2, 250 + i * 30));
  uiBtn(W / 2 - 90, 380, 180, 44, 'resume', 'RESUME');
  uiBtn(W / 2 - 90, 436, 180, 36, 'quit_title', 'QUIT TO TITLE');
}
