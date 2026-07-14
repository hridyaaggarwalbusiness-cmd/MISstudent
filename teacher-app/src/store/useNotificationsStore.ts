import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors } from '@theme';
import { repo } from '@data/repositories';
import { useAuthStore } from '@store/useAuthStore';
import { Notice, Exam, CalendarEvent } from '@/types';
import { FeedNotification } from '@components/notifications/NotificationItem';

const READ_IDS_KEY = 'teacherapp:readNotificationIds';

async function loadReadIds(): Promise<Set<string>> {
  try {
    const raw = await AsyncStorage.getItem(READ_IDS_KEY);
    return new Set(raw ? (JSON.parse(raw) as string[]) : []);
  } catch {
    return new Set();
  }
}

async function saveReadIds(ids: Set<string>): Promise<void> {
  await AsyncStorage.setItem(READ_IDS_KEY, JSON.stringify([...ids]));
}

function isUpcoming(dateIso: string, days: number): boolean {
  const then = new Date(dateIso).getTime();
  if (Number.isNaN(then)) return false;
  const now = Date.now();
  return then >= now && then - now <= days * 24 * 60 * 60 * 1000;
}

interface NotificationsState {
  notices: Notice[];
  exams: Exam[];
  events: CalendarEvent[];
  readIds: Set<string>;
  loaded: boolean;
  items: (FeedNotification & { navTarget: { screen: 'notices' | 'exam' | 'calendar' } })[];
  unreadCount: number;
  init: () => void;
  markRead: (id: string) => void;
  markAllRead: () => void;
}

let subscribed = false;

function recompute(set: (partial: Partial<NotificationsState>) => void, get: () => NotificationsState) {
  const { notices, exams, events, readIds } = get();
  const teacher = useAuthStore.getState().teacher;
  const mySubjects = new Set(teacher?.subjects ?? []);

  const entries: { ts: number; item: NotificationsState['items'][number] }[] = [];

  notices.forEach((n) => {
    const id = `notice-${n.id}`;
    entries.push({
      ts: new Date(n.postedAt).getTime() || 0,
      item: {
        id,
        icon: 'megaphone-outline',
        bg: colors.dangerBg,
        fg: colors.dangerStrong,
        title: n.title,
        body: n.body.length > 120 ? `${n.body.slice(0, 117)}...` : n.body,
        time: n.postedAt,
        isRead: readIds.has(id),
        onPress: () => {},
        navTarget: { screen: 'notices' },
      },
    });
  });

  exams
    .filter((e) => mySubjects.has(e.subject) && isUpcoming(e.date, 14))
    .forEach((e) => {
      const id = `exam-${e.id}`;
      entries.push({
        ts: new Date(e.date).getTime() || 0,
        item: {
          id,
          icon: 'document-text-outline',
          bg: colors.warningBg,
          fg: colors.warningStrong,
          title: `Upcoming: ${e.name}`,
          body: `${e.subject} · ${e.date}${e.room ? ` · Room ${e.room}` : ''}`,
          time: e.date,
          isRead: readIds.has(id),
          onPress: () => {},
          navTarget: { screen: 'exam' },
        },
      });
    });

  events
    .filter((e) => isUpcoming(e.date, 14))
    .forEach((e) => {
      const id = `event-${e.id}`;
      entries.push({
        ts: new Date(e.date).getTime() || 0,
        item: {
          id,
          icon: 'calendar-outline',
          bg: colors.infoBg,
          fg: colors.infoStrong,
          title: e.title,
          body: e.location || 'School event',
          time: e.date,
          isRead: readIds.has(id),
          onPress: () => {},
          navTarget: { screen: 'calendar' },
        },
      });
    });

  const items = entries.sort((a, b) => b.ts - a.ts).map((e) => e.item);
  set({ items, unreadCount: items.filter((i) => !i.isRead).length });
}

export const useNotificationsStore = create<NotificationsState>((set, get) => ({
  notices: [],
  exams: [],
  events: [],
  readIds: new Set(),
  loaded: false,
  items: [],
  unreadCount: 0,

  init: () => {
    if (subscribed) return;
    subscribed = true;
    loadReadIds().then((readIds) => {
      set({ readIds });
      recompute(set, get);
    });
    repo.notices.subscribeAll((notices) => {
      set({ notices, loaded: true });
      recompute(set, get);
    });
    const classId = useAuthStore.getState().teacher?.classIds?.[0];
    if (classId) {
      repo.exams.subscribeForClass(classId, (exams) => {
        set({ exams });
        recompute(set, get);
      });
    }
    repo.calendar.subscribeAll((events) => {
      set({ events });
      recompute(set, get);
    });
  },

  markRead: (id: string) => {
    const readIds = new Set(get().readIds);
    readIds.add(id);
    saveReadIds(readIds);
    set({ readIds });
    recompute(set, get);
  },

  markAllRead: () => {
    const readIds = new Set(get().readIds);
    get().items.forEach((i) => readIds.add(i.id));
    saveReadIds(readIds);
    set({ readIds });
    recompute(set, get);
  },
}));
