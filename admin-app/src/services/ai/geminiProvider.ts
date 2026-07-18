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

const MODEL_CANDIDATES = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-1.5-flash-8b', 'gemini-flash-latest'];

// A notice is a few short paragraphs, nowhere near the token budgets the
// practice-test generator needs - these are deliberately small.
const MODEL_MAX_OUTPUT_TOKENS: Record<string, number> = {
  'gemini-2.5-flash': 4000,
  'gemini-2.0-flash': 2000,
  'gemini-1.5-flash': 2000,
  'gemini-1.5-flash-8b': 2000,
  'gemini-flash-latest': 2000,
};

// The 2.5-generation models "think" before answering by default, and those
// invisible reasoning tokens draw from the same maxOutputTokens budget as
// the visible response - disabling it keeps the full budget for the actual
// notice text.
const MODELS_WITH_THINKING_CONFIG = new Set(['gemini-2.5-flash', 'gemini-flash-latest']);

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

async function callGeminiModel(model: string, apiKey: string, prompt: string, requestedMaxOutputTokens: number): Promise<string> {
  const maxOutputTokens = Math.min(requestedMaxOutputTokens, MODEL_MAX_OUTPUT_TOKENS[model] ?? requestedMaxOutputTokens);
  const generationConfig: Record<string, unknown> = {
    responseMimeType: 'application/json',
    maxOutputTokens,
    temperature: 0.7,
  };
  if (MODELS_WITH_THINKING_CONFIG.has(model)) {
    generationConfig.thinkingConfig = { thinkingBudget: 0 };
  }

  const res = await fetch(`${API_BASE}/${model}:generateContent?key=${encodeURIComponent(apiKey)}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig }),
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

async function callGemini(prompt: string, maxOutputTokens: number): Promise<string> {
  const apiKey = getApiKey();
  let lastMessage = 'The AI provider is currently unavailable.';

  for (const model of MODEL_CANDIDATES) {
    try {
      return await callGeminiModel(model, apiKey, prompt, maxOutputTokens);
    } catch (err) {
      if (err instanceof NoticeGenerationError) throw err;
      lastMessage = err instanceof Error ? err.message : String(err);
    }
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
