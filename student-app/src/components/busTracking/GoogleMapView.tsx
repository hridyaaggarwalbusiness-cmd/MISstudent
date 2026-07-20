/// <reference types="google.maps" />
import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { setOptions, importLibrary } from '@googlemaps/js-api-loader';
import { AppText } from '@components/ui';
import { colors, spacing } from '@theme';

export interface MapStopMarker {
  id: string;
  name: string;
  lat: number;
  lng: number;
  isStudentStop: boolean;
  crossed: boolean;
}

interface GoogleMapViewProps {
  busPosition?: { lat: number; lng: number; heading?: number | null } | null;
  schoolLocation?: { lat: number; lng: number; name: string } | null;
  stops: MapStopMarker[];
  height?: number;
}

let optionsSet = false;
function ensureMapsOptions(): boolean {
  const apiKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;
  if (!apiKey) return false;
  if (!optionsSet) {
    setOptions({ key: apiKey, v: 'weekly' });
    optionsSet = true;
  }
  return true;
}

// Google Maps JS API is display-only here (map + markers + a Polyline drawn
// from stored stop coordinates) — no Directions/Routes/Distance Matrix calls
// anywhere in this component. Only ever runs on web: these apps only ship a
// web export, and the Google Maps JS SDK itself is a browser-only script.
export function GoogleMapView({ busPosition, schoolLocation, stops, height = 320 }: GoogleMapViewProps) {
  const containerRef = useRef<View>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const busMarkerRef = useRef<google.maps.Marker | null>(null);
  const stopMarkersRef = useRef<google.maps.Marker[]>([]);
  const schoolMarkerRef = useRef<google.maps.Marker | null>(null);
  const polylineRef = useRef<google.maps.Polyline | null>(null);
  const [ready, setReady] = React.useState(false);
  const [loadError, setLoadError] = React.useState<string | null>(null);

  useEffect(() => {
    if (Platform.OS !== 'web') return;
    if (!ensureMapsOptions()) {
      setLoadError('Google Maps API key is not configured.');
      return;
    }
    let cancelled = false;
    importLibrary('maps')
      .then(() => importLibrary('marker'))
      .then(() => {
        if (cancelled) return;
        const node = (containerRef.current as unknown as HTMLElement) ?? null;
        if (!node) return;
        const center = busPosition ?? schoolLocation ?? stops[0] ?? { lat: 20.5937, lng: 78.9629 };
        mapRef.current = new google.maps.Map(node, {
          center,
          zoom: 13,
          disableDefaultUI: true,
          zoomControl: true,
          streetViewControl: false,
          mapTypeControl: false,
          fullscreenControl: false,
        });
        setReady(true);
      })
      .catch((err: unknown) => {
        if (!cancelled) setLoadError(err instanceof Error ? err.message : 'Failed to load Google Maps.');
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // School marker (static once map is ready).
  useEffect(() => {
    if (!ready || !mapRef.current || !schoolLocation) return;
    if (!schoolMarkerRef.current) {
      schoolMarkerRef.current = new google.maps.Marker({
        map: mapRef.current,
        position: schoolLocation,
        title: schoolLocation.name || 'School',
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 9,
          fillColor: '#2C52D9',
          fillOpacity: 1,
          strokeColor: '#ffffff',
          strokeWeight: 2,
        },
        zIndex: 5,
      });
    } else {
      schoolMarkerRef.current.setPosition(schoolLocation);
    }
  }, [ready, schoolLocation]);

  // Stop markers + the blue route polyline connecting them in stored order.
  useEffect(() => {
    if (!ready || !mapRef.current) return;

    stopMarkersRef.current.forEach((m) => m.setMap(null));
    stopMarkersRef.current = stops.map(
      (stop) =>
        new google.maps.Marker({
          map: mapRef.current!,
          position: { lat: stop.lat, lng: stop.lng },
          title: stop.name,
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: stop.isStudentStop ? 10 : 6,
            fillColor: stop.isStudentStop ? '#F2711F' : stop.crossed ? '#9AA3B2' : '#16803F',
            fillOpacity: 1,
            strokeColor: '#ffffff',
            strokeWeight: 2,
          },
          zIndex: stop.isStudentStop ? 10 : 3,
        }),
    );

    polylineRef.current?.setMap(null);
    if (stops.length > 1) {
      polylineRef.current = new google.maps.Polyline({
        map: mapRef.current,
        path: stops.map((s) => ({ lat: s.lat, lng: s.lng })),
        strokeColor: '#2C52D9',
        strokeOpacity: 0.9,
        strokeWeight: 4,
        geodesic: true,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, JSON.stringify(stops)]);

  // Live bus marker.
  useEffect(() => {
    if (!ready || !mapRef.current) return;
    if (!busPosition) {
      busMarkerRef.current?.setMap(null);
      busMarkerRef.current = null;
      return;
    }
    if (!busMarkerRef.current) {
      busMarkerRef.current = new google.maps.Marker({
        map: mapRef.current,
        position: busPosition,
        title: 'Bus',
        icon: {
          path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
          scale: 6,
          rotation: busPosition.heading ?? 0,
          fillColor: '#C22A2F',
          fillOpacity: 1,
          strokeColor: '#ffffff',
          strokeWeight: 2,
        },
        zIndex: 20,
      });
    } else {
      busMarkerRef.current.setPosition(busPosition);
      const icon = busMarkerRef.current.getIcon() as google.maps.Symbol;
      busMarkerRef.current.setIcon({ ...icon, rotation: busPosition.heading ?? icon.rotation ?? 0 });
    }
  }, [ready, busPosition]);

  if (Platform.OS !== 'web') {
    return <View style={[styles.fallback, { height }]} />;
  }

  return (
    <View style={[styles.container, { height }]}>
      <View ref={containerRef} style={StyleSheet.absoluteFill} />
      {loadError && (
        <View style={styles.overlay}>
          <AppText variant="caption" color={colors.textTertiary} style={{ textAlign: 'center', paddingHorizontal: spacing.lg }}>
            {loadError}
          </AppText>
        </View>
      )}
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
  overlay: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceAlt,
  },
});
