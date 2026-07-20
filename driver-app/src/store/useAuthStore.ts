import { create } from 'zustand';
import { doc, getDoc } from 'firebase/firestore';
import type { User } from 'firebase/auth';
import { db } from '@services/firebase';
import { repo } from '@data/repositories';
import { DriverProfile } from '@/types';

interface AppUser {
  id: string;
  role: string;
}

interface AuthState {
  user: User | null;
  driver: DriverProfile | null;
  initializing: boolean;
  error: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  init: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  driver: null,
  initializing: true,
  error: null,

  init: () => {
    repo.auth.onChange(async (user) => {
      if (user) {
        const profileSnap = await getDoc(doc(db, 'users', user.uid));
        const profile = profileSnap.exists() ? (profileSnap.data() as AppUser) : null;
        if (profile?.role !== 'driver') {
          await repo.auth.signOut();
          set({ user: null, driver: null, initializing: false, error: 'This account is not registered as a driver.' });
          return;
        }
        const driver = await repo.drivers.get(user.uid);
        set({ user, driver, initializing: false });
      } else {
        set({ user: null, driver: null, initializing: false });
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
