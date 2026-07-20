import { GpsQuality } from '@/types';

const EARTH_RADIUS_METERS = 6371000;

// Straight-line distance between two lat/lng points, in meters. No external
// distance API — this is the one and only distance calculation the bus
// tracking feature uses to decide when to fire proximity notifications.
export function haversineDistanceMeters(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);

  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_METERS * Math.asin(Math.sqrt(h));
}

// Device GPS accuracy is a radius in meters (68% confidence circle) — lower
// is better.
export function gpsQualityFromAccuracy(accuracyMeters: number | null | undefined): GpsQuality {
  if (accuracyMeters == null) return 'weak';
  if (accuracyMeters <= 15) return 'excellent';
  if (accuracyMeters <= 40) return 'good';
  return 'weak';
}

export const GPS_QUALITY_META: Record<GpsQuality, { label: string; color: string }> = {
  excellent: { label: 'Excellent', color: '#16803F' },
  good: { label: 'Good', color: '#B4720C' },
  weak: { label: 'Weak', color: '#C22A2F' },
};

const STOP_REACHED_RADIUS_METERS = 120;

// Flat equirectangular projection, accurate to a couple of meters over a
// bus route's few-kilometer span — used only to work out which leg of the
// route the bus is currently on, never for the notification distance
// (that's pure Haversine above, per spec).
function toLocalMeters(point: { lat: number; lng: number }, origin: { lat: number; lng: number }) {
  const latRad = (origin.lat * Math.PI) / 180;
  const mPerDegLat = 111320;
  const mPerDegLng = 111320 * Math.cos(latRad);
  return {
    x: (point.lng - origin.lng) * mPerDegLng,
    y: (point.lat - origin.lat) * mPerDegLat,
  };
}

// Finds the route leg (segment between two consecutive stops) the bus is
// currently closest to, via point-to-segment projection rather than plain
// closest-stop — so a bus between stop 3 and stop 4 is placed on that leg
// even if it happens to be physically nearer some earlier stop (e.g. on a
// loop route). Returns the index of the "next stop" (the far end of that
// leg, or one past it once reached); every stop before that index counts as
// already crossed.
export function nextStopIndex(
  busPos: { lat: number; lng: number },
  orderedStops: { lat: number; lng: number }[],
): number {
  if (orderedStops.length === 0) return 0;
  if (orderedStops.length === 1) {
    return haversineDistanceMeters(busPos, orderedStops[0]) <= STOP_REACHED_RADIUS_METERS ? 1 : 0;
  }

  const origin = orderedStops[0];
  const bus = toLocalMeters(busPos, origin);

  let bestLeg = 0;
  let bestDistSq = Infinity;
  for (let i = 0; i < orderedStops.length - 1; i++) {
    const a = toLocalMeters(orderedStops[i], origin);
    const b = toLocalMeters(orderedStops[i + 1], origin);
    const abx = b.x - a.x;
    const aby = b.y - a.y;
    const lenSq = abx * abx + aby * aby;
    let t = lenSq === 0 ? 0 : ((bus.x - a.x) * abx + (bus.y - a.y) * aby) / lenSq;
    t = Math.max(0, Math.min(1, t));
    const px = a.x + t * abx;
    const py = a.y + t * aby;
    const dx = bus.x - px;
    const dy = bus.y - py;
    const distSq = dx * dx + dy * dy;
    if (distSq < bestDistSq) {
      bestDistSq = distSq;
      bestLeg = i;
    }
  }

  const farStop = orderedStops[bestLeg + 1];
  if (haversineDistanceMeters(busPos, farStop) <= STOP_REACHED_RADIUS_METERS) {
    return Math.min(bestLeg + 2, orderedStops.length);
  }
  return bestLeg + 1;
}

export function hasBusCrossedStop(nextIdx: number, stopIndex: number): boolean {
  return stopIndex < nextIdx;
}
