/* Generates shot-<name>.html pages that jump to specific game states via the
   test hooks, so headless screenshots can capture mid-game moments. */
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');

function boot(script) {
  const s = `
<div id="selftestOut" style="position:fixed;left:-9999px">PENDING</div>
<script>
window.onerror = function (m, s2, l) { document.getElementById('selftestOut').textContent = 'ERR:' + m + ' @' + l; };
var H = window.__GAME_TEST_HOOKS__;
function tick(n) { for (var i = 0; i < (n || 1); i++) H.tickLight(0.05); }
function clickId(id) {
  for (var pass = 0; pass < 2; pass++) {
    var r = window.__GAME_TEST_HOOKS__.rects();
    for (var i = 0; i < r.length; i++) {
      if (r[i].id === id && isFinite(r[i].x) && isFinite(r[i].y)) {
        var c = document.getElementById('stage');
        var rect = c.getBoundingClientRect();
        c.dispatchEvent(new PointerEvent('pointerdown', { clientX: rect.left + (r[i].x + r[i].w / 2) * rect.width / 1280, clientY: rect.top + (r[i].y + r[i].h / 2) * rect.height / 720, bubbles: true }));
        window.dispatchEvent(new PointerEvent('pointerup', { bubbles: true }));
        return true;
      }
    }
    GH_DRAW();
  }
  return false;
}
function GH_DRAW() { window.__GAME_TEST_HOOKS__.drawFrame(); }
${script}
</script>
`;
  return html.replace('</body>', s + '</body>');
}

const shots = {
  /* mid-game: Elon at the table, mid-walk, HUD + objective visible */
  room: `
    H.reset(20260929);
    H.startGame('musk');
    tick(24);
    GH_DRAW();
  `,
  /* mid-talk: dialogue panel open with typed line + reply buttons */
  talk: `
    H.reset(20260929);
    H.startGame('musk');
    tick(6);
    H.openTalk('huang');
    tick(14);
    GH_DRAW();
  `,
  /* micro-game: Jensen's sand conveyor */
  mini: `
    H.reset(20260929);
    H.startGame('musk');
    tick(4);
    H.openTalk('huang');
    tick(20);
    /* push through to the mini */
    var guard = 0;
    while (H.state().screen === 'talk' && guard++ < 40) {
      tick();
      var tk = H.state().talk;
      if (tk && tk.phase === 'replies') clickId('reply_0'); else clickId('ADVANCE');
      if (H.state().screen === 'talk' && tk && tk.phase === 'lines') tick();
    }
    /* advance lines via clicks anywhere */
    guard = 0;
    while (H.state().screen === 'talk' && guard++ < 20) { H.click(640, 690); tick(); }
    if (H.state().screen === 'talk') { H.click(640, 690); tick(); }
    GH_DRAW();
  `,
  /* the signing: you become Trump, document + typo */
  sign: `
    H.reset(20260929);
    H.startGame('pichai');
    ['zuck','pichai','brockman'].forEach(function (id) {
      H.openTalk(id);
      var g1 = 0;
      while (H.state().screen === 'talk' && g1++ < 40) { tick(); var tk = H.state().talk; if (tk && tk.phase === 'replies') clickId('reply_0'); }
      var g2 = 0;
      while (H.state().screen === 'mini' && g2++ < 200) { tick(); if (H.mini() && !H.mini().done) H.endMiniForce(true); }
      H.tickLight(0.05);
    });
    H.startSign();
    H.click(640, 360); tick(); H.click(640, 360); tick(); H.click(640, 360); tick(); H.click(640, 360); tick();
    GH_DRAW();
  `,
  /* end card: THE VIRAL TYPO (musk posts, sign anyway) */
  end: `
    H.reset(20260929);
    H.startGame('musk');
    ['huang','zuck','pichai'].forEach(function (id) {
      H.openTalk(id);
      var g1 = 0;
      while (H.state().screen === 'talk' && g1++ < 40) { tick(); var tk = H.state().talk; if (tk && tk.phase === 'replies') clickId('reply_0'); }
      var g2 = 0;
      while (H.state().screen === 'mini' && g2++ < 200) { tick(); if (H.mini() && !H.mini().done) H.endMiniForce(true); }
      H.tickLight(0.05);
    });
    H.startSign();
    for (var i = 0; i < 5; i++) { H.click(640, 360); tick(); }
    H.chooseSign('asis');
    H.pickMic('nobody');
    H.state().gaggleT = 100;
    tick(1);
    GH_DRAW();
  `
};

for (const name in shots) {
  fs.writeFileSync(path.join(__dirname, 'shot-' + name + '.html'), boot(shots[name]));
}
console.log('wrote', Object.keys(shots).length, 'shot pages:', Object.keys(shots).join(', '));
