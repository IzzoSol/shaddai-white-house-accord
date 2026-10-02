'use strict';
/* node agents/tournament.js [--seeds 100]
   Every profile plays the same seeds; prints which endings each one tends to produce. */
const { playRun, loadProfiles } = require('./runner');

const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i > -1 ? Number(process.argv[i + 1]) : d; };
const seeds = arg('seeds', 100);
const profiles = loadProfiles();

const table = {};
const endings = new Set();
for (const p of profiles) {
  const row = { runs: 0, counts: {}, seats: {} };
  for (let seed = 1; seed <= seeds; seed++) {
    const r = playRun({ profile: p, seed });
    row.runs++; row.counts[r.endingId] = (row.counts[r.endingId] || 0) + 1; row.seats[r.seat] = (row.seats[r.seat] || 0) + 1;
    endings.add(r.endingId);
  }
  table[p.id] = row;
}
const cols = [...endings].sort();
const pad = (s, n) => String(s).padEnd(n);
console.log(pad('profile', 12) + cols.map((c) => pad(c, 13)).join('') + 'favourite seat');
for (const p of profiles) {
  const row = table[p.id];
  const fav = Object.entries(row.seats).sort((a, b) => b[1] - a[1])[0];
  console.log(pad(p.id, 12) + cols.map((c) => pad(Math.round(100 * (row.counts[c] || 0) / row.runs) + '%', 13)).join('') + fav[0] + ' (' + Math.round(100 * fav[1] / row.runs) + '%)');
}
