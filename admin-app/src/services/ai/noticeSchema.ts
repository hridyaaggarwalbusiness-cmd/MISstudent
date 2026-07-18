import type { GeneratedNoticeContent } from './noticeProvider';

export class NoticeValidationError extends Error {}

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
    throw new NoticeValidationError('AI response was not valid JSON.');
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
