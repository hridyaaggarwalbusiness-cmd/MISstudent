export type BusStatus = 'offline' | 'online' | 'trip_started' | 'trip_completed';
export type RouteType = 'morning' | 'afternoon';
export type GpsQuality = 'excellent' | 'good' | 'weak';

export interface DriverProfile {
  id: string;
  name: string;
  phone: string;
  assignedBusId: string | null;
  fcmTokens?: string[];
}

export interface Bus {
  id: string;
  busNumber: string;
  vehicleRegistrationNumber: string;
  driverId: string | null;
  driverName: string;
  driverPhone: string;
  morningRouteId: string | null;
  afternoonRouteId: string | null;
  status: BusStatus;
  currentTripId: string | null;
  createdAt: string;
}

// One Start Trip -> End Trip cycle.
export interface Trip {
  id: string;
  busId: string;
  driverId: string;
  routeId: string;
  type: RouteType;
  status: 'active' | 'completed';
  startedAt: string;
  endedAt: string | null;
}

// The live GPS ping for a bus - lives in Realtime Database, not Firestore,
// because it's overwritten every 5-10s and RTDB (not Firestore's per-write
// billing/latency model) is built for that kind of churn.
export interface LiveLocation {
  lat: number;
  lng: number;
  speed: number | null;
  heading: number | null;
  accuracy: number | null;
  timestamp: number;
  tripId: string;
  driverId: string;
}
