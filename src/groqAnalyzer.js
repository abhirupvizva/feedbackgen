/**
 * Sentiment analysis via Groq API (llama-3.1-8b-instant).
 * Returns the same shape as analyzeSentiment() so SentimentDisplay works unchanged.
 * Falls back to the local analyzer if the API call fails.
 */
import { analyzeSentiment } from "./sentimentAnalyzer";

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const MODEL = "llama-3.1-8b-instant";

const SYSTEM_PROMPT = `You are a sentiment analysis expert specializing in interview and recruitment feedback.

Analyze the provided feedback text and return a JSON object with EXACTLY these fields:

{
  "label": "<one of: Very Positive | Positive | Slightly Positive | Neutral | Slightly Negative | Negative | Very Negative>",
  "normalizedScore": <integer -100 to 100>,
  "score": <float, raw sentiment score>,
  "comparative": <float, score per word, 3 decimal places>,
  "positiveScore": <float, sum of positive contribution scores>,
  "negativeScore": <float, sum of absolute negative contribution scores>,
  "wordCount": <integer, total words in text>,
  "analyzedWords": <integer, number of sentiment-bearing terms detected>,
  "positiveWords": [{ "word": "<term>", "score": <positive number> }, ...],
  "negativeWords": [{ "word": "<term>", "score": <negative number> }, ...],
  "phraseHits": [{ "phrase": "<multi-word phrase>", "score": <number> }, ...]
}

Scoring rules:
- Focus on the OVERALL tone, not just individual words
- Negations like "lacked confidence", "not fluent", "seemed like reading" are strongly negative (-3 or worse)
- Reading from notes/script during an interview is a red flag (-2 to -3)
- Network/technical issues that impacted the session are mildly negative (-1 to -2)
- Even if individual answers were "clear", if the candidate lacked confidence or fluency the overall sentiment should be negative
- positiveWords and negativeWords: list the top 5-8 individual terms driving the score
- phraseHits: list the key multi-word phrases that influenced the score
- Return ONLY valid JSON. No explanation, no markdown.`;

export async function analyzeWithGroq(text) {
  const apiKey = import.meta.env.VITE_GROQ_API_KEY;

  if (!apiKey) {
    console.warn("Groq API key not found, falling back to local analyzer.");
    return analyzeSentiment(text);
  }

  const response = await fetch(GROQ_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: `Analyze this interview feedback:\n\n${text}` },
      ],
      temperature: 0.1,
      response_format: { type: "json_object" },
    }),
  });

  if (!response.ok) {
    throw new Error(`Groq API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;

  if (!content) throw new Error("Empty response from Groq");

  const result = JSON.parse(content);

  // Ensure arrays exist even if the model omits them
  result.positiveWords = result.positiveWords ?? [];
  result.negativeWords = result.negativeWords ?? [];
  result.phraseHits = result.phraseHits ?? [];

  return result;
}
