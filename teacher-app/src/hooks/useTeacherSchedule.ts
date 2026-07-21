import { useEffect, useMemo, useState } from 'react';
import { repo } from '@data/repositories';
import { useAuthStore } from '@store/useAuthStore';
import { DayOfWeek, PeriodSchedule, TimetablePeriod } from '@/types';

export interface ScheduleSlot {
  id: string;
  type: 'period' | 'break';
  day: DayOfWeek;
  label: string;
  periodNumber: number | null;
  startTime: string;
  endTime: string;
  taught: TimetablePeriod | null;
}

const DAY_ORDER: DayOfWeek[] = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// Derives a teacher's own cross-class schedule from the admin-authored
// PeriodSchedule (the same row structure - and period numbering - every
// class's timetable follows), overlaying which of those rows this teacher
// teaches. Break/recess rows are included so a teacher's day reads the same
// as every other timetable surface, but they never carry a period number.
export function useTeacherSchedule() {
  const { teacher } = useAuthStore();
  const [periods, setPeriods] = useState<TimetablePeriod[] | null>(null);
  const [schedule, setSchedule] = useState<PeriodSchedule | null>(null);

  useEffect(() => repo.timetable.subscribeAll(setPeriods), []);
  useEffect(() => repo.periodSchedule.subscribe(setSchedule), []);

  const slotsByDay = useMemo<Record<DayOfWeek, ScheduleSlot[]> | null>(() => {
    if (!periods || !schedule) return null;
    const teaching = periods.filter((p) => !p.isBreak);
    const sortedSlots = [...schedule.slots].sort((a, b) => a.order - b.order);

    const result = Object.fromEntries(DAY_ORDER.map((d) => [d, [] as ScheduleSlot[]])) as Record<
      DayOfWeek,
      ScheduleSlot[]
    >;

    DAY_ORDER.forEach((day) => {
      sortedSlots.forEach((slot) => {
        if (slot.type === 'break') {
          result[day].push({
            id: slot.id,
            type: 'break',
            day,
            label: slot.label,
            periodNumber: null,
            startTime: slot.startTime,
            endTime: slot.endTime,
            taught: null,
          });
          return;
        }
        const taught =
          teaching.find((p) => p.day === day && p.periodNumber === slot.periodNumber && p.teacherId === teacher?.id) ??
          null;
        result[day].push({
          id: slot.id,
          type: 'period',
          day,
          label: slot.label,
          periodNumber: slot.periodNumber ?? null,
          startTime: slot.startTime,
          endTime: slot.endTime,
          taught,
        });
      });
    });
    return result;
  }, [periods, schedule, teacher?.id]);

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
