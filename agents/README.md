# Agents

Any controller can play White House Accord through one small interface — a scripted bot, a
model-driven agent (Grok, Claude, OpenAI, local), or a forged Shaddai bot — and the game plays
out exactly as it would for a person.

## The interface (`src/agent.js`)
```js
window.__AGENT_API__.observe()        // { screen, playerId, talksDone, toast, actions:[...] }  — never the hidden ledger
window.__AGENT_API__.legalActions()   // pick-seat | talk | reply | mini-result | sign | sign-advance | sign-choice | mic | continue
window.__AGENT_API__.act(action)      // applies one legal action through the same functions the UI uses; throws on anything else
```
Each option lists the effects the game data declares. How well an agent *uses* them is its skill.

## Profiles (`agents/profiles/*.json`)
A profile is a small skill file: what the agent wants (`goals.endings`, `goals.ledger`) and how good it is
(`skills.insight`, `skills.dexterity`, `skills.foresight`, each 0–1). Drop in a new file to add an agent.

| id | wants | tends to end in |
|---|---|---|
| diplomat | a clean, official Accord | The Golden Age |
| showman | the typo to live, the feed to explode | The Viral Typo |
| hawk | real testing regimes | The Safety Caucus |
| technocrat | process and infrastructure | The Sand Sermon |
| schemer | the best ending, planned in full | The Golden Age |
| wildcard | chaos | The Absent CEO / The Glasses Leak |

## Run
```
node agents/tournament.js --seeds 100      # every profile plays the same seeds; shows endings per profile
node --test test/agents.test.js            # 11 tests
node build.js                              # rebuild index.html after editing src/
```

## How it plays
`agents/model.js` is a pure model of one run built from the game's own data tables and its own ending
function. `agents/policy.js` searches it (expectimax): **foresight** is how many decisions ahead it plans,
**insight** how accurately it reads options, **dexterity** its chance in a micro-game. `agents/runner.js`
then plays the chosen moves in the real game, and the tests check the model never drifts from it.
