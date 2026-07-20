import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '@store/useAuthStore';
import { useTripStore } from '@store/useTripStore';
import { repo } from '@data/repositories';
import { gpsQualityFromAccuracy, GPS_QUALITY_META } from '@utils/geo';

const PRIMARY = '#3E6BFA';
const DANGER = '#C22A2F';
const SUCCESS = '#16803F';
const TEXT_PRIMARY = '#161B22';
const TEXT_SECONDARY = '#5C6673';
const BORDER = '#E6E9EF';
const BG = '#F5F7FB';

function relativeTimeFrom(ms: number | null): string {
  if (!ms) return '—';
  const diffSec = Math.max(0, Math.round((Date.now() - ms) / 1000));
  if (diffSec < 5) return 'just now';
  if (diffSec < 60) return `${diffSec}s ago`;
  const diffMin = Math.round(diffSec / 60);
  return `${diffMin}m ago`;
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>{title}</Text>
      {children}
    </View>
  );
}

function Row({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={[styles.rowValue, color ? { color } : null]}>{value}</Text>
    </View>
  );
}

export function DriverHomeScreen() {
  const driver = useAuthStore((s) => s.driver);
  const signOut = useAuthStore((s) => s.signOut);
  const { bus, tracking, locationServicesEnabled, lastAccuracy, lastUpdatedAt, error, initForDriver, startTrip, endTrip } =
    useTripStore();
  const [connected, setConnected] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (driver?.id) {
      initForDriver(driver.id);
      const unsub = repo.driverPresence.watchConnection(driver.id, setConnected);
      return unsub;
    }
  }, [driver?.id, initForDriver]);

  async function onStartTrip() {
    if (!driver) return;
    setBusy(true);
    await startTrip(driver.id);
    setBusy(false);
  }

  async function onEndTrip() {
    setBusy(true);
    await endTrip();
    setBusy(false);
  }

  const quality = gpsQualityFromAccuracy(lastAccuracy);
  const qualityMeta = GPS_QUALITY_META[quality];

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Driver App</Text>
        <Pressable
          onPress={() =>
            Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Sign Out',
                style: 'destructive',
                onPress: async () => {
                  if (driver?.id) await repo.driverPresence.goOffline(driver.id);
                  await signOut();
                },
              },
            ])
          }
        >
          <Text style={styles.signOut}>Sign Out</Text>
        </Pressable>
      </View>

      <View style={styles.content}>
        {error && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <Card title="Driver Information">
          <Row label="Name" value={driver?.name ?? '—'} />
          <Row label="Phone" value={driver?.phone ?? '—'} />
        </Card>

        <Card title="Bus Information">
          <Row label="Bus Number" value={bus?.busNumber ?? 'No bus assigned'} />
          <Row label="Vehicle Reg. No." value={bus?.vehicleRegistrationNumber ?? '—'} />
        </Card>

        <Card title="GPS Status">
          <Row label="GPS Quality" value={qualityMeta.label} color={qualityMeta.color} />
          <Row label="Last Updated" value={relativeTimeFrom(lastUpdatedAt)} />
          <Row
            label="GPS Enabled"
            value={locationServicesEnabled == null ? '—' : locationServicesEnabled ? 'Enabled' : 'Disabled'}
            color={locationServicesEnabled ? SUCCESS : DANGER}
          />
          <Row label="Driver Status" value={connected ? 'Online' : 'Offline'} color={connected ? SUCCESS : DANGER} />
        </Card>

        <View style={{ flex: 1 }} />

        {!tracking ? (
          <Pressable
            style={[styles.tripButton, { backgroundColor: PRIMARY }, (!bus || busy) && styles.disabled]}
            onPress={onStartTrip}
            disabled={!bus || busy}
          >
            {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.tripButtonText}>Start Trip</Text>}
          </Pressable>
        ) : (
          <Pressable style={[styles.tripButton, { backgroundColor: DANGER }, busy && styles.disabled]} onPress={onEndTrip} disabled={busy}>
            {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.tripButtonText}>End Trip</Text>}
          </Pressable>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BG },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  headerTitle: { fontSize: 20, fontWeight: '700', color: TEXT_PRIMARY },
  signOut: { fontSize: 14, color: DANGER, fontWeight: '600' },
  content: { flex: 1, paddingHorizontal: 20, paddingBottom: 20 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 16,
    marginBottom: 14,
  },
  cardTitle: { fontSize: 13, fontWeight: '700', color: TEXT_SECONDARY, marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.4 },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
  rowLabel: { fontSize: 14, color: TEXT_SECONDARY },
  rowValue: { fontSize: 14, fontWeight: '600', color: TEXT_PRIMARY },
  errorBanner: {
    backgroundColor: '#FFE4E4',
    borderRadius: 10,
    padding: 12,
    marginBottom: 14,
  },
  errorText: { color: DANGER, fontSize: 13 },
  tripButton: {
    height: 56,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },
  tripButtonText: { color: '#fff', fontSize: 17, fontWeight: '700' },
  disabled: { opacity: 0.5 },
});
