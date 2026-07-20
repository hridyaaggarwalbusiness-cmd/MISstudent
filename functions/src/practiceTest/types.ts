// Mirrors student-app's src/types/index.ts practice-test shapes. There's no
// shared package between the apps and the Cloud Functions backend (same
// pattern as the fee-receipt types elsewhere in this codebase), so this is
// kept in sync by hand.
export type PaperType = 'practice_test' | 'unit_test' | 'half_yearly' | 'annual_exam' | 'mcq_practice' | 'revision_test';
export type Difficulty = 'easy' | 'medium' | 'hard' | 'mixed';
export type PaperLanguage = 'english' | 'hindi';
export type QuestionType =
  | 'mcq'
  | 'fill_blank'
  | 'true_false'
  | 'match_following'
  | 'very_short'
  | 'short'
  | 'long'
  | 'case_study'
  | 'assertion_reason'
  | 'numerical';

export interface PracticeTestRequest {
  classLabel: string;
  subject: string;
  topics: string[];
  paperType: PaperType;
  totalMarks: number;
  difficulty: Difficulty;
  language: PaperLanguage;
  durationMinutes?: number;
}

export interface MatchPair {
  left: string;
  right: string;
}

export interface PaperQuestion {
  id: string;
  number: number;
  type: QuestionType;
  text: string;
  marks: number;
  options?: string[];
  matchPairs?: MatchPair[];
  caseText?: string;
  answer: string;
  explanation?: string;
}

export interface PaperSection {
  id: string;
  title: string;
  instructions?: string;
  questions: PaperQuestion[];
}

export interface GeneratedPaper {
  title: string;
  classLabel: string;
  subject: string;
  topics: string[];
  paperType: PaperType;
  totalMarks: number;
  difficulty: Difficulty;
  language: PaperLanguage;
  durationMinutes?: number;
  generalInstructions: string[];
  sections: PaperSection[];
  generatedAt: string;
}

export interface RegenerateQuestionRequest {
  request: PracticeTestRequest;
  existingQuestionTexts: string[];
  sectionTitle: string;
  questionType: QuestionType;
  marks: number;
}

// Deliberately excludes a "model answer" - the AI grades by understanding
// the question and the student's answer like a real examiner would, not by
// text-matching against a canned reference key (see prompt.ts).
export interface SubjectiveAnswerToGrade {
  questionId: string;
  questionText: string;
  maxMarks: number;
  studentAnswer: string;
}

export interface GradeAnswersRequest {
  request: PracticeTestRequest;
  answers: SubjectiveAnswerToGrade[];
}

export interface SubjectiveGrade {
  questionId: string;
  marksAwarded: number;
  explanation: string;
  missingConcepts: string[];
  incorrectConcepts: string[];
  suggestions: string;
}
