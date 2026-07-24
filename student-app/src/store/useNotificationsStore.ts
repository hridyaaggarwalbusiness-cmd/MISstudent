import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppNotification, TimetablePeriod } from '@/types';
import { repo } from '@data/repositories';
import { useAuthStore } from '@store/useAuthStore';
import { useHomeworkStore } from '@store/useHomeworkStore';
import { useNoticesStore } from '@store/useNoticesStore';
import { useBusTrackingStore } from '@store/useBusTrackingStore';

let timetablePeriods: TimetablePeriod[] = [];

const READ_NOTIFICATIONS_KEY = 'misstudent:readNotificationIds';

async function loadReadIds(): Promise<Set<string>> {
  try {
    const raw = await AsyncStorage.getItem(READ_NOTIFICATIONS_KEY);
    return new Set(raw ? (JSON.parse(raw) as string[]) : []);
  } catch {
    return new Set();
  }
}

async function saveReadIds(ids: Set<string>): Promise<void> {
  await AsyncStorage.setItem(READ_NOTIFICATIONS_KEY, JSON.stringify([...ids]));
}

function isRecent(dateIso: string, days: number): boolean {
  const then = new Date(dateIso).getTime();
  if (Number.isNaN(then)) return false;
  return Date.now() - then <= days * 24 * 60 * 60 * 1000;
}

// Derived directly from real homework + notice activity (no separate
// notifications collection is wired up yet) - a teacher grading a submission
// or posting a new notice shows up here because those stores are already
// live-subscribed.
function computeNotifications(readIds: Set<string>): AppNotification[] {
  const notifications: AppNotification[] = [];

  for (const hw of useHomeworkStore.getState().items) {
    if (hw.status === 'graded' && hw.remarks) {
      const id = `hw-graded-${hw.id}`;
      notifications.push({
        id,
        type: 'homework',
        title: 'Homework Graded',
        body: `${hw.subject}: ${hw.title}${hw.remarks.grade ? ` — Grade ${hw.remarks.grade}` : ''}`,
        createdAt: hw.remarks.gradedAt,
        isRead: readIds.has(id),
        refId: hw.id,
      });
    } else if ((hw.status === 'pending' || hw.status === 'overdue') && isRecent(hw.assignedDate, 3)) {
      const id = `hw-new-${hw.id}`;
      notifications.push({
        id,
        type: 'homework',
        title: 'New Homework',
        body: `${hw.subject}: ${hw.title}`,
        createdAt: hw.assignedDate,
        isRead: readIds.has(id),
        refId: hw.id,
      });
    }
  }

  for (const period of timetablePeriods) {
    if (!period.updatedAt || !isRecent(period.updatedAt, 3)) continue;
    const id = `timetable-${period.id}-${period.updatedAt}`;
    notifications.push({
      id,
      type: 'timetable',
      title: 'Timetable Updated',
      body: period.isBreak
        ? `${period.day} · ${period.startTime}-${period.endTime} changed`
        : `${period.day} · ${period.subject} with ${period.teacher} (${period.startTime}-${period.endTime})`,
      createdAt: period.updatedAt,
      isRead: readIds.has(id),
    });
  }

  for (const notice of useNoticesStore.getState().items) {
    const id = `notice-${notice.id}`;
    notifications.push({
      id,
      type: 'notice',
      title: notice.title,
      body: notice.body.length > 120 ? `${notice.body.slice(0, 117)}...` : notice.body,
      createdAt: notice.postedAt,
      isRead: readIds.has(id),
      refId: notice.id,
    });
  }

  // Bus Trip Started / Approaching Stop / Reached School / Trip Completed —
  // fired client-side by useBusTrackingStore while the app is open (no FCM
  // server on this project's Spark plan), collected here the same way as
  // every other feed above.
  for (const evt of useBusTrackingStore.getState().events) {
    notifications.push({ ...evt, isRead: readIds.has(evt.id) });
  }

  return notifications.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

interface NotificationsState {
  items: AppNotification[];
  loading: boolean;
  loaded: boolean;
  unreadCount: number;
  readIds: Set<string>;
  fetch: () => Promise<void>;
  markRead: (id: string) => Promise<void>;
  markAllRead: () => Promise<void>;
}

let subscribed = false;

export const useNotificationsStore = create<NotificationsState>((set, get) => ({
  items: [],
  loading: false,
  loaded: false,
  unreadCount: 0,
  readIds: new Set(),

  fetch: async () => {
    if (get().loading) return;
    set({ loading: true });
    const readIds = await loadReadIds();
    set({ readIds });

    await Promise.all([useHomeworkStore.getState().fetch(), useNoticesStore.getState().fetch()]);

    function recompute() {
      const items = computeNotifications(get().readIds);
      set({ items, loading: false, loaded: true, unreadCount: items.filter((n) => !n.isRead).length });
    }

    recompute();

    if (!subscribed) {
      subscribed = true;
      useHomeworkStore.subscribe(recompute);
      useNoticesStore.subscribe(recompute);
      useBusTrackingStore.subscribe(recompute);
      const classId = useAuthStore.getState().student?.classId;
      if (classId) {
        repo.timetable.subscribeForClass(classId, (periods) => {
          timetablePeriods = periods;
          recompute();
        });
      }
    }
  },

  markRead: async (id: string) => {
    const readIds = new Set(get().readIds);
    readIds.add(id);
    await saveReadIds(readIds);
    set((s) => {
      const items = s.items.map((n) => (n.id === id ? { ...n, isRead: true } : n));
      return { readIds, items, unreadCount: items.filter((n) => !n.isRead).length };
    });
  },

  markAllRead: async () => {
    const readIds = new Set(get().readIds);
    get().items.forEach((n) => readIds.add(n.id));
    await saveReadIds(readIds);
    set((s) => ({
      readIds,
      items: s.items.map((n) => ({ ...n, isRead: true })),
      unreadCount: 0,
    }));
  },
}));
