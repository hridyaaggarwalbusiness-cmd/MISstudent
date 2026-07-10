import { create } from 'zustand';
import { AppNotification } from '@/types';
import { repo } from '@data/repositories';

interface NotificationsState {
  items: AppNotification[];
  loading: boolean;
  loaded: boolean;
  unreadCount: number;
  fetch: () => Promise<void>;
  markRead: (id: string) => Promise<void>;
  markAllRead: () => Promise<void>;
}

export const useNotificationsStore = create<NotificationsState>((set, get) => ({
  items: [],
  loading: false,
  loaded: false,
  unreadCount: 0,

  fetch: async () => {
    if (get().loading) return;
    set({ loading: true });
    const items = await repo.notifications.list();
    set({
      items,
      loading: false,
      loaded: true,
      unreadCount: items.filter((n) => !n.isRead).length,
    });
  },

  markRead: async (id: string) => {
    await repo.notifications.markRead(id);
    set((s) => {
      const items = s.items.map((n) => (n.id === id ? { ...n, isRead: true } : n));
      return { items, unreadCount: items.filter((n) => !n.isRead).length };
    });
  },

  markAllRead: async () => {
    await repo.notifications.markAllRead();
    set((s) => ({
      items: s.items.map((n) => ({ ...n, isRead: true })),
      unreadCount: 0,
    }));
  },
}));
