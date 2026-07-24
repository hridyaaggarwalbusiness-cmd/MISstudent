// Master subject list, ordered by how commonly each is scheduled/graded -
// not every surface offers every subject (a period slot can be Sports or
// Skating, but a report card entry never is), and a few subjects only apply
// from/until a certain grade. `subjectOptions()` is the single place that
// applies both the per-surface subset and the grade condition, so Timetable,
// Homework and Results/Exams can never drift out of sync with each other.
// The picker built on top of this list still lets a custom subject be typed
// in - this is the school's list of common subjects, not a hard boundary.
interface SubjectDef {
  label: string;
  // Omitted = every grade. Otherwise the grade this subject starts or ends at.
  minGrade?: number;
  maxGrade?: number;
  // Which surfaces offer this subject - 'timetable' covers all of them, so a
  // subject only listed there (e.g. Library) never shows up when posting
  // homework or entering results.
  surfaces: ('timetable' | 'homework' | 'results')[];
}

const ALL = ['timetable', 'homework', 'results'] as const;

const SUBJECT_DEFS: SubjectDef[] = [
  { label: 'Maths', surfaces: [...ALL] },
  { label: 'English Grammar', surfaces: [...ALL] },
  { label: 'English Literature', surfaces: [...ALL] },
  { label: 'Hindi', surfaces: [...ALL] },
  { label: 'Science', minGrade: 6, surfaces: [...ALL] },
  { label: 'E.V.S', maxGrade: 5, surfaces: [...ALL] },
  { label: 'S.S.T', minGrade: 5, surfaces: [...ALL] },
  { label: 'Computer', surfaces: [...ALL] },
  { label: 'Punjabi', minGrade: 6, surfaces: [...ALL] },
  { label: 'Sanskrit', minGrade: 6, surfaces: [...ALL] },
  { label: 'Mental Ability', surfaces: ['timetable', 'homework'] },
  { label: 'Sports', surfaces: ['timetable'] },
  { label: 'Skating', surfaces: ['timetable'] },
  { label: 'Spoken', surfaces: ['timetable', 'homework'] },
  { label: 'Art and Craft', surfaces: ['timetable'] },
];

// Pulls the first number out of a class name like "Grade 9" or "Class 5" -
// null (rather than throwing) for anything that doesn't parse, so an
// unusual class name just gets every grade-conditioned subject rather than
// blocking the picker entirely.
export function parseGrade(className: string): number | null {
  const match = className.match(/\d+/);
  return match ? parseInt(match[0], 10) : null;
}

export function subjectOptions(surface: 'timetable' | 'homework' | 'results', grade: number | null): string[] {
  return SUBJECT_DEFS.filter((s) => {
    if (!s.surfaces.includes(surface)) return false;
    if (grade === null) return true;
    if (s.minGrade !== undefined && grade < s.minGrade) return false;
    if (s.maxGrade !== undefined && grade > s.maxGrade) return false;
    return true;
  }).map((s) => s.label);
}
