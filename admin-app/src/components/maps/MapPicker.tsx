import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

export interface MapMarkerPoint {
  id: string;
  lat: number;
  lng: number;
  label?: string;
  color?: string;
}

interface MapPickerProps {
  height?: number;
  center?: { lat: number; lng: number };
  markers?: MapMarkerPoint[];
  selected?: { lat: number; lng: number } | null;
  onPick?: (point: { lat: number; lng: number }) => void;
}

// OpenStreetMap via Leaflet — display + click-to-pick-a-coordinate only, no
// API key or billing account of any kind. Used to let the admin drop bus
// stops and the school location directly onto the map instead of typing
// raw lat/lng values.
export function MapPicker({ height = 360, center, markers = [], selected, onPick }: MapPickerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRefs = useRef<L.CircleMarker[]>([]);
  const selectedMarkerRef = useRef<L.CircleMarker | null>(null);
  const onPickRef = useRef(onPick);
  onPickRef.current = onPick;
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!containerRef.current) return;
    const initialCenter = center ?? { lat: 20.5937, lng: 78.9629 };
    const map = L.map(containerRef.current, { zoomControl: true }).setView(
      [initialCenter.lat, initialCenter.lng],
      center ? 14 : 5,
    );
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(map);
    map.on('click', (e: L.LeafletMouseEvent) => {
      onPickRef.current?.({ lat: e.latlng.lat, lng: e.latlng.lng });
    });
    mapRef.current = map;
    setReady(true);

    return () => {
      map.remove();
      mapRef.current = null;
      setReady(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!ready || !mapRef.current) return;
    markerRefs.current.forEach((m) => m.remove());
    markerRefs.current = markers.map((m) =>
      L.circleMarker([m.lat, m.lng], {
        radius: 7,
        color: '#ffffff',
        weight: 2,
        fillColor: m.color ?? '#16803F',
        fillOpacity: 1,
      })
        .bindTooltip(m.label ?? '')
        .addTo(mapRef.current!),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, JSON.stringify(markers)]);

  useEffect(() => {
    if (!ready || !mapRef.current) return;
    if (!selected) {
      selectedMarkerRef.current?.remove();
      selectedMarkerRef.current = null;
      return;
    }
    if (!selectedMarkerRef.current) {
      selectedMarkerRef.current = L.circleMarker([selected.lat, selected.lng], {
        radius: 9,
        color: '#ffffff',
        weight: 2,
        fillColor: '#F2711F',
        fillOpacity: 1,
      }).addTo(mapRef.current);
      mapRef.current.panTo([selected.lat, selected.lng]);
    } else {
      selectedMarkerRef.current.setLatLng([selected.lat, selected.lng]);
    }
  }, [ready, selected]);

  return <div ref={containerRef} style={{ height, borderRadius: 12, overflow: 'hidden' }} />;
}
