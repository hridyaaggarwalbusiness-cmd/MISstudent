import { create } from 'zustand';
import { doc, getDoc } from 'firebase/firestore';
import type { User } from 'firebase/auth';
import { db } from '@/services/firebase';
import { repo } from '@/data/repositories';
import type { AppUser } from '@/types';

interface AuthState {
  user: User | null;
  profile: AppUser | null;
  initializing: boolean;
  error: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  init: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  profile: null,
  initializing: true,
  error: null,

  init: () => {
    repo.auth.onChange(async (user) => {
      if (user) {
        const snap = await getDoc(doc(db, 'users', user.uid));
        const profile = snap.exists() ? ({ id: snap.id, ...snap.data() } as AppUser) : null;
        if (profile?.role !== 'admin') {
          await repo.auth.signOut();
          set({ user: null, profile: null, initializing: false, error: 'This account is not an admin.' });
          return;
        }
        set({ user, profile, initializing: false });
      } else {
        set({ user: null, profile: null, initializing: false });
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
