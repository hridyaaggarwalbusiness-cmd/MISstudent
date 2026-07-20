import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { getFirestore } from 'firebase-admin/firestore';
import { llmProvider, ANTHROPIC_API_KEY } from '../ai';
import { buildGeneratePrompt, buildGradeAnswersPrompt, buildRegenerateQuestionPrompt } from './prompt';
import { extractJson, normalizeGrades, normalizePaper, normalizeRegeneratedQuestion, PaperValidationError } from './schema';
import {
  GeneratedPaper,
  GradeAnswersRequest,
  PaperQuestion,
  PracticeTestRequest,
  QuestionType,
  RegenerateQuestionRequest,
  SubjectiveAnswerToGrade,
  SubjectiveGrade,
} from './types';

async function assertIsStudent(uid: string | undefined) {
  if (!uid) throw new HttpsError('unauthenticated', 'You must be signed in.');
  const snap = await getFirestore().collection('users').doc(uid).get();
  if (snap.data()?.role !== 'student') {
    throw new HttpsError('permission-denied', 'Only students can generate practice tests.');
  }
}

const PAPER_TYPES = new Set(['practice_test', 'unit_test', 'half_yearly', 'annual_exam', 'mcq_practice', 'revision_test']);
const DIFFICULTIES = new Set(['easy', 'medium', 'hard', 'mixed']);
const LANGUAGES = new Set(['english', 'hindi']);
const QUESTION_TYPES = new Set([
  'mcq', 'fill_blank', 'true_false', 'match_following', 'very_short', 'short', 'long', 'case_study', 'assertion_reason', 'numerical',
]);

function validateRequest(data: unknown): PracticeTestRequest {
  const d = (data ?? {}) as Record<string, unknown>;
  const errors: string[] = [];
  if (typeof d.classLabel !== 'string' || !d.classLabel.trim()) errors.push('classLabel');
  if (typeof d.subject !== 'string' || !d.subject.trim()) errors.push('subject');
  if (!Array.isArray(d.topics) || d.topics.length === 0 || !d.topics.every((t) => typeof t === 'string' && t.trim())) {
    errors.push('topics');
  }
  if (typeof d.totalMarks !== 'number' || d.totalMarks <= 0 || d.totalMarks > 200) errors.push('totalMarks');
  if (typeof d.paperType !== 'string' || !PAPER_TYPES.has(d.paperType)) errors.push('paperType');
  if (typeof d.difficulty !== 'string' || !DIFFICULTIES.has(d.difficulty)) errors.push('difficulty');
  if (typeof d.language !== 'string' || !LANGUAGES.has(d.language)) errors.push('language');
  if (d.durationMinutes != null && (typeof d.durationMinutes !== 'number' || d.durationMinutes <= 0)) errors.push('durationMinutes');
  if (errors.length) throw new HttpsError('invalid-argument', `Invalid or missing fields: ${errors.join(', ')}`);

  return {
    classLabel: (d.classLabel as string).trim(),
    subject: (d.subject as string).trim(),
    topics: (d.topics as string[]).map((t) => t.trim().slice(0, 200)),
    paperType: d.paperType as PracticeTestRequest['paperType'],
    totalMarks: d.totalMarks as number,
    difficulty: d.difficulty as PracticeTestRequest['difficulty'],
    language: d.language as PracticeTestRequest['language'],
    durationMinutes: typeof d.durationMinutes === 'number' ? d.durationMinutes : undefined,
  };
}

// Retries once with the validation failure fed back to the model - marks
// mismatches and malformed JSON are the two failure modes worth a second
// try; anything else is treated as a hard failure.
async function generateValidatedPaper(request: PracticeTestRequest): Promise<GeneratedPaper> {
  const prompt = buildGeneratePrompt(request);
  let lastError: Error | undefined;
  for (let attempt = 0; attempt < 2; attempt++) {
    const correction = lastError
      ? `\n\nYour previous attempt was invalid: ${lastError.message}\nFix this and respond again with ONLY the corrected JSON.`
      : '';
    try {
      const raw = await llmProvider.complete(prompt + correction, { maxTokens: 8000 });
      const parsed = extractJson(raw);
      return normalizePaper(parsed, request);
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
    }
  }
  throw new HttpsError('internal', `The AI could not produce a valid paper: ${lastError?.message ?? 'unknown error'}`);
}

export const generatePracticeTestPaper = onCall(
  { secrets: [ANTHROPIC_API_KEY], timeoutSeconds: 120, memory: '512MiB' },
  async (req) => {
    await assertIsStudent(req.auth?.uid);
    const request = validateRequest(req.data);
    return generateValidatedPaper(request);
  },
);

function validateRegenerateRequest(data: unknown): RegenerateQuestionRequest {
  const d = (data ?? {}) as Record<string, unknown>;
  const errors: string[] = [];
  if (!d.request || typeof d.request !== 'object') errors.push('request');
  if (typeof d.sectionTitle !== 'string' || !d.sectionTitle.trim()) errors.push('sectionTitle');
  if (typeof d.questionType !== 'string' || !QUESTION_TYPES.has(d.questionType)) errors.push('questionType');
  if (typeof d.marks !== 'number' || d.marks <= 0) errors.push('marks');
  if (errors.length) throw new HttpsError('invalid-argument', `Invalid or missing fields: ${errors.join(', ')}`);

  return {
    request: validateRequest(d.request),
    existingQuestionTexts: Array.isArray(d.existingQuestionTexts) ? d.existingQuestionTexts.map(String) : [],
    sectionTitle: (d.sectionTitle as string).trim(),
    questionType: d.questionType as QuestionType,
    marks: d.marks as number,
  };
}

export const regeneratePracticeTestQuestion = onCall(
  { secrets: [ANTHROPIC_API_KEY], timeoutSeconds: 60 },
  async (req): Promise<PaperQuestion> => {
    await assertIsStudent(req.auth?.uid);
    const { request, existingQuestionTexts, sectionTitle, questionType, marks } = validateRegenerateRequest(req.data);

    const prompt = buildRegenerateQuestionPrompt({ request, existingQuestionTexts, sectionTitle, questionType, marks });
    try {
      const raw = await llmProvider.complete(prompt, { maxTokens: 1500 });
      const parsed = extractJson(raw);
      return normalizeRegeneratedQuestion(parsed, { id: `q-${Date.now()}`, number: 0, type: questionType, marks });
    } catch (err) {
      if (err instanceof PaperValidationError) throw new HttpsError('internal', err.message);
      throw new HttpsError('internal', err instanceof Error ? err.message : 'Failed to regenerate question.');
    }
  },
);

function validateGradeRequest(data: unknown): GradeAnswersRequest {
  const d = (data ?? {}) as Record<string, unknown>;
  if (!d.request || typeof d.request !== 'object') throw new HttpsError('invalid-argument', 'Missing "request".');
  if (!Array.isArray(d.answers) || d.answers.length === 0) throw new HttpsError('invalid-argument', 'Missing "answers".');

  const answers: SubjectiveAnswerToGrade[] = d.answers.map((raw, i) => {
    const a = raw as Record<string, unknown>;
    if (typeof a.questionId !== 'string' || !a.questionId.trim()) {
      throw new HttpsError('invalid-argument', `answers[${i}] is missing "questionId".`);
    }
    if (typeof a.maxMarks !== 'number' || a.maxMarks <= 0) {
      throw new HttpsError('invalid-argument', `answers[${i}] has invalid "maxMarks".`);
    }
    return {
      questionId: a.questionId,
      questionText: typeof a.questionText === 'string' ? a.questionText : '',
      maxMarks: a.maxMarks,
      studentAnswer: typeof a.studentAnswer === 'string' ? a.studentAnswer : '',
    };
  });

  return { request: validateRequest(d.request), answers };
}

// Batches every subjective question in one submission into a single AI call
// rather than one request per question, to keep quota usage low.
export const gradePracticeTestAnswers = onCall(
  { secrets: [ANTHROPIC_API_KEY], timeoutSeconds: 90 },
  async (req): Promise<SubjectiveGrade[]> => {
    await assertIsStudent(req.auth?.uid);
    const { request, answers } = validateGradeRequest(req.data);

    const prompt = buildGradeAnswersPrompt({ request, answers });
    // Each graded answer returns an explanation plus missing/incorrect
    // concept lists and a suggestion, not a single feedback sentence -
    // scale the budget with the batch size the same way the student-app
    // copy of this call does (see geminiProvider.ts's gradingTokenBudget).
    const maxTokens = Math.min(24000, Math.max(3000, answers.length * 900));
    try {
      const raw = await llmProvider.complete(prompt, { maxTokens });
      const parsed = extractJson(raw);
      return normalizeGrades(parsed, answers);
    } catch (err) {
      if (err instanceof PaperValidationError) throw new HttpsError('internal', err.message);
      throw new HttpsError('internal', err instanceof Error ? err.message : 'Failed to grade answers.');
    }
  },
);
