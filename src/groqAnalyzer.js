import { analyzeSentiment } from "./sentimentAnalyzer";

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const MODEL = "llama-3.1-8b-instant";

const SYSTEM_PROMPT = `You are an objective evaluator of meeting/interview outcomes. Do NOT analyze the 'tone' or 'politeness' of the text. Analyze the factual details to determine the success of the interaction.

Analyze the provided meeting information and return a JSON object with EXACTLY these fields:

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
- IGNORE TONE/POLITENESS. A polite rejection ("We loved meeting you but...") is NEGATIVE. A blunt acceptance ("Hired.") is POSITIVE.
- Focus STRICTLY on the MEETING DETAILS and OUTCOMES:
  - **Task Status**: "Cancelled", "Not Done", "No Show" are NEGATIVE outcomes (unless "Rescheduled"). "Completed" is NEUTRAL/POSITIVE depending on content.
  - **Performance**: "Solved problem", "Good answers", "Strong skills" = POSITIVE. "Struggled", "Unable to answer", "Buggy code" = NEGATIVE.
  - **Red Flags**: "Cheating", "Reading from notes", "Fake experience" = VERY NEGATIVE.
  - **Technical Issues**: "Connection lost", "Audio failed" = SLIGHTLY NEGATIVE (interrupted the process).
- **positiveWords/negativeWords**: Extract the factual keywords (e.g., "solved", "hired", "cancelled", "struggled") rather than emotional ones.
- Return ONLY valid JSON. No explanation, no markdown.`;

export async function analyzeWithGroq(meetingData) {
  const apiKey = import.meta.env.VITE_GROQ_API_KEY;

  // Fallback to local analyzer if no key, but local analyzer only takes text string.
  // We'll pass the feedback text if falling back.
  if (!apiKey) {
    console.warn("Groq API key not found, falling back to local analyzer.");
    return analyzeSentiment(meetingData.feedback || "");
  }

  // Construct a structured representation of the meeting data
  const userContent = `
    Analyze this meeting/interview outcome:

    Meeting Type: ${meetingData.format || "N/A"}
    Task Status: ${meetingData.taskStatus || "N/A"}
    Interview Round: ${meetingData.interviewRound || meetingData.assessmentType || "N/A"}
    Feedback Notes: ${meetingData.feedback || "N/A"}
    Questions Asked: ${meetingData.questions || "N/A"}
  `;

  try {
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
          { role: "user", content: userContent },
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
  } catch (error) {
    console.error("Groq analysis failed:", error);
    // Fallback on failure
    return analyzeSentiment(meetingData.feedback || "");
  }
}
