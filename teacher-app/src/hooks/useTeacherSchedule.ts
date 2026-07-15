import { useEffect, useMemo, useState } from 'react';
import { repo } from '@data/repositories';
import { useAuthStore } from '@store/useAuthStore';
import { DayOfWeek, TimetablePeriod } from '@/types';

export interface ScheduleSlot {
  day: DayOfWeek;
  periodNumber: number;
  startTime: string;
  endTime: string;
  taught: TimetablePeriod | null;
}

const DAY_ORDER: DayOfWeek[] = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// Derives a teacher's own cross-class schedule straight from the whole
// school's timetable: a slot is "taught" if this teacher is assigned to it
// in any class, otherwise it's a free period. The slot universe (which
// periods exist on a given day, and their times) is the union of whatever
// any class's timetable defines for that day/periodNumber, since period
// timing isn't guaranteed identical across every class's individual cells.
export function useTeacherSchedule() {
  const { teacher } = useAuthStore();
  const [periods, setPeriods] = useState<TimetablePeriod[] | null>(null);

  useEffect(() => repo.timetable.subscribeAll(setPeriods), []);

  const slotsByDay = useMemo<Record<DayOfWeek, ScheduleSlot[]> | null>(() => {
    if (!periods) return null;
    const teaching = periods.filter((p) => !p.isBreak);

    const slotMap = new Map<string, { day: DayOfWeek; periodNumber: number; startTime: string; endTime: string }>();
    teaching.forEach((p) => {
      const key = `${p.day}-${p.periodNumber}`;
      if (!slotMap.has(key)) {
        slotMap.set(key, { day: p.day, periodNumber: p.periodNumber, startTime: p.startTime, endTime: p.endTime });
      }
    });

    const result = Object.fromEntries(DAY_ORDER.map((d) => [d, [] as ScheduleSlot[]])) as Record<
      DayOfWeek,
      ScheduleSlot[]
    >;
    Array.from(slotMap.values())
      .sort((a, b) => a.periodNumber - b.periodNumber)
      .forEach((slot) => {
        const taught =
          teaching.find(
            (p) => p.day === slot.day && p.periodNumber === slot.periodNumber && p.teacherId === teacher?.id,
          ) ?? null;
        result[slot.day].push({ ...slot, taught });
      });
    return result;
  }, [periods, teacher?.id]);

  return { loading: slotsByDay === null, slotsByDay };
}

// Schools don't run periods on Sunday, so it has no entry in slotsByDay —
// callers that derive a day-of-week from an arbitrary picked date (which
// can land on a Sunday) should go through this instead of indexing directly.
export function slotsForDay(
  slotsByDay: Record<DayOfWeek, ScheduleSlot[]> | null,
  day: DayOfWeek | 'Sun',
): ScheduleSlot[] {
  if (!slotsByDay || day === 'Sun') return [];
  return slotsByDay[day];
}
