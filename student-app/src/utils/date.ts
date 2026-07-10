import {
  differenceInCalendarDays,
  format,
  formatDistanceToNow,
  isToday,
  isTomorrow,
  isYesterday,
  parseISO,
} from 'date-fns';

export function parseDate(iso: string): Date {
  return iso.includes('T') ? new Date(iso) : parseISO(iso);
}

export function friendlyDate(iso: string): string {
  const d = parseDate(iso);
  if (isToday(d)) return 'Today';
  if (isTomorrow(d)) return 'Tomorrow';
  if (isYesterday(d)) return 'Yesterday';
  return format(d, 'd MMM yyyy');
}

export function friendlyDateShort(iso: string): string {
  const d = parseDate(iso);
  if (isToday(d)) return 'Today';
  if (isTomorrow(d)) return 'Tomorrow';
  if (isYesterday(d)) return 'Yesterday';
  return format(d, 'd MMM');
}

export function dueInLabel(iso: string): { label: string; overdue: boolean; urgent: boolean } {
  const d = parseDate(iso);
  const diff = differenceInCalendarDays(d, new Date());
  if (diff < 0) return { label: `Overdue by ${Math.abs(diff)}d`, overdue: true, urgent: true };
  if (diff === 0) return { label: 'Due today', overdue: false, urgent: true };
  if (diff === 1) return { label: 'Due tomorrow', overdue: false, urgent: true };
  return { label: `Due in ${diff}d`, overdue: false, urgent: false };
}

export function relativeTime(iso: string): string {
  return formatDistanceToNow(parseDate(iso), { addSuffix: true });
}

export function weekdayLabel(iso: string): string {
  return format(parseDate(iso), 'EEEE');
}

export function dayMonth(iso: string): { day: string; month: string } {
  const d = parseDate(iso);
  return { day: format(d, 'd'), month: format(d, 'MMM').toUpperCase() };
}

export function greetingForNow(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

export function todayDayCode(): 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat' | 'Sun' {
  const map = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;
  return map[new Date().getDay()];
}
