'use strict';
/* Headless harness: loads the REAL game source (data, art, mini, scenes, main, agent) into a Node vm
   with a stubbed browser, and hands back the agent API plus read access to the game's own data
   tables and functions (TALKS, STARTS, computeEndingId, ...). Nothing is reimplemented here. */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.join(__dirname, '..');
const PARTS = ['data.js', 'art.js', 'mini.js', 'scenes.js', 'assets.list.js', 'assets.js', 'cutscene.js', 'world.js', 'press.js', 'main.js', 'agent.js'];

function stubContext() {
  return new Proxy({}, {
    get(t, k) {
      if (k === 'createLinearGradient' || k === 'createRadialGradient') return () => ({ addColorStop() {} });
      if (k === 'measureText') return () => ({ width: 50 });
      if (!(k in t)) t[k] = () => ({});
      return t[k];
    },
    set(t, k, v) { t[k] = v; return true; }
  });
}

function fakeElement(id) {
  const ctx = stubContext();
  return {
    id, textContent: '', className: '', disabled: false, width: 0, height: 0,
    style: new Proxy({}, { get: (t, k) => t[k] || '', set: (t, k, v) => { t[k] = v; return true; } }),
    classList: { add() {}, remove() {}, toggle() {}, contains() { return false; } },
    appendChild(c) { return c; }, removeChild() {}, addEventListener() {}, removeEventListener() {},
    getBoundingClientRect() { return { left: 0, top: 0, width: 1280, height: 720 }; },
    getContext() { return ctx; }
  };
}

/** Load a fresh game. `seed` fixes the game's own RNG (gaggle beats, share-card likes, caption words). */
function createGame({ seed = 20260929 } = {}) {
  const elements = {};
  const store = {};
  const win = { innerWidth: 1280, innerHeight: 720, devicePixelRatio: 1, addEventListener() {}, AudioContext: undefined };
  const sandbox = {
    console, Math, Date, JSON, Object, Array, String, Number, Boolean, Error, Set, Map,
    setTimeout: () => 0, clearTimeout() {}, setInterval: () => 0, clearInterval() {},
    document: { getElementById: (id) => elements[id] || (elements[id] = fakeElement(id)), createElement: () => fakeElement('_'), addEventListener() {} },
    localStorage: { getItem: (k) => (k in store ? store[k] : null), setItem: (k, v) => { store[k] = String(v); }, removeItem: (k) => { delete store[k]; } },
    requestAnimationFrame: () => 0,
    window: win
  };
  sandbox.globalThis = sandbox;
  vm.createContext(sandbox);
  const source = PARTS.map((p) => fs.readFileSync(path.join(ROOT, 'src', p), 'utf8')).join('\n');
  vm.runInContext(source, sandbox, { filename: 'game.js' });

  const read = (name) => vm.runInContext(name, sandbox);        // top-level const/let/function of the game
  win.__GAME_TEST_HOOKS__.reset(seed);
  /* computeEndingId is a pure function of (ledger, flags, playerId). Re-creating it in this realm makes the
     millions of calls a planner makes about 3x cheaper; test/agents.test.js proves both versions agree. */
  const endingFn = new Function('return ' + vm.runInContext('computeEndingId.toString()', sandbox))();
  return {
    api: win.__AGENT_API__,
    hooks: win.__GAME_TEST_HOOKS__,
    read,
    state: () => read('G'),
    data: {
      TALKS: read('TALKS'), STARTS: read('STARTS'), CAST: read('CAST'), SIGN_CHOICES: read('SIGN_CHOICES'),
      ENDINGS: read('ENDINGS'), MINI_OUTCOMES: win.__AGENT_API__.MINI_OUTCOMES,
      computeEndingId: endingFn, computeEndingIdInGame: read('computeEndingId'), endLines: read('endLines'), shareCard: read('shareCard')
    }
  };
}

module.exports = { createGame, ROOT, PARTS };
