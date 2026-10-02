/* ==================== press.js — the press conference ====================
   Three questions from the lawn press corps (people and, yes, some AI bots). Pick a tone before the clock
   runs out. Each answer moves your AURA and the hidden ledger. Questions that match your own turf
   (Jensen on chips, Mark on the glasses, Elon on rockets) are easier to ace. A question is only asked once
   per run, so the second conference is fresh — and worth a little less. */

const PRESS_QUESTIONS = [
  { id: 'sand', rep: 'rep3', topic: 'nvidia', home: 'huang', q: 'Jensen says it is “sand.” Sand to wafer to GPU to superintelligence. Is the Accord also sand?',
    a: [{ t: 'Explain the supply chain, calmly.', tone: 'tech', aura: 5, led: { substance: 1 }, line: 'A reporter writes “wafer” and underlines it twice.' },
        { t: '“It is software, not a species.”', tone: 'confident', aura: 3, led: { optics: 1 }, line: 'The line lands. It will be on a mug.' },
        { t: 'Hold up the vial. Say nothing.', tone: 'joke', aura: 2, led: { meme: 1, optics: 1 }, line: 'Cameras flash at a vial of sand. This is journalism now.' }] },
  { id: 'glasses', rep: 'rep2', topic: 'meta', home: 'zuck', q: 'Are the Meta glasses recording this press conference?',
    a: [{ t: '“Robust controls. Board reports.”', tone: 'deflect', aura: 1, led: { drama: 1 }, line: 'That is not a no. Everyone writes down that it was not a no.' },
        { t: '“Yes. And the captions are very good.”', tone: 'tech', aura: 4, led: { optics: 1 }, line: 'Honesty about glasses: rare, and clipped immediately.' },
        { t: '“Say hi to the jumbotron.”', tone: 'joke', aura: 3, led: { meme: 2 }, line: 'The jumbotron says hi back. The room does not know how to feel.' }] },
  { id: 'permit', rep: 'rep4', topic: 'rocket', home: 'musk', q: 'Does the rocket on the lawn have a permit?',
    a: [{ t: '“It has a launch window.”', tone: 'confident', aura: 4, led: { optics: 1, drama: 1 }, line: 'A launch window is not a permit. It is a vibe. It plays.' },
        { t: '“Ask the paperwork. It is on the lawn.”', tone: 'deflect', aura: 1, led: { drama: 1 }, line: 'The paperwork is, in fact, on the lawn.' },
        { t: '“Permits are a state of mind.”', tone: 'joke', aura: 3, led: { meme: 2, substance: -1 }, line: 'The clip will outlive the rocket.' }] },
  { id: 'grokbot', rep: 'bot_grok', topic: 'ai', home: 'musk', q: 'GROK BOT: I analysed the Accord. It is 100% binding, 0% enforceable and 40% “tremendous.” Comment?',
    a: [{ t: '“The math does not add up. Nice try.”', tone: 'humble', aura: 4, led: { substance: 1 }, line: 'The bot recalculates. It now reports the math as “vibes-adjusted.”' },
        { t: '“Correct. Print it.”', tone: 'joke', aura: 3, led: { meme: 2 }, line: 'The bot prints it. Every printer on the lawn starts.' },
        { t: '“Who authorised a bot at the podium?”', tone: 'deflect', aura: 0, led: { drama: 1 }, line: 'The bot logs your question as engagement.' }] },
  { id: 'gptbot', rep: 'bot_gpt', topic: 'ai', home: 'brockman', q: 'GPT BOT: I am pleased to confirm that the typo was intentional. Was the typo intentional?',
    a: [{ t: '“I will neither confirm nor correct a typo.”', tone: 'deflect', aura: 3, led: { optics: 1 }, line: 'The bot thanks you for your thoughtful non-answer.' },
        { t: '“No. And please stop confirming things.”', tone: 'humble', aura: 4, led: { substance: 1 }, line: 'The bot apologises, then confirms that it apologised.' },
        { t: '“Yes. Unites is the new United.”', tone: 'joke', aura: 2, led: { meme: 2, substance: -1 }, line: 'The bot calls it “bold and delightful.” Everyone knows what that means.' }] },
  { id: 'proof', rep: 'rep1', topic: 'typo', q: 'Did anyone proofread “the Unites States”?',
    a: [{ t: '“We will correct the record.”', tone: 'humble', aura: 5, led: { substance: 1 }, line: 'Correcting the record is the least photogenic answer. It works.' },
        { t: '“It is a historic misspelling.”', tone: 'confident', aura: 2, led: { meme: 1 }, line: 'Nobody believes it. Everybody quotes it.' },
        { t: '“Blame staff.”', tone: 'deflect', aura: -3, led: { drama: 1 }, line: 'Staff stare at you from the front row.' }] },
  { id: 'voluntary', rep: 'rep2', topic: 'safety', home: 'amodei', q: 'Is “voluntary” a legal term?',
    a: [{ t: '“Self-policing is not enough.”', tone: 'tech', aura: 5, led: { substance: 2 }, line: 'It is the only real sentence of the afternoon. It is clipped.' },
        { t: '“It means everyone agrees.”', tone: 'confident', aura: 1, led: { substance: -1 }, line: 'The Speaker winces from across the lawn.' },
        { t: '“Say it again slowly.”', tone: 'joke', aura: 2, led: { meme: 1 }, line: '“Voluntary.” The echo is long.' }] },
  { id: 'dots', rep: 'rep3', topic: 'ai', home: 'brockman', q: 'Who is Dots, and why is Sam not here?',
    a: [{ t: '“Sam is at DevDay. Dots are here.”', tone: 'confident', aura: 3, led: { drama: 1 }, line: 'That is the answer, and also the story.' },
        { t: '“No comment. It is a philosophical event.”', tone: 'deflect', aura: 2, led: { meme: 1 }, line: 'It is, sort of. It also is not.' },
        { t: '“Dots are a software update.”', tone: 'tech', aura: 4, led: { substance: 1 }, line: 'Accurate, and very boring. A good answer.' }] },
  { id: 'cost', rep: 'rep4', topic: 'money', q: 'How many hundreds of billions, exactly?',
    a: [{ t: '“Review, then release.”', tone: 'deflect', aura: 2, led: { optics: 1 }, line: 'It is a policy. It is also a slogan.' },
        { t: 'Give a specific number, confidently.', tone: 'confident', aura: 4, led: { optics: 1, substance: 1 }, line: 'A number is a number. The room is relieved.' },
        { t: '“More than the lunch.”', tone: 'joke', aura: 3, led: { meme: 1 }, line: 'The caterer laughs, quietly, in the back.' }] },
  { id: 'testing', rep: 'rep1', topic: 'safety', home: 'amodei', q: 'Will the models be tested before release?',
    a: [{ t: '“Actual testing. Actual ones.”', tone: 'tech', aura: 5, led: { substance: 2 }, line: 'The word “actual” trends faster than the policy.' },
        { t: '“We test constantly.”', tone: 'confident', aura: 2, led: { optics: 1 }, line: 'Constantly is carrying a lot of weight.' },
        { t: '“Ask the jumbotron.”', tone: 'joke', aura: 1, led: { meme: 1 }, line: 'The jumbotron has no comment, in 40-point type.' }] },
  { id: 'jobs', rep: 'rep2', topic: 'society', q: 'What do you tell people who are worried about their jobs?',
    a: [{ t: 'Be honest: it will change a lot, and soon.', tone: 'humble', aura: 5, led: { substance: 1, rapport: 0 }, line: 'It is the answer that costs you the room and wins the headline.' },
        { t: '“Nothing to worry about.”', tone: 'confident', aura: -2, led: { drama: 1 }, line: 'The camera operators look at their feet.' },
        { t: '“Learn to prompt.”', tone: 'joke', aura: 0, led: { meme: 2, substance: -1 }, line: 'It is the dunk of the day. It is not about you. It is.' }] },
  { id: 'post', rep: 'rep4', topic: 'rocket', home: 'musk', q: 'A post went out during the signing. Was that approved?',
    a: [{ t: '“It was reviewed. Officially.”', tone: 'deflect', aura: 2, led: { optics: 1 }, line: 'REVIEWED. The stamp is on your forehead now.' },
        { t: '“It was always going to post.”', tone: 'joke', aura: 3, led: { meme: 2 }, line: 'The clip loops. It is already a sound.' },
        { t: '“No. And it is being drafted again.”', tone: 'humble', aura: 3, led: { substance: 1 }, line: 'The draft dies in a folder forever.' }] }
];
const PRESS_BOTS = { bot_grok: { name: 'GROK BOT', co: 'Press pool · AI', rank: 1 }, bot_gpt: { name: 'GPT BOT', co: 'Press pool · AI', rank: 1 } };
const PRESS_TIME = 12;

function pressReporterName(id) { return (PRESS_BOTS[id] || AMBIENT_PEOPLE[id] || { name: 'Reporter' }); }

function startPressConference() {
  G.press = G.press || { used: {}, sessions: 0 };
  const fresh = PRESS_QUESTIONS.filter((q) => !G.press.used[q.id]);
  if (fresh.length < 1) { toast('The press corps has no questions left. You have survived the lawn.'); return; }
  /* three questions: your home turf first, then the rest in a repeatable shuffle */
  const mine = fresh.filter((q) => q.home === G.playerId);
  const rest = fresh.filter((q) => q.home !== G.playerId).sort((a, b) => idHash(a.id + G.press.sessions) - idHash(b.id + G.press.sessions));
  const qs = mine.slice(0, 1).concat(rest).slice(0, 3);
  G.press.session = { qs: qs, i: 0, t: 0, answered: null, total: 0, mult: G.press.sessions === 0 ? 1 : 0.6 };
  G.press.sessions++;
  G.screen = 'press';
  sfx('shutter');
}

function pressAnswer(idx) {
  const ses = G.press.session; if (!ses || ses.answered) return;
  const q = ses.qs[ses.i], a = q.a[idx];
  const home = q.home === G.playerId;
  let d = a.aura + (home && (a.tone === 'tech' || a.tone === 'confident') ? 3 : 0);
  d = Math.round(d * ses.mult);
  for (const k in a.led) { if (k === 'rapport') G.ledger.rapport = Math.max(0, Math.min(100, G.ledger.rapport + a.led[k])); else G.ledger[k] += a.led[k]; }
  addAura(auraScale(d), 'press: ' + a.tone, 'press');
  const S = G.auraStats;
  S.pressAsked++; S.press += Math.max(0, d) * 12;
  G.press.used[q.id] = true;
  ses.answered = { idx: idx, d: d, line: a.line + (home ? ' (Home turf.)' : '') };
  ses.t = 0;
  sfx(d >= 3 ? 'good' : d < 0 ? 'bad' : 'ui');
}
function pressTimeout() {
  const ses = G.press.session, q = ses.qs[ses.i];
  addAura(auraScale(-3), 'press: stumbled', 'press');
  G.auraStats.pressAsked++; G.press.used[q.id] = true;
  ses.answered = { idx: -1, d: -3, line: 'You let the clock run out. The question hangs in the air like a sneeze.' };
  ses.t = 0; sfx('bad');
}
function pressNext() {
  const ses = G.press.session;
  ses.i++; ses.answered = null; ses.t = 0;
  if (ses.i >= ses.qs.length) { G.screen = 'room'; G.press.session = null; toast('You handled the press. The riser applauds, politely.'); }
}
function updatePress(dt) {
  const ses = G.press && G.press.session; if (!ses) { G.screen = 'room'; return; }
  ses.t += dt;
  if (!ses.answered && ses.t > PRESS_TIME) pressTimeout();
  else if (ses.answered && ses.t > 2.6) pressNext();
}
function drawPress(c, t) {
  const ses = G.press && G.press.session; if (!ses) return;
  worldDraw(c, t, 0.016);
  c.fillStyle = 'rgba(5,7,13,0.72)'; c.fillRect(0, 0, W, H);
  const q = ses.qs[ses.i], rep = pressReporterName(q.rep), isBot = !!PRESS_BOTS[q.rep];
  /* reporter */
  const px = 130, py = 250;
  c.fillStyle = '#16233c'; rr(c, 40, 120, 220, 230, 12); c.fill(); c.strokeStyle = PAL.gold; c.lineWidth = 2; rr(c, 40, 120, 220, 230, 12); c.stroke();
  if (isBot) {
    c.fillStyle = '#0e1830'; rr(c, 70, 142, 160, 120, 14); c.fill();
    c.fillStyle = '#7ec8ff'; c.beginPath(); c.arc(116, 196, 14, 0, 7); c.fill(); c.beginPath(); c.arc(184, 196, 14, 0, 7); c.fill();
    c.fillStyle = '#0b1220'; c.beginPath(); c.arc(116 + Math.sin(t * 2) * 3, 196, 6, 0, 7); c.fill(); c.beginPath(); c.arc(184 + Math.sin(t * 2) * 3, 196, 6, 0, 7); c.fill();
    c.strokeStyle = '#7ec8ff'; c.lineWidth = 3; c.beginPath(); c.moveTo(110, 238); for (let i = 0; i < 9; i++) c.lineTo(110 + i * 10, 238 + Math.sin(t * 8 + i) * (ses.answered ? 1 : 6)); c.stroke();
    c.fillStyle = '#7ec8ff'; c.fillRect(148, 126, 4, 18); c.beginPath(); c.arc(150, 124, 5, 0, 7); c.fill();
  } else {
    c.save(); c.beginPath(); rr(c, 60, 130, 180, 150, 10); c.clip(); drawFigure(c, q.rep, 150, 270, 2.1, { pose: 'stand', t: t, talk: !ses.answered, look: 0 }); c.restore();
  }
  c.fillStyle = PAL.gold2; c.font = 'bold 15px Georgia'; c.textAlign = 'center'; c.fillText(rep.name.toUpperCase(), 150, 312);
  c.fillStyle = 'rgba(245,239,221,0.7)'; c.font = '12px Georgia'; c.fillText(rep.co || '', 150, 332);
  /* question */
  c.fillStyle = PAL.cream; rr(c, 290, 120, 950, 120, 12); c.fill(); c.strokeStyle = PAL.gold; c.lineWidth = 2.5; rr(c, 290, 120, 950, 120, 12); c.stroke();
  c.fillStyle = '#6a5a44'; c.font = 'bold 12px Georgia'; c.textAlign = 'left'; c.fillText('QUESTION ' + (ses.i + 1) + ' OF ' + ses.qs.length + ' · ' + q.topic.toUpperCase(), 312, 146);
  c.fillStyle = PAL.ink; c.font = 'italic 21px Georgia'; wrapText(c, q.q, 312, 178, 906, 28, 'left');
  /* clock */
  const left = ses.answered ? 0 : Math.max(0, 1 - ses.t / PRESS_TIME);
  c.fillStyle = 'rgba(245,239,221,0.15)'; rr(c, 290, 252, 950, 10, 5); c.fill();
  c.fillStyle = left > 0.35 ? PAL.green : PAL.red; rr(c, 290, 252, Math.max(10, 950 * left), 10, 5); c.fill();
  /* answers */
  q.a.forEach((a, i) => {
    const bx = 290, by = 280 + i * 84, bw = 950, bh = 72;
    const chosen = ses.answered && ses.answered.idx === i;
    const hot2 = !ses.answered && MX > bx && MX < bx + bw && MY > by && MY < by + bh;
    c.fillStyle = chosen ? '#2a5a3a' : hot2 ? '#2a4066' : '#1d2f4d'; rr(c, bx, by, bw, bh, 12); c.fill();
    c.strokeStyle = chosen ? '#7ef0a8' : hot2 ? PAL.gold : '#3a4a68'; c.lineWidth = hot2 || chosen ? 2.5 : 1.5; rr(c, bx, by, bw, bh, 12); c.stroke();
    c.fillStyle = PAL.gold; c.beginPath(); c.arc(bx + 36, by + bh / 2, 17, 0, 7); c.fill();
    c.fillStyle = '#101b2d'; c.font = 'bold 18px Georgia'; c.textAlign = 'center'; c.fillText(String(i + 1), bx + 36, by + bh / 2 + 6);
    c.fillStyle = PAL.cream; c.font = '19px Georgia'; c.textAlign = 'left'; wrapText(c, a.t, bx + 72, by + (bh > 60 ? 32 : 28), bw - 190, 24, 'left');
    c.fillStyle = 'rgba(232,201,106,0.9)'; c.font = 'bold 12px Georgia'; c.textAlign = 'right'; c.fillText(a.tone.toUpperCase(), bx + bw - 20, by + 30);
    if (!ses.answered) HOTRECTS.push({ x: bx, y: by, w: bw, h: bh, id: 'ans_' + i });
  });
  /* what happened */
  if (ses.answered) {
    const r = ses.answered;
    c.fillStyle = 'rgba(7,10,18,0.9)'; rr(c, 290, 540, 950, 120, 12); c.fill(); c.strokeStyle = r.d >= 0 ? '#7ef0a8' : '#ff9a90'; c.lineWidth = 2; rr(c, 290, 540, 950, 120, 12); c.stroke();
    c.fillStyle = r.d >= 0 ? '#7ef0a8' : '#ff9a90'; c.font = 'bold 26px Georgia'; c.textAlign = 'left'; c.fillText((r.d > 0 ? '+' : '') + r.d + ' AURA', 314, 584);
    c.fillStyle = PAL.cream; c.font = 'italic 18px Georgia'; wrapText(c, r.line, 314, 618, 900, 24, 'left');
  } else { c.fillStyle = 'rgba(245,239,221,0.6)'; c.font = '14px Georgia'; c.textAlign = 'center'; c.fillText('Press 1, 2 or 3 — or click. Match the tone to the question.', 765, 690); }
  drawHUD(c);
}
