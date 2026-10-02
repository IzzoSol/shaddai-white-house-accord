/* Inspect the generated selftest page structure. */
const fs = require('fs');
const html = fs.readFileSync('C:/Users/Brittany/super-intelligence-game/test/browser-selftest.html', 'utf8');
const i = html.indexOf('<div id="selftestOut"');
console.log('div at char', i, 'of', html.length);
console.log('--- harness head ---');
console.log(html.slice(i, i + 760).split('\n').join(' | '));
