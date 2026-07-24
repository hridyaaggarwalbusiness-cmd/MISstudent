import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors } from '@theme';
import { repo } from '@data/repositories';
import { useAuthStore } from '@store/useAuthStore';
import { Notice, Exam, CalendarEvent, TimetablePeriod } from '@/types';
import { FeedNotification } from '@components/notifications/NotificationItem';
import { parseDate } from '@utils/date';

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

function isRecent(dateIso: string | undefined, days: number): boolean {
  if (!dateIso) return false;
  const then = new Date(dateIso).getTime();
  if (Number.isNaN(then)) return false;
  return Date.now() - then <= days * 24 * 60 * 60 * 1000;
}

interface NotificationsState {
  notices: Notice[];
  exams: Exam[];
  events: CalendarEvent[];
  timetable: TimetablePeriod[];
  readIds: Set<string>;
  loaded: boolean;
  items: (FeedNotification & { navTarget: { screen: 'notices' | 'exam' | 'calendar' | 'timetable' } })[];
  unreadCount: number;
  init: () => void;
  markRead: (id: string) => void;
  markAllRead: () => void;
}

let subscribed = false;

function recompute(set: (partial: Partial<NotificationsState>) => void, get: () => NotificationsState) {
  const { notices, exams, events, timetable, readIds } = get();
  const teacherId = useAuthStore.getState().teacher?.id;

  const entries: { ts: number; item: NotificationsState['items'][number] }[] = [];

  // Grouped by the calendar day the edit happened (not the day the period
  // falls on) so one bulk timetable edit - e.g. a drag-fill touching many
  // cells at once - produces a single notification for this teacher instead
  // of one per cell.
  const myChangedPeriods = timetable.filter((p) => p.teacherId === teacherId && isRecent(p.updatedAt, 3));
  const byEditDay = new Map<string, TimetablePeriod[]>();
  myChangedPeriods.forEach((p) => {
    const key = (p.updatedAt as string).slice(0, 10);
    byEditDay.set(key, [...(byEditDay.get(key) ?? []), p]);
  });
  byEditDay.forEach((periods, editDay) => {
    const id = `timetable-${editDay}`;
    const latest = periods.reduce((a, b) => ((a.updatedAt as string) > (b.updatedAt as string) ? a : b));
    const days = [...new Set(periods.map((p) => p.day))];
    const body =
      periods.length === 1
        ? `${latest.day} · ${latest.subject} for ${latest.startTime}-${latest.endTime}${latest.room ? ` · Room ${latest.room}` : ''}`
        : `${periods.length} periods added or changed on your schedule (${days.join(', ')})`;
    entries.push({
      ts: new Date(latest.updatedAt as string).getTime() || 0,
      item: {
        id,
        icon: 'calendar-outline',
        bg: colors.infoBg,
        fg: colors.infoStrong,
        title: 'Timetable Updated',
        body,
        time: latest.updatedAt as string,
        isRead: readIds.has(id),
        onPress: () => {},
        navTarget: { screen: 'timetable' },
      },
    });
  });

  notices.forEach((n) => {
    const id = `notice-${n.id}`;
    entries.push({
      ts: parseDate(n.postedAt).getTime() || 0,
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
    .filter((e) => isUpcoming(e.date, 14))
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
  timetable: [],
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
    repo.timetable.subscribeAll((timetable) => {
      set({ timetable });
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
