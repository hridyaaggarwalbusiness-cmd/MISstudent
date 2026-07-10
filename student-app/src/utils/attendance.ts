import { AttendanceDay } from '@/types';

export function overallAttendancePercentage(days: AttendanceDay[]): number {
  const countable = days.filter(
    (d) => d.status !== 'weekend' && d.status !== 'future' && d.status !== 'holiday' && d.status !== 'unmarked',
  );
  if (countable.length === 0) return 0;
  const present = countable.filter((d) => d.status === 'present' || d.status === 'late').length;
  return Math.round((present / countable.length) * 1000) / 10;
}
