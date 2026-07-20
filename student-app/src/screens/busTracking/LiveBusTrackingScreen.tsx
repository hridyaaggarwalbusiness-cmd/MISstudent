import React, { useEffect, useMemo } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { AppText, Card, Badge, DetailHeader, EmptyState } from '@components/ui';
import { MapView, MapStopMarker } from '@components/busTracking/MapView';
import { colors, spacing, radius } from '@theme';
import { useAuthStore } from '@store/useAuthStore';
import { useBusTrackingStore, requestBusNotificationPermission } from '@store/useBusTrackingStore';
import { gpsQualityFromAccuracy, GPS_QUALITY_META, nextStopIndex, hasBusCrossedStop } from '@utils/geo';
import { relativeTime } from '@utils/date';
import { BusStatus } from '@/types';

const STATUS_META: Record<BusStatus, { label: string; tone: 'success' | 'warning' | 'neutral' | 'info' }> = {
  offline: { label: 'Offline', tone: 'neutral' },
  online: { label: 'Online', tone: 'info' },
  trip_started: { label: 'Trip in Progress', tone: 'success' },
  trip_completed: { label: 'Trip Completed', tone: 'warning' },
};

export function LiveBusTrackingScreen() {
  const student = useAuthStore((s) => s.student);
  const { bus, route, stops, liveLocation, schoolLocation, driverOnline, init } = useBusTrackingStore();

  useEffect(() => {
    if (student?.assignedBusId) {
      requestBusNotificationPermission();
      init(student.assignedBusId, student.assignedStopId);
    }
  }, [student?.assignedBusId, student?.assignedStopId, init]);

  const orderedStops = useMemo(() => {
    if (!route) return [];
    const byId = new Map(stops.map((s) => [s.id, s]));
    return [...route.stops]
      .sort((a, b) => a.order - b.order)
      .map((rs) => byId.get(rs.stopId))
      .filter((s): s is NonNullable<typeof s> => !!s);
  }, [route, stops]);

  const nextIdx = useMemo(
    () => (liveLocation && orderedStops.length ? nextStopIndex(liveLocation, orderedStops) : -1),
    [liveLocation, orderedStops],
  );

  const mapStops: MapStopMarker[] = useMemo(
    () =>
      orderedStops.map((s, i) => ({
        id: s.id,
        name: s.name,
        lat: s.lat,
        lng: s.lng,
        isStudentStop: s.id === student?.assignedStopId,
        crossed: nextIdx >= 0 && hasBusCrossedStop(nextIdx, i),
      })),
    [orderedStops, nextIdx, student?.assignedStopId],
  );

  if (!student?.assignedBusId) {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
        <DetailHeader title="Live Bus Tracking" />
        <EmptyState
          icon="bus-outline"
          title="No bus assigned"
          message="You haven't been assigned to a bus route yet. Contact the school office if you think this is a mistake."
        />
      </SafeAreaView>
    );
  }

  const statusMeta = STATUS_META[bus?.status ?? 'offline'];
  const gpsQuality = gpsQualityFromAccuracy(liveLocation?.accuracy ?? null);
  const gpsQualityMeta = GPS_QUALITY_META[gpsQuality];
  const gpsFresh = !!liveLocation && Date.now() - liveLocation.timestamp < 30000;
  const myStopIdx = orderedStops.findIndex((s) => s.id === student.assignedStopId);
  const myStopCrossed = myStopIdx >= 0 && nextIdx >= 0 && hasBusCrossedStop(nextIdx, myStopIdx);
  const nextStop = nextIdx >= 0 && nextIdx < orderedStops.length ? orderedStops[nextIdx] : null;

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <DetailHeader title="Live Bus Tracking" />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Card padded={false} style={styles.mapCard}>
          <MapView
            height={260}
            busPosition={
              bus?.status === 'trip_started' && liveLocation
                ? { lat: liveLocation.lat, lng: liveLocation.lng, heading: liveLocation.heading }
                : null
            }
            schoolLocation={schoolLocation}
            stops={mapStops}
          />
        </Card>

        <Card style={styles.statusCard}>
          <View style={styles.statusRow}>
            <View style={{ flex: 1 }}>
              <AppText variant="h3">{bus?.busNumber ?? 'Bus'}</AppText>
              <AppText variant="caption" color={colors.textTertiary}>
                {bus?.vehicleRegistrationNumber}
              </AppText>
            </View>
            <Badge label={statusMeta.label} tone={statusMeta.tone} />
          </View>

          <View style={styles.metaGrid}>
            <MetaItem
              icon="wifi-outline"
              label="GPS Quality"
              value={gpsQualityMeta.label}
              valueColor={gpsQualityMeta.color}
            />
            <MetaItem
              icon="time-outline"
              label="Last Updated"
              value={liveLocation ? relativeTime(new Date(liveLocation.timestamp).toISOString()) : '—'}
            />
            <MetaItem
              icon="person-circle-outline"
              label="Driver"
              value={driverOnline == null ? '—' : driverOnline ? 'Online' : 'Offline'}
              valueColor={driverOnline ? colors.successStrong : colors.textSecondary}
            />
            <MetaItem
              icon="navigate-outline"
              label="GPS Signal"
              value={gpsFresh ? 'Enabled' : 'Disabled'}
              valueColor={gpsFresh ? colors.successStrong : colors.dangerStrong}
            />
          </View>
        </Card>

        {student.assignedStopId && (
          <Card style={styles.statusCard}>
            <AppText variant="bodySemibold">Your Stop</AppText>
            <View style={{ marginTop: spacing.sm }}>
              {myStopIdx >= 0 ? (
                <>
                  <AppText variant="body">{orderedStops[myStopIdx].name}</AppText>
                  <View style={{ marginTop: 6 }}>
                    <Badge
                      label={
                        bus?.status !== 'trip_started'
                          ? 'Trip not started'
                          : myStopCrossed
                            ? 'Bus has crossed your stop'
                            : nextStop?.id === orderedStops[myStopIdx].id
                              ? 'Your stop is next'
                              : 'Bus is on the way'
                      }
                      tone={myStopCrossed ? 'neutral' : 'success'}
                    />
                  </View>
                </>
              ) : (
                <AppText variant="caption" color={colors.textTertiary}>
                  Your stop isn't on today's route yet.
                </AppText>
              )}
            </View>
          </Card>
        )}

        <Card style={styles.statusCard}>
          <AppText variant="bodySemibold" style={{ marginBottom: spacing.sm }}>
            Route Stops
          </AppText>
          {orderedStops.length === 0 ? (
            <AppText variant="caption" color={colors.textTertiary}>
              No route configured for this bus yet.
            </AppText>
          ) : (
            orderedStops.map((stop, i) => {
              const crossed = nextIdx >= 0 && hasBusCrossedStop(nextIdx, i);
              const isMine = stop.id === student.assignedStopId;
              const isNext = i === nextIdx;
              return (
                <View key={stop.id} style={styles.stopRow}>
                  <View
                    style={[
                      styles.stopDot,
                      { backgroundColor: isMine ? '#F2711F' : crossed ? colors.borderSoft : colors.primary },
                    ]}
                  >
                    {crossed && <Ionicons name="checkmark" size={11} color="#fff" />}
                  </View>
                  <View style={{ flex: 1, marginLeft: spacing.sm }}>
                    <AppText
                      variant={isMine ? 'bodySemibold' : 'body'}
                      color={crossed ? colors.textTertiary : colors.textPrimary}
                    >
                      {stop.name}
                      {isMine ? ' (Your stop)' : ''}
                    </AppText>
                  </View>
                  {isNext && bus?.status === 'trip_started' && <Badge label="Next" tone="info" size="sm" />}
                </View>
              );
            })
          )}
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

function MetaItem({
  icon,
  label,
  value,
  valueColor,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  valueColor?: string;
}) {
  return (
    <View style={styles.metaItem}>
      <Ionicons name={icon} size={16} color={colors.textTertiary} style={{ marginBottom: 2 }} />
      <AppText variant="tiny" color={colors.textTertiary}>
        {label}
      </AppText>
      <AppText variant="bodyMedium" color={valueColor ?? colors.textPrimary}>
        {value}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: spacing.xxxl },
  mapCard: { overflow: 'hidden', marginBottom: spacing.md },
  statusCard: { marginBottom: spacing.md },
  statusRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  metaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: spacing.md,
    gap: spacing.md,
  },
  metaItem: { width: '45%' },
  stopRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.xs },
  stopDot: {
    width: 20,
    height: 20,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
