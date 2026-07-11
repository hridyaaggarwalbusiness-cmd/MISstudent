import { create } from 'zustand';
import type { Unsubscribe } from 'firebase/firestore';
import { Student } from '@/types';
import { repo } from '@data/repositories';
import { auth } from '@services/firebase';

type ContactFields = Partial<
  Pick<Student, 'phone' | 'address' | 'emergencyContactName' | 'emergencyContactPhone' | 'emergencyContactRelation'>
>;

interface StudentState {
  student: Student | null;
  loading: boolean;
  loaded: boolean;
  saving: boolean;
  saveError: string | null;
  unsub: Unsubscribe | null;
  fetch: () => Promise<void>;
  updateContact: (fields: ContactFields) => Promise<void>;
}

export const useStudentStore = create<StudentState>((set, get) => ({
  student: null,
  loading: false,
  loaded: false,
  saving: false,
  saveError: null,
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

  updateContact: async (fields: ContactFields) => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    set({ saving: true, saveError: null });
    try {
      await repo.student.updateContact(uid, fields);
      set({ saving: false });
    } catch (e) {
      set({ saving: false, saveError: e instanceof Error ? e.message : 'Could not save changes' });
      throw e;
    }
  },
}));
