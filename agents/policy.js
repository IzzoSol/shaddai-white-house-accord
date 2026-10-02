'use strict';
/* Planner: how a profile chooses. Skills shape the search, not a script —
 *   foresight  how many decisions ahead it plans (0 = only the next one)
 *   insight    how accurately it reads what each option does (low = noisy valuations)
 *   dexterity  chance of landing a micro-game
 * goals.endings  what it wants the story to become;  goals.ledger  what it likes as it goes. */
const M = require('./model');

const DIFFICULTY = { phone: 0.05, sand: 0.0, caption: 0.10, stamp: 0.05, slider: 0.10, pen: 0.12 };

function miniChance(profile, miniId) {
  return Math.max(0.05, Math.min(0.97, 0.30 + 0.65 * profile.skills.dexterity - (DIFFICULTY[miniId] || 0)));
}

/** How much a profile likes a state. Ending preference dominates; ledger taste shapes the path. */
function utility(profile, data, s) {
  const e = M.endingOf(data, s);
  const end = (profile.goals.endings[e] || 0);
  let shaping = 0;
  for (const k in profile.goals.ledger) shaping += (profile.goals.ledger[k] || 0) * (typeof s.ledger[k] === 'number' ? s.ledger[k] : 0);
  if (s.ledger.typoAlive && profile.goals.ledger.typoAlive) shaping += profile.goals.ledger.typoAlive;
  return end + 0.15 * shaping;
}

/* Many move orders reach the same state, so values are cached per profile. */
const MEMO = new WeakMap();
/* The most decision plies the game can still have from this state. Searching deeper than this changes nothing,
   so depth is clamped to it and equal positions share one cache entry. */
function pliesLeft(s) {
  if (s.phase === 'done') return 0;
  const talksToGo = Math.max(0, 3 - s.talksDone.length);
  const base = (s.phase === 'mic' ? 1 : s.phase === 'sign' ? 2 : 3 + 2 * talksToGo + (s.tomDone ? 0 : 2));
  return base + (s.phase === 'reply' ? 1 : 0) + (s.phase === 'mini' ? 0 : 0);
}

function keyOf(s, depth) {
  const L = s.ledger, f = Object.keys(s.flags).sort().join(',');
  return depth + '|' + s.phase + '|' + (s.talk || '') + '|' + (s.miniId || '') + '|' + s.tomDone + '|' + s.talksDone.slice().sort().join(',') + '|' +
    L.rapport + ',' + L.optics + ',' + L.substance + ',' + L.drama + ',' + L.meme + ',' + L.typoAlive + ',' + L.sam + ',' + L.mic + '|' + f + '|' + s.seat;
}

/** Expected utility with `depth` more decisions of lookahead; cut-off states are scored by the heuristic. */
function value(profile, data, s, depth) {
  depth = Math.min(depth, pliesLeft(s));
  let memo = MEMO.get(profile);
  if (!memo || memo.size > 900000) { memo = new Map(); MEMO.set(profile, memo); }   // bounded: never grows without limit
  const key = keyOf(s, depth), hit = memo.get(key);
  if (hit !== undefined) return hit;
  let v;
  if (s.phase === 'done') v = utility(profile, data, s);
  else if (s.phase === 'mini') {
    const p = miniChance(profile, s.miniId);
    v = p * value(profile, data, M.applyMini(data, s, true), depth) + (1 - p) * value(profile, data, M.applyMini(data, s, false), depth);
  } else if (depth <= 0) v = utility(profile, data, s);
  else {
    let best = -Infinity;
    for (const mv of M.moves(data, s)) best = Math.max(best, value(profile, data, M.apply(data, s, mv), depth - 1));
    v = best === -Infinity ? utility(profile, data, s) : best;
  }
  memo.set(key, v);
  return v;
}

function depthFor(profile) { return Math.round(1 + profile.skills.foresight * 9); }

/** Deterministic noise in [-1,1] from the agent's rng. */
function jitter(rng) { return rng() * 2 - 1; }

/** Pick a move from a state. Insight blurs each option's value; foresight sets how far it sees. */
function choose(profile, data, s, rng, extraBonus) {
  const options = M.moves(data, s);
  if (!options.length) throw new Error('no moves in phase ' + s.phase);
  const depth = depthFor(profile), blur = (1 - profile.skills.insight) * 3;
  let bestMove = null, bestScore = -Infinity;
  for (const mv of options) {
    const v = value(profile, data, M.apply(data, s, mv), depth - 1) + blur * jitter(rng) + ((extraBonus && extraBonus(mv)) || 0);
    if (v > bestScore) { bestScore = v; bestMove = mv; }
  }
  return bestMove;
}

/** Which seat to start in: plan from each opening, keep the best (plus a taste for a favourite). */
function chooseSeat(profile, data, seats, rng) {
  const depth = depthFor(profile), blur = (1 - profile.skills.insight) * 3;
  let best = null, bestScore = -Infinity;
  for (const seat of seats) {
    const v = value(profile, data, M.initialState(data, seat), depth) + blur * jitter(rng) + (profile.quirks && profile.quirks.favoriteSeat === seat ? 0.75 : 0);
    if (v > bestScore) { bestScore = v; best = seat; }
  }
  return best;
}

module.exports = { choose, chooseSeat, miniChance, utility, value, depthFor };
