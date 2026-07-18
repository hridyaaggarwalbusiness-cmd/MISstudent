import { anthropicProvider, ANTHROPIC_API_KEY } from './anthropicProvider';
import { LlmProvider } from './types';

// The single switch for which AI vendor powers every feature in this
// codebase. To move to ChatGPT or Gemini: add openaiProvider.ts /
// geminiProvider.ts implementing LlmProvider (same shape as
// anthropicProvider.ts), then point this export at it - callers never
// change.
export const llmProvider: LlmProvider = anthropicProvider;

export { ANTHROPIC_API_KEY };
export type { LlmProvider } from './types';
export { LlmProviderError } from './types';
