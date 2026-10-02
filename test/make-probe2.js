/* Minimal probe #2: exercise the exact hooks the selftest uses (tickLight, rects, state). */
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');

const probe = `
<div id="selftestOut" style="position:fixed;left:-9999px">PENDING</div>
<script>
var OUT = document.getElementById('selftestOut');
OUT.textContent = 'ALIVE';
window.onerror = function (m) { OUT.textContent = 'ERR:' + m; };
setTimeout(function () {
  try {
    var GH = window.__GAME_TEST_HOOKS__;
    GH.reset(20260929);
    OUT.textContent += ' RESET-OK screen=' + GH.state().screen;
    GH.tickLight(0.05);
    OUT.textContent += ' TICK-OK';
    GH.tickLight(0.05);
    var r = GH.rects();
    OUT.textContent += ' RECTS=' + r.length;
    GH.drawFrame();
    OUT.textContent += ' DRAW-OK';
    GH.startGame('musk');
    GH.tickLight(0.05);
    OUT.textContent += ' GAME-OK screen=' + GH.state().screen;
  } catch (e) { OUT.textContent += ' CAUGHT:' + e.message; }
}, 300);
</script>
`;
fs.writeFileSync(path.join(__dirname, 'probe2.html'), html.replace('</body>', probe + '</body>'));
console.log('wrote probe2.html');
