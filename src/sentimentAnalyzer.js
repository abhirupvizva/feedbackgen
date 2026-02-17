/**
 * Client-side sentiment analyzer using an AFINN-style word lexicon.
 * Each word is scored from -5 (very negative) to +5 (very positive).
 * Includes general English sentiment words plus feedback/interview-specific terms.
 */

const LEXICON = {
  // --- Very positive (+5) ---
  outstanding: 5, exceptional: 5, superb: 5, brilliant: 5, phenomenal: 5,

  // --- Strongly positive (+4) ---
  excellent: 4, impressive: 4, remarkable: 4, fantastic: 4, wonderful: 4,
  amazing: 4, extraordinary: 4, talented: 4, exemplary: 4, flawless: 4,

  // --- Positive (+3) ---
  great: 3, strong: 3, confident: 3, articulate: 3, knowledgeable: 3,
  proficient: 3, thorough: 3, insightful: 3, creative: 3, dedicated: 3,
  proactive: 3, enthusiastic: 3, skilled: 3, capable: 3, effective: 3,
  efficient: 3, accomplished: 3, competent: 3, resourceful: 3, motivated: 3,
  polished: 3, precise: 3, eloquent: 3, stellar: 3, adept: 3,
  commendable: 3, praiseworthy: 3, admirable: 3, excelled: 3,

  // --- Mildly positive (+2) ---
  good: 2, clear: 2, solid: 2, well: 2, positive: 2,
  prepared: 2, organized: 2, professional: 2, cooperative: 2, pleasant: 2,
  attentive: 2, responsive: 2, helpful: 2, reliable: 2, consistent: 2,
  appropriate: 2, adequate: 2, satisfactory: 2, reasonable: 2, comfortable: 2,
  engaged: 2, willing: 2, adaptable: 2, flexible: 2, punctual: 2,
  courteous: 2, respectful: 2, improved: 2, improving: 2, progressing: 2,
  promising: 2, potential: 2, recommended: 2, passed: 2, qualified: 2,
  suitable: 2, fit: 2, aligned: 2, relevant: 2, detailed: 2,
  structured: 2, logical: 2, analytical: 2, focused: 2, composed: 2,
  calm: 2, friendly: 2, approachable: 2, communicative: 2,

  // --- Slightly positive (+1) ---
  ok: 1, okay: 1, fine: 1, decent: 1, fair: 1,
  acceptable: 1, average: 1, moderate: 1, basic: 1, functional: 1,
  attempted: 1, tried: 1, participated: 1, completed: 1, finished: 1,
  answered: 1, responded: 1, showed: 1, demonstrated: 1,

  // --- Slightly negative (-1) ---
  slow: -1, limited: -1, hesitant: -1, uncertain: -1, vague: -1,
  brief: -1, short: -1, minimal: -1, passive: -1, quiet: -1,
  reserved: -1, nervous: -1, anxious: -1, rushed: -1, missed: -1,
  forgot: -1, overlooked: -1, inconsistent: -1, repetitive: -1, generic: -1,
  late: -1, delayed: -1, distracted: -1, unfocused: -1, unclear: -1,

  // --- Mildly negative (-2) ---
  poor: -2, weak: -2, lacking: -2, insufficient: -2, unprepared: -2,
  confused: -2, struggling: -2, difficult: -2, disappointing: -2, below: -2,
  underperformed: -2, incomplete: -2, inaccurate: -2, incorrect: -2,
  disorganized: -2, unfamiliar: -2, unresponsive: -2, uncomfortable: -2,
  unsatisfactory: -2, problematic: -2, failed: -2, rejected: -2,
  unsuitable: -2, unqualified: -2, irrelevant: -2, superficial: -2,
  careless: -2, sloppy: -2, rude: -2, dismissive: -2, uncooperative: -2,
  unwilling: -2, resistant: -2, defensive: -2, arrogant: -2,

  // --- Negative (-3) ---
  terrible: -3, awful: -3, horrible: -3, unacceptable: -3, incompetent: -3,
  unprofessional: -3, disrespectful: -3, dishonest: -3, unreliable: -3,
  negligent: -3, irresponsible: -3, hostile: -3, aggressive: -3,
  inappropriate: -3, offensive: -3, abysmal: -3,

  // --- Strongly negative (-4) ---
  atrocious: -4, dreadful: -4, disgraceful: -4, appalling: -4, deplorable: -4,

  // --- Very negative (-5) ---
  catastrophic: -5, disastrous: -5,

  // --- Common modifiers (intensifiers / diminishers handled via bigrams) ---
  not: -1, never: -2, no: -1, cannot: -1, "can't": -1,
  "didn't": -1, "doesn't": -1, "wasn't": -1, "won't": -1, "couldn't": -1,
  very: 1, really: 1, highly: 1, extremely: 2, incredibly: 2,
  absolutely: 2, quite: 1, somewhat: 0, slightly: 0,

  // --- Feedback-specific phrases (single words) ---
  recommend: 2, advance: 2, proceed: 2, promote: 2, hire: 2,
  shortlist: 2, select: 1, consider: 1,
  reject: -3, eliminate: -2, decline: -2, defer: -1,
};

// Negation words that flip the sentiment of the next word
const NEGATORS = new Set([
  "not", "no", "never", "neither", "nobody", "nothing",
  "nor", "nowhere", "cannot", "can't", "couldn't", "didn't",
  "doesn't", "don't", "hasn't", "haven't", "hadn't", "isn't",
  "wasn't", "weren't", "won't", "wouldn't", "shouldn't",
]);

// Intensifiers that amplify the next word's score
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
};

/**
 * Tokenize text into lowercase words.
 */
function tokenize(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z'\s-]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 0);
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
    };
  }

  const tokens = tokenize(text);
  const positiveWords = [];
  const negativeWords = [];
  let totalScore = 0;
  let positiveScore = 0;
  let negativeScore = 0;
  let analyzedWords = 0;

  for (let i = 0; i < tokens.length; i++) {
    const word = tokens[i];
    let wordScore = LEXICON[word];

    if (wordScore === undefined) continue;

    // Skip if this word is a negator or intensifier (they modify the next word)
    if (NEGATORS.has(word) || INTENSIFIERS[word] !== undefined) continue;

    analyzedWords++;

    // Check preceding word for negation or intensification
    const prev = i > 0 ? tokens[i - 1] : null;
    const prevPrev = i > 1 ? tokens[i - 2] : null;

    if (prev && NEGATORS.has(prev)) {
      wordScore = -wordScore * 0.75; // Flip and slightly dampen
    } else if (prev && INTENSIFIERS[prev]) {
      wordScore = wordScore * INTENSIFIERS[prev];
    }

    // Double intensifier: "really very good"
    if (prevPrev && INTENSIFIERS[prevPrev] && prev && INTENSIFIERS[prev]) {
      wordScore = wordScore * 1.25;
    }

    totalScore += wordScore;

    if (wordScore > 0) {
      positiveScore += wordScore;
      positiveWords.push({ word, score: Math.round(wordScore * 100) / 100 });
    } else if (wordScore < 0) {
      negativeScore += Math.abs(wordScore);
      negativeWords.push({ word, score: Math.round(wordScore * 100) / 100 });
    }
  }

  // Comparative score = total / word count (like AFINN)
  const comparative = tokens.length > 0 ? totalScore / tokens.length : 0;

  // Normalize to -100 to +100 scale
  const maxPossible = Math.max(analyzedWords * 5, 1);
  const normalizedScore = Math.max(
    -100,
    Math.min(100, (totalScore / maxPossible) * 100)
  );

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
    negativeWords: negativeWords.sort((a, b) => a.score - b.score),
    positiveScore: Math.round(positiveScore * 100) / 100,
    negativeScore: Math.round(negativeScore * 100) / 100,
    wordCount: tokens.length,
    analyzedWords,
  };
}
