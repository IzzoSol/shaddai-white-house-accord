/* ==================== agent.js — the game's agent interface ====================
   Lets any controller — a scripted bot, a model-driven agent, a test — play a run through the SAME
   functions the UI uses. Nothing here bypasses the rules: act() calls startGame / openTalk /
   chooseReply / chooseSign / pickMic and lets update() settle the state, exactly like a click would.

   window.__AGENT_API__ = { observe(), legalActions(), act(action), MINI_OUTCOMES }

   Information rule: observe() never returns the hidden ledger. Each option does carry the effects it
   declares in the game data; how well a controller *uses* that information is its own skill. */

/* What a micro-game awards. Kept beside the game so a controller can resolve a micro-game without
   playing it. test/agents.test.js checks every literal below still appears in mini.js. */
const MINI_OUTCOMES = {
  phone:   { ok: { residue: { meme: +2, optics: +1 },     flags: [] },
             fail: { residue: { meme: +1, drama: +1 },    flags: [] } },
  sand:    { ok: { residue: { optics: +1, substance: +1 }, flags: [] },
             fail: { residue: { optics: -1 },             flags: [] } },
  caption: { ok: { residue: { optics: +1 },               flags: [] },
             fail: { residue: { drama: +1 },              flags: ['zuckCaption'] } },
  stamp:   { ok: { residue: { substance: +2, optics: +1 }, flags: [] },
             fail: { residue: { optics: -1 },             flags: [] } },
  slider:  { ok: { residue: { substance: +3, rapport: -2 }, flags: [] },
             fail: { residue: { substance: +1 },          flags: [] } },
  pen:     { ok: { residue: { optics: +1, drama: -1 },    flags: [] },
             fail: { residue: { drama: +1 },              flags: [] } }
};

function agentTalkTargets() {
  return Object.keys(TALKS).filter(function (id) {
    if (id === G.playerId) return false;
    if (id === 'tombrown') return !G.tomDone;
    return G.talksDone.length < 3 && G.talksDone.indexOf(id) === -1;   /* three conversations is the rule */
  });
}

function agentLegalActions() {
  const s = G.screen;
  if (s === 'title' || s === 'how' || s === 'cast') {
    return CAST.filter(function (k) { return k.starter || (k.locked && UNLOCKED.trump); })
      .map(function (k) { return { type: 'pick-seat', id: k.id, label: k.name }; });
  }
  if (s === 'room') {
    const out = agentTalkTargets().map(function (id) {
      return { type: 'talk', id: id, label: id, mini: TALKS[id].mini, counts: id !== 'tombrown' };
    });
    if (G.talksDone.length >= 3) out.push({ type: 'sign', label: 'Walk to the President’s desk' });
    return out;
  }
  if (s === 'talk' && G.talk) {
    return G.talk.replies.map(function (r, i) {
      return { type: 'reply', index: i, label: r.t, effects: Object.assign({ rapport: r.r || 0 }, r.residue || {}), flag: r.flag || null };
    });
  }
  if (s === 'mini' && mini && !mini.done) {
    return [{ type: 'mini-result', success: true, mini: mini.id }, { type: 'mini-result', success: false, mini: mini.id }];
  }
  if (s === 'sign') {
    if (G.signPhase === 'lines') return [{ type: 'sign-advance' }];
    if (G.signPhase === 'choices') return SIGN_CHOICES.map(function (c) { return { type: 'sign-choice', id: c.id, label: c.t }; });
    if (G.signPhase === 'mic') {
      return G.talksDone.slice(0, 3).map(function (id) { return { type: 'mic', id: id }; }).concat([{ type: 'mic', id: 'nobody' }]);
    }
  }
  if (s === 'gaggle') return [{ type: 'continue' }];
  return [];
}

function agentObserve() {
  return {
    screen: G.screen,
    playerId: G.playerId,
    talksDone: G.talksDone.slice(),
    talksLeft: Math.max(0, 3 - G.talksDone.length),
    toast: G.toast ? G.toast.t : null,
    typoChoice: G.typoChoice,
    endingId: G.screen === 'end' ? G.endingId : null,
    actions: agentLegalActions()
  };
}

function agentSame(a, b) {
  if (a.type !== b.type) return false;
  if ('id' in b && a.id !== b.id) return false;
  if ('index' in b && a.index !== b.index) return false;
  if ('success' in b && a.success !== b.success) return false;
  return true;
}

function agentAct(action) {
  if (!action || !agentLegalActions().some(function (l) { return agentSame(l, action); })) {
    throw new Error('illegal action on screen "' + G.screen + '": ' + JSON.stringify(action));
  }
  switch (action.type) {
    case 'pick-seat':
      startGame(action.id);
      break;
    case 'talk': {
      openTalk(action.id);
      const tk = G.talk;                       /* skip the typewriter: the lines are read */
      tk.lineIdx = tk.lines.length - 1; tk.typeT = 999; tk.phase = 'replies';
      break;
    }
    case 'reply':
      chooseReply(action.index);
      break;
    case 'mini-result': {
      const out = MINI_OUTCOMES[mini.id][action.success ? 'ok' : 'fail'];
      for (let i = 0; i < out.flags.length; i++) G.flags[out.flags[i]] = true;
      finishMini(action.success, Object.assign({}, out.residue), '');
      update(0.016);                           /* the loop applies the residue and closes the talk */
      break;
    }
    case 'sign':
      startSign();
      break;
    case 'sign-advance':
      G.signLine = SIGN_LINES.length - 1; G.signPhase = 'choices';
      break;
    case 'sign-choice':
      chooseSign(action.id);
      break;
    case 'mic':
      pickMic(action.id);
      break;
    case 'continue':
      G.gaggleT = 1e6; update(0.016);
      break;
  }
  return agentObserve();
}

window.__AGENT_API__ = { observe: agentObserve, legalActions: agentLegalActions, act: agentAct, MINI_OUTCOMES: MINI_OUTCOMES };
