'use strict';
/* Plays one full run of the real game, move by move, through the public agent API. */
const fs = require('fs');
const path = require('path');
const { createGame } = require('./harness');
const M = require('./model');
const P = require('./policy');

function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function hashStr(s) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }

function loadProfiles(dir = path.join(__dirname, 'profiles')) {
  return fs.readdirSync(dir).filter((f) => f.endsWith('.json')).sort().map((f) => JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8')));
}

/** The model and the real game must agree after every move. Throws a readable error if they ever don't. */
function checkSync(game, model) {
  const G = game.state(), L = G.ledger, ml = model.ledger;
  for (const k of Object.keys(ml)) {
    if (L[k] !== ml[k]) throw new Error(`model drift: ledger.${k} game=${L[k]} model=${ml[k]} (talks ${G.talksDone})`);
  }
  for (const k of Object.keys(model.flags)) {
    if (model.flags[k] !== G.flags[k]) throw new Error(`model drift: flag ${k} game=${G.flags[k]} model=${model.flags[k]}`);
  }
  if (model.talksDone.join() !== G.talksDone.join()) throw new Error(`model drift: talksDone game=${G.talksDone} model=${model.talksDone}`);
}

/**
 * profile: an agent profile (see agents/profiles). seed: fixes the game RNG and the agent's own luck.
 * verify: check the model against the real game after every move.
 * controller(profile, obs, model, rng): optional override that returns a legal action — used by model-driven (LLM) agents.
 */
function playRun({ profile, seed = 1, seat = null, verify = false, create = createGame }) {
  const game = create({ seed });
  const api = game.api, data = game.data;
  const rng = mulberry32((hashStr(profile.id) ^ (seed * 2654435761)) >>> 0);
  const steps = [];
  let obs = api.observe();

  const seats = obs.actions.filter((a) => a.type === 'pick-seat').map((a) => a.id);
  const chosen = seat || P.chooseSeat(profile, data, seats, rng);
  obs = api.act({ type: 'pick-seat', id: chosen });
  let model = M.initialState(data, chosen);
  steps.push({ kind: 'seat', id: chosen, toast: obs.toast });

  let guard = 0;
  while (obs.screen !== 'end') {
    if (guard++ > 100) throw new Error('run did not finish (screen ' + obs.screen + ')');
    if (verify) checkSync(game, model);

    if (obs.screen === 'room') {
      const mv = P.choose(profile, data, model, rng);
      obs = api.act(mv.type === 'talk' ? { type: 'talk', id: mv.id } : { type: 'sign' });
      model = M.apply(data, model, mv);
      steps.push({ kind: mv.type, id: mv.id || null });
    } else if (obs.screen === 'talk') {
      const mv = P.choose(profile, data, model, rng);
      const label = (obs.actions.find((a) => a.index === mv.index) || {}).label;
      obs = api.act({ type: 'reply', index: mv.index });
      model = M.apply(data, model, mv);
      steps.push({ kind: 'reply', index: mv.index, label, toast: obs.toast });
    } else if (obs.screen === 'mini') {
      const miniId = model.miniId, success = rng() < P.miniChance(profile, miniId);
      obs = api.act({ type: 'mini-result', success });
      model = M.applyMini(data, model, success);
      steps.push({ kind: 'mini', id: miniId, success });
    } else if (obs.screen === 'sign') {
      const first = obs.actions[0].type;
      if (first === 'sign-advance') obs = api.act({ type: 'sign-advance' });
      else {
        const mv = P.choose(profile, data, model, rng);
        obs = api.act(mv.type === 'sign-choice' ? { type: 'sign-choice', id: mv.id } : { type: 'mic', id: mv.id });
        model = M.apply(data, model, mv);
        steps.push({ kind: mv.type, id: mv.id });
      }
    } else if (obs.screen === 'gaggle') {
      obs = api.act({ type: 'continue' });
    } else {
      throw new Error('unexpected screen ' + obs.screen);
    }
  }

  const G = game.state();
  return {
    profile: profile.id, seed, seat: chosen, endingId: obs.endingId, title: data.ENDINGS[obs.endingId].title,
    ledger: Object.assign({}, G.ledger), flags: Object.assign({}, G.flags), talks: G.talksDone.slice(), typoChoice: G.typoChoice,
    story: data.endLines(G), share: data.shareCard(G), steps
  };
}

module.exports = { playRun, loadProfiles, mulberry32, hashStr, checkSync };
