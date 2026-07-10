import { create } from 'zustand';
import { Notice } from '@/types';
import { repo } from '@data/repositories';

interface NoticesState {
  items: Notice[];
  loading: boolean;
  loaded: boolean;
  fetch: (force?: boolean) => Promise<void>;
  markRead: (id: string) => Promise<void>;
}

export const useNoticesStore = create<NoticesState>((set, get) => ({
  items: [],
  loading: false,
  loaded: false,

  fetch: async (force = false) => {
    if (get().loading) return;
    if (get().loaded && !force) return;
    set({ loading: true });
    const items = await repo.notices.list();
    set({ items, loading: false, loaded: true });
  },

  markRead: async (id: string) => {
    await repo.notices.markRead(id);
    set((s) => ({ items: s.items.map((n) => (n.id === id ? { ...n, isRead: true } : n)) }));
  },
}));
