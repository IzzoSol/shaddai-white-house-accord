'use strict';
/* A pure, fast model of one run, built from the game's OWN data tables (TALKS, STARTS, SIGN_CHOICES,
   MINI_OUTCOMES) and its OWN ending function. Planners search this model; the runner then plays the
   chosen moves in the real game, and tests check the model and the real game never drift apart. */

const clamp = (x, lo, hi) => Math.max(lo, Math.min(hi, x));

function initialState(data, seat) {
  const ledger = { rapport: 50, optics: 0, substance: 0, drama: 0, meme: 0, typoAlive: true, sam: false, mic: 'trump' };
  const start = data.STARTS[seat];
  if (start) for (const k in start.ledger) ledger[k] += start.ledger[k];
  return { seat, phase: 'room', ledger, flags: {}, talksDone: [], tomDone: false, talk: null, miniId: null, typoChoice: null };
}

function copy(s) { return Object.assign({}, s, { ledger: Object.assign({}, s.ledger), flags: Object.assign({}, s.flags), talksDone: s.talksDone.slice() }); }

/** Legal model moves from a state. A 'mini' phase is a chance node, handled by the caller. */
function moves(data, s) {
  if (s.phase === 'room') {
    const out = [];
    for (const id of Object.keys(data.TALKS)) {
      if (id === s.seat) continue;
      if (id === 'tombrown' ? s.tomDone : (s.talksDone.length >= 3 || s.talksDone.indexOf(id) !== -1)) continue;
      out.push({ type: 'talk', id });
    }
    if (s.talksDone.length >= 3) out.push({ type: 'sign' });
    return out;
  }
  if (s.phase === 'reply') return data.TALKS[s.talk].replies.map((r, i) => ({ type: 'reply', index: i }));
  if (s.phase === 'sign') return data.SIGN_CHOICES.map((c) => ({ type: 'sign-choice', id: c.id }));
  if (s.phase === 'mic') return s.talksDone.slice(0, 3).map((id) => ({ type: 'mic', id })).concat([{ type: 'mic', id: 'nobody' }]);
  return [];
}

function endTalk(s) {
  if (s.talk === 'tombrown') s.tomDone = true;
  else if (s.talksDone.indexOf(s.talk) === -1) s.talksDone.push(s.talk);
  s.talk = null; s.miniId = null; s.phase = 'room';
}

/** Apply one move (never mutates the input). For a mini-game pass its result with applyMini. */
function apply(data, state, move) {
  const s = copy(state);
  switch (move.type) {
    case 'talk':
      s.talk = move.id; s.phase = 'reply';
      break;
    case 'reply': {
      const rep = data.TALKS[s.talk].replies[move.index];
      s.ledger.rapport = clamp(s.ledger.rapport + (rep.r || 0), 0, 100);
      if (rep.r >= 6) s.flags.flattered = true;
      if (rep.residue) for (const k in rep.residue) s.ledger[k] += rep.residue[k];
      if (rep.flag) s.flags[rep.flag] = true;
      const mini = data.TALKS[s.talk].mini;
      if (mini) { s.phase = 'mini'; s.miniId = mini; } else endTalk(s);
      break;
    }
    case 'sign':
      s.phase = 'sign'; s.flags.tomIgnored = !s.flags.tomSeen;
      break;
    case 'sign-choice':
      s.typoChoice = move.id; if (move.id === 'fix') s.ledger.typoAlive = false; s.phase = 'mic';
      break;
    case 'mic':
      s.ledger.mic = move.id === 'nobody' ? 'trump' : move.id; s.phase = 'done';
      break;
    default: throw new Error('unknown move ' + move.type);
  }
  return s;
}

function applyMini(data, state, success) {
  const s = copy(state);
  const out = data.MINI_OUTCOMES[s.miniId][success ? 'ok' : 'fail'];
  for (const f of out.flags) s.flags[f] = true;
  for (const k in out.residue) s.ledger[k] += out.residue[k];
  endTalk(s);
  return s;
}

/** The ending this state would produce right now (the real game function). */
function endingOf(data, s) { return data.computeEndingId({ ledger: s.ledger, flags: s.flags, playerId: s.seat }); }

module.exports = { initialState, moves, apply, applyMini, endingOf, copy };
