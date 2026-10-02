/* The finale: the press clock, the score, the leaderboard, and the post you send out afterwards. */
const ROUND_SECONDS = 360;
const BOARD_KEY = 'wh_board';
const POST_TONES = [
  { id: 'humble', label: 'HUMBLE' },
  { id: 'hype',   label: 'HYPE' },
  { id: 'meme',   label: 'MEME' }
];

function loadBoard() {
  try { const b = JSON.parse(localStorage.getItem(BOARD_KEY) || '[]'); return Array.isArray(b) ? b : []; } catch (e) { return []; }
}
function saveBoard(b) { try { localStorage.setItem(BOARD_KEY, JSON.stringify(b)); } catch (e) {} }

/* called once when a run ends, however it ends */
function finishRun() {
  if (G.scored) return;
  G.scored = true;
  if (G.screen !== 'end') { G.endingId = computeEndingId(G); G.screen = 'end'; }
  G.endTab = G.human ? 'aura' : 'story';
  G.boardRank = -1;
  if (!G.human) return;
  const R = auraReport();
  const me = CAST.find((k) => k.id === G.playerId);
  const entry = { n: me ? me.name : G.playerId, s: R.score, r: R.rank, e: ENDINGS[G.endingId].title, d: Date.now() };
  const board = loadBoard();
  board.push(entry);
  board.sort((a, b) => b.s - a.s || a.d - b.d);
  const top = board.slice(0, 10);
  G.boardRank = top.indexOf(entry);
  saveBoard(top);
  G.share = null;
}

function currentPost() {
  if (!G.share) G.share = shareCard(G);
  const R = auraReport(), tone = POST_TONES[G.postPick].id;
  const me = CAST.find((k) => k.id === G.playerId), who = me ? me.name : 'a CEO';
  const e = ENDINGS[G.endingId];
  let txt;
  if (tone === 'humble') txt = 'Survived the White House AI Accord lunch as ' + who + '. Aura rank ' + R.rank + ' (' + R.title.toLowerCase() + '). Ending: ' + e.title + '.';
  else if (tone === 'hype') txt = R.rank + '-rank aura. ' + R.score + ' points. "' + e.title + '." The Accord is signed and I was in the room. Beat that.';
  else txt = G.share.txt + ' #AccordLunch';
  return { who: tone === 'meme' ? G.share.who : '@you', txt: txt, likes: G.share.likes };
}
function openXPost() {
  const p = currentPost();
  let link = '';
  try { if (/^https?:/.test(location.href)) link = location.href.split('#')[0]; } catch (e) {}
  const url = 'https://twitter.com/intent/tweet?text=' + encodeURIComponent(p.txt) + (link ? '&url=' + encodeURIComponent(link) : '');
  try { window.open(url, '_blank', 'noopener'); } catch (e) {}
  sfx('good');
}
function copyXPost() {
  const p = currentPost();
  try { navigator.clipboard.writeText(p.txt); G.copied = true; setTimeout(() => { G.copied = false; }, 1800); } catch (e) {}
  sfx('ui');
}

function drawBoard(c, rx, rw) {
  const board = loadBoard();
  c.fillStyle = PAL.gold2; c.font = '600 22px Georgia, serif'; c.textAlign = 'left';
  c.fillText('LEADERBOARD', rx, 142);
  c.fillStyle = 'rgba(245,239,221,0.55)'; c.font = '13px Georgia, serif';
  c.fillText('Best runs on this device', rx + 215, 142);
  if (!board.length) { c.fillStyle = PAL.cream; c.font = '16px Georgia, serif'; c.fillText('No finished runs yet.', rx, 190); return; }
  board.forEach((b, i) => {
    const y = 176 + i * 40, me = i === G.boardRank;
    c.fillStyle = me ? 'rgba(201,162,39,0.22)' : 'rgba(245,239,221,0.05)'; rr(c, rx, y, rw, 34, 8); c.fill();
    if (me) { c.strokeStyle = PAL.gold; c.lineWidth = 1.5; rr(c, rx, y, rw, 34, 8); c.stroke(); }
    c.textBaseline = 'middle';
    c.fillStyle = i < 3 ? PAL.gold2 : 'rgba(245,239,221,0.6)'; c.font = 'bold 16px Georgia, serif'; c.textAlign = 'left'; c.fillText('#' + (i + 1), rx + 14, y + 18);
    c.fillStyle = PAL.cream; c.font = 'bold 15px Georgia, serif'; c.fillText(b.n, rx + 66, y + 18);
    c.fillStyle = 'rgba(245,239,221,0.6)'; c.font = '13px Georgia, serif'; c.fillText(b.e, rx + 250, y + 18);
    c.fillStyle = PAL.gold2; c.font = 'bold 15px Georgia, serif'; c.textAlign = 'right'; c.fillText(b.s + ' pts', rx + rw - 62, y + 18);
    c.fillStyle = { S: '#7ef0a8', A: '#c9e86a', B: PAL.gold2, C: '#f0b070', D: '#ff9a90' }[b.r] || PAL.cream; c.fillText(b.r, rx + rw - 18, y + 18);
    c.textBaseline = 'alphabetic';
  });
  if (G.boardRank >= 0) { c.fillStyle = PAL.gold2; c.font = 'italic 14px Georgia, serif'; c.textAlign = 'left'; c.fillText('You placed #' + (G.boardRank + 1) + '.', rx, 590); }
}
