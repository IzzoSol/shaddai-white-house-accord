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
  musk:     { face:'oval',   build:'avg',    eye:'#3a2a1c', nose:1.0, brow:1.1, lips:0.9, skin:'#e8b088', hair:'buzz',   hairC:'#3a2e26', suit:'#232a33', shirt:'#e8e4da', tie:null,        exp:'deadpan', phone:true },
  huang:    { face:'round',  build:'stocky', eye:'#1e1612', nose:0.85, brow:1.2, lips:1.0, skin:'#d9a06e', hair:'short',  hairC:'#15110e',    suit:'#1a1a1c', shirt:'#111',    tie:null,        exp:'preacher', beads:true, vial:true, leather:true },
  zuck:     { face:'square', build:'slim',   eye:'#2a3a4a', nose:0.9, brow:0.9, lips:0.85, skin:'#e9c1a0', hair:'curls',  hairC:'#4a3423', suit:'#5a6470', shirt:'#c9ccc9', tie:null,        exp:'stiff', glasses:true },
  pichai:   { face:'oval',   build:'slim',   eye:'#241c18', nose:1.0, brow:1.0, lips:1.05, skin:'#c98e5c', hair:'neat',   hairC:'#1c1712', suit:'#1c2c4e', shirt:'#eef0f2', tie:'#31518a',   exp:'smile' },
  amodei:   { face:'long',   build:'avg',    eye:'#3a2a1c', nose:1.1, brow:1.25, lips:0.9, skin:'#e3bd9c', hair:'short',  hairC:'#2c2620', suit:'#2a2732', shirt:'#dcd9d0', tie:'#5a2a4f',   exp:'flat', glasses:true, beard:true },
  brockman: { face:'heart',  build:'slim',   eye:'#2f3d2a', nose:0.8, brow:0.85, lips:1.1, skin:'#eec2a2', hair:'short',  hairC:'#7a5a34', suit:'#33383f', shirt:'#e6e3dc', tie:null,        exp:'smile', laptop:true },
  trump:    { face:'wide',   build:'broad',  eye:'#5a6e8a', nose:1.0, brow:0.9, lips:1.0, skin:'#f0924f', hair:'swoop',  hairC:'#f0d080', suit:'#20242e', shirt:'#f2f0e8', tie:'#b02a20',   exp:'smile', trumpTie:true },
  bezos:    { skin:'#e6b892', hair:'bald',   hairC:'#555',    suit:'#3a3f47', shirt:'#d8d8d8', tie:null,        exp:'flat' },
  sacks:    { skin:'#e2b492', hair:'short',  hairC:'#5a4a38', suit:'#2c3038', shirt:'#e0ddd4', tie:'#3a4f7a',   exp:'deadpan', glasses:true },
  lisa:     { skin:'#d9a878', hair:'long',   hairC:'#191410', suit:'#232830', shirt:'#cfd2d0', tie:null,        exp:'smile' },
  karp:     { skin:'#e9c0a2', hair:'curls',  hairC:'#8a6a3c', suit:'#242830', shirt:'#e2dfd6', tie:null,        exp:'flat', glasses:true },
  johnson:  { skin:'#eec4a4', hair:'side',   hairC:'#8a7a5c', suit:'#2e3440', shirt:'#e6e2d8', tie:'#7a2a2a',   exp:'wince' },
  vance:    { skin:'#e8bd9c', hair:'short',  hairC:'#6a4a28', suit:'#262b36', shirt:'#dfe2e6', tie:'#3a5a8a',   exp:'flat', beard:true },
  tombrown: { face:'oval',   build:'avg',    eye:'#3a2a1c', nose:0.95, brow:1.0, lips:0.95, skin:'#e0b28c', hair:'short',  hairC:'#3a2c1e', suit:'#3a3630', shirt:'#d8d4ca', tie:'#6a6a2a',   exp:'deadpan' },
  maye:     { skin:'#e9c6a8', hair:'long',   hairC:'#cfc4ae', suit:'#4a3a52', shirt:'#e2d8ea', tie:null,        exp:'smile', glasses:true },
  rogan:    { skin:'#d99e6e', hair:'buzz',   hairC:'#2a2118', suit:'#2a2d33', shirt:'#3a3d44', tie:null,        exp:'flat', beard:true },
  sam:      { skin:'#eec2a2', hair:'curls',  hairC:'#5a3a1e', suit:'#2c3038', shirt:'#dfe0e2', tie:null,        exp:'smile' },
  vlad:     { skin:'#e4b894', hair:'short',  hairC:'#26201a', suit:'#23272e', shirt:'#e4e1d8', tie:null,        exp:'smile' },
  toly:     { skin:'#eec2a2', hair:'neat',   hairC:'#1e1a16', suit:'#282c34', shirt:'#e2dfd8', tie:null,        exp:'deadpan', glasses:true },
  pavel:    { skin:'#e2b08c', hair:'short',  hairC:'#1a1612', suit:'#22262c', shirt:'#d8d5ce', tie:null,        exp:'flat', beard:true },
  barron:   { skin:'#eda173', hair:'side',   hairC:'#4a3a20', suit:'#1e222c', shirt:'#eceae2', tie:null,        exp:'deadpan' },
  rep1:     { skin:'#e6b898', hair:'long',  hairC:'#5a3a22', suit:'#3a3f55', shirt:'#e8e4da', tie:null,      exp:'smile',   face:'heart',  build:'slim' },
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
  player:   { face:'oval',   build:'avg',    eye:'#3a2a1c', skin:'#e8bb96', hair:'short',  hairC:'#2e2418', suit:'#1c2a44', shirt:'#eef0f0', tie:'#8a6a2a',   exp:'smile' }
};

/* ---- character renderer v2: faces, necks, builds ----
   Coordinates are in "s" units. The figure's origin is the hips; shoulders are at -34s, the head centre at -57s,
   feet at +32s. A character is CHAR_ART[id] plus optional face / build / eye / nose / brow / lips fields; anything
   not given is derived from the character's id, so extras get their own look too. */

const FACES = {
  oval:   { hw: 11.8, jaw: 9.4,  chin: 0.35 },
  square: { hw: 12.6, jaw: 11.6, chin: 0.08 },
  long:   { hw: 11.0, jaw: 8.4,  chin: 0.45 },
  round:  { hw: 12.9, jaw: 11.2, chin: 0.0 },
  heart:  { hw: 12.0, jaw: 7.4,  chin: 0.8 },
  wide:   { hw: 13.3, jaw: 10.6, chin: 0.2 }
};
const BUILDS = {
  slim:   { w: 18.5, belly: 0,   legs: 1.04, h: 1.02 },
  avg:    { w: 20.5, belly: 0.6, legs: 1.0,  h: 1.0 },
  broad:  { w: 23.5, belly: 1.6, legs: 1.0,  h: 1.03 },
  stocky: { w: 22.5, belly: 3.2, legs: 0.93, h: 0.97 }
};
const FACE_KEYS = Object.keys(FACES), BUILD_KEYS = Object.keys(BUILDS);
function idHash(id) { let h = 2166136261; for (let i = 0; i < id.length; i++) { h ^= id.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }

function charSpec(id) {
  const a = CHAR_ART[id] || CHAR_ART.player;
  if (a._spec) return a._spec;
  const h = idHash(id);
  const spec = Object.assign({
    face: FACE_KEYS[h % FACE_KEYS.length], build: BUILD_KEYS[(h >> 3) % BUILD_KEYS.length],
    eye: ['#3a2a1c', '#2a3a4a', '#3f3a22', '#241c18'][(h >> 5) % 4],
    nose: 0.8 + ((h >> 7) % 5) * 0.12, brow: 0.9 + ((h >> 9) % 4) * 0.18, lips: 0.85 + ((h >> 11) % 4) * 0.15, eyeSize: 0.95 + ((h >> 13) % 4) * 0.07
  }, a);
  a._spec = spec;
  return spec;
}

/* mouth + brows by expression: brow tilt (positive = worried/raised inner end), mouth curve, teeth */
const EXPR = {
  smile: { tilt: 0.0, curve: 1.6, teeth: false },  grin: { tilt: -0.2, curve: 2.6, teeth: true },
  stiff: { tilt: 0.1, curve: 0.0, teeth: false },  wince: { tilt: 0.9, curve: -1.4, teeth: false },
  preacher: { tilt: -0.3, curve: 0.9, teeth: false }, flat: { tilt: 0.0, curve: 0.0, teeth: false },
  deadpan: { tilt: 0.1, curve: -0.2, teeth: false }
};

/* ---- head: origin at the centre of the face ---- */
function drawHead(c, a0, s, blink, look, mouth, expOver, brow) {
  const a = a0.face ? a0 : charSpec(a0.id || 'player');
  const F = FACES[a.face] || FACES.oval;
  const hw = F.hw * s, jw = F.jaw * s, chinW = (5.2 * (1 - F.chin) + 1.2 * F.chin) * s;
  const top = -14.8 * s, bottom = 13.4 * s;
  mouth = mouth || 0; brow = brow || 0;
  const ex = EXPR[expOver || a.exp] || EXPR.flat;
  c.save();
  if (look) c.translate(look * 0.9 * s, 0);

  /* hair behind the head (long hair, volume) */
  c.fillStyle = a.hairC;
  if (a.hair === 'long') {
    c.beginPath(); c.moveTo(-hw - 2.2 * s, -4 * s); c.bezierCurveTo(-hw - 5 * s, 10 * s, -hw - 2 * s, 18 * s, -hw + 1 * s, 22 * s);
    c.lineTo(hw - 1 * s, 22 * s); c.bezierCurveTo(hw + 2 * s, 18 * s, hw + 5 * s, 10 * s, hw + 2.2 * s, -4 * s); c.closePath(); c.fill();
  }
  /* ears */
  const earY = 1.2 * s;
  c.fillStyle = shade(a.skin, -14);
  c.beginPath(); c.ellipse(-hw - 0.4 * s, earY, 2.3 * s, 3.4 * s, 0, 0, 7); c.fill();
  c.beginPath(); c.ellipse(hw + 0.4 * s, earY, 2.3 * s, 3.4 * s, 0, 0, 7); c.fill();
  c.fillStyle = shade(a.skin, -38);
  c.beginPath(); c.ellipse(-hw - 0.2 * s, earY, 1.0 * s, 1.9 * s, 0, 0, 7); c.fill();
  c.beginPath(); c.ellipse(hw + 0.2 * s, earY, 1.0 * s, 1.9 * s, 0, 0, 7); c.fill();

  /* skull + jaw */
  c.fillStyle = a.skin;
  c.beginPath();
  c.moveTo(-hw, -2 * s);
  c.bezierCurveTo(-hw, top, hw, top, hw, -2 * s);
  c.bezierCurveTo(hw, 5 * s, jw, 10.5 * s, chinW, bottom);
  c.lineTo(-chinW, bottom);
  c.bezierCurveTo(-jw, 10.5 * s, -hw, 5 * s, -hw, -2 * s);
  c.closePath(); c.fill();
  /* soft form: shadow down the far side, forehead light, cheek colour */
  c.save(); c.clip();
  c.fillStyle = 'rgba(0,0,0,0.085)'; c.fillRect(hw * 0.35, -16 * s, hw, 32 * s);
  c.fillStyle = 'rgba(255,255,255,0.07)'; c.beginPath(); c.ellipse(-hw * 0.2, -9 * s, hw * 0.7, 3.2 * s, 0, 0, 7); c.fill();
  c.fillStyle = 'rgba(235,110,95,0.13)';
  c.beginPath(); c.ellipse(-hw * 0.52, 5.6 * s, 3.4 * s, 2.2 * s, 0, 0, 7); c.fill();
  c.beginPath(); c.ellipse(hw * 0.52, 5.6 * s, 3.4 * s, 2.2 * s, 0, 0, 7); c.fill();
  c.restore();

  /* eyes */
  const ey = -2.4 * s, exx = 4.7 * s * (0.96 + F.hw / 60), ew = 3.2 * s * a.eyeSize, eh = 2.1 * s * a.eyeSize;
  for (const sx of [-1, 1]) {
    const cx = sx * exx;
    if (blink) {
      c.strokeStyle = shade(a.skin, -90); c.lineWidth = 1.2 * s; c.lineCap = 'round';
      c.beginPath(); c.moveTo(cx - ew * 0.9, ey + 0.3 * s); c.quadraticCurveTo(cx, ey + 1.1 * s, cx + ew * 0.9, ey + 0.3 * s); c.stroke();
    } else {
      c.fillStyle = '#fbfaf6'; c.beginPath(); c.ellipse(cx, ey, ew, eh, 0, 0, 7); c.fill();
      const px = cx + (look || 0) * 0.9 * s;
      c.fillStyle = a.eye; c.beginPath(); c.arc(px, ey + 0.1 * s, eh * 0.82, 0, 7); c.fill();
      c.fillStyle = '#0c0a09'; c.beginPath(); c.arc(px, ey + 0.1 * s, eh * 0.42, 0, 7); c.fill();
      c.fillStyle = 'rgba(255,255,255,0.9)'; c.beginPath(); c.arc(px - eh * 0.28, ey - eh * 0.3, eh * 0.2, 0, 7); c.fill();
      /* upper lid line + a hint of lower lid */
      c.strokeStyle = shade(a.skin, -105); c.lineWidth = 1.1 * s; c.lineCap = 'round';
      c.beginPath(); c.moveTo(cx - ew, ey + 0.1 * s); c.quadraticCurveTo(cx, ey - eh * 1.25, cx + ew, ey + 0.1 * s); c.stroke();
      c.strokeStyle = 'rgba(0,0,0,0.12)'; c.lineWidth = 0.7 * s;
      c.beginPath(); c.moveTo(cx - ew * 0.8, ey + eh * 0.9); c.quadraticCurveTo(cx, ey + eh * 1.35, cx + ew * 0.8, ey + eh * 0.9); c.stroke();
    }
  }
  /* brows: tapered, tilted by expression and by speaking */
  const by = ey - 4.3 * s - brow * 1.5 * s, bt = (ex.tilt + brow * 0.2) * 1.5 * s, bw = 1.15 * s * a.brow;
  c.fillStyle = shade(a.hairC, a.hair === 'bald' ? 25 : -6);
  for (const sx of [-1, 1]) {
    const x0 = sx * (exx + ew * 1.15), x1 = sx * (exx - ew * 1.0);            /* outer, inner */
    c.beginPath();
    c.moveTo(x0, by + bt * 0.2 * -1 + 0.4 * s); c.quadraticCurveTo((x0 + x1) / 2, by - 1.1 * s, x1, by - bt);
    c.lineTo(x1, by - bt + bw); c.quadraticCurveTo((x0 + x1) / 2, by - 0.1 * s + bw * 0.5, x0, by + 0.4 * s + bw * 0.6);
    c.closePath(); c.fill();
  }
  /* nose */
  const nz = a.nose;
  c.strokeStyle = shade(a.skin, -50); c.lineWidth = 1.05 * s; c.lineCap = 'round';
  c.beginPath(); c.moveTo(-0.5 * s, ey + 1.4 * s); c.quadraticCurveTo(-1.4 * nz * s, 3.2 * s, -1.9 * nz * s, 4.3 * s);
  c.quadraticCurveTo(0, 5.6 * s, 1.9 * nz * s, 4.3 * s); c.stroke();
  c.fillStyle = 'rgba(0,0,0,0.12)'; c.beginPath(); c.ellipse(0.6 * s, 4.6 * s, 2.0 * nz * s, 0.8 * s, 0, 0, 7); c.fill();
  /* mouth */
  const my = 8.4 * s, mw = 3.3 * s * a.lips, curve = ex.curve * s;
  if (mouth > 0.08) {
    c.fillStyle = '#4a1b17'; c.beginPath();
    c.ellipse(0, my + 0.3 * s, mw * 0.78, (0.7 + 2.5 * mouth) * s, 0, 0, 7); c.fill();
    c.fillStyle = '#f4efe6'; c.fillRect(-mw * 0.6, my - 0.4 * s, mw * 1.2, 0.9 * s);
  } else if (ex.teeth) {
    c.fillStyle = '#4a1b17'; c.beginPath(); c.moveTo(-mw, my - 0.4 * s); c.quadraticCurveTo(0, my + curve + 1.4 * s, mw, my - 0.4 * s); c.quadraticCurveTo(0, my + 0.2 * s, -mw, my - 0.4 * s); c.fill();
    c.fillStyle = '#f7f3ea'; c.beginPath(); c.moveTo(-mw * 0.85, my - 0.2 * s); c.quadraticCurveTo(0, my + curve * 0.9, mw * 0.85, my - 0.2 * s); c.quadraticCurveTo(0, my + 0.5 * s, -mw * 0.85, my - 0.2 * s); c.fill();
  } else {
    c.strokeStyle = '#7d3a31'; c.lineWidth = 1.3 * s; c.lineCap = 'round';
    c.beginPath(); c.moveTo(-mw, my); c.quadraticCurveTo(0, my + curve, mw, my); c.stroke();
    c.fillStyle = 'rgba(160,70,60,0.35)'; c.beginPath(); c.ellipse(0, my + 1.1 * s + Math.max(0, curve) * 0.15, mw * 0.6, 0.7 * s, 0, 0, 7); c.fill();
  }

  /* facial hair */
  if (a.beard) {
    c.fillStyle = shade(a.hairC, 6);
    c.beginPath(); c.moveTo(-hw + 0.8 * s, 3 * s); c.bezierCurveTo(-hw + 1 * s, 12 * s, -chinW, bottom + 1.2 * s, 0, bottom + 1.2 * s);
    c.bezierCurveTo(chinW, bottom + 1.2 * s, hw - 1 * s, 12 * s, hw - 0.8 * s, 3 * s);
    c.bezierCurveTo(hw - 3 * s, 7.5 * s, 4 * s, 6.4 * s, 0, 6.4 * s); c.bezierCurveTo(-4 * s, 6.4 * s, -hw + 3 * s, 7.5 * s, -hw + 0.8 * s, 3 * s); c.fill();
    c.fillStyle = shade(a.hairC, 6); c.beginPath(); c.ellipse(0, 7 * s, 4.2 * s, 1 * s, 0, 0, 7); c.fill();
    /* the mouth shows through the beard */
    c.strokeStyle = '#6a2e27'; c.lineWidth = 1.1 * s; c.beginPath(); c.moveTo(-mw * 0.8, my + 0.3 * s); c.quadraticCurveTo(0, my + curve * 0.8 + 0.3 * s, mw * 0.8, my + 0.3 * s); c.stroke();
  }

  /* hair on top: always leaves the forehead and eyes clear */
  c.fillStyle = a.hairC;
  const hl = shade(a.hairC, 26);
  if (a.hair === 'swoop') {
    c.beginPath(); c.moveTo(-hw - 1.6 * s, -1.5 * s); c.bezierCurveTo(-hw - 3.5 * s, -15 * s, -4 * s, -21 * s, 4 * s, -19.5 * s);
    c.bezierCurveTo(12 * s, -18.5 * s, hw + 3.4 * s, -12 * s, hw + 1.4 * s, -3 * s);
    c.bezierCurveTo(hw - 2.5 * s, -9.5 * s, 5 * s, -12.5 * s, -3 * s, -11.5 * s); c.bezierCurveTo(-8 * s, -10.5 * s, -11 * s, -6 * s, -hw - 1.6 * s, -1.5 * s); c.fill();
    c.strokeStyle = hl; c.lineWidth = 0.9 * s; c.beginPath(); c.moveTo(-6 * s, -16 * s); c.quadraticCurveTo(2 * s, -19 * s, 9 * s, -16 * s); c.stroke();
  } else if (a.hair === 'buzz') {
    c.beginPath(); c.moveTo(-hw + 0.4 * s, -4.5 * s); c.bezierCurveTo(-hw - 0.6 * s, -18.4 * s, hw + 0.6 * s, -18.4 * s, hw - 0.4 * s, -4.5 * s);
    c.quadraticCurveTo(hw - 3 * s, -9.5 * s, 0, -10.2 * s); c.quadraticCurveTo(-hw + 3 * s, -9.5 * s, -hw + 0.4 * s, -4.5 * s); c.fill();
  } else if (a.hair === 'curls') {
    for (let i = 0; i < 9; i++) { const t = i / 8, ang = Math.PI * (1.06 + t * 0.88), cx2 = Math.cos(ang) * (hw + 0.6 * s), cy2 = -3 * s + Math.sin(ang) * 13.2 * s; c.beginPath(); c.arc(cx2, cy2, 3.3 * s, 0, 7); c.fill(); }
    c.beginPath(); c.moveTo(-hw - 1 * s, -3 * s); c.bezierCurveTo(-hw - 1 * s, -15 * s, hw + 1 * s, -15 * s, hw + 1 * s, -3 * s); c.quadraticCurveTo(hw - 4 * s, -9 * s, 0, -9.6 * s); c.quadraticCurveTo(-hw + 4 * s, -9 * s, -hw - 1 * s, -3 * s); c.fill();
    c.fillStyle = hl; for (let i = 0; i < 4; i++) { c.beginPath(); c.arc(-6 * s + i * 4 * s, -14.4 * s + (i % 2) * 0.8 * s, 1.1 * s, 0, 7); c.fill(); }
  } else if (a.hair === 'neat') {
    c.beginPath(); c.moveTo(-hw - 0.4 * s, -3.4 * s); c.bezierCurveTo(-hw - 1.6 * s, -20 * s, hw + 1.6 * s, -20 * s, hw + 0.4 * s, -3.4 * s);
    c.quadraticCurveTo(hw - 4 * s, -10.2 * s, 2 * s, -11 * s); c.quadraticCurveTo(-hw + 3 * s, -10.4 * s, -hw - 0.4 * s, -3.4 * s); c.fill();
    c.strokeStyle = hl; c.lineWidth = 0.9 * s; c.beginPath(); c.moveTo(-6 * s, -14.4 * s); c.quadraticCurveTo(0, -15.8 * s, 6 * s, -14.2 * s); c.stroke();
  } else if (a.hair === 'short' || a.hair === 'side') {
    const side = a.hair === 'side';
    c.beginPath(); c.moveTo(-hw - 0.6 * s, -2.6 * s); c.bezierCurveTo(-hw - 2 * s, -20 * s, hw + 2 * s, -20 * s, hw + 0.6 * s, -2.6 * s);
    c.quadraticCurveTo(hw - 3 * s, -9.2 * s, side ? -3 * s : 1 * s, -10.6 * s); c.quadraticCurveTo(-hw + 2 * s, -9 * s, -hw - 0.6 * s, -2.6 * s); c.fill();
    if (side) { c.strokeStyle = shade(a.hairC, -20); c.lineWidth = 0.9 * s; c.beginPath(); c.moveTo(-3 * s, -10.6 * s); c.quadraticCurveTo(-3.6 * s, -13 * s, -2 * s, -15 * s); c.stroke(); }
    c.strokeStyle = hl; c.lineWidth = 0.9 * s; c.beginPath(); c.moveTo(-5 * s, -14 * s); c.quadraticCurveTo(1 * s, -15.4 * s, 6 * s, -13.6 * s); c.stroke();
  } else if (a.hair === 'long') {
    c.beginPath(); c.moveTo(-hw - 1.4 * s, 4 * s); c.bezierCurveTo(-hw - 3 * s, -15 * s, hw + 3 * s, -15 * s, hw + 1.4 * s, 4 * s);
    c.quadraticCurveTo(hw - 2 * s, -7 * s, 0, -8.4 * s); c.quadraticCurveTo(-hw + 2 * s, -7 * s, -hw - 1.4 * s, 4 * s); c.fill();
  } else if (a.hair === 'bald') {
    c.fillStyle = 'rgba(255,255,255,0.1)'; c.beginPath(); c.ellipse(-2 * s, -11.6 * s, 6 * s, 2.4 * s, -0.2, 0, 7); c.fill();
    c.fillStyle = a.hairC; c.globalAlpha = 0.55;                                                  /* a thin fringe at the sides */
    c.beginPath(); c.moveTo(-hw - 0.2 * s, -4.5 * s); c.quadraticCurveTo(-hw - 1 * s, 0, -hw + 0.2 * s, 2.4 * s); c.lineTo(-hw + 1.4 * s, 0.6 * s); c.quadraticCurveTo(-hw + 1 * s, -3 * s, -hw + 1.8 * s, -4.5 * s); c.fill();
    c.beginPath(); c.moveTo(hw + 0.2 * s, -4.5 * s); c.quadraticCurveTo(hw + 1 * s, 0, hw - 0.2 * s, 2.4 * s); c.lineTo(hw - 1.4 * s, 0.6 * s); c.quadraticCurveTo(hw - 1 * s, -3 * s, hw - 1.8 * s, -4.5 * s); c.fill();
    c.globalAlpha = 1;
  }

  /* glasses */
  if (a.glasses) {
    c.strokeStyle = '#1d2128'; c.lineWidth = 1.05 * s; c.lineJoin = 'round';
    for (const sx of [-1, 1]) {
      const gx = sx * exx - 3.9 * s, gy = ey - 2.9 * s;
      rr(c, gx, gy, 7.8 * s, 5.8 * s, 1.6 * s); c.stroke();
      c.fillStyle = 'rgba(180,215,255,0.13)'; rr(c, gx, gy, 7.8 * s, 5.8 * s, 1.6 * s); c.fill();
    }
    c.beginPath(); c.moveTo(-exx + 3.9 * s, ey - 0.4 * s); c.quadraticCurveTo(0, ey - 1.6 * s, exx - 3.9 * s, ey - 0.4 * s); c.stroke();
    c.beginPath(); c.moveTo(-hw - 0.2 * s, ey - 1 * s); c.lineTo(-exx - 3.9 * s, ey - 1.2 * s); c.moveTo(hw + 0.2 * s, ey - 1 * s); c.lineTo(exx + 3.9 * s, ey - 1.2 * s); c.stroke();
  }
  c.restore();
}

/* ---- body: origin at the hips ---- */
function drawTorso(c, a0, s, armPhase, pose, gest) {
  const a = a0.build ? a0 : charSpec(a0.id || 'player');
  const B = BUILDS[a.build] || BUILDS.avg;
  gest = gest || 0;
  const w = B.w * s, belly = B.belly * s, legL = 30 * s * B.legs;
  const skinD = shade(a.skin, -18);
  c.save();
  c.lineCap = 'round'; c.lineJoin = 'round';

  /* legs, shoes */
  if (pose === 'stand' || pose === 'walk' || pose === 'point') {
    const swing = pose === 'walk' ? Math.sin(armPhase) * 8 * s : 0;
    const lw = (7.6 + B.belly * 0.35) * s, gap = 1.2 * s;
    for (const sx of [-1, 1]) {
      const off = sx * swing * 0.45;
      const x0 = sx < 0 ? -gap - lw + off : gap + off;
      c.fillStyle = shade(a.suit, -14);
      c.beginPath(); c.moveTo(x0 + 0.5 * s, 0); c.lineTo(x0 + lw - 0.5 * s, 0); c.lineTo(x0 + lw - 0.4 * s - sx * 0.4 * s, legL); c.lineTo(x0 + 0.4 * s + sx * 0.4 * s, legL); c.closePath(); c.fill();
      c.strokeStyle = 'rgba(255,255,255,0.07)'; c.lineWidth = 0.8 * s; c.beginPath(); c.moveTo(x0 + lw / 2, 3 * s); c.lineTo(x0 + lw / 2, legL - 1 * s); c.stroke();
      c.fillStyle = '#17110d'; c.beginPath(); c.ellipse(x0 + lw / 2 + sx * 0.8 * s + (sx > 0 ? 1.4 * s : -1.4 * s) * 0, legL + 1.4 * s, lw * 0.62, 2.5 * s, 0, 0, 7); c.fill();
    }
  }

  /* jacket body: sloped shoulders, a waist that follows the build */
  const waist = w - 2.2 * s + belly * 0.5;
  c.fillStyle = a.suit;
  c.beginPath();
  c.moveTo(-w * 0.34, -38 * s); c.quadraticCurveTo(-w * 0.82, -37 * s, -w, -33 * s);
  c.bezierCurveTo(-w - 1.2 * s, -22 * s, -waist - belly, -8 * s, -waist - belly * 0.4, 1.5 * s);
  c.lineTo(waist + belly * 0.4, 1.5 * s);
  c.bezierCurveTo(waist + belly, -8 * s, w + 1.2 * s, -22 * s, w, -33 * s);
  c.quadraticCurveTo(w * 0.82, -37 * s, w * 0.34, -38 * s);
  c.closePath(); c.fill();
  c.fillStyle = 'rgba(0,0,0,0.12)'; c.beginPath(); c.moveTo(w * 0.34, -38 * s); c.quadraticCurveTo(w * 0.82, -37 * s, w, -33 * s);
  c.bezierCurveTo(w + 1.2 * s, -22 * s, waist + belly, -8 * s, waist + belly * 0.4, 1.5 * s); c.lineTo(waist * 0.35, 1.5 * s);
  c.bezierCurveTo(w * 0.5, -10 * s, w * 0.5, -26 * s, w * 0.34, -38 * s); c.fill();

  /* neck and shirt */
  c.fillStyle = skinD; rr(c, -3.1 * s, -45 * s, 6.2 * s, 9 * s, 2 * s); c.fill();
  c.fillStyle = a.skin; rr(c, -3.1 * s, -45 * s, 4.6 * s, 8 * s, 2 * s); c.fill();
  c.fillStyle = a.shirt;
  c.beginPath(); c.moveTo(-8.2 * s, -37.5 * s); c.lineTo(0, -22 * s); c.lineTo(8.2 * s, -37.5 * s); c.quadraticCurveTo(0, -34.5 * s, -8.2 * s, -37.5 * s); c.fill();
  /* collar */
  c.fillStyle = shade(a.shirt, 8);
  c.beginPath(); c.moveTo(-8.2 * s, -37.5 * s); c.lineTo(-3.4 * s, -36 * s); c.lineTo(-4.6 * s, -31.5 * s); c.closePath(); c.fill();
  c.beginPath(); c.moveTo(8.2 * s, -37.5 * s); c.lineTo(3.4 * s, -36 * s); c.lineTo(4.6 * s, -31.5 * s); c.closePath(); c.fill();
  /* lapels + buttons */
  c.strokeStyle = shade(a.suit, 24); c.lineWidth = 1.5 * s;
  c.beginPath(); c.moveTo(-8.2 * s, -37.5 * s); c.lineTo(-2.4 * s, -20 * s); c.lineTo(-6.4 * s, -10.5 * s);
  c.moveTo(8.2 * s, -37.5 * s); c.lineTo(2.4 * s, -20 * s); c.lineTo(6.4 * s, -10.5 * s); c.stroke();
  c.fillStyle = shade(a.suit, 38); c.beginPath(); c.arc(0.9 * s, -7 * s, 0.9 * s, 0, 7); c.fill(); c.beginPath(); c.arc(0.9 * s, -2 * s, 0.9 * s, 0, 7); c.fill();
  /* tie */
  if (a.tie) {
    c.fillStyle = a.tie;
    c.beginPath(); c.moveTo(-2 * s, -33.5 * s); c.lineTo(2 * s, -33.5 * s); c.lineTo(a.trumpTie ? 3.4 * s : 1.7 * s, a.trumpTie ? 2 * s : -11.5 * s); c.lineTo(0, a.trumpTie ? 5 * s : -8 * s); c.lineTo(a.trumpTie ? -3.4 * s : -1.7 * s, a.trumpTie ? 2 * s : -11.5 * s); c.closePath(); c.fill();
    c.fillStyle = shade(a.tie, -26); c.beginPath(); c.moveTo(-2.5 * s, -35 * s); c.lineTo(2.5 * s, -35 * s); c.lineTo(2 * s, -31.4 * s); c.lineTo(-2 * s, -31.4 * s); c.closePath(); c.fill();
  }

  /* arms: shoulder → elbow → hand, with a sleeve and a cuff */
  const sh = -34 * s;
  const arm = (x0, y0, x1, y1, x2, y2) => {
    c.strokeStyle = shade(a.suit, -6); c.lineWidth = 6.4 * s;
    c.beginPath(); c.moveTo(x0, y0); c.quadraticCurveTo(x1, y1, x2, y2); c.stroke();
    c.strokeStyle = a.shirt; c.lineWidth = 6.8 * s; c.beginPath(); c.moveTo(x2 - (x2 - x1) * 0.12, y2 - (y2 - y1) * 0.12); c.lineTo(x2, y2); c.stroke();
    c.fillStyle = a.skin; c.beginPath(); c.arc(x2 + (x2 - x1) * 0.12, y2 + (y2 - y1) * 0.12 + 0.6 * s, 3.1 * s, 0, 7); c.fill();
    c.fillStyle = 'rgba(0,0,0,0.1)'; c.beginPath(); c.arc(x2 + (x2 - x1) * 0.12 + 0.7 * s, y2 + (y2 - y1) * 0.12 + 1.2 * s, 2.4 * s, 0, 7); c.fill();
  };
  if (pose === 'sit') {
    arm(-w + 2.4 * s, sh, -w - 5 * s, sh + 15 * s, -10 * s, 3 * s);
    arm(w - 2.4 * s, sh, w + 5 * s + gest * 4 * s, sh + 15 * s - gest * 12 * s, 10 * s + gest * 4 * s, 3 * s - gest * 14 * s);
  } else if (pose === 'point') {
    arm(-w + 2.4 * s, sh, -w - 3.5 * s, sh + 13 * s, -w - 2.2 * s, -4 * s);
    arm(w - 2.4 * s, sh, w + 8 * s, sh - 6 * s, w + 14 * s, sh - 17 * s);
  } else {
    const sw = pose === 'walk' ? Math.sin(armPhase) * 9 * s : 0;
    arm(-w + 2.4 * s, sh, -w - 1.4 * s - sw * 0.3, sh + 15 * s, -w + 1.2 * s + sw * 0.5, -3 * s);
    arm(w - 2.4 * s, sh, w + 1.4 * s + sw * 0.3 + gest * 9 * s, sh + 14 * s - gest * 14 * s, w - 1.2 * s - sw * 0.5 + gest * 12 * s, -3 * s - gest * 26 * s);
  }

  /* props */
  if (a.phone) { c.fillStyle = '#0c0e12'; rr(c, w - 4 * s, -17 * s, 6 * s, 10.5 * s, 1.6 * s); c.fill(); c.fillStyle = 'rgba(140,180,255,0.85)'; rr(c, w - 3.2 * s, -16 * s, 4.4 * s, 7.4 * s, 1 * s); c.fill(); }
  if (a.vial) { c.fillStyle = 'rgba(240,220,150,0.92)'; rr(c, -w + 1 * s, -11 * s, 4 * s, 9.5 * s, 2 * s); c.fill(); c.fillStyle = '#b09a54'; c.fillRect(-w + 1 * s, -13 * s, 4 * s, 2.4 * s); }
  if (a.laptop) { c.fillStyle = '#3a4048'; rr(c, w - 12 * s, -9 * s, 14 * s, 9.5 * s, 1.5 * s); c.fill(); c.fillStyle = 'rgba(150,190,255,0.8)'; rr(c, w - 11 * s, -8 * s, 12 * s, 6.6 * s, 1 * s); c.fill(); }
  if (a.leather) {
    c.strokeStyle = '#0c0c0e'; c.lineWidth = 3.2 * s; c.beginPath(); c.moveTo(-w * 0.34, -38 * s); c.lineTo(-4.6 * s, -21 * s); c.moveTo(w * 0.34, -38 * s); c.lineTo(4.6 * s, -21 * s); c.stroke();
    
  }
  if (a.beads) { c.strokeStyle = '#c9a227'; c.lineWidth = 1.3 * s; c.beginPath(); c.arc(0, -35 * s, 8 * s, 0.45, 2.69); c.stroke(); }
  c.restore();
}

/* ---- full figure ----
   opt: pose ('stand'|'walk'|'sit'|'point'), phase (walk cycle), look (-1..1), blink, flip,
        t (time, for breathing), talk (true while speaking), exp (expression override). */
function drawFigure(c, id, x, y, s, opt) {
  opt = opt || {};
  const a = charSpec(id);
  const B = BUILDS[a.build] || BUILDS.avg;
  s = s * B.h;
  const pose = opt.pose || 'stand';
  const phase = opt.phase || 0;
  const look = opt.look || 0;
  const blink = opt.blink || false;
  const t = opt.t || 0;
  const seed = (String(id).charCodeAt(0) || 1) + String(id).length * 3;
  const talking = !!opt.talk;
  const breathe = 1 + 0.013 * Math.sin(t * 1.7 + seed);
  const mouth = talking ? (0.5 + 0.5 * Math.sin(t * 13 + seed)) * (0.55 + 0.45 * Math.sin(t * 4.7 + seed)) : 0;
  const gest = talking ? Math.max(0, Math.sin(t * 2.2 + seed)) * 0.85 : 0;
  const brow = talking ? Math.max(0, Math.sin(t * 3.1 + seed * 2)) * 0.6 : 0;
  const bounce = pose === 'walk' ? -Math.abs(Math.sin(phase)) * 2.4 * s : 0;
  const nod = talking ? Math.sin(t * 5.2 + seed) * 0.6 * s : 0;
  c.save();
  c.translate(x, y + bounce);
  if (opt.flip) c.scale(-1, 1);
  c.fillStyle = 'rgba(0,0,0,0.28)';
  c.beginPath(); c.ellipse(0, 1.5 * s - bounce + 30 * s * B.legs - 28 * s, 15 * s * (B.w / 20.5), 3.4 * s, 0, 0, 7); c.fill();
  c.save(); c.scale(1, breathe);
  drawTorso(c, a, s, phase, pose, gest);
  c.restore();
  c.save(); c.translate(0, -57 * s + nod + (breathe - 1) * -30 * s);
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
