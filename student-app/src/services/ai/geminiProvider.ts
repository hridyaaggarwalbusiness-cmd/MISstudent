import { GeneratedPaper, GradeAnswersRequest, PaperQuestion, PracticeTestRequest, RegenerateQuestionRequest, SubjectiveGrade } from '@/types';
import { buildGeneratePrompt, buildGradeAnswersPrompt, buildRegenerateQuestionPrompt } from './promptBuilder';
import { extractJson, normalizeGrades, normalizePaper, normalizeRegeneratedQuestion, PaperValidationError } from './paperSchema';
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
// gemini-2.5-flash goes first: it has a far higher output-token ceiling
// than the older flash models, which matters because a full CBSE paper
// (up to 100 marks, 30+ questions with model answers) can run long enough
// to hit the older models' ~8k-token cap mid-JSON. The older models stay
// as fallbacks for accounts where 2.5 isn't available or is over quota.
const MODEL_CANDIDATES = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-1.5-flash-8b', 'gemini-flash-latest'];

// Each model's real output-token ceiling - requests above this are just
// wasted budget (or rejected outright by some models), so the requested
// amount is clamped per-model rather than sent as one flat number.
const MODEL_MAX_OUTPUT_TOKENS: Record<string, number> = {
  'gemini-2.5-flash': 24000,
  'gemini-2.0-flash': 8000,
  'gemini-1.5-flash': 8000,
  'gemini-1.5-flash-8b': 8000,
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
const MODELS_WITH_THINKING_CONFIG = new Set(['gemini-2.5-flash', 'gemini-flash-latest']);

function getApiKey(): string {
  const key = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
  if (!key) {
    throw new PaperGenerationError(
      'AI paper generation isn’t set up yet - ask your school admin to configure the Gemini API key.',
      'missing-api-key',
    );
  }
  return key;
}

async function callGeminiModel(model: string, apiKey: string, prompt: string, requestedMaxOutputTokens: number): Promise<string> {
  const maxOutputTokens = Math.min(requestedMaxOutputTokens, MODEL_MAX_OUTPUT_TOKENS[model] ?? requestedMaxOutputTokens);
  const generationConfig: Record<string, unknown> = {
    responseMimeType: 'application/json',
    maxOutputTokens,
    temperature: 0.8,
  };
  if (MODELS_WITH_THINKING_CONFIG.has(model)) {
    generationConfig.thinkingConfig = { thinkingBudget: 0 };
  }
  const res = await fetch(`${API_BASE}/${model}:generateContent?key=${encodeURIComponent(apiKey)}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig,
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`${model} failed (${res.status}): ${body.slice(0, 200)}`);
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

async function callGemini(prompt: string, maxOutputTokens: number): Promise<string> {
  const apiKey = getApiKey();
  let lastMessage = 'The AI provider is currently unavailable.';

  for (const model of MODEL_CANDIDATES) {
    try {
      return await callGeminiModel(model, apiKey, prompt, maxOutputTokens);
    } catch (err) {
      if (err instanceof PaperGenerationError) throw err;
      lastMessage = err instanceof Error ? err.message : String(err);
    }
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

  async gradeSubjectiveAnswers(request: GradeAnswersRequest): Promise<SubjectiveGrade[]> {
    if (request.answers.length === 0) return [];
    const prompt = buildGradeAnswersPrompt(request);
    try {
      const raw = await callGemini(prompt, 4000);
      const parsed = extractJson(raw);
      return normalizeGrades(parsed, request.answers);
    } catch (err) {
      if (err instanceof PaperGenerationError) throw err;
      const message = err instanceof PaperValidationError ? err.message : 'Could not grade your answers. Please try again.';
      throw new PaperGenerationError(message, 'grading-failed');
    }
  },
};
