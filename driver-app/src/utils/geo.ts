import { GpsQuality } from '@/types';

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
