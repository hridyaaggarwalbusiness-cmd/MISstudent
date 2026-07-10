import {
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isAfter,
  isWeekend,
  formatISO,
  subMonths,
} from 'date-fns';
import { AttendanceDay, AttendanceStatus, AttendanceSubjectSummary } from '@/types';

const iso = (d: Date) => formatISO(d, { representation: 'date' });
const today = new Date();

// deterministic pseudo-random based on date string, so the pattern is stable across renders
function seededStatus(dateStr: string): AttendanceStatus {
  let hash = 0;
  for (let i = 0; i < dateStr.length; i++) {
    hash = (hash << 5) - hash + dateStr.charCodeAt(i);
    hash |= 0;
  }
  const n = Math.abs(hash) % 100;
  if (n < 84) return 'present';
  if (n < 90) return 'late';
  if (n < 96) return 'absent';
  return 'leave';
}

function generateMonth(monthDate: Date): AttendanceDay[] {
  const start = startOfMonth(monthDate);
  const end = endOfMonth(monthDate);
  const days = eachDayOfInterval({ start, end });

  return days.map((d) => {
    const dateStr = iso(d);
    if (isAfter(d, today)) {
      return { date: dateStr, status: 'future' as AttendanceStatus };
    }
    if (isWeekend(d)) {
      return { date: dateStr, status: 'weekend' as AttendanceStatus };
    }
    return { date: dateStr, status: seededStatus(dateStr) };
  });
}

export const mockAttendanceCurrentMonth = generateMonth(today);
export const mockAttendancePreviousMonth = generateMonth(subMonths(today, 1));

export function attendanceForMonth(monthDate: Date): AttendanceDay[] {
  return generateMonth(monthDate);
}

export const mockAttendanceSubjectSummary: AttendanceSubjectSummary[] = [
  { subject: 'Mathematics', present: 42, total: 46 },
  { subject: 'English', present: 44, total: 46 },
  { subject: 'Science', present: 40, total: 46 },
  { subject: 'Social Studies', present: 43, total: 45 },
  { subject: 'Hindi', present: 39, total: 44 },
  { subject: 'Computer Science', present: 45, total: 46 },
];

export function overallAttendancePercentage(days: AttendanceDay[]): number {
  const countable = days.filter((d) => d.status !== 'weekend' && d.status !== 'future' && d.status !== 'holiday');
  if (countable.length === 0) return 0;
  const present = countable.filter((d) => d.status === 'present' || d.status === 'late').length;
  return Math.round((present / countable.length) * 1000) / 10;
}
