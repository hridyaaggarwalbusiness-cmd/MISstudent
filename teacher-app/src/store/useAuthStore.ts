import { create } from 'zustand';
import { User } from 'firebase/auth';
import { repo } from '@data/repositories';
import { Teacher } from '@/types';

interface AuthState {
  user: User | null;
  teacher: Teacher | null;
  initializing: boolean;
  error: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  init: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  teacher: null,
  initializing: true,
  error: null,

  init: () => {
    repo.auth.onChange(async (user) => {
      if (user) {
        const teacher = await repo.teachers.get(user.uid);
        set({ user, teacher, initializing: false });
      } else {
        set({ user: null, teacher: null, initializing: false });
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
