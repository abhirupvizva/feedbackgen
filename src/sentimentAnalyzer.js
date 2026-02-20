/**
 * Client-side sentiment analyzer using an AFINN-style lexicon.
 * - Scores words from -5 (very negative) to +5 (very positive)
 * - Adds a PHRASE_LEXICON for bigrams/trigrams (e.g., "strong hire", "not a fit")
 * - Handles negation + intensifiers
 * - Designed for interview/feedback sentiment (with many added terms)
 */

const LEXICON = {
  // --- Very positive (+5) ---
  outstanding: 5, exceptional: 5, superb: 5, brilliant: 5, phenomenal: 5,
  legendary: 5, masterful: 5, unmatched: 5, unbeatable: 5, perfect: 5,
  "world-class": 5, "top-notch": 5, "best-in-class": 5, "first-class": 5,

  // Added very positive
  "game-changing": 5, "role-model": 5, "benchmarked": 5, "best-ever": 5,
  "bar-raiser": 5, "10x": 5, "star": 5, "rockstar": 5, "standout": 5,

  // --- Strongly positive (+4) ---
  excellent: 4, impressive: 4, remarkable: 4, fantastic: 4, wonderful: 4,
  amazing: 4, extraordinary: 4, talented: 4, exemplary: 4, flawless: 4,
  awesome: 4, terrific: 4, spectacular: 4, fabulous: 4, incredible: 4,
  impeccable: 4, noteworthy: 4, "first-rate": 4, "top-tier": 4,
  "high-performing": 4, "high-caliber": 4, "well-spoken": 4,
  "strong-hire": 4, "must-hire": 4, "hire-now": 4,
  intelligent: 4, sharp: 4, exceptionalism: 4,

  // Added strongly positive
  "high-impact": 4, "high-potential": 4, "high-signal": 4, "super-strong": 4,
  "excellent-fit": 4, "great-fit": 4, "culture-add": 4,
  "bar-raising": 4, "promotion-ready": 4, "ready-now": 4,
  "well-qualified": 4, "highly-qualified": 4, "overqualified": 2, // often positive but context-dependent

  // --- Positive (+3) ---
  great: 3, strong: 3, confident: 3, confidence: 3, articulate: 3, knowledgeable: 3,
  fluent: 2, fluency: 2,
  proficient: 3, thorough: 3, insightful: 3, creative: 3, dedicated: 3,
  proactive: 3, enthusiastic: 3, skilled: 3, capable: 3, effective: 3,
  efficient: 3, accomplished: 3, competent: 3, resourceful: 3, motivated: 3,
  polished: 3, precise: 3, eloquent: 3, stellar: 3, adept: 3,
  commendable: 3, praiseworthy: 3, admirable: 3, excelled: 3,

  // Interview/feedback positives (+3)
  leadership: 3, leader: 3, ownership: 3, initiative: 3, innovative: 3,
  innovation: 3, inventive: 3, strategic: 3, strategically: 3,
  collaborative: 3, collaboration: 3, teamwork: 3, "team-player": 3,
  mentor: 3, mentored: 3, mentoring: 3,
  "self-starter": 3, "fast-learner": 3, "results-driven": 3,
  "customer-focused": 3, "solution-oriented": 3, "problem-solving": 3,
  "problem-solver": 3, impactful: 3, driven: 3, diligent: 3, hardworking: 3,
  communicates: 3, communicated: 3, communicator: 3,
  scalable: 3, maintainable: 3, robust: 3, elegant: 3,

  // Added positive words (+3)
  "well-rounded": 3, "well-balanced": 3, "high-ownership": 3,
  "strong-communicator": 3, "clear-communicator": 3,
  "systems-thinking": 3, "big-picture": 2, "detail-oriented": 3,
  "analytical-thinking": 3, "critical-thinking": 3, "structured-thinking": 3,
  "data-driven": 3, "evidence-based": 3,
  "good-judgment": 3, "sound-judgment": 3,
  "good-instincts": 3, "strong-instincts": 3,
  "strong-fundamentals": 3, "solid-fundamentals": 2,
  "well-reasoned": 3, "well-argued": 3,
  "excellent-communication": 3, "clear-communication": 3,
  "stakeholder-management": 3, "stakeholder-focused": 3,
  "execution": 2, "executed": 2, "delivered": 3, "delivery": 2,
  "bias-for-action": 3, "ownership-mindset": 3,
  "high-agency": 3, "agency": 2,
  "growth-mindset": 3, "coachable": 2,
  "teachable": 2, "curious": 2, "curiosity": 2,
  "resilient": 2, "resilience": 2,
  "adaptable": 2, "adaptability": 2,
  "thought-leadership": 3, "influential": 3,
  "persuasive": 3, "inspiring": 3,

  // --- Mildly positive (+2) ---
  good: 2, clear: 2, solid: 2, well: 2, positive: 2,
  prepared: 2, organized: 2, professional: 2, cooperative: 2, pleasant: 2,
  attentive: 2, responsive: 2, helpful: 2, reliable: 2, consistent: 2,
  appropriate: 2, adequate: 2, satisfactory: 2, reasonable: 2, comfortable: 2,
  engaged: 2, willing: 2, flexible: 2, punctual: 2,
  courteous: 2, respectful: 2, improved: 2, improving: 2, progressing: 2,
  promising: 2, potential: 2, recommended: 2, passed: 2, qualified: 2,
  suitable: 2, fit: 2, aligned: 2, relevant: 2, detailed: 2,
  structured: 2, logical: 2, analytical: 2, focused: 2, composed: 2,
  calm: 2, friendly: 2, approachable: 2, communicative: 2,

  // Added mild positives (+2)
  concise: 2, coherent: 2, thoughtful: 2, supportive: 2, considerate: 2,
  patient: 2, pragmatic: 2, practical: 2, transparent: 2, receptive: 2,
  "open-minded": 2, timely: 2, "on-time": 2, "on-track": 2,
  "well-prepared": 2, "well-organized": 2, "well-structured": 2,
  "well-documented": 2, engaging: 2, dependable: 2, trustworthy: 2,
  "good-fit": 2, "solid-fit": 2, "strong-fit": 3,
  "meets-bar": 2, "meets-expectations": 2, "above-expectations": 3,
  "good-signal": 2, "positive-signal": 2,
  "good-answer": 2, "good-answers": 2,
  "solid-answer": 2, "solid-answers": 2,
  "reasonable-approach": 2, "sound-approach": 2,
  "clean": 2, "readable": 2, "testable": 2,
  "well-tested": 2, "good-coverage": 2, "improved-coverage": 2,
  "good-practices": 2, "best-practices": 3,
  "collaborates": 2, "collaborated": 2,
  "communicated-clearly": 3, "communicates-clearly": 3,
  "asks-good-questions": 3, "asked-good-questions": 3,
  "good-questions": 2,

  // --- Slightly positive (+1) ---
  ok: 1, okay: 1, fine: 1, decent: 1, fair: 1,
  acceptable: 1, average: 1, moderate: 1, basic: 1, functional: 1,
  attempted: 1, tried: 1, participated: 1, completed: 1, finished: 1,
  answered: 1, responded: 1, showed: 1, demonstrated: 1,

  // Added slight positives (+1)
  met: 1, meets: 1, meeting: 1,
  covered: 1, addressed: 1, shared: 1, explained: 1, clarified: 1,
  outlined: 1, started: 1, contributed: 1,
  "somewhat-clear": 1, "mostly-clear": 1, "good-enough": 1,

  // --- Slightly negative (-1) ---
  slow: -1, limited: -1, hesitant: -1, uncertain: -1, vague: -1,
  brief: -1, short: -1, minimal: -1, passive: -1, quiet: -1,
  reserved: -1, nervous: -1, anxious: -1, rushed: -1, missed: -1,
  forgot: -1, overlooked: -1, inconsistent: -1, repetitive: -1, generic: -1,
  late: -1, delayed: -1, distracted: -1, unfocused: -1, unclear: -1,
  reading: -1,  // reading from notes/document during interview is a red flag

  // Added slight negatives (-1)
  ambiguous: -1, wordy: -1, rambling: -1, scattered: -1,
  rusty: -1, shaky: -1, unconfident: -1, overconfident: -1,
  "needs": -1, "needing": -1,
  "not-great": -1, "not-good": -2, "meh": -1,
  "hand-wavy": -1, handwavy: -1,
  "light": -1, "thin": -1, "surface-level": -2,

  // --- Mildly negative (-2) ---
  poor: -2, weak: -2, insufficient: -2, unprepared: -2,
  confused: -2, struggling: -2, difficult: -2, disappointing: -2, below: -2,
  underperformed: -2, incomplete: -2, inaccurate: -2, incorrect: -2,
  disorganized: -2, unfamiliar: -2, unresponsive: -2, uncomfortable: -2,
  unsatisfactory: -2, problematic: -2, failed: -2, rejected: -2,
  unsuitable: -2, unqualified: -2, irrelevant: -2, superficial: -2,
  careless: -2, sloppy: -2, rude: -2, dismissive: -2, uncooperative: -2,
  unwilling: -2, resistant: -2, defensive: -2, arrogant: -2,

  // Added mild negatives (-2)
  inarticulate: -2, scripted: -2,
  mediocre: -2, subpar: -2, "needs-work": -2, "needs-improvement": -2,
  concern: -2, concerns: -2, issue: -2, issues: -2, gap: -2, gaps: -2,
  buggy: -2, flaky: -2, messy: -2, confusing: -2, unpolished: -2,
  unconvincing: -2, questionable: -2, deficient: -2, deficiencies: -2,
  "off-topic": -2, derailed: -2,
  "weak-signal": -2, "low-signal": -2,
  "not-ready": -2, "missing": -2, "missed-expectations": -2,

  // --- Negative (-3) ---
  terrible: -3, awful: -3, horrible: -3, unacceptable: -3, incompetent: -3,
  unprofessional: -3, disrespectful: -3, dishonest: -3, unreliable: -3,
  negligent: -3, irresponsible: -3, hostile: -3, aggressive: -3,
  inappropriate: -3, offensive: -3, abysmal: -3,

  // Added negatives (-3)
  bad: -3, worse: -3, frustrating: -3, frustrated: -3,
  "red-flag": -3, dealbreaker: -3, "no-show": -3,
  disqualifying: -3, unhireable: -3, fail: -3, fails: -3, failing: -3,
  "not-qualified": -3, "not-suitable": -3, "not-a-fit": -3,
  "low-quality": -3, "poor-quality": -3,

  // --- Strongly negative (-4) ---
  atrocious: -4, dreadful: -4, disgraceful: -4, appalling: -4, deplorable: -4,

  // Added strongly negatives (-4)
  toxic: -4, unethical: -4, fraudulent: -4, plagiarized: -4,
  "no-hire": -4, "hard-no": -4,

  // --- Very negative (-5) ---
  catastrophic: -5, disastrous: -5,

  // Added very negatives (-5)
  worst: -5, unforgivable: -5, "do-not-hire": -5,

  // --- Common modifiers (skip-scored; handled separately) ---
  not: -1, never: -2, no: -1, cannot: -1, "can't": -1,
  "didn't": -1, "doesn't": -1, "wasn't": -1, "won't": -1, "couldn't": -1,
  very: 1, really: 1, highly: 1, extremely: 2, incredibly: 2,
  absolutely: 2, quite: 1, somewhat: 0, slightly: 0,

  // --- Feedback-specific words ---
  recommend: 2, recommends: 2, recommending: 2,
  advance: 2, proceed: 2, promote: 2, hire: 2, hiring: 2,
  shortlist: 2, select: 1, consider: 1,
  hireable: 2, hirable: 2,
  reject: -3, rejecting: -3,
  eliminate: -2, decline: -2, defer: -1,
  pass: 2, passes: 2, passing: 2,
};

export const LEXICON_SIZE = Object.keys(LEXICON).length;

/**
 * Multi-word phrases: bigrams & trigrams.
 * Use spaces (NOT hyphens) because tokenization splits into words.
 */
const PHRASE_LEXICON = {
  // Hiring decisions (strong positive)
  "strong hire": 5,
  "must hire": 5,
  "hire now": 5,
  "clear hire": 5,
  "recommend hire": 5,
  "definitely hire": 5,
  "would hire": 4,
  "hire recommendation": 4,

  // High praise
  "bar raiser": 5,
  "raises the bar": 5,
  "sets the bar": 4,
  "top candidate": 4,
  "stand out": 4,
  "stands out": 4,
  "best candidate": 5,
  "exceptional candidate": 5,
  "great candidate": 4,
  "excellent candidate": 4,

  // Fit / growth / readiness
  "great fit": 4,
  "strong fit": 4,
  "good fit": 3,
  "culture add": 4,
  "promotion ready": 4,
  "ready for next": 3,
  "ready for level": 3,

  // Communication
  "communicates clearly": 4,
  "clear communication": 3,
  "well communicated": 3,
  "well spoken": 4,

  // Execution / impact
  "high impact": 4,
  "strong execution": 3,
  "delivered results": 4,
  "drives results": 4,
  "results driven": 3,

  // Collaboration / leadership
  "strong leadership": 4,
  "shows leadership": 3,
  "takes ownership": 3,
  "high ownership": 3,
  "team player": 3,
  "great teammate": 3,

  // Mixed/negative hiring phrases
  "not a fit": -4,
  "not suitable": -3,
  "not qualified": -4,
  "would not hire": -5,
  "do not hire": -5,
  "no hire": -5,
  "hard no": -5,
  "strong no": -4,
  "clear no": -4,
  "reject candidate": -4,

  // Red flags / concerns
  "red flag": -4,
  "major concern": -4,
  "serious concern": -4,
  "significant gap": -3,
  "knowledge gap": -2,
  "skill gap": -2,

  // Quality negatives
  "poor communication": -3,
  "unclear communication": -3,
  "low signal": -3,
  "weak signal": -3,
  "not ready": -3,
  "needs improvement": -2,
  "needs work": -2,
  "missed requirements": -3,

  // Confidence deficits
  "lacked confidence": -3,
  "lacks confidence": -3,
  "lack of confidence": -3,
  "low confidence": -3,
  "no confidence": -4,
  "not confident": -3,
  "seemed nervous": -2,
  "appeared nervous": -2,
  "appeared hesitant": -2,

  // Fluency deficits
  "not fluent": -3,
  "not very fluent": -3,
  "lacked fluency": -3,
  "poor fluency": -3,
  "not articulate": -3,
  "not very articulate": -3,

  // Reading from notes / scripted answers (major interview red flag)
  "reading from": -2,
  "reading the document": -3,
  "reading from document": -3,
  "followed the document": -2,
  "seemed like reading": -2,
  "seemed to be reading": -3,
  "appeared to be reading": -2,
  "read from": -2,

  // Technical/session issues
  "network issues": -2,
  "connection issues": -2,
  "audio issues": -2,
  "video issues": -1,
  "technical issues": -2,
};

// Negation words that flip sentiment of the next word/phrase
const NEGATORS = new Set([
  "not", "no", "never", "neither", "nobody", "nothing",
  "nor", "nowhere", "cannot", "can't", "couldn't", "didn't",
  "doesn't", "don't", "hasn't", "haven't", "hadn't", "isn't",
  "wasn't", "weren't", "won't", "wouldn't", "shouldn't",
  // Lack-based negators: flip the score of the following sentiment word
  "lacked", "lacks", "lack", "lacking", "without", "absent",
]);

// Intensifiers that amplify the next word/phrase score
const INTENSIFIERS = {
  very: 1.5,
  really: 1.5,
  extremely: 2.0,
  incredibly: 2.0,
  absolutely: 2.0,
  highly: 1.5,
  quite: 1.25,
  remarkably: 1.75,
  exceptionally: 2.0,
  truly: 1.5,
  super: 1.5,
  so: 1.25,
  too: 1.25,
};

/**
 * Tokenize text into lowercase words.
 * Keeps hyphens and apostrophes, removes other punctuation.
 */
function tokenize(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z'\s-]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 0);
}

function buildNgrams(tokens, n) {
  const grams = [];
  for (let i = 0; i <= tokens.length - n; i++) {
    grams.push({ text: tokens.slice(i, i + n).join(" "), index: i });
  }
  return grams;
}

/**
 * Analyze sentiment of the given text.
 *
 * @param {string} text - The text to analyze
 * @returns {Object} Analysis result with scores and details
 */
export function analyzeSentiment(text) {
  if (!text || text.trim().length === 0) {
    return {
      score: 0,
      normalizedScore: 0,
      comparative: 0,
      label: "Neutral",
      positiveWords: [],
      negativeWords: [],
      positiveScore: 0,
      negativeScore: 0,
      wordCount: 0,
      analyzedWords: 0,
      phraseHits: [],
    };
  }

  const tokens = tokenize(text);
  const positiveWords = [];
  const negativeWords = [];
  const phraseHits = [];

  let totalScore = 0;
  let positiveScore = 0;
  let negativeScore = 0;
  let analyzedWords = 0;

  // --- 1) Phrase scoring (trigrams first, then bigrams) ---
  const consumed = new Array(tokens.length).fill(false);

  function applyModifier(baseScore, startIndex) {
    // Look at token immediately before phrase/word (and one more back for double intensifier)
    const prev = startIndex > 0 ? tokens[startIndex - 1] : null;
    const prevPrev = startIndex > 1 ? tokens[startIndex - 2] : null;

    let score = baseScore;

    if (prev && NEGATORS.has(prev)) {
      score = -score * 0.75; // flip + dampen
    } else if (prev && INTENSIFIERS[prev]) {
      score = score * INTENSIFIERS[prev];
    }

    // Double intensifier: "really very good"
    if (prevPrev && INTENSIFIERS[prevPrev] && prev && INTENSIFIERS[prev]) {
      score = score * 1.25;
    }

    return score;
  }

  // Try trigrams
  for (const g of buildNgrams(tokens, 3)) {
    const base = PHRASE_LEXICON[g.text];
    if (base === undefined) continue;

    // Only score if none of the tokens are already consumed by another phrase
    if (consumed[g.index] || consumed[g.index + 1] || consumed[g.index + 2]) continue;

    let s = applyModifier(base, g.index);
    s = Math.round(s * 100) / 100;

    phraseHits.push({ phrase: g.text, score: s });
    totalScore += s;
    analyzedWords += 3;

    if (s > 0) positiveScore += s;
    else negativeScore += Math.abs(s);

    consumed[g.index] = consumed[g.index + 1] = consumed[g.index + 2] = true;
  }

  // Try bigrams
  for (const g of buildNgrams(tokens, 2)) {
    const base = PHRASE_LEXICON[g.text];
    if (base === undefined) continue;

    if (consumed[g.index] || consumed[g.index + 1]) continue;

    let s = applyModifier(base, g.index);
    s = Math.round(s * 100) / 100;

    phraseHits.push({ phrase: g.text, score: s });
    totalScore += s;
    analyzedWords += 2;

    if (s > 0) positiveScore += s;
    else negativeScore += Math.abs(s);

    consumed[g.index] = consumed[g.index + 1] = true;
  }

  // --- 2) Single-word scoring (skip tokens consumed by phrases) ---
  for (let i = 0; i < tokens.length; i++) {
    if (consumed[i]) continue;

    const word = tokens[i];
    let wordScore = LEXICON[word];
    if (wordScore === undefined) continue;

    // Skip if this word is a negator or intensifier (they modify the next word/phrase)
    if (NEGATORS.has(word) || INTENSIFIERS[word] !== undefined) continue;

    analyzedWords++;

    // Apply modifier from previous tokens
    let s = applyModifier(wordScore, i);
    s = Math.round(s * 100) / 100;

    totalScore += s;

    if (s > 0) {
      positiveScore += s;
      positiveWords.push({ word, score: s });
    } else if (s < 0) {
      negativeScore += Math.abs(s);
      negativeWords.push({ word, score: s });
    }
  }

  // Comparative score = total / word count (like AFINN)
  const comparative = tokens.length > 0 ? totalScore / tokens.length : 0;

  // Normalize to -100..+100
  const maxPossible = Math.max(analyzedWords * 5, 1);
  const normalizedScore = Math.max(-100, Math.min(100, (totalScore / maxPossible) * 100));

  // Determine label
  let label;
  if (normalizedScore >= 60) label = "Very Positive";
  else if (normalizedScore >= 25) label = "Positive";
  else if (normalizedScore >= 5) label = "Slightly Positive";
  else if (normalizedScore > -5) label = "Neutral";
  else if (normalizedScore > -25) label = "Slightly Negative";
  else if (normalizedScore > -60) label = "Negative";
  else label = "Very Negative";

  return {
    score: Math.round(totalScore * 100) / 100,
    normalizedScore: Math.round(normalizedScore * 100) / 100,
    comparative: Math.round(comparative * 1000) / 1000,
    label,
    positiveWords: positiveWords.sort((a, b) => b.score - a.score),
    negativeWords: negativeWords.sort((a, b) => a.score - b.score), // more negative first
    positiveScore: Math.round(positiveScore * 100) / 100,
    negativeScore: Math.round(negativeScore * 100) / 100,
    wordCount: tokens.length,
    analyzedWords,
    phraseHits: phraseHits.sort((a, b) => Math.abs(b.score) - Math.abs(a.score)),
  };
}
