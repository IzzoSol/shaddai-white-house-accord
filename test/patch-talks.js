/* The room is now proximity-based (worldClick); drive talks via the openTalk hook. */
const fs = require('fs');
const p = 'C:/Users/Brittany/super-intelligence-game/test/make-selftest.js';
let s = fs.readFileSync(p, 'utf8');

const old1 = "if (!clickId(seatMap[id])) { SELFTEST.fail.push('no rect for ' + id); writeOut(); } tick(2);\n    var opened = until(function () { return GH.state().screen === 'talk'; }, 60);";
const new1 = "GH.openTalk(id); tick(2);\n    var opened = until(function () { return GH.state().screen === 'talk'; }, 60);";
if (s.indexOf(old1) !== -1) { s = s.replace(old1, new1); console.log('run1 talks patched'); }
else console.log('run1 pattern not found');

const old2 = "if (!clickId(seat2[id])) { SELFTEST.fail.push('no rect for ' + id); writeOut(); } tick(2);\n    var opened2 = until(function () { return GH.state().screen === 'talk'; }, 60);";
const new2 = "GH.openTalk(id); tick(2);\n    var opened2 = until(function () { return GH.state().screen === 'talk'; }, 60);";
if (s.indexOf(old2) !== -1) { s = s.replace(old2, new2); console.log('run2 talks patched'); }
else console.log('run2 pattern not found');

fs.writeFileSync(p, s);
console.log('seatMap refs left: ' + (s.match(/\bseatMap\b/g) || []).length);
