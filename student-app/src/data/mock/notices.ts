import { subDays, formatISO } from 'date-fns';
import { Notice } from '@/types';

const iso = (d: Date) => formatISO(d, { representation: 'date' });
const today = new Date();

export const mockNotices: Notice[] = [
  {
    id: 'notice_1',
    title: 'Annual Sports Day — 15th of Next Month',
    body:
      'The school Annual Sports Day will be held on the school grounds. All students must report by 7:30 AM in house colors. Events include track & field, relay races, and tug of war. Parents are cordially invited.',
    category: 'event',
    postedAt: iso(subDays(today, 1)),
    postedBy: 'Principal Office',
    isRead: false,
    pinned: true,
  },
  {
    id: 'notice_2',
    title: 'Mid-Term Examination Schedule Released',
    body:
      'The mid-term examination datesheet for Grades 6-10 has been published. Please check the Academic Calendar section for subject-wise dates and reporting times.',
    category: 'exam',
    postedAt: iso(subDays(today, 2)),
    postedBy: 'Examination Cell',
    isRead: false,
  },
  {
    id: 'notice_3',
    title: 'Public Holiday — Republic Day',
    body: 'The school will remain closed on account of Republic Day. Regular classes resume the following day.',
    category: 'holiday',
    postedAt: iso(subDays(today, 3)),
    postedBy: 'Administration',
    isRead: true,
  },
  {
    id: 'notice_4',
    title: 'Inter-School Science Exhibition — Registrations Open',
    body:
      'Students interested in participating in the Regional Science Exhibition should register with their Science teacher by Friday. Projects must be based on renewable energy or sustainability themes.',
    category: 'competition',
    postedAt: iso(subDays(today, 4)),
    postedBy: 'Science Department',
    isRead: true,
  },
  {
    id: 'notice_5',
    title: 'Fee Payment Reminder — Quarter 3',
    body: 'Parents are requested to clear Quarter 3 fees before the due date to avoid late fee charges.',
    category: 'circular',
    postedAt: iso(subDays(today, 6)),
    postedBy: 'Accounts Office',
    isRead: true,
  },
  {
    id: 'notice_6',
    title: 'Parent-Teacher Meeting Scheduled',
    body:
      'A Parent-Teacher Meeting is scheduled for next Saturday from 9 AM to 1 PM. Report cards for the recent unit tests will be distributed.',
    category: 'general',
    postedAt: iso(subDays(today, 7)),
    postedBy: 'Class Coordinator',
    isRead: true,
  },
];
