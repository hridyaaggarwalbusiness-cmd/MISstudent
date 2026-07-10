import { create } from 'zustand';
import type { Unsubscribe } from 'firebase/firestore';
import { Attachment, Homework } from '@/types';
import { repo } from '@data/repositories';
import { useAuthStore } from '@store/useAuthStore';

interface HomeworkState {
  items: Homework[];
  loading: boolean;
  loaded: boolean;
  unsub: Unsubscribe | null;
  fetch: (force?: boolean) => Promise<void>;
  submit: (id: string, payload: { attachments: Attachment[]; note?: string }) => Promise<void>;
}

export const useHomeworkStore = create<HomeworkState>((set, get) => ({
  items: [],
  loading: false,
  loaded: false,
  unsub: null,

  fetch: async (force = false) => {
    if (get().loaded && !force) return;
    if (get().loading) return;
    const { student } = useAuthStore.getState();
    if (!student) return;
    set({ loading: true });
    get().unsub?.();
    const unsub = repo.homework.subscribeForStudent(student.classId, student.id, (items) => {
      set({ items, loading: false, loaded: true });
    });
    set({ unsub });
  },

  submit: async (id, payload) => {
    const { student } = useAuthStore.getState();
    if (!student) return;
    await repo.homework.submit(id, student.id, payload);
  },
}));
