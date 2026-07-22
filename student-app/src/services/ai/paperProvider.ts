import {
  GeneratedPaper,
  GradeAnswersRequest,
  PaperQuestion,
  PracticeTestRequest,
  RegenerateQuestionRequest,
  SubjectiveGrade,
} from '@/types';

// The one contract every concrete AI backend must satisfy. Screens and the
// prompt/business logic only ever depend on this interface - swapping the
// underlying model (ChatGPT, Claude, Gemini, ...) means writing one new file
// that implements it and pointing `index.ts` at it, nothing else in the app
// changes.
export interface PaperProvider {
  generatePaper(request: PracticeTestRequest): Promise<GeneratedPaper>;
  regenerateQuestion(request: RegenerateQuestionRequest): Promise<PaperQuestion>;
  gradeSubjectiveAnswers(request: GradeAnswersRequest): Promise<SubjectiveGrade[]>;
}

export class PaperGenerationError extends Error {
  constructor(message: string, public readonly code?: string) {
    super(message);
    this.name = 'PaperGenerationError';
  }
}

// Every screen that calls the AI shows whatever this returns directly to
// the student, so it's the one place deciding how much of the real error
// they see. Two codes are shown verbatim because they're genuine,
// actionable information rather than a description of something broken:
// "topic-not-in-syllabus" (which class/topic to pick instead) and
// "quota-exceeded" (today's free-tier AI usage is used up - it resets on
// its own; retrying right now won't help, so it needs to read differently
// from a real failure or a student/admin will just keep retrying a request
// that can't succeed until the quota resets). Everything else (invalid
// key, model failures, malformed AI output, etc.) is real but not
// something a student can act on, so it's replaced with one plain,
// consistent message rather than raw technical detail.
export function friendlyAiErrorMessage(err: unknown): string {
  if (err instanceof PaperGenerationError && (err.code === 'topic-not-in-syllabus' || err.code === 'quota-exceeded')) {
    return err.message;
  }
  return "There's a network error. Please try again.";
}
