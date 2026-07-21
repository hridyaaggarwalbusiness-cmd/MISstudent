import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { colors } from '@theme';

export interface MapStopMarker {
  id: string;
  name: string;
  lat: number;
  lng: number;
  isStudentStop: boolean;
  crossed: boolean;
}

interface MapViewProps {
  busPosition?: { lat: number; lng: number; heading?: number | null } | null;
  schoolLocation?: { lat: number; lng: number; name: string } | null;
  stops: MapStopMarker[];
  height?: number;
}

// OpenStreetMap via Leaflet — display + markers + a Polyline drawn from
// stored stop coordinates only. No Google Maps, no API key, no billing
// account: this is a completely free, no-signup mapping stack. Only ever
// runs on web: these apps only ship a web export, and Leaflet itself is a
// browser-only library.
export function MapView({ busPosition, schoolLocation, stops, height = 320 }: MapViewProps) {
  const containerRef = useRef<View>(null);
  const mapRef = useRef<L.Map | null>(null);
  const busMarkerRef = useRef<L.CircleMarker | null>(null);
  const stopMarkersRef = useRef<L.CircleMarker[]>([]);
  const schoolMarkerRef = useRef<L.CircleMarker | null>(null);
  const polylineRef = useRef<L.Polyline | null>(null);
  const [ready, setReady] = React.useState(false);

  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const node = containerRef.current as unknown as HTMLElement | null;
    if (!node) return;

    const center = busPosition ?? schoolLocation ?? stops[0] ?? { lat: 20.5937, lng: 78.9629 };
    const map = L.map(node, { zoomControl: true, attributionControl: true }).setView([center.lat, center.lng], 13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(map);
    mapRef.current = map;
    setReady(true);

    // This screen is pushed with a slide-in transform (see RootNavigator's
    // animation: 'slide_from_right'), which is still animating when this
    // map is created - Leaflet reads the container's geometry at creation
    // time, so a transform still in flight leaves its drag/pan math
    // permanently misaligned even though zoom buttons keep working.
    // Recalculating once the transition has settled fixes it.
    const fixTimers = [100, 350, 600].map((ms) => setTimeout(() => map.invalidateSize(), ms));

    return () => {
      fixTimers.forEach((t) => clearTimeout(t));
      map.remove();
      mapRef.current = null;
      setReady(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // School marker (static once map is ready).
  useEffect(() => {
    if (!ready || !mapRef.current || !schoolLocation) return;
    if (!schoolMarkerRef.current) {
      schoolMarkerRef.current = L.circleMarker([schoolLocation.lat, schoolLocation.lng], {
        radius: 9,
        color: '#ffffff',
        weight: 2,
        fillColor: '#2C52D9',
        fillOpacity: 1,
      })
        .bindTooltip(schoolLocation.name || 'School')
        .addTo(mapRef.current);
    } else {
      schoolMarkerRef.current.setLatLng([schoolLocation.lat, schoolLocation.lng]);
    }
  }, [ready, schoolLocation]);

  // Stop markers + the blue route polyline connecting them in stored order.
  useEffect(() => {
    if (!ready || !mapRef.current) return;

    stopMarkersRef.current.forEach((m) => m.remove());
    stopMarkersRef.current = stops.map((stop) =>
      L.circleMarker([stop.lat, stop.lng], {
        radius: stop.isStudentStop ? 10 : 6,
        color: '#ffffff',
        weight: 2,
        fillColor: stop.isStudentStop ? '#F2711F' : stop.crossed ? '#9AA3B2' : '#16803F',
        fillOpacity: 1,
      })
        .bindTooltip(stop.name)
        .addTo(mapRef.current!),
    );

    polylineRef.current?.remove();
    if (stops.length > 1) {
      polylineRef.current = L.polyline(
        stops.map((s) => [s.lat, s.lng]),
        { color: '#2C52D9', opacity: 0.9, weight: 4 },
      ).addTo(mapRef.current);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, JSON.stringify(stops)]);

  // Live bus marker.
  useEffect(() => {
    if (!ready || !mapRef.current) return;
    if (!busPosition) {
      busMarkerRef.current?.remove();
      busMarkerRef.current = null;
      return;
    }
    if (!busMarkerRef.current) {
      busMarkerRef.current = L.circleMarker([busPosition.lat, busPosition.lng], {
        radius: 8,
        color: '#ffffff',
        weight: 2,
        fillColor: '#C22A2F',
        fillOpacity: 1,
      })
        .bindTooltip('Bus')
        .addTo(mapRef.current);
    } else {
      busMarkerRef.current.setLatLng([busPosition.lat, busPosition.lng]);
    }
  }, [ready, busPosition]);

  if (Platform.OS !== 'web') {
    return <View style={[styles.fallback, { height }]} />;
  }

  return (
    <View style={[styles.container, { height }]}>
      <View ref={containerRef} style={StyleSheet.absoluteFill} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: colors.surfaceAlt,
  },
  fallback: {
    width: '100%',
    borderRadius: 16,
    backgroundColor: colors.surfaceAlt,
  },
});
