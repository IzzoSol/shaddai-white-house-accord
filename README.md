# WHITE HOUSE ACCORD — Super Intelligence Signing Simulator

A satirical single-file browser game. East Room luncheon, September 29, 2026.
Play as one of six signatories, work the table, then become Trump for the
signing — where a one-letter typo ("President of the Unites States") meets
three choices and eight different endings.

## Play

Open `index.html` in any browser. That's it — zero build, zero dependencies.

To serve it (nicer for screenshots / sharing):

```
cd super-intelligence-game
python -m http.server 8477
# then open http://localhost:8477
```

## How it plays

- **Title** → PLAY / CAST / HOW TO PLAY
- **Cast** — six signatory cards + Trump (locked until you finish a run).
  Your seat at the table is already a choice: Elon starts next to Trump,
  Dario starts parked at the far end, Greg starts with Sam on speaker.
- **East Room** — walk the table with A/D or arrows, click a person to talk (talk to three; Tom Brown at the far end is a bonus, once).
  In a conversation press **1 / 2** to reply and **Space** to read on. **P** pauses.
  Talk to three people. Each talk ends in their micro-game:
  Elon's phone composer, Jensen's sand conveyor, Zuck's live captions,
  Sundar's stamp folders, Dario's safety slider, Greg's pen on the line.
- **The signing** — you become Trump. Three giant choices on the typo,
  then pick who says a word to the press.
- **The gaggle** — twenty seconds of driveway, camera flashes, and beats
  chosen by your earlier decisions.
- **End card** — one of eight authored endings, plus a fake-X share card.

## The hidden ledger

The game tracks eight invisible channels — rapport, photo optics, safety
substance, platform drama, meme halflife, whether the typo survived, whether
Sam is in the story, and who got the mic. You never see them; you feel them.
The same lunch produces a different public story depending on what you did.

- THE CONSTITUTION OF NOTHING — looks historic, means little
- THE VIRAL TYPO — the internet signed the typo faster than Congress
- THE SAFETY CAUCUS — worse photo, one real quote
- THE PROMPT-OFF — the signing is a footnote to Grok vs Dots
- THE SAND SERMON — everyone remembers the vial
- THE GLASSES LEAK — one wrong caption becomes the clip
- THE ABSENT CEO — OpenAI's president signs while its CEO launches merch
- THE GOLDEN AGE — most official, least funny, secretly the darkest

## Repo

```
index.html        the game (single file, ~100 KB)
build.js          assembles index.html from src/
src/shell.html    HTML + CSS
src/data.js       cast, ledger, residues, eight endings
src/art.js        editorial vector caricatures (canvas-drawn)
src/mini.js       the six micro-games
src/scenes.js     title, cast, room, talk, sign, gaggle, end
src/main.js       state machine, loop, input, audio, test hooks
test/smoke.js     headless playthrough (~40 checks, node test/smoke.js)
test/make-selftest.js    generates an in-browser QA pass
test/run-browser-test.ps1  runs it in headless Edge (canvas pixels, real input)
```

Rebuild after editing sources: `node build.js`
Run the headless checks: `node test/smoke.js`

QA discipline borrowed from majidmanzarpour/threejs-game-skills: seeded RNG,
`__GAME_TEST_HOOKS__` test contract, canvas pixel checks, real input path,
zero console errors.

## Agents

Any controller — a scripted bot, a model-driven agent, a forged Shaddai bot — can play through the game's agent interface. See `agents/README.md`.
