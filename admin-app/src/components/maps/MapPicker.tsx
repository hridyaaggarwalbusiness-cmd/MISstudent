import { useEffect, useRef, useState } from 'react';
import { Search, Loader2 } from 'lucide-react';
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

interface SearchResult {
  display_name: string;
  lat: string;
  lon: string;
}

// OpenStreetMap via Leaflet — display + click-to-pick-a-coordinate only, no
// API key or billing account of any kind. Place search uses Nominatim
// (OpenStreetMap's free geocoder) — also no key, no billing.
export function MapPicker({ height = 360, center, markers = [], selected, onPick }: MapPickerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRefs = useRef<L.CircleMarker[]>([]);
  const selectedMarkerRef = useRef<L.CircleMarker | null>(null);
  const onPickRef = useRef(onPick);
  onPickRef.current = onPick;
  const [ready, setReady] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);

  useEffect(() => {
    if (!containerRef.current) return;
    const initialCenter = center ?? { lat: 20.5937, lng: 78.9629 };
    const map = L.map(containerRef.current, { zoomControl: true, dragging: true, scrollWheelZoom: true }).setView(
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

    // The map is almost always created while it's inside a Modal that's
    // still mid-animation (a CSS transform on an ancestor) - Leaflet reads
    // the container's size/position at creation time, and a transform still
    // in flight throws that off, leaving drag/pan permanently misaligned
    // even though zoom buttons (which don't depend on that math) still
    // work. Recalculating once the animation has settled fixes it.
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

  // Debounced Nominatim search — free OpenStreetMap geocoding, no key.
  useEffect(() => {
    const q = query.trim();
    if (q.length < 3) {
      setResults([]);
      return;
    }
    setSearching(true);
    const timer = window.setTimeout(async () => {
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&limit=6&q=${encodeURIComponent(q)}`,
        );
        const data: SearchResult[] = await res.json();
        setResults(data);
        setShowResults(true);
      } catch {
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 500);
    return () => window.clearTimeout(timer);
  }, [query]);

  function selectResult(r: SearchResult) {
    const lat = parseFloat(r.lat);
    const lng = parseFloat(r.lon);
    mapRef.current?.setView([lat, lng], 16);
    onPickRef.current?.({ lat, lng });
    setQuery(r.display_name);
    setShowResults(false);
  }

  return (
    <div>
      <div style={{ position: 'relative', marginBottom: 8 }}>
        <div style={{ position: 'relative' }}>
          <Search
            size={15}
            style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-tertiary)' }}
          />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => results.length > 0 && setShowResults(true)}
            placeholder="Search for a place or address…"
            style={{
              width: '100%',
              padding: '9px 12px 9px 32px',
              borderRadius: 8,
              border: '1px solid var(--color-border-soft, #ddd)',
              fontSize: 14,
              boxSizing: 'border-box',
            }}
          />
          {searching && (
            <Loader2
              size={15}
              className="spin"
              style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-tertiary)' }}
            />
          )}
        </div>
        {showResults && results.length > 0 && (
          <div
            style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              zIndex: 500,
              background: 'var(--color-surface, #fff)',
              border: '1px solid var(--color-border-soft, #ddd)',
              borderRadius: 8,
              marginTop: 4,
              maxHeight: 220,
              overflowY: 'auto',
              boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
            }}
          >
            {results.map((r, i) => (
              <div
                key={i}
                onClick={() => selectResult(r)}
                style={{ padding: '8px 12px', fontSize: 13, cursor: 'pointer', borderBottom: i < results.length - 1 ? '1px solid var(--color-border-soft, #eee)' : undefined }}
                onMouseDown={(e) => e.preventDefault()}
              >
                {r.display_name}
              </div>
            ))}
          </div>
        )}
      </div>
      <div ref={containerRef} style={{ height, borderRadius: 12, overflow: 'hidden' }} />
      <div style={{ fontSize: 12, color: 'var(--color-text-tertiary)', marginTop: 6 }}>
        Search above, or drag the map to pan, scroll to zoom, and click to drop the pin.
      </div>
    </div>
  );
}
