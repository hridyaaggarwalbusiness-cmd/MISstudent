import { create } from 'zustand';
import { doc, getDoc } from 'firebase/firestore';
import type { User } from 'firebase/auth';
import { db } from '@services/firebase';
import { repo } from '@data/repositories';
import { AppUser, Student } from '@/types';

interface AuthState {
  user: User | null;
  profile: AppUser | null;
  student: Student | null;
  initializing: boolean;
  error: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  init: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  profile: null,
  student: null,
  initializing: true,
  error: null,

  init: () => {
    repo.auth.onChange(async (user) => {
      if (user) {
        const profileSnap = await getDoc(doc(db, 'users', user.uid));
        const profile = profileSnap.exists() ? ({ id: profileSnap.id, ...profileSnap.data() } as AppUser) : null;
        if (profile?.role !== 'student') {
          await repo.auth.signOut();
          set({
            user: null,
            profile: null,
            student: null,
            initializing: false,
            error: 'This account is not registered as a student.',
          });
          return;
        }
        const studentSnap = await getDoc(doc(db, 'students', user.uid));
        const student = studentSnap.exists() ? ({ id: studentSnap.id, ...studentSnap.data() } as Student) : null;
        set({ user, profile, student, initializing: false });
      } else {
        set({ user: null, profile: null, student: null, initializing: false });
      }
    });
  },

  signIn: async (email, password) => {
    set({ error: null });
    try {
      await repo.auth.signIn(email, password);
    } catch (e) {
      set({ error: e instanceof Error ? e.message : 'Sign in failed' });
      throw e;
    }
  },

  signOut: async () => {
    await repo.auth.signOut();
  },
}));
