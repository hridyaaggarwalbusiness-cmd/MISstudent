const CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';

// Generates a temporary password for bulk-imported accounts that didn't
// come with one in the spreadsheet. Meets Firebase Auth's 6-char minimum
// with room to spare, and avoids visually ambiguous characters (0/O, 1/l/I)
// since these get read off a screen and typed in by hand.
export function generateTempPassword(): string {
  let out = '';
  for (let i = 0; i < 10; i++) {
    out += CHARS[Math.floor(Math.random() * CHARS.length)];
  }
  return out;
}
