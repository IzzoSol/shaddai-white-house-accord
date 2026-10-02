/* ==================== art.js — editorial vector caricatures ==================== */

/* rounded-rect path */
function rr(c, x, y, w, h, r) {
  r = Math.min(r, w / 2, h / 2);
  c.beginPath();
  c.moveTo(x + r, y);
  c.arcTo(x + w, y, x + w, y + h, r);
  c.arcTo(x + w, y + h, x, y + h, r);
  c.arcTo(x, y + h, x, y, r);
  c.arcTo(x, y, x + w, y, r);
  c.closePath();
}
function shade(hex, amt) {
  const n = parseInt(hex.slice(1), 16);
  const r = Math.max(0, Math.min(255, (n >> 16) + amt));
  const g = Math.max(0, Math.min(255, ((n >> 8) & 255) + amt));
  const b = Math.max(0, Math.min(255, (n & 255) + amt));
  return 'rgb(' + r + ',' + g + ',' + b + ')';
}

/* per-character art spec */
const CHAR_ART = {
  musk:     { skin:'#e8b088', hair:'buzz',   hairC:'#3a2e26', suit:'#232a33', shirt:'#e8e4da', tie:null,        exp:'deadpan', phone:true },
  huang:    { skin:'#d9a06e', hair:'bald',   hairC:'#000',    suit:'#1a1a1c', shirt:'#111',    tie:null,        exp:'preacher', beads:true, vial:true, leather:true },
  zuck:     { skin:'#e9c1a0', hair:'curls',  hairC:'#4a3423', suit:'#5a6470', shirt:'#c9ccc9', tie:null,        exp:'stiff', glasses:true },
  pichai:   { skin:'#c98e5c', hair:'neat',   hairC:'#1c1712', suit:'#1c2c4e', shirt:'#eef0f2', tie:'#31518a',   exp:'smile' },
  amodei:   { skin:'#e3bd9c', hair:'short',  hairC:'#2c2620', suit:'#2a2732', shirt:'#dcd9d0', tie:'#5a2a4f',   exp:'flat', glasses:true, beard:true },
  brockman: { skin:'#eec2a2', hair:'short',  hairC:'#7a5a34', suit:'#33383f', shirt:'#e6e3dc', tie:null,        exp:'smile', laptop:true },
  trump:    { skin:'#f0924f', hair:'swoop',  hairC:'#f0d080', suit:'#20242e', shirt:'#f2f0e8', tie:'#b02a20',   exp:'smile', trumpTie:true },
  bezos:    { skin:'#e6b892', hair:'bald',   hairC:'#555',    suit:'#3a3f47', shirt:'#d8d8d8', tie:null,        exp:'flat' },
  sacks:    { skin:'#e2b492', hair:'short',  hairC:'#5a4a38', suit:'#2c3038', shirt:'#e0ddd4', tie:'#3a4f7a',   exp:'deadpan', glasses:true },
  lisa:     { skin:'#d9a878', hair:'long',   hairC:'#191410', suit:'#232830', shirt:'#cfd2d0', tie:null,        exp:'smile' },
  karp:     { skin:'#e9c0a2', hair:'curls',  hairC:'#8a6a3c', suit:'#242830', shirt:'#e2dfd6', tie:null,        exp:'flat', glasses:true },
  johnson:  { skin:'#eec4a4', hair:'side',   hairC:'#8a7a5c', suit:'#2e3440', shirt:'#e6e2d8', tie:'#7a2a2a',   exp:'wince' },
  vance:    { skin:'#e8bd9c', hair:'short',  hairC:'#6a4a28', suit:'#262b36', shirt:'#dfe2e6', tie:'#3a5a8a',   exp:'flat', beard:true },
  tombrown: { skin:'#e0b28c', hair:'short',  hairC:'#3a2c1e', suit:'#3a3630', shirt:'#d8d4ca', tie:'#6a6a2a',   exp:'deadpan' },
  maye:     { skin:'#e9c6a8', hair:'long',   hairC:'#cfc4ae', suit:'#4a3a52', shirt:'#e2d8ea', tie:null,        exp:'smile', glasses:true },
  rogan:    { skin:'#d99e6e', hair:'buzz',   hairC:'#2a2118', suit:'#2a2d33', shirt:'#3a3d44', tie:null,        exp:'flat', beard:true },
  sam:      { skin:'#eec2a2', hair:'curls',  hairC:'#5a3a1e', suit:'#2c3038', shirt:'#dfe0e2', tie:null,        exp:'smile' },
  vlad:     { skin:'#e4b894', hair:'short',  hairC:'#26201a', suit:'#23272e', shirt:'#e4e1d8', tie:null,        exp:'smile' },
  toly:     { skin:'#eec2a2', hair:'neat',   hairC:'#1e1a16', suit:'#282c34', shirt:'#e2dfd8', tie:null,        exp:'deadpan', glasses:true },
  pavel:    { skin:'#e2b08c', hair:'short',  hairC:'#1a1612', suit:'#22262c', shirt:'#d8d5ce', tie:null,        exp:'flat', beard:true },
  barron:   { skin:'#eda173', hair:'side',   hairC:'#4a3a20', suit:'#1e222c', shirt:'#eceae2', tie:null,        exp:'deadpan' },
  player:   { skin:'#e8bb96', hair:'short',  hairC:'#2e2418', suit:'#1c2a44', shirt:'#eef0f0', tie:'#8a6a2a',   exp:'smile' }
};

/* ---- head (drawn at origin, feet baseline is +H) ---- */
function drawHead(c, a, s, blink, look, mouth, expOver, brow) {
  mouth = mouth || 0; brow = brow || 0;
  const exp = expOver || a.exp;
  const hw = 13 * s;               // half-width of skull
  c.save();
  c.translate(0, -62 * s);
  if (look) c.translate(look * 1.2 * s, 0);

  /* ears */
  c.fillStyle = shade(a.skin, -26);
  c.beginPath(); c.ellipse(-hw - 1 * s, 1 * s, 2.4 * s, 3.6 * s, 0, 0, 7); c.fill();
  c.beginPath(); c.ellipse(hw + 1 * s, 1 * s, 2.4 * s, 3.6 * s, 0, 0, 7); c.fill();

  /* skull + jaw */
  c.fillStyle = a.skin;
  c.beginPath();
  c.moveTo(-hw, -2 * s);
  c.bezierCurveTo(-hw, -16 * s, hw, -16 * s, hw, -2 * s);          // cranium
  c.bezierCurveTo(hw, 8 * s, 6 * s, 13 * s, 0, 13 * s);            // right jaw
  c.bezierCurveTo(-6 * s, 13 * s, -hw, 8 * s, -hw, -2 * s);        // left jaw
  c.fill();
  /* subtle side shade */
  c.fillStyle = 'rgba(0,0,0,0.07)';
  c.beginPath();
  c.moveTo(hw - 4 * s, -13 * s);
  c.bezierCurveTo(hw + 2 * s, -4 * s, hw - 2 * s, 8 * s, 2 * s, 12 * s);
  c.bezierCurveTo(hw - 1 * s, 6 * s, hw - 5 * s, -4 * s, hw - 4 * s, -13 * s);
  c.fill();

  /* hair styles */
  c.fillStyle = a.hairC;
  if (a.hair === 'swoop') {                       // Trump
    c.beginPath();
    c.moveTo(-hw - 1.5 * s, -1 * s);
    c.bezierCurveTo(-hw - 3 * s, -14 * s, -6 * s, -19 * s, 2 * s, -18 * s);
    c.bezierCurveTo(10 * s, -17.5 * s, hw + 3 * s, -13 * s, hw + 1 * s, -4 * s);
    c.bezierCurveTo(hw - 2 * s, -9 * s, 4 * s, -12 * s, -2 * s, -10 * s);
    c.bezierCurveTo(-7 * s, -8.5 * s, -10 * s, -5 * s, -hw - 1.5 * s, -1 * s);
    c.fill();
  } else if (a.hair === 'bald') {
    c.fillStyle = 'rgba(0,0,0,0.05)';
    c.beginPath(); c.ellipse(0, -14.5 * s, 9 * s, 3.4 * s, 0, 0, 7); c.fill();
  } else if (a.hair === 'buzz') {
    c.beginPath();
    c.moveTo(-hw, -3 * s);
    c.bezierCurveTo(-hw - 1 * s, -14 * s, hw + 1 * s, -14 * s, hw, -3 * s);
    c.closePath(); c.fill();
  } else if (a.hair === 'curls') {
    c.beginPath();
    c.moveTo(-hw - 1 * s, -2 * s);
    c.bezierCurveTo(-hw - 2 * s, -15 * s, hw + 2 * s, -15 * s, hw + 1 * s, -2 * s);
    c.quadraticCurveTo(hw - 4 * s, -8 * s, 0, -8.5 * s);
    c.quadraticCurveTo(-hw + 4 * s, -8 * s, -hw - 1 * s, -2 * s);
    c.fill();
  } else if (a.hair === 'neat') {
    c.beginPath();
    c.moveTo(-hw, -3 * s);
    c.bezierCurveTo(-hw - 1.5 * s, -13.5 * s, hw + 1.5 * s, -13.5 * s, hw, -3 * s);
    c.quadraticCurveTo(hw - 6 * s, -10 * s, 0, -10.5 * s);
    c.quadraticCurveTo(-hw + 6 * s, -10 * s, -hw, -3 * s);
    c.fill();
  } else if (a.hair === 'short' || a.hair === 'side') {
    const side = a.hair === 'side';
    c.beginPath();
    c.moveTo(-hw - (side ? 1 : 0), -2 * s);
    c.bezierCurveTo(-hw - 1 * s, -14 * s, hw + (side ? 0 : 1) * 1, -14 * s, hw, -3.5 * s);
    c.quadraticCurveTo(0, -9 * s, -hw - (side ? 1 : 0), -2 * s);
    c.fill();
    if (side) { c.fillRect(-hw - 0.6 * s, -8 * s, 2 * s, 7 * s); }
  } else if (a.hair === 'long') {
    c.beginPath();
    c.moveTo(-hw - 2 * s, 12 * s);
    c.bezierCurveTo(-hw - 5 * s, -8 * s, -8 * s, -17 * s, 0, -17 * s);
    c.bezierCurveTo(8 * s, -17 * s, hw + 5 * s, -8 * s, hw + 2 * s, 12 * s);
    c.lineTo(hw - 3 * s, 12 * s);
    c.bezierCurveTo(hw, 0, 6 * s, -9 * s, 0, -9 * s);
    c.bezierCurveTo(-6 * s, -9 * s, -hw, 0, -hw + 3 * s, 12 * s);
    c.fill();
  }

  /* eyes */
  const ey = -3.4 * s, ex = 4.6 * s;
  c.strokeStyle = '#1a1613'; c.lineWidth = 1.15 * s; c.lineCap = 'round';
  if (blink) {
    c.beginPath(); c.moveTo(-ex - 2 * s, ey); c.lineTo(-ex + 2 * s, ey);
    c.moveTo(ex - 2 * s, ey); c.lineTo(ex + 2 * s, ey); c.stroke();
  } else {
    c.fillStyle = '#fff';
    c.beginPath(); c.ellipse(-ex, ey, 2.5 * s, 1.7 * s, 0, 0, 7); c.fill();
    c.beginPath(); c.ellipse(ex, ey, 2.5 * s, 1.7 * s, 0, 0, 7); c.fill();
    c.fillStyle = '#1a1613';
    c.beginPath(); c.arc(-ex + (look || 0) * 1.1 * s, ey, 1.05 * s, 0, 7); c.fill();
    c.beginPath(); c.arc(ex + (look || 0) * 1.1 * s, ey, 1.05 * s, 0, 7); c.fill();
  }
  /* brows */
  c.strokeStyle = shade(a.hairC, -18); c.lineWidth = 1.5 * s;
  const bl = brow * 1.6 * s;
  c.beginPath(); c.moveTo(-ex - 2.6 * s, ey - 3.4 * s - bl); c.lineTo(-ex + 2.2 * s, ey - 4 * s - bl);
  c.moveTo(ex - 2.2 * s, ey - 4 * s - bl); c.lineTo(ex + 2.6 * s, ey - 3.4 * s - bl); c.stroke();

  /* nose */
  c.strokeStyle = shade(a.skin, -55); c.lineWidth = 1.2 * s;
  c.beginPath(); c.moveTo(0.4 * s, ey + 2 * s); c.quadraticCurveTo(1.6 * s, ey + 5 * s, -0.6 * s, ey + 6.4 * s); c.stroke();

  /* mouth by expression */
  c.strokeStyle = '#7a3a30'; c.lineWidth = 1.35 * s;
  if (mouth > 0.08) {                                   /* speaking: the mouth opens and closes */
    c.fillStyle = '#4a1e1a';
    c.beginPath(); c.ellipse(0, 9 * s, (2.3 + 0.4 * mouth) * s, (0.6 + 2.4 * mouth) * s, 0, 0, 7); c.fill();
  } else {
    c.beginPath();
    if (exp === 'smile')      { c.moveTo(-3 * s, 8.4 * s); c.quadraticCurveTo(0, 10.4 * s, 3 * s, 8.4 * s); }
    else if (exp === 'grin')  { c.moveTo(-3.6 * s, 8 * s); c.quadraticCurveTo(0, 12 * s, 3.6 * s, 8 * s); }
    else if (exp === 'stiff') { c.moveTo(-2.6 * s, 8.8 * s); c.lineTo(2.6 * s, 8.8 * s); }
    else if (exp === 'wince') { c.moveTo(-2.8 * s, 9.4 * s); c.quadraticCurveTo(0, 7.6 * s, 2.8 * s, 9.4 * s); }
    else if (exp === 'preacher') { c.moveTo(-2.2 * s, 9 * s); c.quadraticCurveTo(0, 9.8 * s, 2.2 * s, 9 * s); }
    else                        { c.moveTo(-2.4 * s, 9 * s); c.lineTo(2.4 * s, 9 * s); }
    c.stroke();
  }

  /* beard */
  if (a.beard) {
    c.fillStyle = shade(a.hairC, 10);
    c.beginPath();
    c.moveTo(-hw + 2 * s, 4 * s);
    c.bezierCurveTo(-hw + 3 * s, 12 * s, -3 * s, 13.6 * s, 0, 13.6 * s);
    c.bezierCurveTo(3 * s, 13.6 * s, hw - 3 * s, 12 * s, hw - 2 * s, 4 * s);
    c.bezierCurveTo(hw - 5 * s, 8 * s, 5 * s, 9.6 * s, 0, 9.6 * s);
    c.bezierCurveTo(-5 * s, 9.6 * s, -hw + 5 * s, 8 * s, -hw + 2 * s, 4 * s);
    c.fill();
  }
  /* glasses */
  if (a.glasses) {
    c.strokeStyle = '#20242c'; c.lineWidth = 1.05 * s;
    c.strokeRect(-ex - 3.2 * s, ey - 2.8 * s, 6.4 * s, 5.2 * s);
    c.strokeRect(ex - 3.2 * s, ey - 2.8 * s, 6.4 * s, 5.2 * s);
    c.beginPath(); c.moveTo(-ex + 3.2 * s, ey); c.lineTo(ex - 3.2 * s, ey); c.stroke();
    c.fillStyle = 'rgba(255,255,255,0.14)';
    c.beginPath(); c.ellipse(ex - 1 * s, ey - 1 * s, 2.2 * s, 1.4 * s, -0.5, 0, 7); c.fill();
  }
  c.restore();
}

/* ---- torso / suit (origin at hips) ---- */
function drawTorso(c, a, s, armPhase, pose, gest) {
  gest = gest || 0;
  const w = 21 * s;   // half shoulder width
  c.save();
  /* legs for standing poses */
  if (pose === 'stand' || pose === 'walk') {
    const swing = pose === 'walk' ? Math.sin(armPhase) * 7 * s : 0;
    c.fillStyle = shade(a.suit, -12);
    rr(c, -9 * s + swing * 0.4, 0, 8 * s, 30 * s, 3 * s); c.fill();
    rr(c, 1 * s - swing * 0.4, 0, 8 * s, 30 * s, 3 * s); c.fill();
    c.fillStyle = '#14100c';
    rr(c, -10 * s + swing * 0.4, 28 * s, 10 * s, 4.5 * s, 2 * s); c.fill();
    rr(c, 0 * s - swing * 0.4, 28 * s, 10 * s, 4.5 * s, 2 * s); c.fill();
  }
  /* jacket */
  c.fillStyle = a.suit;
  c.beginPath();
  c.moveTo(-w, -34 * s);
  c.bezierCurveTo(-w - 2 * s, -18 * s, -w + 3 * s, -6 * s, -w + 6 * s, 0);
  c.lineTo(w - 6 * s, 0);
  c.bezierCurveTo(w - 3 * s, -6 * s, w + 2 * s, -18 * s, w, -34 * s);
  c.closePath(); c.fill();
  /* shirt V */
  c.fillStyle = a.shirt;
  c.beginPath();
  c.moveTo(-8 * s, -34 * s);
  c.lineTo(0, -22 * s);
  c.lineTo(8 * s, -34 * s);
  c.closePath(); c.fill();
  /* lapels */
  c.strokeStyle = shade(a.suit, 26); c.lineWidth = 1.6 * s;
  c.beginPath();
  c.moveTo(-8 * s, -34 * s); c.lineTo(-2 * s, -20 * s); c.lineTo(-6 * s, -12 * s);
  c.moveTo(8 * s, -34 * s); c.lineTo(2 * s, -20 * s); c.lineTo(6 * s, -12 * s);
  c.stroke();
  /* tie */
  if (a.tie) {
    c.fillStyle = a.tie;
    c.beginPath();
    c.moveTo(-2.2 * s, -32 * s); c.lineTo(2.2 * s, -32 * s);
    c.lineTo(1.4 * s, -12 * s); c.lineTo(0, -9 * s); c.lineTo(-1.4 * s, -12 * s);
    c.closePath(); c.fill();
    c.fillStyle = shade(a.tie, -22);
    c.beginPath(); c.moveTo(-2.6 * s, -33.5 * s); c.lineTo(2.6 * s, -33.5 * s);
    c.lineTo(2 * s, -30.5 * s); c.lineTo(-2 * s, -30.5 * s); c.closePath(); c.fill();
  }
  /* arms */
  const armY = -32 * s;
  c.strokeStyle = shade(a.suit, -8); c.lineWidth = 6.5 * s; c.lineCap = 'round';
  if (pose === 'sit') {
    /* hands forward onto table */
    c.beginPath(); c.moveTo(-w + 2 * s, armY); c.quadraticCurveTo(-w - 6 * s, armY + 14 * s, -10 * s, 4 * s); c.stroke();
    c.beginPath(); c.moveTo(w - 2 * s, armY); c.quadraticCurveTo(w + 6 * s + gest * 4 * s, armY + 14 * s - gest * 12 * s, 10 * s + gest * 4 * s, 4 * s - gest * 14 * s); c.stroke();
    c.fillStyle = a.skin;
    c.beginPath(); c.arc(-10 * s, 4 * s, 3.2 * s, 0, 7); c.fill();
    c.beginPath(); c.arc(10 * s + gest * 4 * s, 4 * s - gest * 14 * s, 3.2 * s, 0, 7); c.fill();
  } else if (pose === 'point') {
    /* one arm raised in the Trump gesture */
    c.beginPath(); c.moveTo(-w + 2 * s, armY); c.lineTo(-w - 2 * s, armY + 16 * s); c.stroke();
    c.beginPath(); c.moveTo(w - 2 * s, armY); c.quadraticCurveTo(w + 8 * s, armY - 8 * s, w + 14 * s, armY - 18 * s); c.stroke();
    c.fillStyle = a.skin;
    c.beginPath(); c.arc(w + 14 * s, armY - 18 * s, 3.4 * s, 0, 7); c.fill();
  } else {
    const sw = pose === 'walk' ? Math.sin(armPhase) * 8 * s : 0;
    /* the right hand lifts while talking */
    const rx = w - 3 * s - sw * 0.5 + gest * 9 * s, ry = -2 * s - gest * 24 * s;
    c.beginPath(); c.moveTo(-w + 2 * s, armY); c.lineTo(-w + 3 * s + sw * 0.5, -2 * s); c.stroke();
    c.beginPath(); c.moveTo(w - 2 * s, armY); c.lineTo(rx, ry); c.stroke();
    c.fillStyle = a.skin;
    c.beginPath(); c.arc(-w + 3 * s + sw * 0.5, -1 * s, 3 * s, 0, 7); c.fill();
    c.beginPath(); c.arc(rx, ry + s, 3 * s, 0, 7); c.fill();
  }
  /* accessories in hand */
  if (a.phone) {
    c.fillStyle = '#0c0e12';
    rr(c, 12 * s, -18 * s, 6 * s, 10 * s, 1.6 * s); c.fill();
    c.fillStyle = 'rgba(140,180,255,0.85)';
    rr(c, 12.8 * s, -17 * s, 4.4 * s, 7 * s, 1 * s); c.fill();
  }
  if (a.vial) {
    c.fillStyle = 'rgba(240,220,150,0.9)';
    rr(c, -17 * s, -10 * s, 4 * s, 9 * s, 2 * s); c.fill();
    c.fillStyle = '#b09a54';
    c.fillRect(-17 * s, -12 * s, 4 * s, 2.4 * s);
  }
  if (a.laptop) {
    c.fillStyle = '#3a4048';
    rr(c, 8 * s, -6 * s, 13 * s, 9 * s, 1.5 * s); c.fill();
    c.fillStyle = 'rgba(150,190,255,0.8)';
    rr(c, 9 * s, -5 * s, 11 * s, 6 * s, 1 * s); c.fill();
  }
  /* leather jacket collar (Jensen) */
  if (a.leather) {
    c.strokeStyle = '#0c0c0e'; c.lineWidth = 3 * s;
    c.beginPath(); c.moveTo(-w + 1 * s, -33 * s); c.lineTo(-4 * s, -20 * s);
    c.moveTo(w - 1 * s, -33 * s); c.lineTo(4 * s, -20 * s); c.stroke();
  }
  /* prayer beads (Jensen) */
  if (a.beads) {
    c.strokeStyle = '#c9a227'; c.lineWidth = 1.2 * s;
    c.beginPath(); c.arc(0, -30 * s, 7.5 * s, 0.5, 2.64); c.stroke();
  }
  c.restore();
}

/* ---- full figure ----
   opt: pose ('stand'|'walk'|'sit'|'point'), phase (walk cycle), look (-1..1), blink, flip,
        t (time, for breathing), talk (true while speaking), exp (expression override: 'smile'|'grin'|'wince'|...). */
function drawFigure(c, id, x, y, s, opt) {
  opt = opt || {};
  const a = CHAR_ART[id] || CHAR_ART.player;
  const pose = opt.pose || 'stand';
  const phase = opt.phase || 0;
  const look = opt.look || 0;
  const blink = opt.blink || false;
  const t = opt.t || 0;
  const seed = (String(id).charCodeAt(0) || 1) + String(id).length * 3;
  const talking = !!opt.talk;
  /* life: breathing always; mouth, brow, hand and a small nod while speaking; a bounce while walking */
  const breathe = 1 + 0.013 * Math.sin(t * 1.7 + seed);
  const mouth = talking ? (0.5 + 0.5 * Math.sin(t * 13 + seed)) * (0.55 + 0.45 * Math.sin(t * 4.7 + seed)) : 0;
  const gest = talking ? Math.max(0, Math.sin(t * 2.2 + seed)) * 0.85 : 0;
  const brow = talking ? Math.max(0, Math.sin(t * 3.1 + seed * 2)) * 0.6 : 0;
  const bounce = pose === 'walk' ? -Math.abs(Math.sin(phase)) * 2.4 * s : 0;
  const nod = talking ? Math.sin(t * 5.2 + seed) * 0.6 * s : 0;
  c.save();
  c.translate(x, y + bounce);
  if (opt.flip) c.scale(-1, 1);
  /* shadow stays on the floor while the body bounces */
  c.fillStyle = 'rgba(0,0,0,0.28)';
  c.beginPath(); c.ellipse(0, 1.5 * s - bounce, 14 * s, 3.4 * s, 0, 0, 7); c.fill();
  c.save(); c.scale(1, breathe);
  drawTorso(c, a, s, phase, pose, gest);
  c.restore();
  c.save(); c.translate(0, nod + (breathe - 1) * -30 * s);
  drawHead(c, a, s, blink, look, mouth, opt.exp, brow);
  c.restore();
  c.restore();
}

/* ---- faceTime window (Sam) ---- */
function drawFaceTime(c, x, y, w, h, t) {
  c.save();
  rr(c, x, y, w, h, 6); c.clip();
  c.fillStyle = '#121826'; c.fillRect(x, y, w, h);
  const s = w / 90;
  drawFigure(c, 'sam', x + w * 0.5, y + h * 0.96, s * 1.15, { pose: 'stand', look: Math.sin(t * 0.9) });
  /* goblin merch bouncing */
  const gy = y + h - 26 * s * 1.15 - Math.abs(Math.sin(t * 3)) * 8;
  c.fillStyle = '#3f7d4e';
  c.beginPath(); c.arc(x + w * 0.18, gy, 9, 0, 7); c.fill();
  c.fillStyle = '#fff'; c.font = 'bold 10px Georgia'; c.textAlign = 'center';
  c.fillText('DOTS', x + w * 0.18, gy + 4);
  c.fillStyle = '#0c0e12'; rr(c, x + w * 0.62, y + 8, 26, 14, 3); c.fill();
  c.fillStyle = '#e8c96a'; c.font = 'bold 9px monospace';
  c.fillText('LIVE', x + w * 0.62 + 13, y + 18);
  c.restore();
  c.strokeStyle = '#3a4f7a'; c.lineWidth = 2;
  rr(c, x, y, w, h, 6); c.stroke();
}
