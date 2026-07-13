import React, { useMemo, useState } from 'react';
import { View, ScrollView, StyleSheet, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { startOfWeek, addDays, format, isSameDay } from 'date-fns';
import { AppText, Card, AnimatedPressable, SkeletonCard, EmptyState, ErrorState } from '@components/ui';
import { TimetableAgendaRow } from '@components/timetable/TimetableAgendaRow';
import { colors, spacing, layout, radius } from '@theme';
import { repo } from '@data/repositories';
import { useAsyncResource } from '@hooks/useAsyncResource';
import { useAuthStore } from '@store/useAuthStore';
import { DayOfWeek } from '@/types';

const DAY_CODES: DayOfWeek[] = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function TimetableScreen() {
  const classId = useAuthStore((s) => s.student?.classId);

  const weekDates = useMemo(() => {
    const monday = startOfWeek(new Date(), { weekStartsOn: 1 });
    return DAY_CODES.map((code, i) => ({ code, date: addDays(monday, i) }));
  }, []);

  const [selectedIndex, setSelectedIndex] = useState(() => {
    const idx = weekDates.findIndex((d) => isSameDay(d.date, new Date()));
    return idx >= 0 ? idx : 0;
  });
  const selectedDay = weekDates[selectedIndex];

  const { data, loading, refreshing, error, refresh } = useAsyncResource(
    () => (classId ? repo.timetable.getAll(classId) : Promise.resolve([])),
    [classId],
  );

  const dayPeriods = useMemo(() => {
    if (!data) return [];
    return [...data.filter((p) => p.day === selectedDay.code)].sort((a, b) => a.periodNumber - b.periodNumber);
  }, [data, selectedDay]);

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.safe}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.dayRow} contentContainerStyle={styles.dayRowContent}>
        {weekDates.map((d, i) => {
          const active = i === selectedIndex;
          return (
            <AnimatedPressable
              key={d.code}
              onPress={() => setSelectedIndex(i)}
              haptic={false}
              style={[styles.dayChip, active && styles.dayChipActive]}
            >
              <AppText variant="caption" color={active ? colors.textInverse : colors.textSecondary} style={{ fontWeight: '700' }}>
                {d.code}
              </AppText>
              <AppText variant="tiny" color={active ? colors.textInverse : colors.textTertiary} style={{ marginTop: 2 }}>
                {format(d.date, 'd MMM')}
              </AppText>
            </AnimatedPressable>
          );
        })}
      </ScrollView>

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
            ) : dayPeriods.length === 0 ? (
              <EmptyState icon="calendar-outline" title="No periods" message="Nothing scheduled for this day." />
            ) : (
              <Card padded={false} elevation="xs">
                {dayPeriods.map((p, i) => (
                  <TimetableAgendaRow key={p.id} period={p} isLast={i === dayPeriods.length - 1} />
                ))}
              </Card>
            )}
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  dayRow: { flexGrow: 0, paddingTop: spacing.sm },
  dayRowContent: { paddingHorizontal: spacing.lg, gap: spacing.xs },
  dayChip: {
    width: 64,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderSoft,
  },
  dayChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  section: { paddingHorizontal: spacing.lg, marginTop: spacing.md, marginBottom: spacing.md },
  scrollContent: { paddingBottom: layout.tabBarClearance },
});
