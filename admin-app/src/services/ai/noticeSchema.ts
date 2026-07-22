import type { GeneratedNoticeContent } from './noticeProvider';

export class NoticeValidationError extends Error {}

// The most common way an otherwise-correct AI response becomes invalid
// JSON: a raw, unescaped newline/tab character sitting inside a JSON
// string value instead of its escaped \n/\t form (e.g. a multi-paragraph
// notice body), or a trailing comma before a closing brace. Both are
// silent, single-character mistakes that break JSON.parse even though the
// rest of the response is fine. This walks the text tracking whether each
// character sits inside a JSON string (respecting backslash-escapes and
// quote boundaries) and only rewrites control characters found there, then
// strips trailing commas - it never touches anything outside a string
// value, so it can't alter well-formed JSON. Only invoked as a fallback
// after a first, unmodified parse attempt has already failed - it can
// rescue an otherwise-broken response, never change one that already
// parsed fine. Mirrors student-app/src/services/ai/paperSchema.ts.
function repairJsonWhitespace(text: string): string {
  let result = '';
  let inString = false;
  let escaped = false;
  for (const ch of text) {
    if (inString) {
      if (escaped) {
        result += ch;
        escaped = false;
      } else if (ch === '\\') {
        result += ch;
        escaped = true;
      } else if (ch === '"') {
        inString = false;
        result += ch;
      } else if (ch === '\n') {
        result += '\\n';
      } else if (ch === '\r') {
        result += '\\r';
      } else if (ch === '\t') {
        result += '\\t';
      } else {
        result += ch;
      }
    } else if (ch === '"') {
      inString = true;
      result += ch;
    } else {
      result += ch;
    }
  }
  return result.replace(/,(\s*[}\]])/g, '$1');
}

// Models sometimes wrap JSON in ```json fences or add a stray sentence
// around it despite instructions - this pulls out the outermost {...}
// object rather than trusting the response to be bare JSON. Mirrors
// student-app/src/services/ai/paperSchema.ts's extractJson().
export function extractJson(raw: string): unknown {
  const trimmed = raw.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced ? fenced[1].trim() : trimmed;
  const start = candidate.indexOf('{');
  const end = candidate.lastIndexOf('}');
  const jsonText = start >= 0 && end > start ? candidate.slice(start, end + 1) : candidate;
  try {
    return JSON.parse(jsonText);
  } catch {
    try {
      return JSON.parse(repairJsonWhitespace(jsonText));
    } catch {
      throw new NoticeValidationError('AI response was not valid JSON.');
    }
  }
}

function isNonEmptyString(v: unknown): v is string {
  return typeof v === 'string' && v.trim().length > 0;
}

export function normalizeNotice(raw: unknown): GeneratedNoticeContent {
  const obj = raw as Record<string, unknown>;
  if (!obj || typeof obj !== 'object') throw new NoticeValidationError('AI response is not a JSON object.');
  if (!isNonEmptyString(obj.title)) throw new NoticeValidationError('AI response is missing "title".');
  if (!isNonEmptyString(obj.body)) throw new NoticeValidationError('AI response is missing "body".');
  return { title: obj.title.trim(), body: obj.body.trim() };
}
