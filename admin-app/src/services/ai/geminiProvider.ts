import type { GeneratedNoticeContent, NoticeGenerateRequest, NoticeProvider } from './noticeProvider';
import { NoticeGenerationError } from './noticeProvider';
import { buildGenerateNoticePrompt } from './promptBuilder';
import { extractJson, normalizeNotice, NoticeValidationError } from './noticeSchema';

// Same architecture as student-app/src/services/ai/geminiProvider.ts (the
// AI Practice Test Generator) - calls Gemini directly from the browser
// since this project runs on Firebase's free Spark plan (no Cloud
// Functions). Restrict this key by HTTP referrer in Google Cloud Console
// to this app's real domains, same as the student-app key.
const API_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';

// gemini-2.0-flash, gemini-1.5-flash, and gemini-1.5-flash-8b have all been
// permanently retired by Google (shut down / returning 404) as of 2026 - see
// student-app/src/services/ai/geminiProvider.ts for the same note.
const MODEL_CANDIDATES = ['gemini-2.5-flash', 'gemini-2.5-flash-lite', 'gemini-flash-latest'];

// A notice is a few short paragraphs, nowhere near the token budgets the
// practice-test generator needs - these are deliberately small.
const MODEL_MAX_OUTPUT_TOKENS: Record<string, number> = {
  'gemini-2.5-flash': 4000,
  'gemini-2.5-flash-lite': 2000,
  'gemini-flash-latest': 2000,
};

// The 2.5-generation models "think" before answering by default, and those
// invisible reasoning tokens draw from the same maxOutputTokens budget as
// the visible response - disabling it keeps the full budget for the actual
// notice text.
const MODELS_WITH_THINKING_CONFIG = new Set(['gemini-2.5-flash', 'gemini-2.5-flash-lite', 'gemini-flash-latest']);

// Every key/model combination gets this long to answer before it's raced
// out - see callGemini below.
const REQUEST_TIMEOUT_MS = 12000;

// Each free-tier Gemini API key (from its own Google Cloud project) has an
// independent daily quota, small enough that a handful of AI notices can
// exhaust it. This rotates through every configured key in order -
// callGemini falls through to the next key once the current one's models
// are all failing, effectively stacking each key's daily budget on top of
// the others.
function getApiKeys(): string[] {
  const primary = import.meta.env.VITE_GEMINI_API_KEY as string | undefined;
  const extra = import.meta.env.VITE_GEMINI_API_KEYS_EXTRA as string | undefined;
  const keys = [primary, ...(extra ? extra.split(',') : [])]
    .map((k) => k?.trim())
    .filter((k): k is string => !!k);
  if (keys.length === 0) {
    throw new NoticeGenerationError(
      'AI notice generation isn’t set up yet — the Gemini API key hasn’t been configured for this app.',
      'missing-api-key',
    );
  }
  return keys;
}

async function callGeminiModel(
  model: string,
  apiKey: string,
  prompt: string,
  requestedMaxOutputTokens: number,
  signal: AbortSignal,
): Promise<string> {
  const maxOutputTokens = Math.min(requestedMaxOutputTokens, MODEL_MAX_OUTPUT_TOKENS[model] ?? requestedMaxOutputTokens);
  const generationConfig: Record<string, unknown> = {
    responseMimeType: 'application/json',
    maxOutputTokens,
    temperature: 0.7,
  };
  if (MODELS_WITH_THINKING_CONFIG.has(model)) {
    generationConfig.thinkingConfig = { thinkingBudget: 0 };
  }

  let res: Response;
  try {
    res = await fetch(`${API_BASE}/${model}:generateContent?key=${encodeURIComponent(apiKey)}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig }),
      signal,
    });
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') {
      throw new Error(`${model} timed out after ${REQUEST_TIMEOUT_MS / 1000}s`);
    }
    throw err;
  }

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
    throw new NoticeGenerationError('The AI declined to generate this notice. Try rephrasing the instruction.', 'gemini-safety');
  }
  if (reason === 'MAX_TOKENS') {
    throw new Error(`${model} hit its output token limit before finishing the notice (requested ${maxOutputTokens} tokens).`);
  }
  if (!text) {
    throw new Error(`${model} returned an empty response (finishReason: ${reason ?? 'unknown'})`);
  }
  return text;
}

// Every key/model combination is raced at once rather than tried one at a
// time, same reasoning as student-app's practice-test generator: bounds the
// whole call to roughly one request's round trip instead of the sum of
// every sequential attempt, and aborts the losers the moment one succeeds.
async function callGemini(prompt: string, maxOutputTokens: number): Promise<string> {
  const apiKeys = getApiKeys();
  const combos = apiKeys.flatMap((apiKey) => MODEL_CANDIDATES.map((model) => ({ apiKey, model })));
  const controllers = combos.map(() => new AbortController());
  const timeoutId = setTimeout(() => controllers.forEach((c) => c.abort()), REQUEST_TIMEOUT_MS);
  let lastMessage = 'The AI provider is currently unavailable.';

  try {
    return await Promise.any(
      combos.map(({ apiKey, model }, i) => callGeminiModel(model, apiKey, prompt, maxOutputTokens, controllers[i].signal)),
    );
  } catch (aggregate) {
    const errors = aggregate instanceof AggregateError ? aggregate.errors : [aggregate];
    for (const err of errors) {
      if (err instanceof NoticeGenerationError) throw err;
      lastMessage = err instanceof Error ? err.message : String(err);
    }
  } finally {
    clearTimeout(timeoutId);
    controllers.forEach((c) => c.abort());
  }

  throw new NoticeGenerationError(`AI provider request failed on every available model. ${lastMessage}`, 'gemini-all-models-failed');
}

// Retries once with the validation failure fed back to the model, same
// pattern as the practice-test generator.
async function generateValidatedNotice(request: NoticeGenerateRequest): Promise<GeneratedNoticeContent> {
  const prompt = buildGenerateNoticePrompt(request);
  let lastError: Error | undefined;
  for (let attempt = 0; attempt < 2; attempt++) {
    const correction = lastError
      ? `\n\nYour previous attempt was invalid: ${lastError.message}\nFix this and respond again with ONLY the corrected JSON.`
      : '';
    try {
      const raw = await callGemini(prompt + correction, 3000);
      const parsed = extractJson(raw);
      return normalizeNotice(parsed);
    } catch (err) {
      if (err instanceof NoticeGenerationError) throw err;
      lastError = err instanceof NoticeValidationError ? err : err instanceof Error ? err : new Error(String(err));
    }
  }
  throw new NoticeGenerationError(`The AI could not produce a valid notice: ${lastError?.message ?? 'unknown error'}`, 'validation-failed');
}

export const geminiProvider: NoticeProvider = {
  generateNotice: generateValidatedNotice,
};
