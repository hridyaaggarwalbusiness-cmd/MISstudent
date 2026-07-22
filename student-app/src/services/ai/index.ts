import { geminiProvider } from './geminiProvider';
import { PaperProvider } from './paperProvider';

// The single place that picks which backend answers "generate me a paper" -
// every screen imports `paperProvider` from here, never a concrete provider
// file directly, so this line is the entire footprint of swapping AI
// vendors (or backends) later.
//
// Currently: geminiProvider, which calls Google's Gemini API directly from
// the browser - this is the only path that works on Firebase's free Spark
// plan (see geminiProvider.ts for the API key/security tradeoff that comes
// with that). If you enable the Blaze plan, swap this back to
// `cloudFunctionPaperProvider` (unchanged, still in this folder) to run the
// AI call through a Cloud Function instead, where the key never reaches
// the client at all.
export const paperProvider: PaperProvider = geminiProvider;

export { PaperGenerationError, friendlyAiErrorMessage } from './paperProvider';
export type { PaperProvider } from './paperProvider';
