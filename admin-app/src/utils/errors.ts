const FIREBASE_ERROR_MESSAGES: Record<string, string> = {
  'auth/email-already-in-use': 'An account with this email already exists.',
  'auth/invalid-email': 'That email address looks invalid.',
  'auth/weak-password': 'Password must be at least 6 characters.',
  'auth/network-request-failed': 'Network error — check your connection and try again.',
  'auth/too-many-requests': 'Too many attempts. Please wait a moment and try again.',
  'permission-denied': "You don't have permission to do that.",
};

// Firebase errors come through as `Error("Firebase: <message> (auth/weak-password).")`
// or as FirebaseError objects with a `.code` field depending on the SDK path taken.
export function getErrorMessage(error: unknown): string {
  if (error && typeof error === 'object' && 'code' in error) {
    const code = String((error as { code: unknown }).code);
    if (FIREBASE_ERROR_MESSAGES[code]) return FIREBASE_ERROR_MESSAGES[code];
  }
  if (error instanceof Error) {
    const match = error.message.match(/\(([a-z-]+\/[a-z-]+)\)/);
    if (match && FIREBASE_ERROR_MESSAGES[match[1]]) return FIREBASE_ERROR_MESSAGES[match[1]];
    if (error.message.includes('Missing or insufficient permissions')) {
      return FIREBASE_ERROR_MESSAGES['permission-denied'];
    }
    return error.message.replace(/^Firebase:\s*/, '');
  }
  return 'Something went wrong. Please try again.';
}
