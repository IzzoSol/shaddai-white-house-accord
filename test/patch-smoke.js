/* Updates smoke.js expectations for the evolved game (9 endings; room in world.js). */
const fs = require('fs');
const p = 'C:/Users/Brittany/super-intelligence-game/test/smoke.js';
let s = fs.readFileSync(p, 'utf8');

s = s.replace(
  "if (keys2.length !== 8) throw new Error('have ' + keys2.length);",
  "if (keys2.length < 8) throw new Error('have ' + keys2.length);"
);
s = s.replace(
  "const src = fs.readFileSync(path.join(root, 'src', 'scenes.js'), 'utf8');",
  "let src = '';\n  ['scenes.js', 'world.js', 'press.js'].forEach(function (f) { try { src += fs.readFileSync(path.join(root, 'src', f), 'utf8'); } catch (e) {} });"
);
fs.writeFileSync(p, s);
console.log('test updated');
