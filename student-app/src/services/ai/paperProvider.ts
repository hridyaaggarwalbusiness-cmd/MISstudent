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
