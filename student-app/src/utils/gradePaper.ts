import { AttemptAnswer, GeneratedPaper, PaperAttemptResult, PaperQuestion, QuestionResult, SubjectiveGrade } from '@/types';
import { paperProvider } from '@services/ai';

// Question types with an unambiguous, canonical correct form that can be
// checked instantly without an AI call. Assertion-Reason questions join
// this list only when the generator gave them the standard 4-option format
// (see promptBuilder.ts) - free-text assertion-reason falls back to AI
// grading like the other subjective types.
const OBJECTIVE_TYPES = new Set(['mcq', 'true_false', 'fill_blank', 'numerical', 'match_following']);

function isObjective(question: PaperQuestion): boolean {
  if (OBJECTIVE_TYPES.has(question.type)) return true;
  if (question.type === 'assertion_reason' && question.options && question.options.length > 0) return true;
  return false;
}

function normalizeText(s: string): string {
  return s
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, '')
    .replace(/\s+/g, ' ');
}

function textsMatch(a: string, b: string): boolean {
  const na = normalizeText(a);
  const nb = normalizeText(b);
  if (!na || !nb) return false;
  if (na === nb) return true;
  // Tolerate the student or the model answer being a superset phrase of
  // the other (e.g. "photosynthesis" vs "the process of photosynthesis").
  return na.includes(nb) || nb.includes(na);
}

function parseNumber(text: string): number | null {
  const match = text.replace(/,/g, '').match(/-?\d+(\.\d+)?/);
  return match ? parseFloat(match[0]) : null;
}

function numbersMatch(a: string, b: string): boolean {
  const na = parseNumber(a);
  const nb = parseNumber(b);
  if (na === null || nb === null) return textsMatch(a, b);
  const tolerance = Math.max(0.01, Math.abs(nb) * 0.01);
  return Math.abs(na - nb) <= tolerance;
}

function gradeMatchFollowing(question: PaperQuestion, answer: AttemptAnswer | undefined): QuestionResult {
  const pairs = question.matchPairs ?? [];
  const perPair = pairs.length > 0 ? question.marks / pairs.length : 0;
  const selections = answer?.matchSelections ?? [];
  let correctCount = 0;
  const studentLines: string[] = [];

  pairs.forEach((pair, i) => {
    const pickedIndex = selections[i];
    const picked = typeof pickedIndex === 'number' && pickedIndex >= 0 ? pairs[pickedIndex]?.right : undefined;
    if (picked && picked === pair.right) correctCount++;
    studentLines.push(`${pair.left} → ${picked ?? '(unmatched)'}`);
  });

  const marksAwarded = Math.round(correctCount * perPair * 100) / 100;
  const correctText = pairs.map((p) => `${p.left} → ${p.right}`).join('; ');
  const answered = selections.some((s) => typeof s === 'number' && s >= 0);

  return {
    questionId: question.id,
    marksAwarded,
    maxMarks: question.marks,
    method: answered ? 'objective' : 'unanswered',
    correct: correctCount === pairs.length && pairs.length > 0,
    studentAnswerText: answered ? studentLines.join('; ') : '(not attempted)',
    correctAnswerText: correctText,
  };
}

// Instantly grades every question with an unambiguous correct form
// (MCQ/True-False/Fill-Blank/Numerical/Match-the-Following, plus
// Assertion-Reason when it has the standard 4-option format) without any
// network call. Returns null for genuinely subjective questions, which the
// caller routes to gradeAttempt's AI batch instead.
export function gradeObjectiveQuestion(question: PaperQuestion, answer: AttemptAnswer | undefined): QuestionResult | null {
  if (!isObjective(question)) return null;

  if (question.type === 'match_following') return gradeMatchFollowing(question, answer);

  const response = answer?.response?.trim() ?? '';
  if (!response) {
    return {
      questionId: question.id,
      marksAwarded: 0,
      maxMarks: question.marks,
      method: 'unanswered',
      correct: false,
      studentAnswerText: '(not attempted)',
      correctAnswerText: question.answer,
    };
  }

  const isCorrect = question.type === 'numerical' ? numbersMatch(response, question.answer) : textsMatch(response, question.answer);

  return {
    questionId: question.id,
    marksAwarded: isCorrect ? question.marks : 0,
    maxMarks: question.marks,
    method: 'objective',
    correct: isCorrect,
    studentAnswerText: response,
    correctAnswerText: question.answer,
  };
}

function gradeForPercentage(pct: number): string {
  if (pct >= 90) return 'A+';
  if (pct >= 80) return 'A';
  if (pct >= 70) return 'B+';
  if (pct >= 60) return 'B';
  if (pct >= 50) return 'C';
  if (pct >= 33) return 'D';
  return 'F';
}

// Orchestrates a full submission: grades every objective question
// instantly, then sends the remaining subjective questions to the AI
// provider in a single batched call (skipped entirely if there are none).
export async function gradeAttempt(paper: GeneratedPaper, answers: AttemptAnswer[]): Promise<PaperAttemptResult> {
  const answerById = new Map(answers.map((a) => [a.questionId, a]));
  const allQuestions = paper.sections.flatMap((s) => s.questions);

  const objectiveResults: QuestionResult[] = [];
  const subjectiveQuestions: PaperQuestion[] = [];

  allQuestions.forEach((q) => {
    const result = gradeObjectiveQuestion(q, answerById.get(q.id));
    if (result) objectiveResults.push(result);
    else subjectiveQuestions.push(q);
  });

  let subjectiveGrades: SubjectiveGrade[] = [];
  if (subjectiveQuestions.length > 0) {
    subjectiveGrades = await paperProvider.gradeSubjectiveAnswers({
      request: {
        classLabel: paper.classLabel,
        subject: paper.subject,
        topics: paper.topics,
        paperType: paper.paperType,
        totalMarks: paper.totalMarks,
        difficulty: paper.difficulty,
        language: paper.language,
        durationMinutes: paper.durationMinutes,
      },
      answers: subjectiveQuestions.map((q) => ({
        questionId: q.id,
        questionText: q.text,
        maxMarks: q.marks,
        modelAnswer: q.answer,
        studentAnswer: answerById.get(q.id)?.response ?? '',
      })),
    });
  }

  const gradeById = new Map(subjectiveGrades.map((g) => [g.questionId, g]));
  const subjectiveResults: QuestionResult[] = subjectiveQuestions.map((q) => {
    const g = gradeById.get(q.id);
    const response = answerById.get(q.id)?.response?.trim() ?? '';
    return {
      questionId: q.id,
      marksAwarded: g?.marksAwarded ?? 0,
      maxMarks: q.marks,
      method: response ? 'ai' : 'unanswered',
      correct: (g?.marksAwarded ?? 0) >= q.marks,
      studentAnswerText: response || '(not attempted)',
      correctAnswerText: q.answer,
      feedback: g?.feedback,
    };
  });

  const questionResults = [...objectiveResults, ...subjectiveResults].sort((a, b) => {
    const na = allQuestions.find((q) => q.id === a.questionId)?.number ?? 0;
    const nb = allQuestions.find((q) => q.id === b.questionId)?.number ?? 0;
    return na - nb;
  });

  const totalMarksAwarded = Math.round(questionResults.reduce((sum, r) => sum + r.marksAwarded, 0) * 100) / 100;
  const totalMaxMarks = questionResults.reduce((sum, r) => sum + r.maxMarks, 0);
  const percentage = totalMaxMarks > 0 ? Math.round((totalMarksAwarded / totalMaxMarks) * 1000) / 10 : 0;

  return {
    totalMarksAwarded,
    totalMaxMarks,
    percentage,
    grade: gradeForPercentage(percentage),
    questionResults,
    gradedAt: new Date().toISOString(),
  };
}
