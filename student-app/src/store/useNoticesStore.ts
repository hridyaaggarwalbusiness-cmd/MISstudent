import { create } from 'zustand';
import type { Unsubscribe } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Notice } from '@/types';
import { repo } from '@data/repositories';
import { useAuthStore } from '@store/useAuthStore';

const READ_NOTICES_KEY = 'misstudent:readNoticeIds';

async function loadReadIds(): Promise<Set<string>> {
  try {
    const raw = await AsyncStorage.getItem(READ_NOTICES_KEY);
    return new Set(raw ? (JSON.parse(raw) as string[]) : []);
  } catch {
    return new Set();
  }
}

async function saveReadIds(ids: Set<string>): Promise<void> {
  await AsyncStorage.setItem(READ_NOTICES_KEY, JSON.stringify([...ids]));
}

interface NoticesState {
  items: Notice[];
  loading: boolean;
  loaded: boolean;
  unsub: Unsubscribe | null;
  readIds: Set<string>;
  fetch: (force?: boolean) => Promise<void>;
  markRead: (id: string) => Promise<void>;
}

export const useNoticesStore = create<NoticesState>((set, get) => ({
  items: [],
  loading: false,
  loaded: false,
  unsub: null,
  readIds: new Set(),

  fetch: async (force = false) => {
    if (get().loaded && !force) return;
    if (get().loading) return;
    const { student } = useAuthStore.getState();
    if (!student) return;
    set({ loading: true });
    const readIds = await loadReadIds();
    get().unsub?.();
    const unsub = repo.notices.subscribeForClass(student.classId, (rawItems) => {
      const items = rawItems.map((n) => ({ ...n, isRead: get().readIds.has(n.id) }));
      set({ items, loading: false, loaded: true });
    });
    set({ unsub, readIds });
  },

  markRead: async (id: string) => {
    const readIds = new Set(get().readIds);
    readIds.add(id);
    await saveReadIds(readIds);
    set((s) => ({
      readIds,
      items: s.items.map((n) => (n.id === id ? { ...n, isRead: true } : n)),
    }));
  },
}));
