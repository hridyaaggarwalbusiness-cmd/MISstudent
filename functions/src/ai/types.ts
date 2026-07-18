// The one contract every LLM backend must satisfy. Nothing outside this
// folder should ever import a concrete provider (anthropicProvider, a
// future openaiProvider, etc.) directly - always go through `../ai` (see
// index.ts), so swapping vendors touches exactly one line in this package.
export interface LlmProvider {
  complete(prompt: string, opts?: { maxTokens?: number }): Promise<string>;
}

export class LlmProviderError extends Error {}
