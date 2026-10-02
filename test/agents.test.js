'use strict';
/* node --test test/agents.test.js   (or: node test/agents.test.js)
   Proves the agent layer: it can only make legal moves, it never sees the hidden ledger, its model of the
   game never drifts from the real game, runs are reproducible, and different profiles really play differently. */
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const { createGame } = require('../agents/harness');
const { playRun, loadProfiles } = require('../agents/runner');
const M = require('../agents/model');

const profiles = loadProfiles();
const byId = Object.fromEntries(profiles.map((p) => [p.id, p]));

test('observe() never exposes the hidden ledger, and lists only legal actions', () => {
  const g = createGame({ seed: 1 });
  const obs = g.api.observe();
  assert.equal(obs.ledger, undefined);
  assert.ok(obs.actions.length >= 6 && obs.actions.every((a) => a.type === 'pick-seat'));
  g.api.act({ type: 'pick-seat', id: 'musk' });
  assert.equal(JSON.stringify(g.api.observe()).includes('"substance"'), false);
});

test('illegal actions are rejected and change nothing', () => {
  const g = createGame({ seed: 1 });
  assert.throws(() => g.api.act({ type: 'talk', id: 'musk' }), /illegal action/);          // not in the room yet
  g.api.act({ type: 'pick-seat', id: 'musk' });
  assert.throws(() => g.api.act({ type: 'talk', id: 'musk' }), /illegal action/);          // cannot talk to yourself
  assert.throws(() => g.api.act({ type: 'sign' }), /illegal action/);                       // pen not up yet
  assert.equal(g.state().talksDone.length, 0);
});

test('three conversations is the rule; Tom Brown is the one optional extra', () => {
  const g = createGame({ seed: 2 });
  g.api.act({ type: 'pick-seat', id: 'pichai' });
  for (const id of ['musk', 'huang', 'zuck']) {
    g.api.act({ type: 'talk', id }); g.api.act({ type: 'reply', index: 0 });
    if (g.state().screen === 'mini') g.api.act({ type: 'mini-result', success: true });
  }
  const ids = g.api.observe().actions.filter((a) => a.type === 'talk').map((a) => a.id);
  assert.deepEqual(ids, ['tombrown']);                       // everyone else is closed once three talks are done
  g.api.act({ type: 'talk', id: 'tombrown' }); g.api.act({ type: 'reply', index: 0 });
  assert.equal(g.state().tomDone, true);
  assert.equal(g.api.observe().actions.some((a) => a.id === 'tombrown'), false);
});

test('a repeat conversation is a callback, not a second helping (no ledger change)', () => {
  const g = createGame({ seed: 3 });
  g.api.act({ type: 'pick-seat', id: 'pichai' });
  g.api.act({ type: 'talk', id: 'musk' }); g.api.act({ type: 'reply', index: 0 }); g.api.act({ type: 'mini-result', success: true });
  const before = JSON.stringify(g.state().ledger);
  g.hooks.openTalk('musk'); g.hooks.chooseReply(0);          // the UI path for an "AGAIN" conversation
  assert.equal(JSON.stringify(g.state().ledger), before);
  assert.equal(g.state().screen, 'room');
});

test('the model never drifts from the real game (checked after every move, every profile, many seeds)', () => {
  for (const p of profiles) for (let seed = 1; seed <= 6; seed++) playRun({ profile: p, seed, verify: true });
});

test('runs are reproducible: same profile + seed gives the same story', () => {
  for (const p of profiles) {
    const a = playRun({ profile: p, seed: 11 }), b = playRun({ profile: p, seed: 11 });
    assert.deepEqual(a.steps, b.steps); assert.equal(a.endingId, b.endingId); assert.deepEqual(a.ledger, b.ledger);
  }
});

test('profiles play differently: each has a signature ending and the field produces many endings', () => {
  const tally = {}; const all = new Set();
  for (const p of profiles) {
    tally[p.id] = {};
    for (let seed = 1; seed <= 20; seed++) { const e = playRun({ profile: p, seed }).endingId; tally[p.id][e] = (tally[p.id][e] || 0) + 1; all.add(e); }
  }
  const top = (id) => Object.entries(tally[id]).sort((a, b) => b[1] - a[1])[0][0];
  assert.equal(top('hawk'), 'safetyCaucus');
  assert.equal(top('showman'), 'viralTypo');
  assert.equal(top('technocrat'), 'sandSermon');
  assert.equal(top('diplomat'), 'perfect');
  assert.equal(top('wildcard'), 'absentCEO');
  assert.ok(all.size >= 5, 'expected at least 5 distinct endings across the field, got ' + [...all]);
});

test('foresight matters: the deep planner reaches its goal at least as often as a shallow one with the same goals', () => {
  const deep = Object.assign({}, byId.schemer, { id: 'deep' });
  const shallow = Object.assign({}, byId.schemer, { id: 'shallow', skills: Object.assign({}, byId.schemer.skills, { foresight: 0, insight: 0.3 }) });
  let d = 0, s = 0;
  for (let seed = 1; seed <= 30; seed++) { d += playRun({ profile: deep, seed }).endingId === 'perfect'; s += playRun({ profile: shallow, seed }).endingId === 'perfect'; }
  assert.ok(d >= s, `deep=${d} shallow=${s}`);
});

test('the fast ending function agrees with the game\'s own on many random states', () => {
  const g = createGame({ seed: 1 }), d = g.data, ids = ['musk', 'huang', 'zuck', 'pichai', 'amodei', 'brockman'];
  let rnd = 12345; const r = () => (rnd = (rnd * 1103515245 + 12345) >>> 0) / 4294967296;
  for (let i = 0; i < 2000; i++) {
    const st = { playerId: ids[Math.floor(r() * 6)], ledger: { rapport: 50, optics: Math.floor(r() * 7) - 1, substance: Math.floor(r() * 7) - 2, drama: Math.floor(r() * 5), meme: Math.floor(r() * 6), typoAlive: r() < 0.5, sam: r() < 0.2, mic: 'trump' },
      flags: { zuckCaption: r() < 0.3, elonPosted: r() < 0.4, darioTesting: r() < 0.3, sandDone: r() < 0.4 } };
    assert.equal(d.computeEndingId(st), d.computeEndingIdInGame(st));
  }
});

test('MINI_OUTCOMES still match the values written in mini.js', () => {
  const norm = (s) => s.replace(/\s+/g, '').replace(/\+/g, '').replace(/,}/g, '}');
  const src = norm(fs.readFileSync(path.join(__dirname, '..', 'src', 'mini.js'), 'utf8'));
  const g = createGame({ seed: 1 });
  for (const [mini, outs] of Object.entries(g.data.MINI_OUTCOMES)) {
    for (const [kind, out] of Object.entries(outs)) {
      const lit = '{' + Object.entries(out.residue).map(([k, v]) => `${k}:${v}`).join(',') + '}';
      assert.ok(src.includes(lit), `${mini}.${kind} ${lit} not found in mini.js`);
    }
  }
});

test('every profile file is complete', () => {
  for (const p of profiles) {
    for (const k of ['id', 'name', 'type', 'summary', 'goals', 'skills']) assert.ok(p[k], p.id + ' missing ' + k);
    for (const k of ['insight', 'dexterity', 'foresight']) assert.ok(p.skills[k] >= 0 && p.skills[k] <= 1, p.id + ' skill ' + k);
  }
});
