import React, { useMemo } from 'react';
import { View, ScrollView, StyleSheet, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { format } from 'date-fns';
import { AppText, SkeletonCard, EmptyState, ErrorState } from '@components/ui';
import { TimetableGrid } from '@components/timetable/TimetableGrid';
import { colors, spacing, layout } from '@theme';
import { repo } from '@data/repositories';
import { useAsyncResource } from '@hooks/useAsyncResource';
import { useAuthStore } from '@store/useAuthStore';
import { todayDayCode } from '@utils/date';

function toMinutes(t: string) {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

export function TimetableScreen() {
  const todayCode = todayDayCode();
  const classId = useAuthStore((s) => s.student?.classId);

  const { data, loading, refreshing, error, refresh } = useAsyncResource(
    () => (classId ? repo.timetable.getAll(classId) : Promise.resolve([])),
    [classId],
  );

  const currentPeriodId = useMemo(() => {
    if (!data) return null;
    const nowMinutes = new Date().getHours() * 60 + new Date().getMinutes();
    return (
      data.find(
        (p) =>
          p.day === todayCode &&
          !p.isBreak &&
          nowMinutes >= toMinutes(p.startTime) &&
          nowMinutes < toMinutes(p.endTime),
      )?.id ?? null
    );
  }, [data, todayCode]);

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.safe}>
      <View style={styles.header}>
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' }}>
          <AppText variant="displayMd">Timetable</AppText>
          <AppText variant="captionRegular" color={colors.textTertiary}>
            {format(new Date(), 'MMMM yyyy')}
          </AppText>
        </View>
      </View>

      {error && !data ? (
        <ErrorState onRetry={refresh} />
      ) : (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.primary} colors={[colors.primary]} />
          }
        >
          <View style={styles.section}>
            {loading ? (
              <SkeletonCard lines={4} />
            ) : !data || data.length === 0 ? (
              <EmptyState icon="calendar-outline" title="No timetable yet" message="Your class timetable hasn't been set up yet." />
            ) : (
              <TimetableGrid periods={data} todayCode={todayCode} currentPeriodId={currentPeriodId} />
            )}
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: { paddingHorizontal: spacing.lg, paddingTop: spacing.sm, marginBottom: spacing.md },
  section: { paddingHorizontal: spacing.lg, marginBottom: spacing.md },
  scrollContent: { paddingBottom: layout.tabBarClearance },
});
