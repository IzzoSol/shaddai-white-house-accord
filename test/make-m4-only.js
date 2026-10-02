/* m4-only page: does the m4 harness run in isolation (no game script)? */
const fs = require('fs');
const h = fs.readFileSync('C:/Users/Brittany/super-intelligence-game/src/harness-m4.js', 'utf8');
const page = '<!DOCTYPE html><html><head><meta charset="UTF-8"></head><body>' +
  '<div id="selftestOut" style="position:fixed;left:-9999px">PENDING</div>' +
  '<script>' + h + '</script></body></html>';
fs.writeFileSync('C:/Users/Brittany/super-intelligence-game/test/m4-only.html', page);
console.log('wrote m4-only.html');
