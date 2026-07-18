import { GeneratedPaper, PaperQuestion, PaperSection, PracticeTestRequest, QuestionType } from './types';

export class PaperValidationError extends Error {}

// Models sometimes wrap JSON in ```json fences or add a stray sentence
// around it despite instructions - this pulls out the outermost {...}
// object rather than trusting the response to be bare JSON.
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
    throw new PaperValidationError('AI response was not valid JSON.');
  }
}

const QUESTION_TYPES = new Set<QuestionType>([
  'mcq',
  'fill_blank',
  'true_false',
  'match_following',
  'very_short',
  'short',
  'long',
  'case_study',
  'assertion_reason',
  'numerical',
]);

function isNonEmptyString(v: unknown): v is string {
  return typeof v === 'string' && v.trim().length > 0;
}

function normalizeQuestion(raw: unknown, index: number): PaperQuestion {
  const q = raw as Record<string, unknown>;
  if (!q || typeof q !== 'object') throw new PaperValidationError(`Question ${index} is not an object.`);
  if (!isNonEmptyString(q.text)) throw new PaperValidationError(`Question ${index} is missing "text".`);
  if (typeof q.marks !== 'number' || q.marks <= 0) throw new PaperValidationError(`Question ${index} has invalid "marks".`);
  if (typeof q.type !== 'string' || !QUESTION_TYPES.has(q.type as QuestionType)) {
    throw new PaperValidationError(`Question ${index} has invalid "type": ${String(q.type)}.`);
  }
  if (!isNonEmptyString(q.answer)) throw new PaperValidationError(`Question ${index} is missing "answer".`);

  return {
    id: isNonEmptyString(q.id) ? q.id : `q${index}`,
    number: index,
    type: q.type as QuestionType,
    text: q.text.trim(),
    marks: q.marks,
    options: Array.isArray(q.options) ? q.options.map(String) : undefined,
    matchPairs: Array.isArray(q.matchPairs)
      ? (q.matchPairs as Record<string, unknown>[]).map((p) => ({ left: String(p.left ?? ''), right: String(p.right ?? '') }))
      : undefined,
    caseText: isNonEmptyString(q.caseText) ? q.caseText : undefined,
    answer: q.answer.trim(),
    explanation: isNonEmptyString(q.explanation) ? q.explanation : undefined,
  };
}

function normalizeSection(raw: unknown, index: number): PaperSection {
  const s = raw as Record<string, unknown>;
  if (!s || typeof s !== 'object') throw new PaperValidationError(`Section ${index} is not an object.`);
  if (!isNonEmptyString(s.title)) throw new PaperValidationError(`Section ${index} is missing "title".`);
  if (!Array.isArray(s.questions) || s.questions.length === 0) {
    throw new PaperValidationError(`Section ${index} ("${String(s.title)}") has no questions.`);
  }
  return {
    id: isNonEmptyString(s.id) ? s.id : `section-${index}`,
    title: s.title.trim(),
    instructions: isNonEmptyString(s.instructions) ? s.instructions : undefined,
    questions: s.questions.map((q, i) => normalizeQuestion(q, i + 1)),
  };
}

export function normalizePaper(raw: unknown, request: PracticeTestRequest): GeneratedPaper {
  const obj = raw as Record<string, unknown>;
  if (!obj || typeof obj !== 'object') throw new PaperValidationError('AI response is not a JSON object.');
  if (!isNonEmptyString(obj.title)) throw new PaperValidationError('AI response is missing "title".');
  if (!Array.isArray(obj.sections) || obj.sections.length === 0) {
    throw new PaperValidationError('AI response is missing "sections".');
  }

  const sections = obj.sections.map((s, i) => normalizeSection(s, i + 1));

  // Renumber sequentially across the whole paper regardless of what the
  // model returned, so numbering is always internally consistent even if
  // the model miscounted.
  let n = 1;
  sections.forEach((s) => s.questions.forEach((q) => { q.number = n++; }));

  const sumMarks = sections.reduce((sum, s) => sum + s.questions.reduce((sSum, q) => sSum + q.marks, 0), 0);
  if (sumMarks !== request.totalMarks) {
    throw new PaperValidationError(`Question marks add up to ${sumMarks}, but the paper must total exactly ${request.totalMarks}.`);
  }

  return {
    title: obj.title.trim(),
    classLabel: request.classLabel,
    subject: request.subject,
    chapterTopic: request.chapterTopic,
    paperType: request.paperType,
    totalMarks: request.totalMarks,
    difficulty: request.difficulty,
    language: request.language,
    durationMinutes: request.durationMinutes,
    generalInstructions: Array.isArray(obj.generalInstructions) ? obj.generalInstructions.map(String) : [],
    sections,
    generatedAt: new Date().toISOString(),
  };
}

export function normalizeRegeneratedQuestion(
  raw: unknown,
  template: { id: string; number: number; type: QuestionType; marks: number },
): PaperQuestion {
  const q = raw as Record<string, unknown>;
  if (!q || typeof q !== 'object') throw new PaperValidationError('AI response is not a JSON object.');
  if (!isNonEmptyString(q.text)) throw new PaperValidationError('AI response is missing "text".');
  if (!isNonEmptyString(q.answer)) throw new PaperValidationError('AI response is missing "answer".');

  return {
    id: template.id,
    number: template.number,
    type: template.type,
    marks: template.marks,
    text: q.text.trim(),
    options: Array.isArray(q.options) ? q.options.map(String) : undefined,
    matchPairs: Array.isArray(q.matchPairs)
      ? (q.matchPairs as Record<string, unknown>[]).map((p) => ({ left: String(p.left ?? ''), right: String(p.right ?? '') }))
      : undefined,
    caseText: isNonEmptyString(q.caseText) ? q.caseText : undefined,
    answer: q.answer.trim(),
    explanation: isNonEmptyString(q.explanation) ? q.explanation : undefined,
  };
}
