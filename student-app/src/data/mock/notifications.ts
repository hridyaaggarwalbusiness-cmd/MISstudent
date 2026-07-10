import { subHours, subDays, formatISO } from 'date-fns';
import { AppNotification } from '@/types';

const isoDT = (d: Date) => formatISO(d);
const today = new Date();

export const mockNotifications: AppNotification[] = [
  {
    id: 'notif_1',
    type: 'homework',
    title: 'Homework due tomorrow',
    body: 'Mathematics — Quadratic Equations Practice Set 4 is due tomorrow.',
    createdAt: isoDT(subHours(today, 2)),
    isRead: false,
    refId: 'hw_1',
  },
  {
    id: 'notif_2',
    type: 'notice',
    title: 'New notice posted',
    body: 'Annual Sports Day — 15th of Next Month',
    createdAt: isoDT(subHours(today, 20)),
    isRead: false,
    refId: 'notice_1',
  },
  {
    id: 'notif_3',
    type: 'exam',
    title: 'Upcoming exam reminder',
    body: 'Mid-Term Examination for Mathematics is in 5 days. Syllabus is now available.',
    createdAt: isoDT(subDays(today, 1)),
    isRead: false,
    refId: 'exam_1',
  },
  {
    id: 'notif_4',
    type: 'result',
    title: 'New result published',
    body: 'Your Unit Test 2 (Term 3) result has been published. You ranked 3rd in class!',
    createdAt: isoDT(subDays(today, 2)),
    isRead: true,
    refId: 'result_3',
  },
  {
    id: 'notif_5',
    type: 'material',
    title: 'New study material added',
    body: 'Recorded Lecture — Python Functions has been uploaded to Computer Science.',
    createdAt: isoDT(subDays(today, 3)),
    isRead: true,
    refId: 'mat_5',
  },
  {
    id: 'notif_6',
    type: 'attendance',
    title: 'Attendance updated',
    body: 'Your attendance for last week has been updated. Overall attendance is 91.2%.',
    createdAt: isoDT(subDays(today, 4)),
    isRead: true,
  },
  {
    id: 'notif_7',
    type: 'homework',
    title: 'Homework graded',
    body: 'Social Studies — Map Work has been graded. You scored 18/20.',
    createdAt: isoDT(subDays(today, 5)),
    isRead: true,
    refId: 'hw_4',
  },
];
