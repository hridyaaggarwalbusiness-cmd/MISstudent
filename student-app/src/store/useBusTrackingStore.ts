import { create } from 'zustand';
import { Platform } from 'react-native';
import { repo } from '@data/repositories';
import { Bus, BusRoute, BusStop, LiveLocation, SchoolLocation, Trip, AppNotification } from '@/types';
import { haversineDistanceMeters } from '@utils/geo';

const SCHOOL_REACHED_RADIUS_METERS = 200;
const STOP_PROXIMITY_RADIUS_METERS = 500;

// There is no Cloud Function / FCM server on this project's Spark plan, so
// "push" notifications are produced client-side while the app is open: this
// store watches the bus's live Firestore/RTDB state and (a) pops a real
// browser Notification when permitted, (b) appends an AppNotification-shaped
// event that useNotificationsStore folds into the in-app Notifications
// center, exactly like the existing homework/notice entries.
function notifyBrowser(title: string, body: string) {
  if (Platform.OS !== 'web') return;
  if (typeof Notification === 'undefined') return;
  if (Notification.permission !== 'granted') return;
  try {
    // eslint-disable-next-line no-new
    new Notification(title, { body });
  } catch {
    // Notification constructor can throw in some embedded/webview contexts — non-fatal.
  }
}

export function requestBusNotificationPermission() {
  if (Platform.OS !== 'web') return;
  if (typeof Notification === 'undefined') return;
  if (Notification.permission === 'default') {
    Notification.requestPermission().catch(() => {});
  }
}

interface BusTrackingState {
  busId: string | null;
  bus: Bus | null;
  trip: Trip | null;
  route: BusRoute | null;
  stops: BusStop[];
  liveLocation: LiveLocation | null;
  schoolLocation: SchoolLocation | null;
  driverOnline: boolean | null;
  events: AppNotification[];
  init: (busId: string, assignedStopId: string | undefined | null) => void;
  reset: () => void;
}

let unsubscribers: (() => void)[] = [];
let activeBusId: string | null = null;
let prevStatus: Bus['status'] | null = null;
let approachingFired = false;
let reachedSchoolFired = false;
let driverStatusDriverId: string | null = null;
let driverStatusUnsub: (() => void) | null = null;

function pushEvent(set: (fn: (s: BusTrackingState) => Partial<BusTrackingState>) => void, evt: Omit<AppNotification, 'isRead'>) {
  notifyBrowser(evt.title, evt.body);
  set((s) => ({ events: [{ ...evt, isRead: false }, ...s.events].slice(0, 50) }));
}

export const useBusTrackingStore = create<BusTrackingState>((set, get) => ({
  busId: null,
  bus: null,
  trip: null,
  route: null,
  stops: [],
  liveLocation: null,
  schoolLocation: null,
  driverOnline: null,
  events: [],

  init: (busId, assignedStopId) => {
    if (!busId || activeBusId === busId) return;
    get().reset();
    activeBusId = busId;
    prevStatus = null;
    approachingFired = false;
    reachedSchoolFired = false;
    set({ busId });

    unsubscribers.push(
      repo.busStops.subscribeAll((stops) => set({ stops })),
      repo.schoolLocation.subscribe((schoolLocation) => set({ schoolLocation })),
      repo.trips.subscribeActiveForBus(busId, (trip) => {
        set({ trip });
        if (trip?.routeId) {
          repo.routes.get(trip.routeId).then((route) => set({ route }));
        }
      }),
      repo.buses.subscribe(busId, (bus) => {
        set({ bus });
        if (!bus) return;

        if (bus.driverId && bus.driverId !== driverStatusDriverId) {
          driverStatusUnsub?.();
          driverStatusDriverId = bus.driverId;
          driverStatusUnsub = repo.driverStatus.subscribe(bus.driverId, (online) => set({ driverOnline: online }));
        }

        if (prevStatus !== 'trip_started' && bus.status === 'trip_started') {
          pushEvent(set, {
            id: `bus-started-${busId}-${Date.now()}`,
            type: 'bus',
            title: 'Bus Trip Started',
            body: `${bus.busNumber} has started its trip.`,
            createdAt: new Date().toISOString(),
            refId: busId,
          });
          approachingFired = false;
          reachedSchoolFired = false;
        }
        if (prevStatus === 'trip_started' && bus.status === 'trip_completed') {
          pushEvent(set, {
            id: `bus-completed-${busId}-${Date.now()}`,
            type: 'bus',
            title: 'Trip Completed',
            body: `${bus.busNumber}'s trip has ended.`,
            createdAt: new Date().toISOString(),
            refId: busId,
          });
        }
        prevStatus = bus.status;

        if (!bus.morningRouteId && !bus.afternoonRouteId) return;
        // Fall back to whichever route exists if there's no active trip yet
        // (e.g. viewing the screen before the driver has pressed Start Trip).
        if (!get().trip) {
          const hour = new Date().getHours();
          const fallbackRouteId = hour < 13 ? bus.morningRouteId ?? bus.afternoonRouteId : bus.afternoonRouteId ?? bus.morningRouteId;
          if (fallbackRouteId) repo.routes.get(fallbackRouteId).then((route) => set({ route }));
        }
      }),
      repo.liveLocation.subscribe(busId, (liveLocation) => {
        set({ liveLocation });
        const { bus, stops, schoolLocation } = get();
        if (!liveLocation || bus?.status !== 'trip_started') return;

        if (!reachedSchoolFired && schoolLocation) {
          const d = haversineDistanceMeters(liveLocation, schoolLocation);
          if (d <= SCHOOL_REACHED_RADIUS_METERS) {
            reachedSchoolFired = true;
            pushEvent(set, {
              id: `bus-school-${busId}-${Date.now()}`,
              type: 'bus',
              title: 'Bus Reached School',
              body: `${bus.busNumber} has arrived at school.`,
              createdAt: new Date().toISOString(),
              refId: busId,
            });
          }
        }

        if (!approachingFired && assignedStopId) {
          const myStop = stops.find((s) => s.id === assignedStopId);
          if (myStop) {
            const d = haversineDistanceMeters(liveLocation, myStop);
            if (d <= STOP_PROXIMITY_RADIUS_METERS) {
              approachingFired = true;
              pushEvent(set, {
                id: `bus-approaching-${busId}-${Date.now()}`,
                type: 'bus',
                title: 'Bus Approaching Your Stop',
                body: `${bus.busNumber} is within 500m of ${myStop.name}.`,
                createdAt: new Date().toISOString(),
                refId: busId,
              });
            }
          }
        }
      }),
    );
  },

  reset: () => {
    unsubscribers.forEach((u) => u());
    unsubscribers = [];
    driverStatusUnsub?.();
    driverStatusUnsub = null;
    driverStatusDriverId = null;
    activeBusId = null;
    set({ busId: null, bus: null, trip: null, route: null, liveLocation: null, driverOnline: null });
  },
}));
