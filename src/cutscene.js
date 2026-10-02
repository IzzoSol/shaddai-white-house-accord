/* ==================== cutscene.js — short, skippable scenes ====================
   A cutscene is { dur, draw(c, t) } where t is seconds since it began. Anything can skip it
   (click, Space, Enter, Escape) after a third of a second. Agents never see cutscenes: the agent
   interface calls the same game functions directly. */

const CUT_SEEN_KEY = 'wh_seen_arrival';
const ARRIVAL_CAST = ['musk', 'huang', 'zuck', 'pichai', 'amodei', 'brockman'];

function introSeen() {
  try { return localStorage.getItem(CUT_SEEN_KEY) === '1'; } catch (e) { return false; }
}
function startCutscene(id) {
  G.screen = 'cutscene';
  G.cut = { id: id, t: 0, flashed: -1 };
  if (id === 'desk') { G.signPhase = 'lines'; G.signLine = 0; }
}
function endCutscene() {
  const id = G.cut && G.cut.id;
  G.cut = null;
  if (id === 'arrival') {
    try { localStorage.setItem(CUT_SEEN_KEY, '1'); } catch (e) {}
    G.screen = 'cast';
  } else if (id === 'desk') {
    startSign();
  } else {
    G.screen = 'room';
  }
}
function updateCutscene(dt) {
  const cs = G.cut;
  if (!cs) { G.screen = 'title'; return; }
  cs.t += dt;
  if (cs.t >= CUTSCENES[cs.id].dur) endCutscene();
}
function skipCutscene() { if (G.cut && G.cut.t > 0.33) endCutscene(); }
function drawCutscene(c, t) {
  const cs = G.cut;
  if (!cs) { c.fillStyle = '#05070d'; c.fillRect(0, 0, W, H); return; }
  CUTSCENES[cs.id].draw(c, cs.t);
  /* skip hint */
  c.fillStyle = 'rgba(245,239,221,0.55)'; c.font = '13px Georgia, serif'; c.textAlign = 'right';
  c.fillText('click or press Space to skip', W - 26, H - 22);
}

const easeOut = (x) => 1 - Math.pow(1 - Math.max(0, Math.min(1, x)), 3);
const easeInOut = (x) => { x = Math.max(0, Math.min(1, x)); return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
const fadeWindow = (t, a, b, f) => Math.max(0, Math.min(1, Math.min((t - a) / f, (b - t) / f)));   /* 0→1→0 between a and b */

/* a title card: lines fade in and out over [a, b] */
function cutTitle(c, text, y, t, a, b, size, italic) {
  const k = fadeWindow(t, a, b, 0.6);
  if (k <= 0) return;
  c.fillStyle = 'rgba(245,239,221,' + (0.95 * k) + ')';
  c.font = (italic ? 'italic ' : '600 ') + size + 'px Georgia, serif'; c.textAlign = 'center';
  c.fillText(text, W / 2, y - (1 - k) * -8);
}

function drawMotorcadeCar(c, x, y, lead, t) {
  /* headlight cones */
  const g = c.createLinearGradient(x + 70, y, x + 330, y);
  g.addColorStop(0, 'rgba(255,238,200,0.5)'); g.addColorStop(1, 'rgba(255,238,200,0)');
  c.fillStyle = g;
  c.beginPath(); c.moveTo(x + 70, y - 8); c.lineTo(x + 340, y - 46); c.lineTo(x + 340, y + 36); c.lineTo(x + 70, y + 8); c.closePath(); c.fill();
  /* body */
  c.fillStyle = '#07090e'; rr(c, x - 78, y - 24, 156, 40, 12); c.fill();
  c.fillStyle = '#11151d'; rr(c, x - 44, y - 40, 92, 24, 9); c.fill();
  c.fillStyle = 'rgba(160,190,230,0.18)'; rr(c, x - 38, y - 36, 80, 14, 6); c.fill();
  c.fillStyle = '#0a0c11'; c.beginPath(); c.arc(x - 44, y + 18, 11, 0, 7); c.fill(); c.beginPath(); c.arc(x + 44, y + 18, 11, 0, 7); c.fill();
  c.fillStyle = 'rgba(255,245,220,0.95)'; c.beginPath(); c.arc(x + 74, y - 8, 4, 0, 7); c.fill();
  if (lead) {                                                   /* sirens */
    const on = Math.sin(t * 22) > 0;
    c.fillStyle = on ? 'rgba(230,50,60,0.9)' : 'rgba(60,110,240,0.9)';
    c.beginPath(); c.arc(x - 6, y - 42, 5, 0, 7); c.fill();
    const sg = c.createRadialGradient(x - 6, y - 42, 2, x - 6, y - 42, 70);
    sg.addColorStop(0, on ? 'rgba(230,50,60,0.35)' : 'rgba(60,110,240,0.35)'); sg.addColorStop(1, 'rgba(0,0,0,0)');
    c.fillStyle = sg; c.fillRect(x - 80, y - 110, 160, 140);
  }
}

const CUTSCENES = {
  /* ---- THE ARRIVAL: motorcade, doors, six people in, a one-line promise ---- */
  arrival: {
    dur: 12,
    draw(c, t) {
      const d = 12;
      /* slow push-in on everything */
      const k = 1 + 0.06 * (t / d);
      c.save(); c.translate(W / 2, H * 0.56); c.scale(k, k); c.translate(-W / 2, -H * 0.56);
      const bg = ASSETS.img('arrival-bg');
      if (bg) drawCover(c, bg, -40, -30, W + 80, H + 60);
      else {
        /* night sky + stars */
        const sky = c.createLinearGradient(0, 0, 0, H * 0.7);
        sky.addColorStop(0, '#04060c'); sky.addColorStop(1, '#16223d');
        c.fillStyle = sky; c.fillRect(-40, -30, W + 80, H + 60);
        for (let i = 0; i < 70; i++) {
          const sx = (i * 197) % W, sy = (i * 83) % 260, tw = 0.5 + 0.5 * Math.sin(t * 1.4 + i);
          c.fillStyle = 'rgba(245,239,221,' + (0.15 + 0.35 * tw) + ')'; c.fillRect(sx, sy, 2, 2);
        }
        /* the residence: wings, portico, columns, lit windows */
        c.fillStyle = '#0d1424'; c.fillRect(120, 300, W - 240, 220);
        c.fillStyle = '#121b30';
        c.beginPath(); c.moveTo(380, 300); c.lineTo(W / 2, 214); c.lineTo(W - 380, 300); c.closePath(); c.fill();
        c.fillStyle = '#1a2640'; c.fillRect(380, 300, W - 760, 220);
        for (let i = 0; i < 6; i++) { c.fillStyle = '#232f4d'; c.fillRect(410 + i * 80, 308, 22, 212); }
        for (let i = 0; i < 9; i++) {
          const lit = 0.6 + 0.4 * Math.sin(t * 0.8 + i * 1.7);
          c.fillStyle = 'rgba(255,205,120,' + (0.35 + 0.35 * lit) + ')';
          c.fillRect(150 + i * 28, 340, 14, 30); c.fillRect(150 + i * 28, 410, 14, 30);
          c.fillRect(W - 150 - 14 - i * 28, 340, 14, 30); c.fillRect(W - 150 - 14 - i * 28, 410, 14, 30);
        }
        /* steps and plaza */
        for (let i = 0; i < 4; i++) { c.fillStyle = 'rgba(60,70,98,' + (0.5 - i * 0.07) + ')'; c.fillRect(360 - i * 20, 520 + i * 16, W - 720 + i * 40, 16); }
        const pl = c.createLinearGradient(0, 520, 0, H);
        pl.addColorStop(0, '#0b101c'); pl.addColorStop(1, '#05070d');
        c.fillStyle = pl; c.fillRect(-40, 584, W + 80, H);
      }
      /* motorcade sweeps across the plaza (0.3s–4.6s) */
      const mt = easeInOut((t - 0.3) / 4.3);
      for (let i = 0; i < 3; i++) drawMotorcadeCar(c, -260 + mt * (W + 760) - i * 300, 574 + i * 4, i === 0, t);
      /* six people walk in from the left and stop on their marks (3.6s onward) */
      ARRIVAL_CAST.forEach((id, i) => {
        const start = 3.4 + i * 0.7, mark = 330 + i * 124;
        const p = easeOut((t - start) / 3.0);
        const x = -60 + (mark + 60) * p;
        const walking = t > start && p < 0.985;
        if (t < start - 0.2) return;
        drawFigure(c, id, x, 596 - i % 2 * 6, 1.45, { pose: walking ? 'walk' : 'stand', phase: t * 7 + i * 1.3, look: 0.3, blink: Math.sin(t * 1.1 + i) > 0.99, t: t });
        if (!walking) {                                         /* name tag once they stop */
          const kk = Math.min(1, (t - (start + 3)) / 0.5);
          const nm = CAST.find(q => q.id === id).name.split(' ')[0].toUpperCase();
          c.fillStyle = 'rgba(7,10,18,' + (0.7 * kk) + ')'; rr(c, x - 44, 452, 88, 22, 6); c.fill();
          c.fillStyle = 'rgba(232,201,106,' + kk + ')'; c.font = 'bold 12px Georgia, serif'; c.textAlign = 'center';
          c.fillText(nm, x, 467);
        }
      });
      c.restore();
      /* camera flashes at the edges, once the guests arrive */
      for (let i = 0; i < 7; i++) {
        const ft = t * 2.3 + i * 1.9, f = Math.sin(ft);
        if (t > 3.5 && f > 0.9) {
          const fx = 90 + i * 180 + Math.sin(i * 5) * 60, fy = 470 + Math.sin(i * 3) * 80;
          const fg = c.createRadialGradient(fx, fy, 2, fx, fy, 110);
          fg.addColorStop(0, 'rgba(255,255,255,0.65)'); fg.addColorStop(1, 'rgba(255,255,255,0)');
          c.fillStyle = fg; c.fillRect(fx - 120, fy - 120, 240, 240);
          if (G.cut && Math.floor(ft / (Math.PI * 2)) !== G.cut.flashed && f > 0.97) { G.cut.flashed = Math.floor(ft / (Math.PI * 2)); sfx('shutter'); }
        }
      }
      /* letterbox + title cards */
      c.fillStyle = '#000'; c.fillRect(0, 0, W, 64); c.fillRect(0, H - 64, W, 64);
      cutTitle(c, 'SEPTEMBER 29, 2026', 330, t, 0.6, 3.6, 40, false);
      cutTitle(c, 'THE WHITE HOUSE', 372, t, 0.9, 3.6, 20, true);
      cutTitle(c, 'EAST ROOM · LUNCHEON · 12:40 PM', 120, t, 4.2, 8.2, 26, false);
      cutTitle(c, 'A one-letter typo is about to become history.', 330, t, 8.6, 11.6, 30, true);
      /* open from black, close to black */
      const a = Math.max(1 - t / 0.7, (t - (d - 0.7)) / 0.7);
      if (a > 0) { c.fillStyle = 'rgba(5,7,13,' + Math.min(1, a) + ')'; c.fillRect(0, 0, W, H); }
    }
  },

  /* ---- THE DESK: the pen comes up; the camera pushes in on the document ---- */
  desk: {
    dur: 3.2,
    draw(c, t) {
      const z = 1 + 0.26 * easeOut(t / 2.6);
      c.save(); c.translate(W / 2 + 70, 440); c.scale(z, z); c.translate(-(W / 2 + 70), -440);
      drawSign(c, G.t, 0.016);
      c.restore();
      /* vignette closes in */
      const v = c.createRadialGradient(W / 2 + 70, 440, 160, W / 2 + 70, 440, 760);
      v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,' + (0.25 + 0.5 * easeOut(t / 2.6)) + ')');
      c.fillStyle = v; c.fillRect(0, 0, W, H);
      cutTitle(c, 'THE PEN IS UP.', 150, t, 0.2, 2.5, 38, false);
      /* flash into the signing */
      const f = Math.max(0, (t - 2.55) / 0.65);
      if (f > 0) { c.fillStyle = 'rgba(255,255,255,' + Math.min(0.92, f) + ')'; c.fillRect(0, 0, W, H); }
      if (G.cut && G.cut.flashed < 0 && t > 2.55) { G.cut.flashed = 1; sfx('shutter'); }
    }
  }
};
