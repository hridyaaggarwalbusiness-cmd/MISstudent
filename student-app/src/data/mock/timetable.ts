import { DayOfWeek, TimetablePeriod } from '@/types';

const subjectTeacherRoom: Record<string, { teacher: string; room: string }> = {
  Mathematics: { teacher: 'Mr. Arvind Rao', room: 'Room 204' },
  English: { teacher: 'Ms. Priya Nair', room: 'Room 101' },
  Science: { teacher: 'Dr. Sunita Verma', room: 'Lab 3' },
  'Social Studies': { teacher: 'Mr. Karan Mehta', room: 'Room 108' },
  Hindi: { teacher: 'Mrs. Anjali Gupta', room: 'Room 105' },
  'Computer Science': { teacher: 'Mr. Rohit Malhotra', room: 'Computer Lab' },
  Art: { teacher: 'Ms. Fatima Khan', room: 'Art Studio' },
  'Physical Education': { teacher: 'Mr. Vikram Singh', room: 'Sports Ground' },
};

const days: DayOfWeek[] = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const weeklyPattern: Record<DayOfWeek, (string | 'BREAK')[]> = {
  Mon: ['Mathematics', 'English', 'Science', 'BREAK', 'Social Studies', 'Hindi', 'Computer Science'],
  Tue: ['Science', 'Mathematics', 'Computer Science', 'BREAK', 'English', 'Physical Education', 'Art'],
  Wed: ['Hindi', 'Social Studies', 'Mathematics', 'BREAK', 'Science', 'English', 'Art'],
  Thu: ['English', 'Science', 'Social Studies', 'BREAK', 'Mathematics', 'Computer Science', 'Hindi'],
  Fri: ['Mathematics', 'Hindi', 'English', 'BREAK', 'Science', 'Social Studies', 'Physical Education'],
  Sat: ['Computer Science', 'Art', 'Mathematics', 'BREAK', 'English', 'Science'],
};

const periodTimes = [
  ['08:00', '08:45'],
  ['08:45', '09:30'],
  ['09:30', '10:15'],
  ['10:15', '10:35'],
  ['10:35', '11:20'],
  ['11:20', '12:05'],
  ['12:05', '12:50'],
];

export function generateTimetable(): TimetablePeriod[] {
  const periods: TimetablePeriod[] = [];
  days.forEach((day) => {
    const pattern = weeklyPattern[day];
    pattern.forEach((subject, idx) => {
      const [startTime, endTime] = periodTimes[idx];
      if (subject === 'BREAK') {
        periods.push({
          id: `${day}-${idx}`,
          day,
          periodNumber: idx + 1,
          startTime,
          endTime,
          subject: 'Recess',
          teacher: '',
          room: '',
          isBreak: true,
        });
        return;
      }
      const meta = subjectTeacherRoom[subject];
      periods.push({
        id: `${day}-${idx}`,
        day,
        periodNumber: idx + 1,
        startTime,
        endTime,
        subject,
        teacher: meta?.teacher ?? '',
        room: meta?.room ?? '',
      });
    });
  });
  return periods;
}

export const mockTimetable = generateTimetable();
export const allSubjects = Object.keys(subjectTeacherRoom);
