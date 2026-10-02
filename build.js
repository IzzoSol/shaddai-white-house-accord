/* build.js — assembles the single-file game at index.html from src/ parts. */
const fs = require('fs');
const path = require('path');

const root = __dirname;
const parts = ['data.js', 'art.js', 'mini.js', 'scenes.js', 'main.js', 'agent.js'];

const shell = fs.readFileSync(path.join(root, 'src', 'shell.html'), 'utf8');
let js = '';
for (const p of parts) {
  js += '\n/* ==================== ' + p + ' ==================== */\n';
  js += fs.readFileSync(path.join(root, 'src', p), 'utf8');
}

const marker = '/*GAME*/';
if (!shell.includes(marker)) throw new Error('src/shell.html is missing the /*GAME*/ marker');
const out = shell.replace(marker, () => js);

fs.writeFileSync(path.join(root, 'index.html'), out, 'utf8');
const kb = (Buffer.byteLength(out, 'utf8') / 1024).toFixed(1);
console.log('built index.html  ' + kb + ' KB  (' + out.split('\n').length + ' lines)');
