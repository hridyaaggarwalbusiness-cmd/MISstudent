import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { BusStop } from '@/types';

interface RouteStopMapProps {
  stops: BusStop[];
  selectedStopIds: string[];
  onToggleStop: (stopId: string) => void;
  height?: number;
}

// Click any stop marker to add it to the route (in click order) or click it
// again to remove it — this is the primary way to build a route, the
// reorder/remove list below the map is the fallback for fine-tuning.
export function RouteStopMap({ stops, selectedStopIds, onToggleStop, height = 320 }: RouteStopMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRefs = useRef<Map<string, L.Marker | L.CircleMarker>>(new Map());
  const polylineRef = useRef<L.Polyline | null>(null);
  const onToggleRef = useRef(onToggleStop);
  onToggleRef.current = onToggleStop;
  const [ready, setReady] = useState(false);
  const fittedRef = useRef(false);

  useEffect(() => {
    if (!containerRef.current) return;
    const map = L.map(containerRef.current, { zoomControl: true }).setView([20.5937, 78.9629], 5);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(map);
    mapRef.current = map;
    setReady(true);

    const fixTimers = [100, 350, 600].map((ms) => window.setTimeout(() => map.invalidateSize(), ms));

    return () => {
      fixTimers.forEach((t) => window.clearTimeout(t));
      map.remove();
      mapRef.current = null;
      setReady(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!ready || !mapRef.current) return;
    const map = mapRef.current;

    markerRefs.current.forEach((m) => m.remove());
    markerRefs.current.clear();

    stops.forEach((stop) => {
      const order = selectedStopIds.indexOf(stop.id);
      const isSelected = order >= 0;
      const marker: L.Marker | L.CircleMarker = isSelected
        ? L.marker([stop.lat, stop.lng], {
            icon: L.divIcon({
              className: '',
              html: `<div style="width:26px;height:26px;border-radius:50%;background:#F2711F;border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;color:#fff;font-size:12px;font-weight:700;">${order + 1}</div>`,
              iconSize: [26, 26],
              iconAnchor: [13, 13],
            }),
          })
        : L.circleMarker([stop.lat, stop.lng], {
            radius: 7,
            color: '#ffffff',
            weight: 2,
            fillColor: '#16803F',
            fillOpacity: 1,
          });
      marker.bindTooltip(`${stop.name}${isSelected ? ' (in route — click to remove)' : ' (click to add)'}`);
      marker.on('click', () => onToggleRef.current(stop.id));
      marker.addTo(map);
      markerRefs.current.set(stop.id, marker);
    });

    polylineRef.current?.remove();
    if (selectedStopIds.length > 1) {
      const path = selectedStopIds
        .map((id) => stops.find((s) => s.id === id))
        .filter((s): s is BusStop => !!s)
        .map((s) => [s.lat, s.lng] as [number, number]);
      polylineRef.current = L.polyline(path, { color: '#2C52D9', opacity: 0.9, weight: 4 }).addTo(map);
    }

    if (!fittedRef.current && stops.length > 0) {
      fittedRef.current = true;
      map.fitBounds(
        stops.map((s) => [s.lat, s.lng] as [number, number]),
        { padding: [30, 30], maxZoom: 15 },
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, stops, selectedStopIds]);

  return <div ref={containerRef} style={{ height, borderRadius: 12, overflow: 'hidden' }} />;
}
