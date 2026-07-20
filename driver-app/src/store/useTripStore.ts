import { create } from 'zustand';
import * as Location from 'expo-location';
import { repo } from '@data/repositories';
import { Bus, Trip, RouteType } from '@/types';

const GPS_WRITE_INTERVAL_MS = 7000; // within the required 5-10s window

interface TripState {
  bus: Bus | null;
  activeTrip: Trip | null;
  tracking: boolean;
  locationServicesEnabled: boolean | null;
  lastAccuracy: number | null;
  lastUpdatedAt: number | null;
  error: string | null;
  initForDriver: (driverId: string) => void;
  startTrip: (driverId: string) => Promise<void>;
  endTrip: () => Promise<void>;
}

let busUnsub: (() => void) | null = null;
let watchSubscription: Location.LocationSubscription | null = null;

async function stopWatching() {
  watchSubscription?.remove();
  watchSubscription = null;
}

export const useTripStore = create<TripState>((set, get) => ({
  bus: null,
  activeTrip: null,
  tracking: false,
  locationServicesEnabled: null,
  lastAccuracy: null,
  lastUpdatedAt: null,
  error: null,

  initForDriver: (driverId) => {
    busUnsub?.();
    busUnsub = repo.buses.subscribeForDriver(driverId, async (bus) => {
      set({ bus });
      if (!bus) {
        set({ activeTrip: null });
        return;
      }
      const trip = await repo.trips.getActiveForBus(bus.id);
      set({ activeTrip: trip, tracking: bus.status === 'trip_started' && !!trip });
    });

    Location.hasServicesEnabledAsync().then((enabled) => set({ locationServicesEnabled: enabled }));
  },

  startTrip: async (driverId) => {
    const bus = get().bus;
    if (!bus) {
      set({ error: 'No bus is assigned to this driver account yet.' });
      return;
    }
    set({ error: null });

    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      set({ error: 'Location permission is required to start a trip.' });
      return;
    }
    const servicesEnabled = await Location.hasServicesEnabledAsync();
    set({ locationServicesEnabled: servicesEnabled });
    if (!servicesEnabled) {
      set({ error: 'Please enable device location services.' });
      return;
    }

    const hour = new Date().getHours();
    const type: RouteType = hour < 13 ? 'morning' : 'afternoon';
    const routeId = type === 'morning' ? bus.morningRouteId ?? bus.afternoonRouteId : bus.afternoonRouteId ?? bus.morningRouteId;
    if (!routeId) {
      set({ error: "This bus doesn't have a route configured yet — ask the admin to set one up." });
      return;
    }
    const resolvedType: RouteType = routeId === bus.morningRouteId ? 'morning' : 'afternoon';

    try {
      const tripId = await repo.trips.start({ busId: bus.id, driverId, routeId, type: resolvedType });
      await repo.buses.updateStatus(bus.id, { status: 'trip_started', currentTripId: tripId });
      set({ activeTrip: { id: tripId, busId: bus.id, driverId, routeId, type: resolvedType, status: 'active', startedAt: new Date().toISOString(), endedAt: null }, tracking: true });

      watchSubscription = await Location.watchPositionAsync(
        { accuracy: Location.LocationAccuracy.High, timeInterval: GPS_WRITE_INTERVAL_MS, distanceInterval: 0 },
        (location) => {
          repo.liveLocation.write(bus.id, {
            lat: location.coords.latitude,
            lng: location.coords.longitude,
            speed: location.coords.speed,
            heading: location.coords.heading,
            accuracy: location.coords.accuracy,
            timestamp: location.timestamp,
            tripId,
            driverId,
          });
          set({ lastAccuracy: location.coords.accuracy, lastUpdatedAt: location.timestamp });
        },
      );
    } catch (e) {
      set({ error: e instanceof Error ? e.message : 'Failed to start trip.' });
    }
  },

  endTrip: async () => {
    const { bus, activeTrip } = get();
    await stopWatching();
    set({ tracking: false });
    if (!bus || !activeTrip) return;
    try {
      await repo.trips.end(activeTrip.id);
      await repo.buses.updateStatus(bus.id, { status: 'trip_completed', currentTripId: null });
      set({ activeTrip: null });
    } catch (e) {
      set({ error: e instanceof Error ? e.message : 'Failed to end trip.' });
    }
  },
}));
