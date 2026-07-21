import React, { useEffect, useMemo, useState } from 'react';
import { View, ScrollView, StyleSheet, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { startOfWeek, addDays, format, isSameDay } from 'date-fns';
import { AppText, Card, AnimatedPressable, SkeletonCard, EmptyState, ErrorState } from '@components/ui';
import { TimetableAgendaRow, TimetableAgendaRowData } from '@components/timetable/TimetableAgendaRow';
import { colors, spacing, layout, radius } from '@theme';
import { repo } from '@data/repositories';
import { useAsyncResource } from '@hooks/useAsyncResource';
import { useAuthStore } from '@store/useAuthStore';
import { DayOfWeek, PeriodSchedule } from '@/types';

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

  const [schedule, setSchedule] = useState<PeriodSchedule | null>(null);
  useEffect(() => repo.periodSchedule.subscribe(setSchedule), []);

  // Merges the admin-authored row order (which slots exist, and which are
  // breaks vs. teaching periods) with this class's saved periods for the
  // day. Break rows always render (schedule-only, no document behind them);
  // a period row only renders once this class has a saved period for it.
  const dayRows = useMemo<TimetableAgendaRowData[]>(() => {
    if (!data || !schedule) return [];
    const dayPeriods = data.filter((p) => p.day === selectedDay.code);
    const sortedSlots = [...schedule.slots].sort((a, b) => a.order - b.order);
    const rows: TimetableAgendaRowData[] = [];
    for (const slot of sortedSlots) {
      if (slot.type === 'break') {
        rows.push({ type: 'break', key: slot.id, label: slot.label, startTime: slot.startTime, endTime: slot.endTime });
        continue;
      }
      const period = dayPeriods.find((p) => p.periodNumber === slot.periodNumber);
      if (period) {
        rows.push({ type: 'period', key: period.id, periodNumber: slot.periodNumber!, period });
      }
    }
    return rows;
  }, [data, schedule, selectedDay]);

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
            ) : dayRows.length === 0 ? (
              <EmptyState icon="calendar-outline" title="No periods" message="Nothing scheduled for this day." />
            ) : (
              <Card padded={false} elevation="xs">
                {dayRows.map((row, i) => (
                  <TimetableAgendaRow key={row.key} row={row} isLast={i === dayRows.length - 1} />
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
