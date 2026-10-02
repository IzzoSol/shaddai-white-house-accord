/* Bisect the selftest harness: generate truncated versions to find where it stops running. */
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');

const full = fs.readFileSync(path.join(__dirname, 'browser-selftest.html'), 'utf8');
const blocks = full.match(/<script>[\s\S]*?<\/script>/g) || [];
const harness = blocks[blocks.length - 1].replace(/^<script>/, '').replace(/<\/script>$/, '');

/* split the try block at section markers */
const markers = [];
const re = /\/\* -+ ([\w: ]+) -+ \*\//g;
let m;
while ((m = re.exec(harness))) markers.push({ name: m[1], idx: m.index });

function version(upto) {
  let cut = harness.length;
  if (upto < markers.length) cut = markers[upto].idx;
  const body = harness.slice(0, cut) + '\nwriteOut();\n} catch (e) { SELFTEST.fail.push("THREW:" + e.message); writeOut(); }\nwriteOut();\n';
  return html.replace('</body>', '\n<div id="selftestOut" style="position:fixed;left:-9999px">PENDING</div>\n<script>' + body + '</script>\n</body>');
}

/* version 0: everything up to the first marker (boot checks only) */
fs.writeFileSync(path.join(__dirname, 'bs-half.html'), version(3));
fs.writeFileSync(path.join(__dirname, 'bs-m4.html'), version(4));
fs.writeFileSync(path.join(__dirname, 'bs-m5.html'), version(5));
console.log('markers:', markers.map((x, i) => i + ':' + x.name).join('  '));
console.log('wrote bs-half.html (to marker 3), bs-m4.html (to 4), bs-m5.html (to 5)');
