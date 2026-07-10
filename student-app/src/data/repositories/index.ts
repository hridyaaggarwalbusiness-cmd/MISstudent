import { mockStudent } from '../mock/student';
import { mockTimetable } from '../mock/timetable';
import { mockHomework } from '../mock/homework';
import { mockExams } from '../mock/exams';
import { mockNotices } from '../mock/notices';
import {
  mockAttendanceCurrentMonth,
  attendanceForMonth,
  mockAttendanceSubjectSummary,
} from '../mock/attendance';
import { mockResults } from '../mock/results';
import { mockMaterials } from '../mock/materials';
import { mockCalendarEvents } from '../mock/calendarEvents';
import { mockNotifications } from '../mock/notifications';
import {
  Homework,
  Attachment,
} from '@/types';

function delay<T>(value: T, ms = 500): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

/**
 * Repository layer: every screen talks to these functions, never to the mock
 * arrays directly. Swapping to Firebase/Firestore later means reimplementing
 * the bodies here — call sites and screens do not change.
 */
export const repo = {
  student: {
    get: () => delay(mockStudent, 400),
  },

  timetable: {
    getAll: () => delay(mockTimetable, 400),
  },

  homework: {
    list: () => delay(mockHomework, 500),
    getById: (id: string) => delay(mockHomework.find((h) => h.id === id) ?? null, 300),
    submit: (id: string, payload: { attachments: Attachment[]; note?: string }) => {
      const hw = mockHomework.find((h) => h.id === id);
      if (hw) {
        hw.status = 'submitted';
        hw.submission = {
          submittedAt: new Date().toISOString(),
          attachments: payload.attachments,
          note: payload.note,
        };
      }
      return delay(hw as Homework, 600);
    },
  },

  exams: {
    list: () => delay(mockExams, 400),
  },

  notices: {
    list: () => delay(mockNotices, 450),
    markRead: (id: string) => {
      const n = mockNotices.find((x) => x.id === id);
      if (n) n.isRead = true;
      return delay(true, 200);
    },
  },

  attendance: {
    getMonth: (monthDate: Date) => delay(attendanceForMonth(monthDate), 450),
    getCurrentMonth: () => delay(mockAttendanceCurrentMonth, 450),
    getSubjectSummary: () => delay(mockAttendanceSubjectSummary, 400),
  },

  results: {
    list: () => delay(mockResults, 500),
  },

  materials: {
    list: () => delay(mockMaterials, 500),
  },

  calendar: {
    list: () => delay(mockCalendarEvents, 400),
  },

  notifications: {
    list: () => delay(mockNotifications, 400),
    markRead: (id: string) => {
      const n = mockNotifications.find((x) => x.id === id);
      if (n) n.isRead = true;
      return delay(true, 150);
    },
    markAllRead: () => {
      mockNotifications.forEach((n) => (n.isRead = true));
      return delay(true, 200);
    },
  },
};
