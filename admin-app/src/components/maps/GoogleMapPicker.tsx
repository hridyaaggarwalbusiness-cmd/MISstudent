import { useEffect, useRef, useState } from 'react';
import { setOptions, importLibrary } from '@googlemaps/js-api-loader';

export interface MapMarkerPoint {
  id: string;
  lat: number;
  lng: number;
  label?: string;
  color?: string;
}

interface GoogleMapPickerProps {
  height?: number;
  center?: { lat: number; lng: number };
  markers?: MapMarkerPoint[];
  selected?: { lat: number; lng: number } | null;
  onPick?: (point: { lat: number; lng: number }) => void;
}

let optionsSet = false;
function ensureMapsOptions(): boolean {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined;
  if (!apiKey) return false;
  if (!optionsSet) {
    setOptions({ key: apiKey, v: 'weekly' });
    optionsSet = true;
  }
  return true;
}

// Google Maps JS API, display + click-to-pick-a-coordinate only — no
// Directions/Places/Geocoding calls. Used to let the admin drop bus stops
// and the school location directly onto the map instead of typing raw
// lat/lng values.
export function GoogleMapPicker({ height = 360, center, markers = [], selected, onPick }: GoogleMapPickerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const markerRefs = useRef<google.maps.Marker[]>([]);
  const selectedMarkerRef = useRef<google.maps.Marker | null>(null);
  const onPickRef = useRef(onPick);
  onPickRef.current = onPick;
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!ensureMapsOptions()) {
      setError('Google Maps API key is not configured.');
      return;
    }
    let cancelled = false;
    importLibrary('maps')
      .then(() => importLibrary('marker'))
      .then(() => {
        if (cancelled || !containerRef.current) return;
        mapRef.current = new google.maps.Map(containerRef.current, {
          center: center ?? { lat: 20.5937, lng: 78.9629 },
          zoom: center ? 14 : 5,
          streetViewControl: false,
          mapTypeControl: false,
          fullscreenControl: false,
        });
        mapRef.current.addListener('click', (e: google.maps.MapMouseEvent) => {
          if (e.latLng) onPickRef.current?.({ lat: e.latLng.lat(), lng: e.latLng.lng() });
        });
        setReady(true);
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load Google Maps.');
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!ready || !mapRef.current) return;
    markerRefs.current.forEach((m) => m.setMap(null));
    markerRefs.current = markers.map(
      (m) =>
        new google.maps.Marker({
          map: mapRef.current!,
          position: { lat: m.lat, lng: m.lng },
          title: m.label,
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 7,
            fillColor: m.color ?? '#16803F',
            fillOpacity: 1,
            strokeColor: '#ffffff',
            strokeWeight: 2,
          },
        }),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, JSON.stringify(markers)]);

  useEffect(() => {
    if (!ready || !mapRef.current) return;
    if (!selected) {
      selectedMarkerRef.current?.setMap(null);
      selectedMarkerRef.current = null;
      return;
    }
    if (!selectedMarkerRef.current) {
      selectedMarkerRef.current = new google.maps.Marker({
        map: mapRef.current,
        position: selected,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 9,
          fillColor: '#F2711F',
          fillOpacity: 1,
          strokeColor: '#ffffff',
          strokeWeight: 2,
        },
        zIndex: 10,
      });
      mapRef.current.panTo(selected);
    } else {
      selectedMarkerRef.current.setPosition(selected);
    }
  }, [ready, selected]);

  if (error) {
    return (
      <div
        style={{
          height,
          borderRadius: 12,
          background: 'var(--color-surface-alt, #f2f2f2)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 16,
          textAlign: 'center',
          fontSize: 13,
          color: 'var(--color-text-tertiary, #888)',
        }}
      >
        {error}
      </div>
    );
  }

  return <div ref={containerRef} style={{ height, borderRadius: 12, overflow: 'hidden' }} />;
}
