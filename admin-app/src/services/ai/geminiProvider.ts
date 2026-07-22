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

// Google fully retired the entire Gemini 2.5 generation for this project
// sometime before July 2026 (gemini-2.5-flash / gemini-2.5-flash-lite both
// 404 with "no longer available to new users") - see
// student-app/src/services/ai/geminiProvider.ts for the full account of
// how this was diagnosed. Current lineup as of July 2026: gemini-3.5-flash
// (released May 2026, free tier) as primary, gemini-3.1-flash-lite (GA
// since May 2026, free tier) as fallback - not the same-day-released
// gemini-3.5-flash-lite/gemini-3.6-flash, which are too unproven yet for a
// fallback that needs to just work. If every candidate here starts failing
// again, check https://ai.google.dev/gemini-api/docs/models for the
// current model IDs rather than assuming these are still current.
const MODEL_CANDIDATES = ['gemini-3.5-flash', 'gemini-3.1-flash-lite'];

// A notice is a few short paragraphs, nowhere near the token budgets the
// practice-test generator needs - these are deliberately small.
const MODEL_MAX_OUTPUT_TOKENS: Record<string, number> = {
  'gemini-3.5-flash': 4000,
  'gemini-3.1-flash-lite': 2000,
};

// Gemini 3.x models "think" before answering by default, and those
// invisible reasoning tokens draw from the same maxOutputTokens budget as
// the visible response. Gemini 3 replaced the old numeric `thinkingBudget`
// field with `thinkingLevel` ("low" | "medium" | "high") - sending the old
// field name gets a flat 400 INVALID_ARGUMENT. "low" leaves the most
// budget for the actual notice text (Gemini 3 has no true "off" setting).
const MODELS_WITH_THINKING_CONFIG = new Set(['gemini-3.5-flash', 'gemini-3.1-flash-lite']);

// Every candidate model gets this long to answer before it's raced out -
// see callGemini below.
const REQUEST_TIMEOUT_MS = 12000;

// Google rejects a `?key=` value it doesn't recognize as a real API key in
// two different ways depending on what was actually sent: a malformed-but-
// key-shaped string gets 400 INVALID_ARGUMENT ("API key not valid"), while a
// value that isn't a key at all - an OAuth token, a session cookie, anything
// else - gets 401 UNAUTHENTICATED ("Request had invalid authentication
// credentials. Expected OAuth 2 access token, login cookie or other valid
// authentication credential"). Both mean the same thing here: whatever is
// configured isn't a usable Generative Language API key - a config mistake,
// not a transient AI-provider problem.
function isInvalidKeyError(body: string): boolean {
  return /API key not valid|API_KEY_INVALID|invalid authentication credentials|UNAUTHENTICATED/i.test(body);
}

function getApiKey(): string {
  const key = import.meta.env.VITE_GEMINI_API_KEY as string | undefined;
  if (!key) {
    throw new NoticeGenerationError(
      'AI notice generation isn’t set up yet — the Gemini API key hasn’t been configured for this app.',
      'missing-api-key',
    );
  }
  return key;
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
    generationConfig.thinkingConfig = { thinkingLevel: 'low' };
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
    const err = new Error(`${model} failed (${res.status}): ${body.slice(0, 200)}`) as Error & { invalidKey?: boolean };
    err.invalidKey = isInvalidKeyError(body);
    throw err;
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

// Every candidate model is raced at once rather than tried one at a time,
// same reasoning as student-app's practice-test generator: bounds the whole
// call to roughly one request's round trip instead of the sum of every
// sequential attempt, and aborts the losers the moment one succeeds.
async function callGemini(prompt: string, maxOutputTokens: number): Promise<string> {
  const apiKey = getApiKey();
  const controllers = MODEL_CANDIDATES.map(() => new AbortController());
  const timeoutId = setTimeout(() => controllers.forEach((c) => c.abort()), REQUEST_TIMEOUT_MS);
  // Every model's own distinct failure message, not just whichever one
  // happened to be last in the race - see student-app's geminiProvider.ts
  // for the full reasoning.
  const messagesByModel = new Map<string, string>();
  let sawInvalidKey = false;

  try {
    return await Promise.any(
      MODEL_CANDIDATES.map((model, i) => callGeminiModel(model, apiKey, prompt, maxOutputTokens, controllers[i].signal)),
    );
  } catch (aggregate) {
    const errors = aggregate instanceof AggregateError ? aggregate.errors : [aggregate];
    errors.forEach((err, i) => {
      if (err instanceof NoticeGenerationError) throw err;
      messagesByModel.set(MODEL_CANDIDATES[i] ?? `model ${i}`, err instanceof Error ? err.message : String(err));
      if (err instanceof Error && (err as Error & { invalidKey?: boolean }).invalidKey) {
        sawInvalidKey = true;
      }
    });
  } finally {
    clearTimeout(timeoutId);
    controllers.forEach((c) => c.abort());
  }

  if (sawInvalidKey) {
    throw new NoticeGenerationError(
      'The configured Gemini API key is invalid or malformed - Gemini rejected it outright (not a quota or overload issue). Double-check it was copied in full from Google Cloud Console / AI Studio into VITE_GEMINI_API_KEY, with no missing characters, extra whitespace, or stray line breaks.',
      'invalid-api-key',
    );
  }
  const allMessages = Array.from(messagesByModel.values()).join(' | ');
  throw new NoticeGenerationError(`AI provider request failed on every available model. ${allMessages}`, 'gemini-all-models-failed');
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
