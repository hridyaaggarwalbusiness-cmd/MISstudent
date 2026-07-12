function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

// Whole days between today and the given date string; negative = in the past.
export function daysUntil(dateStr: string): number {
  const today = startOfDay(new Date());
  const target = startOfDay(new Date(dateStr));
  return Math.round((target.getTime() - today.getTime()) / 86_400_000);
}

export function relativeDayLabel(dateStr: string): { label: string; tone: 'danger' | 'warning' | 'info' | 'success' } {
  const diff = daysUntil(dateStr);
  if (diff < 0) return { label: diff === -1 ? '1 day overdue' : `${Math.abs(diff)} days overdue`, tone: 'danger' };
  if (diff === 0) return { label: 'Due today', tone: 'warning' };
  if (diff === 1) return { label: 'Due tomorrow', tone: 'warning' };
  if (diff <= 7) return { label: `Due in ${diff} days`, tone: 'info' };
  return { label: `Due in ${diff} days`, tone: 'success' };
}
