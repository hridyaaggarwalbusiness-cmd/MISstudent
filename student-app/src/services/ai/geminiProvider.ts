import { GeneratedPaper, GradeAnswersRequest, PaperQuestion, PracticeTestRequest, RegenerateQuestionRequest, SubjectiveGrade } from '@/types';
import { buildGeneratePrompt, buildGradeAnswersPrompt, buildRegenerateQuestionPrompt, GradePromptPart } from './promptBuilder';
import { extractJson, getSyllabusMismatchMessage, normalizeGrades, normalizePaper, normalizeRegeneratedQuestion, PaperValidationError } from './paperSchema';
import { PaperGenerationError, PaperProvider } from './paperProvider';

// This is the ONLY provider that can run on Firebase's free Spark plan: no
// Cloud Function (which needs the Blaze plan) sits in between, so the app
// calls Google's Generative Language API straight from the browser.
//
// That means this API key ships inside the web bundle. Google explicitly
// supports this pattern for the Gemini API specifically - restrict the key
// in Google Cloud Console (APIs & Services -> Credentials) to an "HTTP
// referrers" list containing only this app's real domains (e.g.
// mis-student-6yhtxk.web.app, mis-student-6yhtxk.firebaseapp.com, and any
// custom domain), the same way Google Maps API keys are locked down. Do
// NOT reuse an unrestricted key here. If you later enable the Blaze plan,
// switch `paperProvider` in index.ts back to `cloudFunctionPaperProvider`
// for a key that never leaves the server at all.
const API_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';

// Free-tier quota/billing eligibility for a given model varies by Google
// account and can differ even between models on the exact same key (some
// accounts get a 429 "exceeded quota" on the newest flash model but not on
// older ones). Rather than depend on one model working, try a prioritized
// list and fall through to the next on any failure - this self-heals
// without needing per-account diagnosis.
// gemini-2.5-flash goes first: it has a far higher output-token ceiling,
// which matters because a full CBSE paper (up to 100 marks, 30+ questions
// with model answers) can run long enough to hit a smaller cap mid-JSON.
// gemini-2.5-flash-lite is the fallback: same generation, no separate
// billing/quota bucket shared with 2.5-flash, and a noticeably higher free-
// tier daily request cap - so once 2.5-flash's own daily quota is used up,
// this keeps the app working for the rest of the day instead of failing.
// gemini-flash-latest is a final catch-all alias in case Google renames the
// current flagship flash model again. The older gemini-2.0-flash,
// gemini-1.5-flash, and gemini-1.5-flash-8b model IDs have all been
// permanently retired by Google (shut down / returning 404) as of 2026 -
// keeping them in this list would only waste an attempt on every request,
// so they've been removed. Google's model lineup and rate limits do
// continue to shift periodically; if requests start failing on every
// candidate, check https://ai.google.dev/gemini-api/docs/models for the
// current model IDs.
const MODEL_CANDIDATES = ['gemini-2.5-flash', 'gemini-2.5-flash-lite', 'gemini-flash-latest'];

// Each model's real output-token ceiling - requests above this are just
// wasted budget (or rejected outright by some models), so the requested
// amount is clamped per-model rather than sent as one flat number.
const MODEL_MAX_OUTPUT_TOKENS: Record<string, number> = {
  'gemini-2.5-flash': 24000,
  'gemini-2.5-flash-lite': 8000,
  'gemini-flash-latest': 8000,
};

// The 2.5-generation models "think" before answering by default, and those
// invisible reasoning tokens are deducted from the SAME maxOutputTokens
// budget as the visible JSON - on a model that reasons a lot, thinking
// alone can consume the entire budget and leave nothing for the actual
// paper, which is why even a small 20-mark request can hit MAX_TOKENS.
// Setting thinkingBudget: 0 turns thinking off so the full budget goes to
// the response. Only send this to models that actually understand it -
// older models reject unrecognized generationConfig fields outright.
const MODELS_WITH_THINKING_CONFIG = new Set(['gemini-2.5-flash', 'gemini-2.5-flash-lite', 'gemini-flash-latest']);

// Carries the HTTP status (and whether this specifically means "the API key
// itself is malformed/invalid") so callGemini can decide what to tell the
// student instead of showing whichever raw error happened to come back last.
class GeminiHttpError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly invalidKey: boolean = false,
  ) {
    super(message);
  }
}

// Google returns 400 INVALID_ARGUMENT with this exact wording when the API
// key itself is malformed or doesn't exist - as opposed to a valid key that's
// merely out of quota (429) or a model that's overloaded (503). Detecting
// this specifically matters because it's a config mistake (a mistyped or
// wrong-format key in GEMINI_API_KEYS_EXTRA), not a transient AI-provider
// problem, and deserves a completely different, actionable message.
function isInvalidKeyError(body: string): boolean {
  return /API key not valid|API_KEY_INVALID/i.test(body);
}

// Every key/model combination gets this long to answer before it's treated
// as failed and raced out - see callGemini below for why racing (not trying
// one at a time) is what actually keeps this under 30s.
const REQUEST_TIMEOUT_MS = 12000;

// Each free-tier Gemini API key (from its own Google Cloud project) has an
// independent daily quota. A single key's quota is small enough that a
// handful of practice-test generations can exhaust it, so this rotates
// through every configured key in order - callGemini falls through to the
// next key once the current one's models are all failing, effectively
// stacking each key's daily budget on top of the others.
function getApiKeys(): string[] {
  const primary = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
  const extra = process.env.EXPO_PUBLIC_GEMINI_API_KEYS_EXTRA;
  const keys = [primary, ...(extra ? extra.split(',') : [])]
    .map((k) => k?.trim())
    .filter((k): k is string => !!k);
  if (keys.length === 0) {
    throw new PaperGenerationError(
      'AI paper generation isn’t set up yet - ask your school admin to configure the Gemini API key.',
      'missing-api-key',
    );
  }
  return keys;
}

async function callGeminiModel(
  model: string,
  apiKey: string,
  parts: GradePromptPart[],
  requestedMaxOutputTokens: number,
  temperature: number,
  signal: AbortSignal,
): Promise<string> {
  const maxOutputTokens = Math.min(requestedMaxOutputTokens, MODEL_MAX_OUTPUT_TOKENS[model] ?? requestedMaxOutputTokens);
  const generationConfig: Record<string, unknown> = {
    responseMimeType: 'application/json',
    maxOutputTokens,
    temperature,
  };
  if (MODELS_WITH_THINKING_CONFIG.has(model)) {
    generationConfig.thinkingConfig = { thinkingBudget: 0 };
  }
  let res: Response;
  try {
    res = await fetch(`${API_BASE}/${model}:generateContent?key=${encodeURIComponent(apiKey)}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts }],
        generationConfig,
      }),
      signal,
    });
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') {
      throw new GeminiHttpError(408, `${model} timed out after ${REQUEST_TIMEOUT_MS / 1000}s`);
    }
    throw err;
  }

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new GeminiHttpError(res.status, `${model} failed (${res.status}): ${body.slice(0, 200)}`, isInvalidKeyError(body));
  }

  const data = (await res.json()) as {
    candidates?: { content?: { parts?: { text?: string }[] }; finishReason?: string }[];
  };
  const reason = data.candidates?.[0]?.finishReason;
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

  if (reason === 'SAFETY') {
    throw new PaperGenerationError('The AI declined to generate this paper. Try rephrasing the chapter/topic.', 'gemini-safety');
  }
  // A truncated response is not usable even when non-empty - the JSON is cut
  // mid-object - so this must be treated as a hard failure. Throwing here
  // (rather than returning the partial text) is what lets callGemini's loop
  // move on to a model with more output headroom instead of trying to parse
  // broken JSON.
  if (reason === 'MAX_TOKENS') {
    throw new Error(`${model} hit its output token limit before finishing the paper (requested ${maxOutputTokens} tokens).`);
  }
  if (!text) {
    throw new Error(`${model} returned an empty response (finishReason: ${reason ?? 'unknown'})`);
  }
  return text;
}

// Generation benefits from some creative variety across questions (higher
// temperature); grading must not - the same answer should score the same
// way every time it's submitted, so grading calls use a near-deterministic
// temperature instead of inheriting generation's default.
const GENERATION_TEMPERATURE = 0.8;
const GRADING_TEMPERATURE = 0.15;

// Every configured key × candidate model is fired at once and raced,
// instead of tried one at a time with sleep-based retries in between. With
// several keys now in play (see getApiKeys), trying every combination
// sequentially - even with short backoffs - could add up to minutes before
// giving up, which is exactly what made generation look "stuck". Racing
// them bounds the whole call to roughly one request's round trip (or
// REQUEST_TIMEOUT_MS if every single combo is genuinely down), and the
// moment one succeeds every other in-flight request is aborted so it isn't
// silently burning quota for an answer nobody needs.
async function callGemini(
  prompt: string | GradePromptPart[],
  maxOutputTokens: number,
  temperature: number = GENERATION_TEMPERATURE,
): Promise<string> {
  const apiKeys = getApiKeys();
  const parts = typeof prompt === 'string' ? [{ text: prompt }] : prompt;
  const combos = apiKeys.flatMap((apiKey) => MODEL_CANDIDATES.map((model) => ({ apiKey, model })));
  const controllers = combos.map(() => new AbortController());
  const timeoutId = setTimeout(() => controllers.forEach((c) => c.abort()), REQUEST_TIMEOUT_MS);

  let lastMessage = 'The AI provider is currently unavailable.';
  // Tracks whether every single failure across every key and every model was
  // specifically a 429 quota/rate-limit response - if so, the real story
  // isn't "every model is broken", it's "today's free-tier AI usage is used
  // up on every configured key", and the student deserves that plain-
  // language explanation instead of a wall of raw JSON from whichever
  // model happened to fail last.
  let allFailuresWereQuota = true;
  // Which configured key (1-indexed into apiKeys) came back invalid, if any -
  // surfaced ahead of every other failure below since it's an actionable
  // config mistake, not "the AI is having a bad day".
  let invalidKeyIndex: number | undefined;

  try {
    return await Promise.any(
      combos.map(({ apiKey, model }, i) =>
        callGeminiModel(model, apiKey, parts, maxOutputTokens, temperature, controllers[i].signal),
      ),
    );
  } catch (aggregate) {
    const errors = aggregate instanceof AggregateError ? aggregate.errors : [aggregate];
    errors.forEach((err, i) => {
      if (err instanceof PaperGenerationError) throw err;
      lastMessage = err instanceof Error ? err.message : String(err);
      if (!(err instanceof GeminiHttpError && err.status === 429)) {
        allFailuresWereQuota = false;
      }
      if (err instanceof GeminiHttpError && err.invalidKey && invalidKeyIndex === undefined) {
        invalidKeyIndex = Math.floor(i / MODEL_CANDIDATES.length) + 1;
      }
    });
  } finally {
    clearTimeout(timeoutId);
    controllers.forEach((c) => c.abort());
  }

  if (invalidKeyIndex !== undefined) {
    const which = apiKeys.length > 1 ? `key #${invalidKeyIndex} of ${apiKeys.length} configured` : 'the configured key';
    throw new PaperGenerationError(
      `${which} is invalid or malformed - Gemini rejected it outright (not a quota or overload issue). Double-check it was copied correctly into GEMINI_API_KEY / GEMINI_API_KEYS_EXTRA - a real Gemini API key from Google AI Studio starts with "AIzaSy".`,
      'invalid-api-key',
    );
  }
  if (allFailuresWereQuota) {
    throw new PaperGenerationError(
      "The school's AI usage limit for today has been reached (this is a free-plan quota, not a bug). It resets automatically - please try again later, or ask your school admin about upgrading the plan for a higher limit.",
      'quota-exceeded',
    );
  }
  throw new PaperGenerationError(`AI provider request failed on every available model. ${lastMessage}`, 'gemini-all-models-failed');
}

// A bigger paper needs proportionally more room to write out every
// question, option set, and model answer - a flat budget that's fine for a
// 20-mark unit test runs out mid-JSON on an 80-100 mark annual-exam paper.
// This is a request, not a guarantee: callGeminiModel clamps it to whatever
// the chosen model can actually output.
function requestedTokenBudget(totalMarks: number): number {
  return Math.min(24000, Math.max(8000, totalMarks * 220));
}

// Each graded answer now returns an explanation plus missing/incorrect
// concept lists and a suggestion - several times larger than the single
// feedback sentence the old prompt asked for. A flat 4000-token budget
// (fine for that old shape) truncates the JSON mid-array once a paper has
// more than a couple of subjective questions, which silently falls back to
// the provisional estimate. Scale with the number of answers instead.
function gradingTokenBudget(answerCount: number): number {
  return Math.min(24000, Math.max(3000, answerCount * 900));
}

// Retries once with the validation failure fed back to the model - marks
// mismatches and malformed JSON are the two failure modes worth a second
// try; anything else (network, missing key) is a hard failure.
async function generateValidatedPaper(request: PracticeTestRequest): Promise<GeneratedPaper> {
  const prompt = buildGeneratePrompt(request);
  const maxOutputTokens = requestedTokenBudget(request.totalMarks);
  let lastError: Error | undefined;
  for (let attempt = 0; attempt < 2; attempt++) {
    const correction = lastError
      ? `\n\nYour previous attempt was invalid: ${lastError.message}\nFix this and respond again with ONLY the corrected JSON. If your previous response was cut off, keep each question's "answer" and "explanation" more concise so the whole paper fits.`
      : '';
    try {
      const raw = await callGemini(prompt + correction, maxOutputTokens);
      const parsed = extractJson(raw);
      const mismatch = getSyllabusMismatchMessage(parsed);
      if (mismatch) {
        throw new PaperGenerationError(mismatch, 'topic-not-in-syllabus');
      }
      return normalizePaper(parsed, request);
    } catch (err) {
      if (err instanceof PaperGenerationError) throw err;
      lastError = err instanceof Error ? err : new Error(String(err));
    }
  }
  throw new PaperGenerationError(`The AI could not produce a valid paper: ${lastError?.message ?? 'unknown error'}`, 'validation-failed');
}

export const geminiProvider: PaperProvider = {
  generatePaper: generateValidatedPaper,

  async regenerateQuestion(request: RegenerateQuestionRequest): Promise<PaperQuestion> {
    const prompt = buildRegenerateQuestionPrompt(request);
    try {
      const raw = await callGemini(prompt, 1500);
      const parsed = extractJson(raw);
      return normalizeRegeneratedQuestion(parsed, {
        id: `q-${Date.now()}`,
        number: 0,
        type: request.questionType,
        marks: request.marks,
      });
    } catch (err) {
      if (err instanceof PaperGenerationError) throw err;
      const message = err instanceof PaperValidationError ? err.message : 'Could not regenerate that question. Please try again.';
      throw new PaperGenerationError(message, 'regenerate-failed');
    }
  },

  // Same retry-with-correction pattern as paper generation: a malformed or
  // truncated grading response is worth one automatic retry before giving
  // up, since a student is waiting on their score, not just browsing.
  async gradeSubjectiveAnswers(request: GradeAnswersRequest): Promise<SubjectiveGrade[]> {
    if (request.answers.length === 0) return [];
    const promptParts = buildGradeAnswersPrompt(request);
    const maxOutputTokens = gradingTokenBudget(request.answers.length);
    let lastError: Error | undefined;
    for (let attempt = 0; attempt < 2; attempt++) {
      const correction: GradePromptPart[] = lastError
        ? [{
            text: `\n\nYour previous attempt was invalid: ${lastError.message}\nFix this and respond again with ONLY the corrected JSON array, one object per question. If your previous response was cut off, keep each question's "explanation" and "suggestions" more concise so the whole array fits.`,
          }]
        : [];
      try {
        const raw = await callGemini([...promptParts, ...correction], maxOutputTokens, GRADING_TEMPERATURE);
        const parsed = extractJson(raw);
        return normalizeGrades(parsed, request.answers);
      } catch (err) {
        if (err instanceof PaperGenerationError) throw err;
        lastError = err instanceof PaperValidationError ? err : new Error(err instanceof Error ? err.message : String(err));
      }
    }
    throw new PaperGenerationError(lastError?.message ?? 'Could not grade your answers. Please try again.', 'grading-failed');
  },
};
