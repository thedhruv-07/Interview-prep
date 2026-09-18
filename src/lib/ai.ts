import { ApiError, GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Free-tier-eligible Flash model. Google renames/retires Flash versions
// periodically — if this starts 404ing, check the model picker at
// aistudio.google.com and swap the string.
const MODEL = "gemini-2.5-flash";

const RETRYABLE_STATUSES = new Set([429, 500, 502, 503, 504]);

// The free tier gets transient 503 "model overloaded" errors more often
// than paid traffic (lower priority under load). Both callers below hit
// the same model, so retry once here rather than duplicating backoff logic
// in each of them.
async function generateWithRetry(
  params: Parameters<typeof ai.models.generateContent>[0],
  retries = 3
): Promise<string> {
  for (let attempt = 0; ; attempt++) {
    try {
      const response = await ai.models.generateContent(params);
      if (!response.text) throw new Error("No text response from model");
      return response.text;
    } catch (e) {
      const retryable = e instanceof ApiError && RETRYABLE_STATUSES.has(e.status);
      if (!retryable || attempt >= retries) throw e;
      await new Promise((r) => setTimeout(r, 2 ** attempt * 1000)); // 1s, 2s, 4s
    }
  }
}

export interface GeneratedQuestion {
  question: string;
  category: "technical" | "behavioral" | "system_design";
  relevance_reason: string;
}

/**
 * Generates questions anchored to the SPECIFIC gap/overlap between this resume
 * and this JD — not a generic "top 10 interview questions" list. The
 * relevance_reason is what makes this defensible in an interview: it's not
 * just an LLM wrapper, it's targeted retrieval-style reasoning over two
 * documents.
 */
export async function generateQuestions(
  resumeText: string,
  jobDescription: string
): Promise<GeneratedQuestion[]> {
  const text = await generateWithRetry({
    model: MODEL,
    contents: `You are an experienced technical interviewer. Given this candidate's resume and this job description, generate exactly 10 interview questions that specifically probe the GAPS and OVERLAPS between them — not generic questions that could apply to any candidate.

RESUME:
${resumeText}

JOB DESCRIPTION:
${jobDescription}

For each question, identify:
1. category: "technical", "behavioral", or "system_design"
2. question: the actual question to ask
3. relevance_reason: one sentence tying it to a SPECIFIC line in the resume or a SPECIFIC requirement in the JD (e.g. "JD requires distributed systems experience; resume only shows single-service projects" or "resume claims RAG experience; probe implementation depth")

Return ONLY a JSON array, no preamble, no markdown fences:
[{"category": "...", "question": "...", "relevance_reason": "..."}]`,
    // thinkingBudget: 0 disables Gemini's default "thinking" pass — without
    // it, the model burns part of maxOutputTokens on internal reasoning
    // before writing the JSON, which was truncating the output mid-string.
    // This task is straightforward extraction, not reasoning-heavy, so no
    // quality loss from skipping it.
    config: {
      responseMimeType: "application/json",
      // A prompt example ("return JSON shaped like...") only shows the
      // model a shape — it doesn't enforce one. responseSchema does, so a
      // field can't drift into some other structure the model decides is
      // more helpful (see scoreAnswer's weak_areas below for exactly that
      // happening).
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            category: { type: Type.STRING, enum: ["technical", "behavioral", "system_design"] },
            question: { type: Type.STRING },
            relevance_reason: { type: Type.STRING },
          },
          required: ["category", "question", "relevance_reason"],
        },
      },
      maxOutputTokens: 2000,
      thinkingConfig: { thinkingBudget: 0 },
    },
  });

  return JSON.parse(text.trim());
}

export interface AnswerScore {
  score: number;
  feedback: string;
  weak_areas: string[];
}

/**
 * Scores against specificity/evidence, not vibes. The prompt explicitly asks
 * for concrete, actionable feedback rather than generic encouragement —
 * that's the difference between a useful practice tool and a toy.
 */
export async function scoreAnswer(
  question: string,
  userAnswer: string
): Promise<AnswerScore> {
  const text = await generateWithRetry({
    model: MODEL,
    contents: `You are a strict but fair interview coach. Score this answer.

QUESTION: ${question}

CANDIDATE'S ANSWER: ${userAnswer}

Score 0-100 based on:
- Specificity: concrete examples, numbers, and details vs. vague general claims
- Relevance: does it actually answer what was asked
- Structure: clear beginning/middle/end, not rambling

Give 2-3 concrete, actionable improvements in the "feedback" field — not generic advice like "be more confident." Point to the exact part of the answer that's weak and what specifically to add or cut.

For "weak_areas": short topic labels only (e.g. "Vague on specifics", "No structure", "Missing metrics") — under 5 words each, plain text, no markdown formatting (no **bold**, no headers). The detailed explanation belongs in "feedback", not here — weak_areas are tags for a UI badge, not a second feedback paragraph.

Return ONLY JSON, no preamble, no markdown fences:
{"score": <0-100>, "feedback": "...", "weak_areas": ["...", "..."]}`,
    config: {
      responseMimeType: "application/json",
      // weak_areas drifted into an array of {part, improvement} objects
      // without this — the prompt's "point to the exact part... and what
      // to add or cut" line gave the model an implicit two-field shape it
      // ran with, even though the example just above shows plain strings.
      // responseSchema makes "array of strings" load-bearing instead of
      // just suggested. maxLength keeps them short enough to actually
      // work as UI badges — a later run returned full markdown-formatted
      // paragraphs per item without this, breaking the badge layout.
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          score: { type: Type.INTEGER },
          feedback: { type: Type.STRING },
          weak_areas: {
            type: Type.ARRAY,
            items: { type: Type.STRING, maxLength: "40" },
          },
        },
        required: ["score", "feedback", "weak_areas"],
      },
      maxOutputTokens: 1000,
      thinkingConfig: { thinkingBudget: 0 },
    },
  });

  return JSON.parse(text.trim());
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

/**
 * Lets the candidate keep discussing one specific scored answer — "why was
 * this weak", "how should I have said this instead" — with the same coach
 * persona that produced the original feedback. Scoped to a single
 * question/answer/feedback triple, not a general-purpose chatbot: the whole
 * point is staying anchored to context the candidate is already looking at.
 */
export async function discussFeedback(
  question: string,
  userAnswer: string,
  feedback: string,
  messages: ChatMessage[]
): Promise<string> {
  const history = messages
    .map((m) => `${m.role === "user" ? "Candidate" : "Coach"}: ${m.content}`)
    .join("\n\n");

  const text = await generateWithRetry({
    model: MODEL,
    contents: `You are the same interview coach who just scored this practice answer. Continue the conversation naturally, staying focused on this specific question and answer — help the candidate understand what was weak and how to actually improve it. Keep replies concise (2-4 sentences) and concrete.

QUESTION: ${question}

CANDIDATE'S ORIGINAL ANSWER: ${userAnswer}

YOUR INITIAL FEEDBACK: ${feedback}

CONVERSATION SO FAR:
${history}

Respond as the Coach, addressing the candidate's latest message directly. Return ONLY your reply text — no preamble, no "Coach:" prefix, no markdown fences.`,
    config: {
      maxOutputTokens: 500,
      thinkingConfig: { thinkingBudget: 0 },
    },
  });

  return text.trim();
}
