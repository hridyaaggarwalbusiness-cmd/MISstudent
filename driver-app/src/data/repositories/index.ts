import { collection, doc, query, where, onSnapshot, setDoc, updateDoc, getDocs, getDoc } from 'firebase/firestore';
import type { Unsubscribe } from 'firebase/firestore';
import { ref, set, onValue, onDisconnect } from 'firebase/database';
import { signInWithEmailAndPassword, signOut as firebaseSignOut, onAuthStateChanged } from 'firebase/auth';
import type { User } from 'firebase/auth';
import { db, auth, rtdb } from '@services/firebase';
import { Bus, DriverProfile, Trip, LiveLocation, RouteType } from '@/types';

function withId<T>(d: { id: string; data: () => unknown }): T {
  return { id: d.id, ...(d.data() as object) } as T;
}

function cryptoId(): string {
  return doc(collection(db, '_ids')).id;
}

export const repo = {
  auth: {
    signIn: (email: string, password: string) => signInWithEmailAndPassword(auth, email, password),
    signOut: () => firebaseSignOut(auth),
    onChange: (cb: (user: User | null) => void): Unsubscribe => onAuthStateChanged(auth, cb),
  },

  drivers: {
    subscribe: (uid: string, cb: (driver: DriverProfile | null) => void): Unsubscribe =>
      onSnapshot(doc(db, 'drivers', uid), (snap) => cb(snap.exists() ? withId<DriverProfile>(snap) : null)),
    get: async (uid: string): Promise<DriverProfile | null> => {
      const snap = await getDoc(doc(db, 'drivers', uid));
      return snap.exists() ? withId<DriverProfile>(snap) : null;
    },
  },

  buses: {
    subscribeForDriver: (driverId: string, cb: (bus: Bus | null) => void): Unsubscribe => {
      const q = query(collection(db, 'buses'), where('driverId', '==', driverId));
      return onSnapshot(q, (snap) => cb(snap.empty ? null : withId<Bus>(snap.docs[0])));
    },
    // The driver may only flip status/currentTripId - enforced again
    // server-side by firestore.rules.
    updateStatus: (busId: string, changes: Partial<Pick<Bus, 'status' | 'currentTripId'>>) =>
      updateDoc(doc(db, 'buses', busId), changes),
  },

  trips: {
    start: async (input: { busId: string; driverId: string; routeId: string; type: RouteType }): Promise<string> => {
      const id = cryptoId();
      await setDoc(doc(db, 'trips', id), {
        id,
        busId: input.busId,
        driverId: input.driverId,
        routeId: input.routeId,
        type: input.type,
        status: 'active',
        startedAt: new Date().toISOString(),
        endedAt: null,
      });
      return id;
    },
    end: (tripId: string) => updateDoc(doc(db, 'trips', tripId), { status: 'completed', endedAt: new Date().toISOString() }),
    getActiveForBus: async (busId: string): Promise<Trip | null> => {
      const snap = await getDocs(query(collection(db, 'trips'), where('busId', '==', busId), where('status', '==', 'active')));
      return snap.empty ? null : withId<Trip>(snap.docs[0]);
    },
  },

  // Realtime Database, not Firestore — see LiveLocation's doc comment.
  liveLocation: {
    write: (busId: string, location: LiveLocation) => set(ref(rtdb, `liveLocations/${busId}`), location),
    clear: (busId: string) => set(ref(rtdb, `liveLocations/${busId}`), null),
  },

  // RTDB presence via onDisconnect() - the idiomatic way to track
  // online/offline without a server, since the connection drop itself
  // (app closed, network lost, phone dies) fires the disconnect write.
  // onDisconnect() handlers only apply to the CURRENT socket connection, so
  // they must be re-registered every time `.info/connected` flips back to
  // true (e.g. after a network blip) - watchConnection does exactly that.
  driverPresence: {
    watchConnection: (driverId: string, cb: (connected: boolean) => void): (() => void) =>
      onValue(ref(rtdb, '.info/connected'), (snap) => {
        const connected = snap.val() === true;
        cb(connected);
        if (connected) {
          const statusRef = ref(rtdb, `driverStatus/${driverId}`);
          onDisconnect(statusRef)
            .set({ online: false, lastSeen: Date.now() })
            .catch(() => {});
          set(statusRef, { online: true, lastSeen: Date.now() });
        }
      }),
    goOffline: (driverId: string) => set(ref(rtdb, `driverStatus/${driverId}`), { online: false, lastSeen: Date.now() }),
  },
};
