import { TimetablePeriod } from '@/types';

export interface SchoolStatus {
  headline: string;
  minutesLabel?: string;
  sublabel: string;
}

function toMinutes(t: string): number {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

function formatMinutes(total: number): string {
  if (total <= 1) return 'now';
  if (total < 60) return `${total} min`;
  const h = Math.floor(total / 60);
  const m = total % 60;
  return m === 0 ? `${h} hr` : `${h} hr ${m} min`;
}

// Drives the home screen's hero banner: where the student is relative to
// today's timetable right now (before school / in class / between classes /
// day over / no school today).
export function computeSchoolStatus(todaysPeriods: TimetablePeriod[]): SchoolStatus {
  const classPeriods = [...todaysPeriods.filter((p) => !p.isBreak)].sort(
    (a, b) => toMinutes(a.startTime) - toMinutes(b.startTime),
  );

  if (classPeriods.length === 0) {
    return { headline: 'No classes today', sublabel: 'Enjoy your day off! 🎉' };
  }

  const nowMinutes = new Date().getHours() * 60 + new Date().getMinutes();
  const first = classPeriods[0];
  const last = classPeriods[classPeriods.length - 1];
  const current = classPeriods.find(
    (p) => nowMinutes >= toMinutes(p.startTime) && nowMinutes < toMinutes(p.endTime),
  );

  if (nowMinutes < toMinutes(first.startTime)) {
    return {
      headline: 'School starts in',
      minutesLabel: formatMinutes(toMinutes(first.startTime) - nowMinutes),
      sublabel: 'Have a great day! ☀️',
    };
  }

  if (current) {
    return {
      headline: `${current.subject} is on now`,
      sublabel: `Ends in ${formatMinutes(toMinutes(current.endTime) - nowMinutes)}`,
    };
  }

  if (nowMinutes < toMinutes(last.endTime)) {
    const next = classPeriods.find((p) => toMinutes(p.startTime) > nowMinutes);
    if (next) {
      return {
        headline: 'Next class in',
        minutesLabel: formatMinutes(toMinutes(next.startTime) - nowMinutes),
        sublabel: next.subject,
      };
    }
  }

  return { headline: "School's done for today!", sublabel: 'Enjoy your evening 🌙' };
}
