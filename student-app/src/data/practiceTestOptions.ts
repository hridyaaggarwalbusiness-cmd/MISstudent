import { Difficulty, PaperLanguage, PaperType } from '@/types';

export const CLASS_OPTIONS = Array.from({ length: 12 }, (_, i) => `Class ${i + 1}`);

const PRIMARY_SUBJECTS = ['English', 'Hindi', 'Mathematics', 'EVS', 'Computer Science', 'General Knowledge'];
const MIDDLE_SUBJECTS = ['English', 'Hindi', 'Mathematics', 'Science', 'Social Science', 'Sanskrit', 'Computer Science'];
const SECONDARY_SUBJECTS = ['English', 'Hindi', 'Mathematics', 'Science', 'Social Science', 'Sanskrit', 'Computer Applications'];
const SENIOR_SECONDARY_SUBJECTS = [
  'English',
  'Physics',
  'Chemistry',
  'Mathematics',
  'Biology',
  'Computer Science',
  'Accountancy',
  'Business Studies',
  'Economics',
  'History',
  'Political Science',
  'Geography',
];

// CBSE's subject offering shifts meaningfully at three points: primary
// (1-5) is EVS-based with no streams, middle (6-8) introduces standalone
// Science/Social Science, and senior secondary (11-12) drops EVS/Social
// Science for stream electives.
export function subjectsForClass(classLabel: string): string[] {
  const n = parseInt(classLabel.replace(/[^0-9]/g, ''), 10);
  if (n <= 5) return PRIMARY_SUBJECTS;
  if (n <= 8) return MIDDLE_SUBJECTS;
  if (n <= 10) return SECONDARY_SUBJECTS;
  return SENIOR_SECONDARY_SUBJECTS;
}

// A paper "in Hindi" only makes sense for subjects where the medium of
// instruction itself varies - an English-subject paper tests English, so
// forcing a language choice there is meaningless.
export function languagesForSubject(subject: string): PaperLanguage[] {
  if (subject === 'English') return ['english'];
  if (subject === 'Hindi' || subject === 'Sanskrit') return ['hindi'];
  return ['english', 'hindi'];
}

export const PAPER_TYPE_OPTIONS: { value: PaperType; label: string; description: string }[] = [
  { value: 'practice_test', label: 'Practice Test', description: 'A balanced mixed-format paper for regular practice' },
  { value: 'unit_test', label: 'Unit Test', description: 'Short, focused test for a single chapter or topic' },
  { value: 'half_yearly', label: 'Half-Yearly Pattern', description: 'Mid-term board-style structure' },
  { value: 'annual_exam', label: 'Annual Exam Pattern', description: 'Full board-exam-style structure' },
  { value: 'mcq_practice', label: 'MCQ Practice', description: 'Mostly multiple-choice questions' },
  { value: 'revision_test', label: 'Revision Test', description: 'Quick recall-focused revision paper' },
];

export const MARKS_PRESETS = [10, 20, 30, 40, 50, 80, 100];

export const DIFFICULTY_OPTIONS: { value: Difficulty; label: string }[] = [
  { value: 'easy', label: 'Easy' },
  { value: 'medium', label: 'Medium' },
  { value: 'hard', label: 'Hard' },
  { value: 'mixed', label: 'Mixed' },
];

export const DURATION_PRESETS = [30, 45, 60, 90, 120, 180];

export const LANGUAGE_LABEL: Record<PaperLanguage, string> = {
  english: 'English',
  hindi: 'Hindi',
};

export const PAPER_TYPE_LABEL: Record<PaperType, string> = Object.fromEntries(
  PAPER_TYPE_OPTIONS.map((o) => [o.value, o.label]),
) as Record<PaperType, string>;

export const DIFFICULTY_LABEL: Record<Difficulty, string> = Object.fromEntries(
  DIFFICULTY_OPTIONS.map((o) => [o.value, o.label]),
) as Record<Difficulty, string>;
