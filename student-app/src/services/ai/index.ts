import { cloudFunctionPaperProvider } from './cloudFunctionPaperProvider';
import { PaperProvider } from './paperProvider';

// The single place that picks which backend answers "generate me a paper" -
// every screen imports `paperProvider` from here, never a concrete provider
// file directly, so this line is the entire footprint of swapping AI
// vendors later.
export const paperProvider: PaperProvider = cloudFunctionPaperProvider;

export { PaperGenerationError } from './paperProvider';
export type { PaperProvider } from './paperProvider';
