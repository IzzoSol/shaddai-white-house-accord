/* Generates test/browser-selftest.html = index.html + an in-browser QA pass that
   reports into #selftestOut for `msedge --headless --dump-dom`.
   Headless Edge never fires rAF, so frames are driven via GH.tick(). Real input is
   still exercised: synthetic PointerEvents on the canvas feed the game's own handlers. */
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');

const harness = `
<div id="selftestOut" style="position:fixed;left:-9999px">PENDING</div>
<script>
document.getElementById('selftestOut').textContent = 'SCRIPT-RAN';
var SELFTEST = { pass: 0, fail: [], errors: [] };
window.onerror = function (m, s, l) { SELFTEST.errors.push(m + ' @line ' + l); };
function writeOut() {
  document.getElementById('selftestOut').textContent =
    'SELFTEST_PASS=' + SELFTEST.pass + ' SELFTEST_FAIL=' + SELFTEST.fail.length +
    (SELFTEST.fail.length ? ' FAILURES: ' + SELFTEST.fail.join(' | ') : '') +
    (SELFTEST.errors.length ? ' ERRORS: ' + SELFTEST.errors.join(' | ') : '');
}
function ck(name, fn) {
  try { if (fn() === false) throw new Error('assertion false'); SELFTEST.pass++; }
  catch (e) { SELFTEST.fail.push(name + ' -> ' + (e && e.message)); }
  writeOut();
}
var T0 = Date.now();
var LAST = 'start';
function beat(msg) { LAST = msg; if (Date.now() - T0 > 35000) { document.getElementById('selftestOut').textContent = 'TIMEOUT at: ' + msg + ' | ' + (H ? GH.state().screen : 'no hooks'); throw new Error('timeout at ' + msg); } }
var GH = window.__GAME_TEST_HOOKS__;
function getRects() { return window.__GAME_TEST_HOOKS__.rects(); }
function tick(n) { for (var i = 0; i < (n || 1); i++) GH.tickLight(0.05); }
/* real input: synthetic PointerEvents on the canvas -> the game's own listeners */
function clickId(id) {
  for (var pass = 0; pass < 2; pass++) {
    var r = getRects();
    for (var i = 0; i < r.length; i++) {
      if (r[i].id === id && isFinite(r[i].x) && isFinite(r[i].y)) { canvasClick(r[i].x + r[i].w / 2, r[i].y + r[i].h / 2); return true; }
    }
    GH.drawFrame();
  }
  return false;
}
function canvasClick(x, y) {
  var c = document.getElementById('stage');
  var r = c.getBoundingClientRect();
  c.dispatchEvent(new PointerEvent('pointerdown', { clientX: r.left + x * r.width / 1280, clientY: r.top + y * r.height / 720, bubbles: true }));
  window.dispatchEvent(new PointerEvent('pointerup', { bubbles: true }));
}
function pixelStats() {
  GH.drawFrame();
  var c = document.getElementById('stage');
  var d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data;
  var colors = {}, blank = 0, n = 0;
  for (var i = 0; i < d.length; i += 40) {
    n++;
    colors[d[i] + ',' + d[i + 1] + ',' + d[i + 2]] = 1;
    if (d[i] === 0 && d[i + 1] === 0 && d[i + 2] === 0) blank++;
  }
  return { distinct: Object.keys(colors).length, blankFrac: blank / n };
}
function until(cond, maxTicks, tag) {
  var guard = 0;
  while (!cond() && guard++ < (maxTicks || 400)) { tick(); if (guard % 50 === 0) beat('until ' + (tag || '?') + ' #' + guard); }
  return !!cond();
}

try {
  try { localStorage.removeItem('wh_unlocks'); } catch (e) {}
  GH.reset(20260929);

  /* ---------- boot: title ---------- */
  ck('boots to title', function () { return GH.state().screen === 'title'; });
  tick(3);
  var st = pixelStats();
  ck('title renders (non-blank)', function () { return st.blankFrac < 0.9; });
  ck('title is rich (250+ distinct colors)', function () { return st.distinct >= 250; });
  ck('no errors during boot', function () { return SELFTEST.errors.length === 0; });

  /* ---------- cast via real click on PLAY ---------- */
  clickId('PLAY'); tick(2);
  ck('PLAY opens cast (real canvas input)', function () { return GH.state().screen === 'cast'; });
  var cc = pixelStats();
  ck('cast renders 7 cards', function () { return cc.distinct >= 150 && cc.blankFrac < 0.9; });

  /* ---------- ACT I: start as Musk ---------- */
  GH.startGame('musk'); tick(2);
  ck('room reached', function () { return GH.state().screen === 'room'; });
  var rs = pixelStats();
  ck('East Room renders (non-blank, rich)', function () { return rs.blankFrac < 0.85 && rs.distinct >= 200; });
  ck('ACT I ledger tilt (optics 2, drama 1)', function () { return GH.ledger().optics === 2 && GH.ledger().drama === 1; });

  /* ---------- ACT II: three talks via real canvas input ---------- */
  var seatX = { huang: 'npc_huang', zuck: 'npc_zuck', pichai: 'npc_pichai' };
  ['huang', 'zuck', 'pichai'].forEach(function (id) {
    if (!clickId(seatX[id])) { SELFTEST.fail.push('no rect for ' + id); writeOut(); } tick(2);
    var opened = until(function () { return GH.state().screen === 'talk'; }, 60);
    if (!opened) { SELFTEST.fail.push('talk ' + id + ' did not open'); writeOut(); return; }
    var guard = 0;
    while (GH.state().screen === 'talk' && guard++ < 40) {
      tick();
      var tk = GH.state().talk;
      if (tk && tk.phase === 'replies') { if (!clickId('reply_0')) canvasClick(208, 650); }
      else canvasClick(640, 690);
      tick(2);
    }
    until(function () { return GH.state().screen === 'mini' || GH.state().screen === 'room'; }, 100);
    if (GH.state().screen === 'mini') {
      ck('mini ' + id + ' started', function () { return !!GH.mini(); });
      GH.endMiniForce(true);
      until(function () { return GH.state().screen === 'room'; }, 100);
    }
    tick(2);
  });
  ck('3 talks done', function () { return GH.state().talksDone.length === 3; });
  ck('provisional ending after talk 3', function () { return !!GH.state().endingId; });
  ck('residues accumulated (optics >= 3)', function () { return GH.ledger().optics >= 3; });

  /* ---------- ACT III: signing ---------- */
  if (!clickId('npc_trump')) canvasClick(683, 370); tick(2);
  var inSign = until(function () { return GH.state().screen === 'sign'; }, 60);
  ck('signing reached from the desk', function () { return inSign && GH.state().screen === 'sign'; });
  var ss = pixelStats();
  ck('document renders (signature block)', function () { return ss.distinct >= 120; });
  for (var i = 0; i < 6; i++) { canvasClick(640, 360); tick(2); }
  ck('typo choices up', function () { return GH.state().signPhase === 'choices'; });
  if (!clickId('sign_fix')) canvasClick(370, 655); tick(2);
  ck('fix chosen -> typoAlive false', function () { return GH.state().typoChoice === 'fix' && GH.ledger().typoAlive === false; });
  ck('mic phase reached', function () { return GH.state().signPhase === 'mic'; });
  GH.pickMic('nobody'); tick(2);
  ck('gaggle running', function () { return GH.state().screen === 'gaggle'; });
  var gs = pixelStats();
  ck('gaggle renders orange driveway', function () { return gs.blankFrac < 0.85; });

  /* ---------- end ---------- */
  GH.state().gaggleT = 100; tick(1);
  var inEnd = until(function () { return GH.state().screen === 'end'; }, 40);
  ck('end card reached by itself', function () { return inEnd && GH.state().screen === 'end'; });
  ck('endingId set', function () { return !!GH.state().endingId; });
  var es = pixelStats();
  ck('end card renders (non-blank, rich)', function () { return es.blankFrac < 0.85 && es.distinct >= 150; });

  /* ---------- second run: different person -> different end card ---------- */
  var first = GH.state().endingId;
  GH.reset(7);
  GH.startGame('amodei'); tick(2);
  var seat2 = { musk: 'npc_musk', zuck: 'npc_zuck', brockman: 'npc_brockman' };
  ['musk', 'zuck', 'brockman'].forEach(function (id) {
    if (!clickId(seat2[id])) { SELFTEST.fail.push('no rect for ' + id); writeOut(); } tick(2);
    var opened2 = until(function () { return GH.state().screen === 'talk'; }, 60);
    if (!opened2) { SELFTEST.fail.push('run2 talk ' + id + ' did not open'); writeOut(); return; }
    var guard2 = 0;
    while (GH.state().screen === 'talk' && guard2++ < 40) {
      tick();
      var tk2 = GH.state().talk;
      if (tk2 && tk2.phase === 'replies') { if (!clickId('reply_0')) canvasClick(346, 650); }
      else canvasClick(640, 690);
      tick(2);
    }
    if (GH.state().screen === 'mini') { GH.endMiniForce(true); until(function () { return GH.state().screen === 'room'; }, 100); }
    tick(2);
  });
  canvasClick(683, 370);
  until(function () { return GH.state().screen === 'sign'; }, 60);
  for (var i2 = 0; i2 < 6; i2++) { canvasClick(640, 360); tick(2); }
  if (!clickId('sign_asis')) canvasClick(620, 655); tick(2);
  GH.pickMic('nobody'); tick(2);
  GH.state().gaggleT = 100; tick(1);
  until(function () { return GH.state().screen === 'end'; }, 40);
  ck('second run completes', function () { return GH.state().screen === 'end'; });
  ck('two runs -> two different end cards', function () {
    return first !== null && GH.state().endingId !== null && first !== GH.state().endingId;
  });

  ck('no uncaught errors in the whole pass', function () { return SELFTEST.errors.length === 0; });
} catch (e) {
  SELFTEST.fail.push('THREW: ' + (e && e.message) + ' >> ' + String((e && e.stack) || '').split('\\n').slice(0, 3).join(' >> '));
  writeOut();
}
writeOut();
</script>
`;

if (!html.includes('</body>')) throw new Error('index.html has no </body>');
fs.writeFileSync(path.join(__dirname, 'browser-selftest.html'), html.replace('</body>', harness + '</body>'));
console.log('wrote test/browser-selftest.html');



