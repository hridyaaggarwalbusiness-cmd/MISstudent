import { addDays, subDays, formatISO } from 'date-fns';
import { CalendarEvent } from '@/types';

const iso = (d: Date) => formatISO(d, { representation: 'date' });
const today = new Date();

export const mockCalendarEvents: CalendarEvent[] = [
  {
    id: 'cal_1',
    title: 'Republic Day (Holiday)',
    date: iso(subDays(today, 3)),
    type: 'holiday',
    description: 'School closed for Republic Day.',
  },
  {
    id: 'cal_2',
    title: 'Mid-Term Exam — Mathematics',
    date: iso(addDays(today, 5)),
    type: 'exam',
    location: 'Exam Hall A',
  },
  {
    id: 'cal_3',
    title: 'Mid-Term Exam — Science',
    date: iso(addDays(today, 7)),
    type: 'exam',
    location: 'Exam Hall A',
  },
  {
    id: 'cal_4',
    title: 'Mid-Term Exam — English',
    date: iso(addDays(today, 9)),
    type: 'exam',
    location: 'Exam Hall A',
  },
  {
    id: 'cal_5',
    title: 'Annual Sports Day',
    date: iso(addDays(today, 20)),
    type: 'sports',
    location: 'School Grounds',
    description: 'Track & field events, relay races, and house competitions.',
  },
  {
    id: 'cal_6',
    title: 'Inter-School Science Exhibition',
    date: iso(addDays(today, 15)),
    type: 'competition',
    location: 'Auditorium',
  },
  {
    id: 'cal_7',
    title: 'Parent-Teacher Meeting',
    date: iso(addDays(today, 4)),
    type: 'meeting',
    location: 'Respective Classrooms',
  },
  {
    id: 'cal_8',
    title: 'Annual Day Function',
    date: iso(addDays(today, 35)),
    type: 'function',
    location: 'School Auditorium',
  },
  {
    id: 'cal_9',
    title: 'Spring Break Begins',
    date: iso(addDays(today, 45)),
    endDate: iso(addDays(today, 52)),
    type: 'holiday',
  },
];

export const eventTypeMeta: Record<
  CalendarEvent['type'],
  { label: string; color: string; icon: string }
> = {
  holiday: { label: 'Holiday', color: 'rose', icon: 'sunny-outline' },
  exam: { label: 'Examination', color: 'indigo', icon: 'document-text-outline' },
  function: { label: 'School Function', color: 'violet', icon: 'sparkles-outline' },
  sports: { label: 'Sports Event', color: 'emerald', icon: 'trophy-outline' },
  meeting: { label: 'Parent Meeting', color: 'sky', icon: 'people-outline' },
  competition: { label: 'Competition', color: 'amber', icon: 'ribbon-outline' },
  other: { label: 'Other', color: 'slate', icon: 'calendar-outline' },
};
