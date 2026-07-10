import { create } from 'zustand';
import type { Unsubscribe } from 'firebase/firestore';
import { Student } from '@/types';
import { repo } from '@data/repositories';
import { auth } from '@services/firebase';

interface StudentState {
  student: Student | null;
  loading: boolean;
  loaded: boolean;
  unsub: Unsubscribe | null;
  fetch: () => Promise<void>;
}

export const useStudentStore = create<StudentState>((set, get) => ({
  student: null,
  loading: false,
  loaded: false,
  unsub: null,

  fetch: async () => {
    if (get().loaded || get().loading) return;
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    set({ loading: true });
    const unsub = repo.student.subscribe(uid, (student) => {
      set({ student, loading: false, loaded: true });
    });
    set({ unsub });
  },
}));
