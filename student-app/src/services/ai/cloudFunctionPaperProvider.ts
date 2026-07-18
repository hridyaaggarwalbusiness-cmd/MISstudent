import { httpsCallable, FunctionsError } from 'firebase/functions';
import { functions } from '@services/firebase';
import {
  GeneratedPaper,
  GradeAnswersRequest,
  PaperQuestion,
  PracticeTestRequest,
  RegenerateQuestionRequest,
  SubjectiveGrade,
} from '@/types';
import { PaperGenerationError, PaperProvider } from './paperProvider';

// The actual LLM call (and its API key) lives entirely server-side in a
// Cloud Function - this class is just a thin, typed RPC client. It never
// talks to an AI API directly, so no provider credential is ever shipped to
// the browser/app bundle.
const generatePracticeTestPaper = httpsCallable<PracticeTestRequest, GeneratedPaper>(functions, 'generatePracticeTestPaper');
const regeneratePracticeTestQuestion = httpsCallable<RegenerateQuestionRequest, PaperQuestion>(
  functions,
  'regeneratePracticeTestQuestion',
);
const gradePracticeTestAnswers = httpsCallable<GradeAnswersRequest, SubjectiveGrade[]>(functions, 'gradePracticeTestAnswers');

function toFriendlyError(err: unknown): PaperGenerationError {
  if (err instanceof FunctionsError) {
    if (err.code === 'functions/not-found' || err.code === 'functions/internal') {
      return new PaperGenerationError(
        'AI paper generation isn’t set up yet on this server. Please ask your school admin to enable it.',
        err.code,
      );
    }
    if (err.code === 'functions/unauthenticated' || err.code === 'functions/permission-denied') {
      return new PaperGenerationError('Please sign in again to generate a paper.', err.code);
    }
    if (err.code === 'functions/deadline-exceeded') {
      return new PaperGenerationError('The AI took too long to respond. Please try again.', err.code);
    }
    return new PaperGenerationError(err.message || 'Could not generate the paper. Please try again.', err.code);
  }
  return new PaperGenerationError('Could not generate the paper. Please check your connection and try again.');
}

export const cloudFunctionPaperProvider: PaperProvider = {
  async generatePaper(request) {
    try {
      const result = await generatePracticeTestPaper(request);
      return result.data;
    } catch (err) {
      throw toFriendlyError(err);
    }
  },

  async regenerateQuestion(request) {
    try {
      const result = await regeneratePracticeTestQuestion(request);
      return result.data;
    } catch (err) {
      throw toFriendlyError(err);
    }
  },

  async gradeSubjectiveAnswers(request) {
    if (request.answers.length === 0) return [];
    try {
      const result = await gradePracticeTestAnswers(request);
      return result.data;
    } catch (err) {
      throw toFriendlyError(err);
    }
  },
};
