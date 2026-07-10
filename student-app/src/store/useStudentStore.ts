import { create } from 'zustand';
import { Student } from '@/types';
import { repo } from '@data/repositories';

interface StudentState {
  student: Student | null;
  loading: boolean;
  fetch: () => Promise<void>;
}

export const useStudentStore = create<StudentState>((set, get) => ({
  student: null,
  loading: false,

  fetch: async () => {
    if (get().student || get().loading) return;
    set({ loading: true });
    const student = await repo.student.get();
    set({ student, loading: false });
  },
}));
