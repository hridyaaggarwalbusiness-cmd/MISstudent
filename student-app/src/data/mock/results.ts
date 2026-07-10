import { subMonths, formatISO } from 'date-fns';
import { ExamResult, SubjectMark } from '@/types';

const iso = (d: Date) => formatISO(d, { representation: 'date' });
const today = new Date();

function gradeFor(pct: number): string {
  if (pct >= 90) return 'A+';
  if (pct >= 80) return 'A';
  if (pct >= 70) return 'B+';
  if (pct >= 60) return 'B';
  if (pct >= 50) return 'C';
  return 'D';
}

function buildSubjects(marks: number[]): SubjectMark[] {
  const subjects = ['Mathematics', 'English', 'Science', 'Social Studies', 'Hindi', 'Computer Science'];
  return subjects.map((subject, i) => {
    const maxMarks = 100;
    const marksObtained = marks[i];
    return { subject, marksObtained, maxMarks, grade: gradeFor(marksObtained) };
  });
}

function summarize(subjects: SubjectMark[]) {
  const totalObtained = subjects.reduce((s, m) => s + m.marksObtained, 0);
  const totalMax = subjects.reduce((s, m) => s + m.maxMarks, 0);
  const percentage = Math.round((totalObtained / totalMax) * 1000) / 10;
  return { totalObtained, totalMax, percentage, grade: gradeFor(percentage) };
}

const term1Subjects = buildSubjects([78, 85, 74, 88, 69, 92]);
const term2Subjects = buildSubjects([82, 88, 79, 90, 73, 95]);
const term3Subjects = buildSubjects([88, 91, 84, 92, 77, 97]);

export const mockResults: ExamResult[] = [
  {
    id: 'result_1',
    examName: 'Unit Test 1',
    term: 'Term 1',
    date: iso(subMonths(today, 6)),
    subjects: term1Subjects,
    ...summarize(term1Subjects),
    rank: 8,
    outOf: 42,
    teacherRemark: 'Good start to the year. Focus more on Hindi grammar.',
  },
  {
    id: 'result_2',
    examName: 'Mid-Term Examination',
    term: 'Term 2',
    date: iso(subMonths(today, 3)),
    subjects: term2Subjects,
    ...summarize(term2Subjects),
    rank: 5,
    outOf: 42,
    teacherRemark: 'Noticeable improvement across all subjects. Keep up the consistency.',
  },
  {
    id: 'result_3',
    examName: 'Unit Test 2',
    term: 'Term 3',
    date: iso(subMonths(today, 1)),
    subjects: term3Subjects,
    ...summarize(term3Subjects),
    rank: 3,
    outOf: 42,
    teacherRemark: 'Excellent performance! Among the top scorers in Computer Science and Social Studies.',
  },
];
