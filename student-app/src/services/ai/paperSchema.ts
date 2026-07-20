import {
  GeneratedPaper,
  PaperQuestion,
  PaperSection,
  PracticeTestRequest,
  QuestionType,
  SubjectiveAnswerToGrade,
  SubjectiveGrade,
} from '@/types';

export class PaperValidationError extends Error {}

// Models sometimes wrap JSON in ```json fences or add a stray sentence
// around it despite instructions - this pulls out the outermost {...}
// object rather than trusting the response to be bare JSON. Mirrors
// functions/src/practiceTest/schema.ts (see promptBuilder.ts for why this
// app keeps a client-side copy instead of calling that Cloud Function).
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
    topics: request.topics,
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

function stringArray(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return v.filter((s): s is string => typeof s === 'string' && s.trim().length > 0).map((s) => s.trim());
}

// Grading is intentionally more forgiving than paper generation: a missing
// or out-of-range mark for one question shouldn't fail the whole batch when
// the other 9 graded fine, so out-of-range values are clamped rather than
// thrown, and any question the model dropped just falls back to 0.
export function normalizeGrades(raw: unknown, expected: SubjectiveAnswerToGrade[]): SubjectiveGrade[] {
  if (!Array.isArray(raw)) throw new PaperValidationError('AI grading response is not a JSON array.');

  const byId = new Map<string, Record<string, unknown>>();
  raw.forEach((item) => {
    const g = item as Record<string, unknown>;
    if (g && isNonEmptyString(g.questionId)) byId.set(g.questionId, g);
  });

  return expected.map((exp) => {
    const g = byId.get(exp.questionId);
    const rawMarks = typeof g?.marksAwarded === 'number' ? g.marksAwarded : 0;
    const marksAwarded = Math.max(0, Math.min(exp.maxMarks, rawMarks));
    const explanation = isNonEmptyString(g?.explanation) ? (g!.explanation as string).trim() : 'Graded by AI.';
    return {
      questionId: exp.questionId,
      marksAwarded,
      explanation,
      missingConcepts: stringArray(g?.missingConcepts),
      incorrectConcepts: stringArray(g?.incorrectConcepts),
      suggestions: isNonEmptyString(g?.suggestions) ? (g!.suggestions as string).trim() : '',
    };
  });
}
