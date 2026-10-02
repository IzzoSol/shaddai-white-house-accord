/* ==================== mini.js — six micro-games (no falling orbs) ==================== */

let mini = null;   // { id, t, elapsed, done, success, residue, toast, title, how, time }

function startMini(id) {
  const def = MINI[id];
  mini = { id: id, t: 0, elapsed: 0, done: false, success: false, residue: null, toast: '', title: def.title, how: def.how, time: def.time };
  def.init();
}
function finishMini(success, residue, toast) {
  mini.success = success; mini.residue = residue || {}; mini.toast = toast || ''; mini.done = true;
}

/* The window every micro-game plays in. Positions inside a micro-game are relative to this. */
function miniPanel() {
  const pw = Math.min(760, W * 0.72), ph = Math.min(430, H * 0.72);
  return { pw: pw, ph: ph, px: (W - pw) / 2, py: (H - ph) / 2 };
}

/* ---- shared chrome ---- */
function drawMiniShell(c, W, H, t) {
  c.fillStyle = 'rgba(7,10,18,0.72)'; c.fillRect(0, 0, W, H);
  const pw = Math.min(760, W * 0.72), ph = Math.min(430, H * 0.72);
  const px = (W - pw) / 2, py = (H - ph) / 2;
  c.fillStyle = PAL.cream; rr(c, px, py, pw, ph, 10); c.fill();
  c.strokeStyle = PAL.gold; c.lineWidth = 2.5; rr(c, px, py, pw, ph, 10); c.stroke();
  c.fillStyle = PAL.ink; c.font = 'bold 24px Georgia, serif'; c.textAlign = 'left';
  c.fillText(mini.title, px + 24, py + 40);
  c.fillStyle = '#4a3a28'; c.font = '16px Georgia, serif';
  wrapText(c, mini.how, px + 24, py + 66, pw - 48, 20, 'left');
  /* time bar */
  const frac = 1 - Math.min(1, mini.elapsed / mini.time);
  c.fillStyle = '#d9cfae'; rr(c, px + 24, py + ph - 26, pw - 48, 10, 5); c.fill();
  c.fillStyle = frac > 0.3 ? PAL.green : PAL.red; rr(c, px + 24, py + ph - 26, (pw - 48) * frac, 10, 5); c.fill();
  return { px: px, py: py, pw: pw, ph: ph };
}

const MINI = {
  /* ---- ELON: phone composer ---- */
  phone: {
    title: 'ELON’S PHONE — post the thing',
    how: 'Click a draft, then POST. One of these is a bad idea.',
    time: 16,
    init() { mini.drafts = ['Banger.', 'Grading each other’s homework. Morally.', 'Dots are here. Wait—'], mini.picked = -1, mini.likes = 0, mini.posted = false; },
    tick(dt) {
      mini.t += dt;
      if (mini.posted) { mini.elapsed += dt * 0.2; return; }
      mini.elapsed += dt;
      if (mini.elapsed > mini.time) { finishMini(false, { meme:+1, drama:+1 }, 'The phone slept. PR is monitoring the situation.'); return; }
      for (let i = 0; i < 3; i++) {
        const r = miniRects['draft' + i];
        if (r && hitTest(r) && CLICKS.length) { CLICKS.pop(); mini.picked = i; break; }
      }
      if (mini.picked >= 0) {
        const r = miniRects['post'];
        if (r && hitTest(r) && CLICKS.length) {
          CLICKS.pop(); mini.posted = true;
          const bad = mini.picked === 2;
          if (bad) finishMini(false, { meme:+1, drama:+1 }, '“Dots are here.” That was Sam’s line. PR is monitoring the situation.');
          else finishMini(true, { meme:+2, optics:+1 }, 'Posted. The internet finds it before dessert.');
        }
      }
    },
    draw(c, t) {
      const b = drawMiniShell(c, W, H, t);
      /* phone */
      const cx = b.px + 120, cy = b.py + 90;
      c.fillStyle = '#0c0e12'; rr(c, cx, cy, 150, 250, 18); c.fill();
      c.fillStyle = '#eef0f4'; rr(c, cx + 8, cy + 8, 134, 234, 12); c.fill();
      c.fillStyle = '#8899aa'; c.font = '9px monospace'; c.textAlign = 'left';
      c.fillText('X · POST', cx + 16, cy + 24);
      for (let i = 0; i < 3; i++) {
        const dy = cy + 38 + i * 62;
        const r = { x: cx + 14, y: dy, w: 122, h: 54 };
        miniRects['draft' + i] = r;
        c.fillStyle = mini.picked === i ? '#d8e4f4' : '#fff';
        rr(c, r.x, r.y, r.w, r.h, 6); c.fill();
        c.strokeStyle = mini.picked === i ? '#3a6ea5' : '#c8c8c8'; c.lineWidth = 1.5; rr(c, r.x, r.y, r.w, r.h, 6); c.stroke();
        c.fillStyle = '#22262c'; c.font = 'italic 10.5px Georgia';
        wrapText(c, mini.drafts[i], r.x + 8, r.y + 16, r.w - 16, 13);
      }
      const pr = { x: cx + 14, y: cy + 226, w: 122, h: 16 };
      miniRects['post'] = pr;
      c.fillStyle = mini.picked >= 0 ? '#1d9bf0' : '#9aa4b0';
      rr(c, pr.x, pr.y, pr.w, pr.h, 8); c.fill();
      c.fillStyle = '#fff'; c.font = 'bold 10px monospace'; c.textAlign = 'center';
      c.fillText(mini.picked >= 0 ? 'POST' : 'PICK A DRAFT', pr.x + pr.w / 2, pr.y + 11);
      /* Elon watching */
      drawFigure(c, 'musk', b.px + b.pw - 120, b.py + b.ph - 86, 1.35, { pose: 'stand', look: Math.sin(t * 1.4) });
      c.fillStyle = '#5a4a38'; c.font = 'italic 13px Georgia, serif'; c.textAlign = 'center';
      c.fillText(mini.posted ? '“Historic.”' : '“Probably.”', b.px + b.pw - 120, b.py + b.ph - 200);
    }
  },

  /* ---- JENSEN: sand conveyor ---- */
  sand: {
    title: 'SAND → WAFER → GPU',
    how: 'Drag the sand along the track. Hold it inside each station until it converts.',
    time: 20,
    init() { mini.sx = 0.06; mini.station = 0; mini.hold = 0; mini.stage = ['SAND', 'WAFER', 'GPU']; },
    tick(dt) {
      mini.t += dt; mini.elapsed += dt;
      if (mini.elapsed > mini.time) { finishMini(false, { optics:-1 }, 'The sand stayed sand. Jensen nods anyway.'); return; }
      if (MDOWN && MXY) {
        const track = miniRects['track'];
        if (track && MXY.x > track.x && MXY.x < track.x + track.w) {
          mini.sx = (MXY.x - track.x) / track.w;
        }
      }
      const zone = Math.min(2, Math.floor(mini.sx * 3));
      const inZone = Math.abs(mini.sx - (zone + 0.5) / 3) < 0.16;
      if (zone === mini.station && inZone && MDOWN) {
        mini.hold += dt;
        if (mini.hold > 1.6) { mini.hold = 0; mini.station++; if (mini.station > 2) { finishMini(true, { optics:+1, substance:+1 }, 'Sand to GPU. The vial glints. The jacket does the rest.'); } }
      } else { mini.hold = Math.max(0, mini.hold - dt * 0.6); }
    },
    draw(c, t) {
      const b = drawMiniShell(c, W, H, t);
      const tx = b.px + 60, ty = b.py + 210, tw = b.pw - 120;
      miniRects['track'] = { x: tx, y: ty - 30, w: tw, h: 60 };
      c.fillStyle = '#2a2f3a'; rr(c, tx, ty - 30, tw, 60, 8); c.fill();
      for (let i = 0; i < 3; i++) {
        const zx = tx + tw * (i / 3), zw = tw / 3;
        c.fillStyle = i === mini.station ? 'rgba(201,162,39,0.25)' : 'rgba(255,255,255,0.05)';
        rr(c, zx + 3, ty - 27, zw - 6, 54, 6); c.fill();
        c.fillStyle = i < mini.station ? PAL.gold : '#8892a0'; c.font = 'bold 13px monospace'; c.textAlign = 'center';
        c.fillText(mini.stage[i], zx + zw / 2, ty + 44);
      }
      const gx = tx + tw * mini.sx;
      /* the sand blob becomes a wafer becomes a GPU */
      if (mini.station === 0) {
        c.fillStyle = '#d9c07a';
        c.beginPath(); c.ellipse(gx, ty, 13, 8, 0, 0, 7); c.fill();
        c.fillStyle = '#b09a54'; c.beginPath(); c.ellipse(gx - 3, ty - 3, 5, 3, 0, 0, 7); c.fill();
      } else if (mini.station === 1) {
        c.fillStyle = '#cfd6de'; rr(c, gx - 14, ty - 9, 28, 18, 3); c.fill();
        c.strokeStyle = '#8892a0'; c.lineWidth = 1; c.strokeRect(gx - 14, ty - 9, 28, 18);
      } else {
        c.fillStyle = '#1c3a2a'; rr(c, gx - 16, ty - 11, 32, 22, 3); c.fill();
        c.fillStyle = PAL.gold; c.font = 'bold 9px monospace'; c.textAlign = 'center';
        c.fillText('GPU', gx, ty + 4);
      }
      /* hold progress */
      if (mini.hold > 0.05) {
        c.fillStyle = PAL.gold; rr(c, tx, ty - 44, tw * (mini.hold / 1.6), 6, 3); c.fill();
      }
      drawFigure(c, 'huang', b.px + b.pw - 110, b.py + b.ph - 86, 1.3, { pose: 'stand' });
      c.fillStyle = '#5a4a38'; c.font = 'italic 13px Georgia, serif'; c.textAlign = 'center';
      c.fillText(mini.station === 0 ? '“Sand.”' : mini.station === 1 ? '“Wafer.”' : '“Software.”', b.px + b.pw - 110, b.py + b.ph - 200);
    }
  },

  /* ---- ZUCK: caption tap ---- */
  caption: {
    title: 'META GLASSES — LIVE CAPTIONS',
    how: 'Tap the WRONG words before they reach the jumbotron. Let the right ones through.',
    time: 18,
    init() {
      mini.words = []; mini.spawn = 0; mini.wrongTapped = 0; mini.wrongMissed = 0; mini.jumbotron = [];
      mini.pool = [
        { t:'robust', w:false }, { t:'controls', w:false }, { t:'board', w:false }, { t:'reports', w:false },
        { t:'morally', w:true }, { t:'bidding', w:true }, { t:'binder', w:true }, { t:'constitution', w:false },
        { t:'monitoring', w:false }, { t:'morally', w:true }
      ];
    },
    tick(dt) {
      mini.t += dt; mini.elapsed += dt;
      if (mini.elapsed > mini.time) {
        const leaked = mini.wrongMissed + mini.wrongTapped;
        if (leaked === 0) finishMini(true, { optics:+1 }, 'Captions clean. The jumbotron is disappointed.');
        else finishMini(false, { drama:+1, }, 'One wrong caption is already on the jumbotron.');
        if (mini.wrongMissed > 0) mini.residue.flag = null, stateFlags.zuckCaption = true;
        return;
      }
      mini.spawn -= dt;
      if (mini.spawn <= 0 && mini.words.length < 4) {
        const w = mini.pool[Math.floor(RND() * mini.pool.length)];
        const lane = (mini.laneN = (mini.laneN || 0) + 1) % 3;   /* three lanes, inside the window */
        mini.words.push({ t: w.t, wrong: w.w, x: -30, y: lane * 44, speed: 70 + RND() * 40 });
        mini.spawn = 0.55;
      }
      for (let i = mini.words.length - 1; i >= 0; i--) {
        const wd = mini.words[i]; wd.x += wd.speed * dt;
        const P = miniPanel();
        const r = { x: P.px + 24 + wd.x - 34, y: P.py + 128 + wd.y, w: 68, h: 26 };
        wd.rect = r;
        if (hitTest(r) && CLICKS.length) { CLICKS.pop(); if (wd.wrong) mini.wrongTapped++; else mini.opticsHit = (mini.opticsHit || 0) + 1; mini.words.splice(i, 1); continue; }
        if (wd.x > miniPanel().pw - 38) {
          if (wd.wrong) { mini.wrongMissed++; mini.jumbotron.push(wd.t); }
          mini.words.splice(i, 1);
        }
      }
    },
    draw(c, t) {
      const b = drawMiniShell(c, W, H, t);
      /* jumbotron */
      c.fillStyle = '#101826'; rr(c, b.px + 24, b.py + 78, b.pw - 48, 34, 4); c.fill();
      c.strokeStyle = PAL.gold; c.lineWidth = 1.5; rr(c, b.px + 24, b.py + 78, b.pw - 48, 34, 4); c.stroke();
      c.fillStyle = PAL.gold; c.font = 'bold 15px monospace'; c.textAlign = 'left';
      c.fillText(mini.jumbotron.slice(-2).join(' · ') || '· · ·', b.px + 36, b.py + 101);
      /* streaming words: a lane track, clipped to the window */
      c.save(); c.beginPath(); c.rect(b.px + 24, b.py + 120, b.pw - 48, 150); c.clip();
      for (let ln = 0; ln < 3; ln++) { c.fillStyle = 'rgba(16,24,38,0.07)'; rr(c, b.px + 24, b.py + 124 + ln * 44, b.pw - 48, 34, 8); c.fill(); }
      for (const wd of mini.words) {
        const r = wd.rect;
        c.fillStyle = '#fff'; rr(c, r.x, r.y, r.w, r.h, 13); c.fill();
        c.strokeStyle = '#c8c0a8'; c.lineWidth = 1.2; rr(c, r.x, r.y, r.w, r.h, 13); c.stroke();
        c.fillStyle = '#22262c'; c.font = '13px Georgia'; c.textAlign = 'center';
        c.fillText(wd.t, r.x + r.w / 2, r.y + 17);
      }
      c.restore();
      /* zuck wearing the glasses, watching */
      drawFigure(c, 'zuck', b.px + b.pw - 110, b.py + b.ph - 86, 1.3, { pose: 'stand', look: Math.sin(t * 0.8) });
      c.fillStyle = '#5a4a38'; c.font = 'italic 13px Georgia, serif'; c.textAlign = 'center';
      c.fillText('“Robust.”', b.px + b.pw - 110, b.py + b.ph - 200);
      c.fillStyle = '#5a4a38'; c.font = '12px Georgia'; c.textAlign = 'left';
      c.fillText('tapped: ' + mini.wrongTapped + '   leaked: ' + mini.wrongMissed, b.px + 24, b.py + b.ph - 40);
    }
  },

  /* ---- SUNDAR: stamp folders ---- */
  stamp: {
    title: 'MODEL FOLDERS — REVIEW, THEN RELEASE',
    how: 'Click each folder when the stamp is inside it. Miss and it ships unstamped.',
    time: 16,
    init() { mini.folders = [0, 1, 2].map(() => ({ stamped: false })); mini.marker = 0; mini.dir = 1; },
    tick(dt) {
      mini.t += dt; mini.elapsed += dt;
      if (mini.elapsed > mini.time) {
        const done = mini.folders.filter(f => f.stamped).length;
        finishMini(done === 3, done === 3 ? { substance:+2 } : { optics:-1 },
          done === 3 ? 'REVIEWED. Official. In the minutes now.' : done + ' of 3 shipped. Somewhere, a lawyer opens a tab.');
        return;
      }
      mini.marker += mini.dir * dt * 0.85;
      if (mini.marker > 1 || mini.marker < 0) { mini.dir *= -1; mini.marker = Math.max(0, Math.min(1, mini.marker)); }
      for (let i = 0; i < 3; i++) {
        const r = miniRects['folder' + i];
        if (r && hitTest(r) && CLICKS.length && !mini.folders[i].stamped) {
          CLICKS.pop();
          const inZone = (i % 2 === 0 ? mini.marker > 0.62 : mini.marker < 0.38);
          mini.folders[i].stamped = inZone; mini.folders[i].missed = !inZone;
        }
      }
      if (mini.folders.every(f => f.stamped)) {
        finishMini(true, { substance:+2, optics:+1 }, 'REVIEWED ×3. The lunch feels official and slightly dead.');
      }
    },
    draw(c, t) {
      const b = drawMiniShell(c, W, H, t);
      for (let i = 0; i < 3; i++) {
        const fx = b.px + 70 + i * 190, fy = b.py + 150, fw = 120, fh = 150;
        const r = { x: fx, y: fy, w: fw, h: fh };
        miniRects['folder' + i] = r;
        c.fillStyle = '#e0d4ae'; rr(c, fx, fy, fw, fh, 6); c.fill();
        c.strokeStyle = '#b8a878'; c.lineWidth = 2; rr(c, fx, fy, fw, fh, 6); c.stroke();
        c.fillStyle = '#8a7a54'; c.font = 'bold 11px monospace'; c.textAlign = 'center';
        c.fillText('MODEL-' + (i + 1), fx + fw / 2, fy + 24);
        c.fillStyle = '#b8a878'; c.font = '9px monospace';
        c.fillText('auto-ship in ' + Math.max(0, Math.ceil(mini.time - mini.elapsed)) + 's', fx + fw / 2, fy + 40);
        if (mini.folders[i].stamped) {
          c.save(); c.translate(fx + fw / 2, fy + 92); c.rotate(-0.12);
          c.strokeStyle = '#2a5a8a'; c.lineWidth = 3; rr(c, -34, -14, 68, 28, 4); c.stroke();
          c.fillStyle = '#2a5a8a'; c.font = 'bold 14px monospace';
          c.fillText('REVIEWED', 0, 5); c.restore();
        } else if (mini.folders[i].missed) {
          c.fillStyle = '#a05a4a'; c.font = 'italic 11px Georgia';
          c.fillText('shipped unstamped', fx + fw / 2, fy + 96);
        }
      }
      /* the stamp marker: two green zones at the ends */
      const mx = b.px + 70 + mini.marker * (b.pw - 190);
      c.fillStyle = PAL.green; rr(c, mx - 26, b.py + 108, 52, 24, 4); c.fill();
      c.fillStyle = '#fff'; c.font = 'bold 10px monospace'; c.textAlign = 'center';
      c.fillText('STAMP', mx, b.py + 124);
      drawFigure(c, 'pichai', b.px + b.pw - 60, b.py + b.ph - 72, 1.0, { pose: 'stand' });
    }
  },

  /* ---- DARIO: safety slider ---- */
  slider: {
    title: 'HOLD THE SAFETY SLIDER',
    how: 'Drag SAFETY up. SPEED fights you. Keep it above the line.',
    time: 15,
    init() { mini.safety = 0.5; mini.held = 0; },
    tick(dt) {
      mini.t += dt; mini.elapsed += dt;
      if (mini.elapsed > mini.time) {
        finishMini(false, { substance:+1 }, 'SPEED won. “The frosting is not the cake.”');
        return;
      }
      if (MDOWN && MXY) {
        const track = miniRects['strack'];
        if (track && MXY.x > track.x - 20 && MXY.x < track.x + track.w + 20) {
          mini.safety = Math.max(0, Math.min(1, 1 - (MXY.y - track.y) / track.h));
        }
      }
      mini.safety -= dt * (0.14 + 0.10 * Math.sin(mini.t * 2.2));   // SPEED fights you
      if (mini.safety > 0.62) mini.held += dt; else mini.held = Math.max(0, mini.held - dt * 0.5);
      if (mini.held > 6) finishMini(true, { substance:+3, rapport:-2 }, 'The testing held. Trump noticed. That is not always good.');
    },
    draw(c, t) {
      const b = drawMiniShell(c, W, H, t);
      const tx = b.px + 150, ty = b.py + 100, tw = 60, th = 220;
      miniRects['strack'] = { x: tx, y: ty, w: tw, h: th };
      c.fillStyle = '#2a2f3a'; rr(c, tx, ty, tw, th, 8); c.fill();
      /* red speed gradient bottom */
      const grad = c.createLinearGradient(0, ty + th, 0, ty);
      grad.addColorStop(0, 'rgba(192,57,43,0.55)'); grad.addColorStop(1, 'rgba(192,57,43,0)');
      c.fillStyle = grad; rr(c, tx, ty, tw, th, 8); c.fill();
      /* the line */
      c.strokeStyle = PAL.gold; c.setLineDash([5, 4]); c.lineWidth = 1.5;
      c.beginPath(); c.moveTo(tx - 12, ty + th * 0.38); c.lineTo(tx + tw + 12, ty + th * 0.38); c.stroke();
      c.setLineDash([]);
      c.fillStyle = '#8892a0'; c.font = '10px monospace'; c.textAlign = 'right';
      c.fillText('SPEED →', tx + tw - 6, ty + th - 8);
      /* the safety knob */
      const ky = ty + th * (1 - mini.safety);
      c.fillStyle = mini.safety > 0.62 ? PAL.green : PAL.red;
      rr(c, tx + 4, ky - 11, tw - 8, 22, 6); c.fill();
      c.fillStyle = '#fff'; c.font = 'bold 10px monospace'; c.textAlign = 'center';
      c.fillText('SAFETY', tx + tw / 2, ky + 4);
      /* progress */
      c.fillStyle = PAL.gold; rr(c, b.px + 250, b.py + 100, 14 * (mini.held / 6), 220, 4); c.fill();
      c.fillStyle = '#5a4a38'; c.font = '12px monospace'; c.textAlign = 'left';
      c.fillText(Math.ceil(mini.held) + 's / 6s held', b.px + 250, b.py + 340);
      drawFigure(c, 'amodei', b.px + b.pw - 110, b.py + b.ph - 86, 1.3, { pose: 'stand' });
      c.fillStyle = '#5a4a38'; c.font = 'italic 13px Georgia, serif'; c.textAlign = 'center';
      c.fillText('“Actual ones.”', b.px + b.pw - 110, b.py + b.ph - 200);
    }
  },

  /* ---- GREG: pen on the line ---- */
  pen: {
    title: 'KEEP THE PEN ON THE LINE',
    how: 'Hold the mouse button and keep the nib inside the wobbling signature line.',
    time: 15,
    init() { mini.off = 0; mini.on = 0; mini.wob = 0; },
    tick(dt) {
      mini.t += dt; mini.elapsed += dt;
      if (mini.elapsed > mini.time) {
        finishMini(false, { drama:+1 }, 'The nib wandered. The line is technically a squiggle.');
        return;
      }
      mini.wob += dt;
      if (MDOWN && MXY) {
        const lane = miniRects['lane'];
        if (lane) {
          const yMid = lane.y + lane.h / 2 + Math.sin(mini.wob * 2.4) * 26;
          mini.off = Math.abs(MXY.y - yMid);
        }
      }
      if (MDOWN && mini.off < 18) mini.on += dt; else mini.on = Math.max(0, mini.on - dt * 0.7);
      if (mini.on > 8) finishMini(true, { optics:+1, drama:-1 }, 'The pen held the line. Greg exhales for the first time today.');
    },
    draw(c, t) {
      const b = drawMiniShell(c, W, H, t);
      const lx = b.px + 50, lw = b.pw - 100, ly = b.py + 200, lh = 90;
      miniRects['lane'] = { x: lx, y: ly, w: lw, h: lh };
      /* document */
      c.fillStyle = '#faf6ea'; rr(c, lx - 10, ly - 40, lw + 20, lh + 60, 4); c.fill();
      c.strokeStyle = '#d8cba0'; c.lineWidth = 1.5; rr(c, lx - 10, ly - 40, lw + 20, lh + 60, 4); c.stroke();
      /* wobbling signature line */
      const yMid = ly + lh / 2 + Math.sin(mini.wob * 2.4) * 26;
      c.strokeStyle = '#2a2f3a'; c.lineWidth = 2.5;
      c.beginPath(); c.moveTo(lx + 20, yMid); c.lineTo(lx + lw - 20, yMid); c.stroke();
      c.fillStyle = '#8a7a54'; c.font = 'italic 12px Georgia'; c.textAlign = 'left';
      c.fillText('Donald J. Trump — President of the Unites States', lx + 20, yMid - 18);
      /* the pen follows the mouse x, nib at mouse y */
      const px2 = MXY ? Math.max(lx + 20, Math.min(lx + lw - 20, MXY.x)) : lx + lw / 2;
      const py2 = MXY ? MXY.y : yMid;
      const onLine = MDOWN && mini.off < 18;
      c.strokeStyle = onLine ? '#1a1a2e' : '#4a4a5a'; c.lineWidth = 4; c.lineCap = 'round';
      c.beginPath(); c.moveTo(px2 + 16, py2 - 40); c.lineTo(px2, py2); c.stroke();
      c.fillStyle = PAL.gold;
      c.beginPath(); c.arc(px2, py2, 3.4, 0, 7); c.fill();
      /* progress */
      c.fillStyle = PAL.green; rr(c, lx, ly + lh + 34, lw * (mini.on / 8), 8, 4); c.fill();
      /* sam faceTiming in, goblin merch yelling */
      drawFaceTime(c, b.px + b.pw - 200, b.py + 70, 150, 100, t);
      c.fillStyle = '#5a4a38'; c.font = 'italic 13px Georgia, serif'; c.textAlign = 'center';
      c.fillText(mini.on > 4 ? '“…ignore the merch.”' : '“DOTS ARE HERE.”', b.px + b.pw - 125, b.py + 190);
    }
  }
};

/* micro-game rect registry, cleared each frame */
let miniRects = {};
