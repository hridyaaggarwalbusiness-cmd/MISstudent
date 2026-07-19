import type { NoticeGenerateRequest } from './noticeProvider';

const NOTICE_TYPE_LABEL: Record<string, string> = {
  holiday: 'Holiday',
  examination: 'Examination',
  ptm: 'Parent-Teacher Meeting',
  event: 'Event',
  circular: 'Circular',
  urgent: 'Urgent Notice',
  general: 'General',
};

const AUDIENCE_LABEL: Record<string, string> = {
  all: 'All Students',
  classes: 'Selected Classes',
  teachers: 'Teachers',
  parents: 'Parents',
};

const PRIORITY_LABEL: Record<string, string> = {
  normal: 'Normal',
  important: 'Important',
  urgent: 'Urgent',
};

const TONE_INSTRUCTION: Record<string, string> = {
  formal: 'Formal and businesslike - precise, reserved wording, no exclamation marks.',
  friendly: 'Warm and approachable - still professional, but conversational and welcoming.',
  enthusiastic: 'Enthusiastic and upbeat - convey genuine excitement about this announcement, while staying respectful and appropriate for a school notice.',
  urgent: 'Urgent and direct - short, emphatic sentences that make the importance and any deadline unmistakable.',
  sympathetic: 'Sympathetic and reassuring - gentle, caring wording, appropriate for sensitive or difficult news.',
};

function salutationFor(audience: NoticeGenerateRequest['audience']): string {
  if (audience === 'teachers') return '"Dear Teachers,"';
  if (audience === 'parents') return '"Dear Parents,"';
  return '"Dear Students," or "Dear Parents," (whichever fits this notice better)';
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
  } catch {
    return iso;
  }
}

// This is the exact system prompt the feature was specced with - kept as one
// literal block rather than reconstructed piecemeal so its wording can't
// drift from what was agreed.
const SYSTEM_PROMPT = `You are writing official CBSE school notices. Generate only the notice title (if required) and the notice body. Do not generate the school name, NOTICE heading, date, logo, border, principal name, signature, footer, or any formatting. Start with "Dear Parents," or "Dear Students," depending on the selected audience. Use formal and professional school language. Keep the notice concise, grammatically correct, respectful, and suitable for official school communication. End with a proper closing paragraph, but do not write "Thanks & Regards" because it already exists in the template.`;

export function buildGenerateNoticePrompt(request: NoticeGenerateRequest): string {
  const { noticeType, audience, classLabels, priority, tone, noticeDate, effectiveDate, titleHint, instruction } = request;

  return `${SYSTEM_PROMPT}

Formatting note: wrap important terms the reader must not miss — specific dates, deadlines, times, and named organizations — in **double asterisks** so they render in bold on the printed notice, the same way the original letterhead emphasizes key details. Use this sparingly, only for genuinely important terms.

Tone: ${TONE_INSTRUCTION[tone] ?? TONE_INSTRUCTION.formal} Stay within this tone throughout the notice, without ever becoming unprofessional.

Notice type: ${NOTICE_TYPE_LABEL[noticeType] ?? noticeType}
Audience: ${AUDIENCE_LABEL[audience] ?? audience}${classLabels.length ? ` (${classLabels.join(', ')})` : ''}
Priority: ${PRIORITY_LABEL[priority] ?? priority}
Notice date: ${formatDate(noticeDate)}
${effectiveDate ? `Effective from: ${formatDate(effectiveDate)}\n` : ''}Correct salutation to open the body with: ${salutationFor(audience)}
${titleHint ? `Suggested title (refine it if you can make it clearer, otherwise keep it close to this): "${titleHint}"` : 'Generate a short, clear notice title (4-10 words) that summarizes this notice.'}

Admin's instruction - what this notice needs to communicate:
"""
${instruction}
"""

Respond with ONLY raw JSON (no markdown code fences, no commentary before or after it) matching EXACTLY this shape:
{
  "title": string,
  "body": string
}`;
}
