import { defineSecret } from 'firebase-functions/params';
import { LlmProvider, LlmProviderError } from './types';

// Set via `firebase functions:secrets:set ANTHROPIC_API_KEY` (interactive -
// the raw key is never written to a file or committed) before this function
// can be deployed and used.
export const ANTHROPIC_API_KEY = defineSecret('ANTHROPIC_API_KEY');

const MODEL = 'claude-sonnet-5';
const API_URL = 'https://api.anthropic.com/v1/messages';

interface AnthropicResponse {
  content?: { type: string; text?: string }[];
}

export const anthropicProvider: LlmProvider = {
  async complete(prompt, opts = {}) {
    const apiKey = ANTHROPIC_API_KEY.value();
    if (!apiKey) {
      throw new LlmProviderError('ANTHROPIC_API_KEY secret is not configured on this Cloud Function.');
    }

    const res = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: opts.maxTokens ?? 8000,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!res.ok) {
      const body = await res.text().catch(() => '');
      throw new LlmProviderError(`Anthropic API request failed (${res.status}): ${body.slice(0, 300)}`);
    }

    const data = (await res.json()) as AnthropicResponse;
    const text = data.content?.find((block) => block.type === 'text')?.text;
    if (!text) throw new LlmProviderError('Anthropic API returned an empty response.');
    return text;
  },
};
