import React, { useMemo, useState } from 'react';
import { View, ScrollView, StyleSheet, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  AppText,
  SegmentedControl,
  SkeletonCard,
  EmptyState,
  ErrorState,
} from '@components/ui';
import { PeriodCard } from '@components/dashboard/PeriodCard';
import { WeekStrip } from '@components/timetable/WeekStrip';
import { DayTimeline } from '@components/timetable/DayTimeline';
import { colors, spacing, layout } from '@theme';
import { repo } from '@data/repositories';
import { useAsyncResource } from '@hooks/useAsyncResource';
import { useAuthStore } from '@store/useAuthStore';
import { todayDayCode } from '@utils/date';
import { DayOfWeek } from '@/types';
import { format } from 'date-fns';

const DAYS: DayOfWeek[] = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function toMinutes(t: string) {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

export function TimetableScreen() {
  const [mode, setMode] = useState(0); // 0 = Day, 1 = Week
  const todayCode = todayDayCode();
  const defaultDay: DayOfWeek = DAYS.includes(todayCode as DayOfWeek) ? (todayCode as DayOfWeek) : 'Mon';
  const [selectedDay, setSelectedDay] = useState<DayOfWeek>(defaultDay);
  const classId = useAuthStore((s) => s.student?.classId);

  const { data, loading, refreshing, error, refresh } = useAsyncResource(
    () => (classId ? repo.timetable.getAll(classId) : Promise.resolve([])),
    [classId],
  );

  const dayPeriods = useMemo(() => {
    if (!data) return [];
    return data.filter((p) => p.day === selectedDay);
  }, [data, selectedDay]);

  const currentPeriodId = useMemo(() => {
    if (selectedDay !== todayCode) return null;
    const nowMinutes = new Date().getHours() * 60 + new Date().getMinutes();
    return dayPeriods.find((p) => nowMinutes >= toMinutes(p.startTime) && nowMinutes < toMinutes(p.endTime))?.id ?? null;
  }, [dayPeriods, selectedDay, todayCode]);

  const nextPeriodId = useMemo(() => {
    if (selectedDay !== todayCode) return null;
    const nowMinutes = new Date().getHours() * 60 + new Date().getMinutes();
    return dayPeriods.find((p) => toMinutes(p.startTime) > nowMinutes && !p.isBreak)?.id ?? null;
  }, [dayPeriods, selectedDay, todayCode]);

  const weekByDay = useMemo(() => {
    if (!data) return [];
    return DAYS.map((day) => ({
      day,
      periods: data.filter((p) => p.day === day && !p.isBreak),
    }));
  }, [data]);

  const hasClasses = (day: DayOfWeek) => (data ?? []).some((p) => p.day === day && !p.isBreak);

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.safe}>
      <View style={styles.header}>
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' }}>
          <AppText variant="displayMd">Timetable</AppText>
          <AppText variant="captionRegular" color={colors.textTertiary}>
            {format(new Date(), 'MMMM yyyy')}
          </AppText>
        </View>
        <View style={{ marginTop: spacing.md }}>
          <SegmentedControl options={['Day', 'Week']} selectedIndex={mode} onChange={setMode} />
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
          {mode === 0 ? (
            <>
              <View style={styles.section}>
                <WeekStrip
                  selectedDay={selectedDay}
                  todayCode={todayCode}
                  hasClasses={hasClasses}
                  onSelect={setSelectedDay}
                />
              </View>

              <View style={styles.section}>
                {loading ? (
                  <>
                    <SkeletonCard lines={1} />
                    <View style={{ height: spacing.sm }} />
                    <SkeletonCard lines={1} />
                  </>
                ) : dayPeriods.length === 0 ? (
                  <EmptyState icon="calendar-outline" title="No classes" message="There are no periods scheduled for this day." />
                ) : (
                  <DayTimeline periods={dayPeriods} currentPeriodId={currentPeriodId} nextPeriodId={nextPeriodId} />
                )}
              </View>
            </>
          ) : (
            <View style={styles.section}>
              {loading ? (
                <SkeletonCard lines={4} />
              ) : (
                weekByDay.map(({ day, periods }) => (
                  <View key={day} style={{ marginBottom: spacing.lg }}>
                    <View style={styles.weekDayHeader}>
                      <AppText variant="h3">{dayFullName(day)}</AppText>
                      {day === todayCode && (
                        <AppText variant="tiny" color={colors.primary}>
                          Today
                        </AppText>
                      )}
                    </View>
                    {periods.length === 0 ? (
                      <AppText variant="caption" color={colors.textTertiary}>
                        No classes scheduled
                      </AppText>
                    ) : (
                      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        {periods.map((p) => (
                          <PeriodCard key={p.id} period={p} compact />
                        ))}
                      </ScrollView>
                    )}
                  </View>
                ))
              )}
            </View>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

function dayFullName(day: DayOfWeek): string {
  const map: Record<DayOfWeek, string> = {
    Mon: 'Monday',
    Tue: 'Tuesday',
    Wed: 'Wednesday',
    Thu: 'Thursday',
    Fri: 'Friday',
    Sat: 'Saturday',
  };
  return map[day];
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: { paddingHorizontal: spacing.lg, paddingTop: spacing.sm, marginBottom: spacing.md },
  section: { paddingHorizontal: spacing.lg, marginBottom: spacing.md },
  scrollContent: { paddingBottom: layout.tabBarClearance },
  weekDayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
});
