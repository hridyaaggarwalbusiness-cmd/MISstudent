import { addDays, formatISO } from 'date-fns';
import { Exam } from '@/types';

const iso = (d: Date) => formatISO(d, { representation: 'date' });
const today = new Date();

export const mockExams: Exam[] = [
  {
    id: 'exam_1',
    name: 'Mid-Term Examination',
    subject: 'Mathematics',
    date: iso(addDays(today, 5)),
    startTime: '09:00',
    endTime: '11:00',
    room: 'Exam Hall A',
    syllabus: 'Chapters 1-6: Number Systems, Polynomials, Coordinate Geometry, Linear Equations, Quadratic Equations',
    status: 'upcoming',
  },
  {
    id: 'exam_2',
    name: 'Mid-Term Examination',
    subject: 'Science',
    date: iso(addDays(today, 7)),
    startTime: '09:00',
    endTime: '11:00',
    room: 'Exam Hall A',
    syllabus: 'Chemical Reactions, Acids & Bases, Life Processes, Light — Reflection & Refraction',
    status: 'upcoming',
  },
  {
    id: 'exam_3',
    name: 'Mid-Term Examination',
    subject: 'English',
    date: iso(addDays(today, 9)),
    startTime: '09:00',
    endTime: '11:00',
    room: 'Exam Hall A',
    syllabus: 'Prose Units 1-4, Poetry Units 1-3, Grammar: Tenses & Reported Speech',
    status: 'upcoming',
  },
  {
    id: 'exam_4',
    name: 'Mid-Term Examination',
    subject: 'Social Studies',
    date: iso(addDays(today, 12)),
    startTime: '09:00',
    endTime: '11:00',
    room: 'Exam Hall A',
    syllabus: 'History Ch 1-3, Geography Ch 1-2, Civics Ch 1-2',
    status: 'upcoming',
  },
  {
    id: 'exam_5',
    name: 'Unit Test 2',
    subject: 'Hindi',
    date: iso(addDays(today, -10)),
    startTime: '09:00',
    endTime: '10:00',
    room: 'Room 105',
    status: 'completed',
  },
];
