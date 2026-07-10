import { create } from 'zustand';
import { Attachment, Homework } from '@/types';
import { repo } from '@data/repositories';

interface HomeworkState {
  items: Homework[];
  loading: boolean;
  loaded: boolean;
  fetch: (force?: boolean) => Promise<void>;
  submit: (id: string, payload: { attachments: Attachment[]; note?: string }) => Promise<void>;
}

export const useHomeworkStore = create<HomeworkState>((set, get) => ({
  items: [],
  loading: false,
  loaded: false,

  fetch: async (force = false) => {
    if (get().loading) return;
    if (get().loaded && !force) return;
    set({ loading: true });
    const items = await repo.homework.list();
    set({ items, loading: false, loaded: true });
  },

  submit: async (id, payload) => {
    const updated = await repo.homework.submit(id, payload);
    if (updated) {
      set((s) => ({ items: s.items.map((h) => (h.id === id ? updated : h)) }));
    }
  },
}));
