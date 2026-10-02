/* ==================== data.js — cast, ledger, residues, endings ==================== */
'use strict';

/* Seeded RNG (mulberry32) — deterministic runs, testable. */
function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
let RND = mulberry32(20260929);

/* Palette — luxury editorial: navy / gold / wood / cream. */
const PAL = {
  navy: '#101b2d', navy2: '#16233c', navy3: '#1d2f4d',
  gold: '#c9a227', gold2: '#e8c96a', gold3: '#f4e3a1',
  cream: '#f5efdd', cream2: '#e9e0c6',
  wood: '#5d3f28', wood2: '#7a5535', wood3: '#936b42',
  ink: '#0b0e14', dusk: '#0c1220',
  orange: '#f0924f', orange2: '#d97b35',
  red: '#c0392b', green: '#3f7d4e', blue: '#3a6ea5'
};

/* ---- CAST ---- */
const CAST = [
  { id:'musk',     name:'Elon Musk',       co:'xAI · SpaceX · Tesla', quote:'“Grading each other’s homework.”', signed:true,  starter:true },
  { id:'huang',    name:'Jensen Huang',    co:'Nvidia',               quote:'“This is sand. It is software, not a new species.”', signed:true,  starter:true },
  { id:'zuck',     name:'Mark Zuckerberg', co:'Meta',                 quote:'“Robust controls. Board reports.”', signed:true,  starter:true },
  { id:'pichai',   name:'Sundar Pichai',   co:'Google / Alphabet',    quote:'“Hundreds of billions. Review, then release.”', signed:true,  starter:true },
  { id:'amodei',   name:'Dario Amodei',    co:'Anthropic',            quote:'“Self-policing is not enough.”', signed:true,  starter:true },
  { id:'brockman', name:'Greg Brockman',   co:'OpenAI',               quote:'“Sam is in San Francisco. So I’m here.”', signed:true,  starter:true },
  { id:'trump',    name:'Donald J. Trump', co:'President of the United States', quote:'“Morally binding. Almost like a constitution.”', signed:true,  starter:false, locked:true },
  { id:'maye',     name:'???', co:'', quote:'', signed:false, starter:false, hidden:true },
  { id:'rogan',    name:'???', co:'', quote:'', signed:false, starter:false, hidden:true },
  { id:'sam',      name:'???', co:'', quote:'', signed:false, starter:false, hidden:true },
  { id:'vlad',     name:'???', co:'', quote:'', signed:false, starter:false, hidden:true },
  { id:'toly',     name:'???', co:'', quote:'', signed:false, starter:false, hidden:true },
  { id:'pavel',    name:'???', co:'', quote:'', signed:false, starter:false, hidden:true },
  { id:'barron',   name:'???', co:'', quote:'', signed:false, starter:false, hidden:true }
];

/* ---- ACT I — where your body is at the table ----
   startSeat: x position on the walk line. ledger: opening tilt. toast: first frame tell. */
const STARTS = {
  musk:     { x: 0.18, ledger:{ optics:+2, substance:-1, drama:+1 }, toast:'You are already next to Trump. The cameras found you before the lunch started.' },
  huang:    { x: 0.30, ledger:{ optics:+1, substance:+1 },           toast:'You are the infrastructure priest. People listen. Then they glaze.' },
  zuck:     { x: 0.42, ledger:{ optics:+1, drama:+1 },               toast:'Your glasses might be recording. Several people just checked.' },
  pichai:   { x: 0.50, ledger:{ rapport:+5, meme:-2 },               toast:'You are the adult in the room. Easy rapport. Zero virality.' },
  amodei:   { x: 0.68, ledger:{ substance:+2, optics:-1 },           toast:'You are parked far from the power sandwich. It feels colder here.' },
  brockman: { x: 0.80, ledger:{ drama:+1 },                          toast:'Sam is on speaker from DevDay. The absence is the plot.' }
};

/* ---- TALKS: 3 lines in real cadence + 2 replies + a micro-game.
   Reply residue = ledger deltas + flags (never shown as numbers).
   ref: a line that fires on later talks, referencing earlier residues. ---- */
const TALKS = {
  musk: {
    mini:'phone',
    lines:[
      'ELON: We agreed to joint monitoring. Board committees.',
      'ELON: Basically grading each other’s homework.',
      'ELON: I might post about it. Probably.'
    ],
    ref: (flags) => flags.darioTesting ? 'ELON: Dario calls it testing. I call it a slowdown play. Same letters, different tax.' : null,
    replies:[
      { t:'“Post one. Right now.”', r:+6, residue:{ meme:+2, optics:+1, drama:+1 }, flag:'elonPosted', toast:'Posted. The internet will find it before dessert.' },
      { t:'“Maybe draft it first?”', r:-3, residue:{ meme:-1 }, flag:'elonDrafted', toast:'Elon nods. The draft dies in a folder forever.' }
    ]
  },
  huang: {
    mini:'sand',
    lines:[
      'JENSEN: Everyone calls it a five-layer cake. Controls, team, auditor, committee.',
      'JENSEN: I call it sand. Sand → wafer → GPU → superintelligence.',
      'JENSEN: This is not a new species. It is software.'
    ],
    ref: (flags) => flags.sandDone ? 'JENSEN: You did the sand. So you know. The vial does the talking now.' : null,
    replies:[
      { t:'“Hand me the vial.”', r:+6, residue:{ optics:+1, substance:+1 }, flag:'sandDone', toast:'The vial glints. The leather jacket does half the work.' },
      { t:'“It’s a cake, actually.”', r:-3, residue:{ meme:-1 }, flag:'cakeFight', toast:'Jensen smiles anyway. The vial stays in the pocket.' }
    ]
  },
  zuck: {
    mini:'caption',
    lines:[
      'MARK: Meta glasses are live-captioning the lunch right now.',
      'MARK: Robust controls, board reports, third-party red teaming.',
      'MARK: If Trump says something wrong, it goes on the jumbotron.'
    ],
    ref: (flags) => flags.zuckCaption ? 'MARK: The captions corrected themselves. Mostly. There is one word I cannot fix.' : null,
    replies:[
      { t:'“What happens on the jumbotron?”', r:+6, residue:{ optics:+1, drama:+1 }, flag:'zuckWatch', toast:'The jumbotron brightens. It is very interested in this table.' },
      { t:'“Your glasses are recording us?”', r:-3, residue:{ drama:+1 }, flag:'zuckPressed', toast:'Mark smiles with no eyes. The recording continues.' }
    ]
  },
  pichai: {
    mini:'stamp',
    lines:[
      'SUNDAR: Google is investing hundreds of billions of dollars.',
      'SUNDAR: Our policy is simple. Review, then release.',
      'SUNDAR: These folders ship in ninety seconds.'
    ],
    ref: (flags) => flags.stamped ? 'SUNDAR: You reviewed them. Officially. It is in the minutes now.' : null,
    replies:[
      { t:'“Let’s review them together.”', r:+6, residue:{ optics:+2, meme:-2, substance:+1 }, flag:'stamped', toast:'REVIEWED. The lunch feels official and slightly dead.' },
      { t:'“Ship them. It’s a luncheon.”', r:-3, residue:{ meme:+1 }, flag:'shipped', toast:'The folders ship unstamped. Somewhere, a lawyer opens a tab.' }
    ]
  },
  amodei: {
    mini:'slider',
    lines:[
      'DARIO: Self-policing is not enough. I said that out loud, at the table.',
      'DARIO: There should be testing regimes. Actual ones.',
      'DARIO: The frosting on the cake is not the cake.'
    ],
    ref: (flags) => flags.darioTesting ? 'DARIO: The testing held. Trump noticed. That is not always good.' : null,
    replies:[
      { t:'“You’re the only one saying this.”', r:+6, residue:{ substance:+3, rapport:-2 }, flag:'darioTesting', toast:'Somewhere down the table, Musk calls it a slowdown play.' },
      { t:'“The Accord is a constitution, though.”', r:-4, residue:{ substance:-1 }, flag:'constitution', toast:'JOHNSON winces. Someone said constitution again.' }
    ]
  },
  brockman: {
    mini:'pen',
    lines:[
      'GREG: Sam is at DevDay in San Francisco. So I’m the one holding the pen.',
      'GREG: He says Dots are here. Nobody knows what Dots are.',
      'GREG: If his FaceTime rings, ignore the merch.'
    ],
    ref: (flags) => flags.samCall ? 'GREG: Sam posted anyway. He was always going to post anyway.' : null,
    replies:[
      { t:'“Hold the line, Greg.”', r:+6, residue:{ optics:+1, drama:-1 }, flag:'penHeld', toast:'Greg holds the pen like it is the whole ceremony.' },
      { t:'“What is a Dot?”', r:-3, residue:{ drama:+1, meme:+1 }, flag:'samCall', toast:'Sam posts. He was always going to post anyway.' }
    ]
  },
  tombrown: {
    mini:null,
    lines:[
      'TOM BROWN: Why am I here?',
      'TOM BROWN: I design the suits. I sign nothing. It is fine. It is fine.'
    ],
    ref: () => null,
    replies:[
      { t:'“Stay for the photo.”', r:+1, residue:{ optics:+1 }, flag:'tomSeen', toast:'Tom Brown stays. He will be in the caption now.' },
      { t:'(walk away)', r:0, residue:{}, flag:null, toast:'You leave Tom Brown at the far end. He understands completely.' }
    ]
  }
};

/* ---- ambient jokes: one line, triggered by real things in the scene ---- */
const AMBIENT = {
  americaGov:  'america.gov resolves to a 404. Nobody at the table notices.',
  protest:      'Outside the window: nine protesters and one very good drum.',
  sacks:        'SACKS, off to the side: “This is the Bretton Woods of Super Intelligence.”',
  johnson:      'JOHNSON winces. Someone said “constitution” again.',
  bezos:        'BEZOS says nothing. It is the loudest thing in the room.',
  lisaSu:       'LISA SU, passing: “Nice jacket.” (to Jensen, who takes it as infrastructure policy)',
  karp:         'KARP: “We must take responsibility for the dangers we know about.”',
  samText:      'SAM (DevDay): “Dots are here. The lunch happened. These facts are related.”'
};

/* ---- SIGNING ---- */
const SIGNERS = ['trump','pichai','amodei','zuck','brockman','musk','huang'];
const SIGN_LINES = [
  'The pen is up. Cameras are pointed at the signature page.',
  'Greg holds the pen out. Sam’s FaceTime window is on the laptop. Dots are here.',
  'The document reads: Donald J. Trump, President of the Unites States.',
  'Jensen whispers: “It says Unites.” You have about two seconds.'
];
const SIGN_CHOICES = [
  { id:'fix',   t:'Fix “Unites States”' },
  { id:'asis',  t:'Sign it anyway' },
  { id:'blame', t:'Blame staff' }
];

/* ---- GAGGLE (driveway, 20s): execs shoulder to shoulder, orange light.
   Two beats are chosen by your flags. One beat is random. ---- */
const GAGGLE_POOL = [
  { who:'@MayeMusk',     t:'(hearts under the photo of Elon next to Trump)' },
  { who:'@joerogan',     t:'“Morally binding” is a wild phrase. Wild.' },
  { who:'@sama',         t:'Dots are here. It is a software update. It is also, sort of, a philosophical event.' },
  { who:'@whitehousephotog', t:'[PHOTO] Execs shoulder to shoulder. Zuck pulled slightly forward. Trump more orange outside than inside.' }
];
function gaggleBeats(flags, ledger) {
  const beats = [];
  if (flags.elonPosted) beats.push({ who:'REPORTER', t:'“Mr. President — your first question is about the post, not biosecurity.”' });
  else                  beats.push({ who:'REPORTER', t:'“Mr. President — is this biosecurity or bandwidth?”' });
  if (flags.realRules)  beats.push({ who:'TRUMP', t:'“They want to stifle Super Intelligence. Terrible people.” (That is not what you said.)' });
  if (flags.flattered)  beats.push({ who:'TRUMP', t:'“One of the most brilliant people in the world.” (He has forgotten your company.)' });
  if (flags.zuckCaption) beats.push({ who:'@jumbotrong', t:'[CAPTION] “morally bidding” — live from the East Room.' });
  const pool = GAGGLE_POOL.slice();
  beats.push(pool[Math.floor(RND() * pool.length)]);
  return beats;
}

/* ---- THE EIGHT ENDINGS.
   Each: id, title, lines[6], artifact (in-world object), art (still variant). ---- */
const ENDINGS = {
  constitution: {
    title:'THE CONSTITUTION OF NOTHING',
    art:'pulitzer',
    lines:[
      'The photo is historic. The paper means little.',
      '“Voluntary,” Johnson says again, wincing on the vowel.',
      'The four layers exist in a folder nobody opens.',
      'Trump calls it a constitution. Nobody checks it.',
      'You are in the frame. The frame is the achievement.',
      'Tomorrow the room is used for a luncheon about nicknames.'
    ]
  },
  viralTypo: {
    title:'THE VIRAL TYPO',
    art:'monologue',
    lines:[
      'The Accord is remembered as “Unites States.”',
      'Late-night hosts get a week of material. Free.',
      'The internet signed the typo faster than Congress signed anything.',
      'Maye still likes the photo. She was always going to.',
      'The four layers are mentioned, once, in a correction.',
      '“Unites” trends in nine countries. The Accord trends in none.'
    ]
  },
  safetyCaucus: {
    title:'THE SAFETY CAUCUS',
    art:'cold',
    lines:[
      'The photo is worse. The quote is real.',
      '“Testing regimes, actual ones” survives into the minutes.',
      'Dario nods at you like you passed a test nobody announced.',
      'The accelerationists mock the frost. The frost was the point.',
      'You sat far from the power sandwich. The paperwork knows.',
      'It is the bittersweet ending. It is also the only substantive one.'
    ]
  },
  promptOff: {
    title:'THE PROMPT-OFF',
    art:'split',
    lines:[
      'The signing is a footnote to Grok vs Dots.',
      'Trump tried both bots. He liked the one that flattered him.',
      'Greg looks tired. He has been tired since 2015.',
      'The Accord gets thirty seconds. The bots get the other four minutes.',
      'Sam was not in the room. The room was about him anyway.',
      'Split-screen: two logos, one president, zero layers.'
    ]
  },
  sandSermon: {
    title:'THE SAND SERMON',
    art:'wafer',
    lines:[
      'Everyone remembers the vial of sand.',
      'The Accord becomes an infrastructure keynote with a signature.',
      'Lisa Su: “Nice jacket.” It enters the official record.',
      'Sand → wafer → GPU → superintelligence. The room nods along.',
      'Nobody mentions the four layers. The vial was better television.',
      'Jensen leaves with the vial. The vial was always leaving with Jensen.'
    ]
  },
  glassesLeak: {
    title:'THE GLASSES LEAK',
    art:'caption',
    lines:[
      'One wrong caption becomes the clip.',
      '“Morally bidding” — live from the East Room, 41 million views.',
      'Meta issues a statement about robust controls. It becomes a caption too.',
      'The jumbotron apologizes in the same font as the error.',
      'The Accord is a footnote to a subtitle.',
      'Mark’s glasses record the apology. The apology leaks.'
    ]
  },
  absentCEO: {
    title:'THE ABSENT CEO',
    art:'goblin',
    lines:[
      'OpenAI’s president signs while its CEO launches merch.',
      'A goblin shirt is in the corner of the official photo.',
      '“Dots are here.” The lunch happened. These facts are related.',
      'Greg holds the pen like it is the whole company.',
      'Sam was not in the room. The story keeps him in it anyway.',
      'The pen is real. The Dots are real. The layers are a folder.'
    ]
  },
  perfect: {
    title:'THE GOLDEN AGE',
    art:'golden',
    lines:[
      'The most official lunch in the history of lunches.',
      'The typo was fixed. The photo is perfect. Nobody said the true thing.',
      'The machine moved on. The machine was everyone.',
      'Trump calls it tremendous. Tremendous is the whole record.',
      'You are in the frame. The frame is empty. It is beautiful.',
      'This is the darkest ending. It looks like a win.'
    ]
  }
};

/* provisional ending after Act II; signing can flip it one step */
function computeEndingId(state) {
  const L = state.ledger, f = state.flags;
  if (f.zuckCaption && L.drama >= 2) return 'glassesLeak';
  if (f.elonPosted && L.sam) return 'promptOff';
  if (L.typoAlive && L.meme >= 3) return 'viralTypo';
  if (f.darioTesting && L.substance >= 3 && L.optics <= 1) return 'safetyCaucus';
  if (f.sandDone && L.optics >= 2) return 'sandSermon';
  if (state.playerId === 'brockman' && !L.sam) return 'absentCEO';
  if (L.optics >= 3 && L.substance >= 2 && L.drama <= 1 && !L.typoAlive) return 'perfect';
  if (L.optics >= 3 && L.substance <= 1) return 'constitution';
  if (L.meme >= 2) return 'viralTypo';
  if (L.substance >= 2) return 'safetyCaucus';
  return 'constitution';
}

/* end card lines: ending + who got the mic + typo + delayed jokes */
function endLines(state) {
  const L = state.ledger, f = state.flags, e = ENDINGS[state.endingId];
  const lines = e.lines.slice();
  if (L.mic === 'trump') lines[4] = 'Trump got the mic. It became a branding event: Super Intelligence, constitution, tremendous.';
  if (L.mic === 'zuck')  lines[4] = 'Zuck got the mic. The country heard “robust internal controls” in one breath.';
  if (L.mic === 'musk')  lines[4] = 'Musk got the mic. The country heard a two-word post.';
  if (L.mic === 'amodei') lines[4] = 'Dario got the mic. The country heard one real sentence and then the feed cut.';
  if (f.tomIgnored) lines[3] += ' (Tom Brown is in the caption anyway. Small, far end, present.)';
  return lines.slice(0, 6);
}

/* share card: fake X post per ending */
function shareCard(state) {
  const L = state.ledger, f = state.flags;
  const e = ENDINGS[state.endingId];
  const who = f.elonPosted ? '@ElonMusk' : (f.zuckCaption ? '@jumbotrong' : '@WhiteHouse');
  const txt = {
    constitution: 'A historic Accord on Super Intelligence was signed today. Morally binding.',
    viralTypo: 'Unites States.',
    safetyCaucus: 'Testing regimes. Actual ones. Signed in a colder corner of the room.',
    promptOff: 'Grok vs Dots. The president tried both. The Accord happened in between.',
    sandSermon: 'Sand. Wafer. GPU. Superintelligence. The vial did the talking.',
    glassesLeak: '[CAPTION] “morally bidding” — live from the East Room.',
    absentCEO: 'Dots are here. The lunch happened. These facts are related.',
    perfect: 'The Golden Age of Super Intelligence has begun. Tremendous.'
  }[state.endingId];
  const k = (12 + Math.floor(RND() * 88)) * (L.meme >= 3 ? 1000 : 100);   /* in thousands */
  return { who: who, txt: txt, likes: k >= 1000 ? (k / 1000).toFixed(1) + 'M' : k + 'K' };
}
