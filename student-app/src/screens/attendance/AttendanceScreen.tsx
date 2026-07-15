import React, { useMemo, useState } from 'react';
import { View, ScrollView, StyleSheet, RefreshControl, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { addMonths, subMonths, format, isSameMonth } from 'date-fns';
import { Ionicons } from '@expo/vector-icons';
import {
  AppText,
  Card,
  ProgressRing,
  ProgressBar,
  IconButton,
  DetailHeader,
  SkeletonCard,
  EmptyState,
  ErrorState,
} from '@components/ui';
import { AttendanceCalendar, AttendanceLegend } from '@components/attendance/AttendanceCalendar';
import { colors, spacing, layout } from '@theme';
import { repo } from '@data/repositories';
import { useAsyncResource } from '@hooks/useAsyncResource';
import { overallAttendancePercentage } from '@utils/attendance';
import { friendlyDate } from '@utils/date';
import { AttendanceDay } from '@/types';
import { useAuthStore } from '@store/useAuthStore';

async function loadAttendance(studentId: string, monthDate: Date) {
  const [days, subjectSummary] = await Promise.all([
    repo.attendance.getMonth(studentId, monthDate),
    repo.attendance.getSubjectSummary(),
  ]);
  return { days, subjectSummary };
}

export function AttendanceScreen() {
  const studentId = useAuthStore((s) => s.student?.id);
  const [monthDate, setMonthDate] = useState(new Date());
  const { data, loading, refreshing, error, refresh } = useAsyncResource(
    () => (studentId ? loadAttendance(studentId, monthDate) : Promise.resolve({ days: [], subjectSummary: [] })),
    [studentId, monthDate.getMonth(), monthDate.getFullYear()],
  );

  const monthPct = useMemo(() => (data ? overallAttendancePercentage(data.days) : 0), [data]);

  const monthStats = useMemo(() => {
    if (!data) return { present: 0, total: 0 };
    const countable = data.days.filter((d) => d.status !== 'weekend' && d.status !== 'future' && d.status !== 'holiday');
    const present = countable.filter((d) => d.status === 'present' || d.status === 'late').length;
    return { present, total: countable.length };
  }, [data]);

  // Consecutive present/late days counting back from the most recent marked
  // day in the currently-loaded month (weekends/holidays don't break it).
  const streak = useMemo(() => {
    if (!data) return 0;
    const known = data.days.filter((d) => d.status !== 'future');
    let count = 0;
    for (let i = known.length - 1; i >= 0; i--) {
      const s = known[i].status;
      if (s === 'present' || s === 'late') count++;
      else if (s === 'weekend' || s === 'holiday') continue;
      else break;
    }
    return count;
  }, [data]);

  const canGoNext = !isSameMonth(monthDate, new Date()) && monthDate < new Date();

  const onDayPress = (day: AttendanceDay) => {
    const labelMap: Record<string, string> = {
      present: 'Present',
      absent: 'Absent',
      late: 'Late arrival',
      leave: 'On leave',
      holiday: 'Holiday',
      weekend: 'Weekend',
      future: '',
    };
    Alert.alert(friendlyDate(day.date), labelMap[day.status] ?? day.status);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <DetailHeader title="Attendance" />

      {error && !data ? (
        <ErrorState onRetry={refresh} />
      ) : (
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.primary} colors={[colors.primary]} />
          }
        >
          {loading && !data ? (
            <SkeletonCard lines={3} />
          ) : (
            <>
              <Card style={styles.overviewCard}>
                <ProgressRing value={monthPct} size={110} strokeWidth={10} label="This month" />
                <View style={{ marginLeft: spacing.lg, flex: 1 }}>
                  <AppText variant="h2">Monthly Attendance</AppText>
                  <AppText variant="body" color={colors.textSecondary} style={{ marginTop: 4 }}>
                    Present {monthStats.present} of {monthStats.total} school days
                  </AppText>
                  <AppText variant="caption" color={colors.textTertiary} style={{ marginTop: 6 }}>
                    Minimum required: 75%
                  </AppText>
                  {streak > 0 && (
                    <View style={styles.streakPill}>
                      <Ionicons name="flame" size={13} color={colors.warningStrong} />
                      <AppText variant="tiny" color={colors.warningStrong} style={{ marginLeft: 4 }}>
                        {streak}-day streak
                      </AppText>
                    </View>
                  )}
                </View>
              </Card>

              <Card style={{ marginTop: spacing.lg }}>
                <View style={styles.monthNav}>
                  <IconButton icon="chevron-back" onPress={() => setMonthDate((d) => subMonths(d, 1))} size={34} />
                  <AppText variant="h3">{format(monthDate, 'MMMM yyyy')}</AppText>
                  <IconButton
                    icon="chevron-forward"
                    onPress={() => canGoNext && setMonthDate((d) => addMonths(d, 1))}
                    size={34}
                    color={canGoNext ? colors.textPrimary : colors.textTertiary}
                  />
                </View>
                <AttendanceCalendar monthDate={monthDate} days={data?.days ?? []} onDayPress={onDayPress} />
                <AttendanceLegend />
              </Card>

              <View style={styles.sectionTitle}>
                <Ionicons name="library-outline" size={16} color={colors.textSecondary} />
                <AppText variant="h3" style={{ marginLeft: 6 }}>
                  Subject-wise Attendance
                </AppText>
              </View>
              {(data?.subjectSummary ?? []).length === 0 ? (
                <Card>
                  <EmptyState
                    icon="library-outline"
                    title="Not tracked yet"
                    message="Subject-wise attendance isn't recorded by teachers yet — only daily attendance."
                    compact
                  />
                </Card>
              ) : (
                <Card>
                  {(data?.subjectSummary ?? []).map((s, index) => {
                    const pct = Math.round((s.present / s.total) * 1000) / 10;
                    return (
                      <View
                        key={s.subject}
                        style={[
                          styles.subjectRow,
                          index !== (data?.subjectSummary.length ?? 0) - 1 && styles.subjectRowBorder,
                        ]}
                      >
                        <View style={styles.subjectHeaderRow}>
                          <AppText variant="bodyMedium">{s.subject}</AppText>
                          <AppText variant="caption" color={colors.textSecondary}>
                            {s.present}/{s.total} · {pct}%
                          </AppText>
                        </View>
                        <ProgressBar
                          value={pct}
                          fillColor={pct >= 85 ? colors.success : pct >= 75 ? colors.warning : colors.danger}
                          trackColor={colors.surfaceAlt}
                          style={{ marginTop: 6 }}
                        />
                      </View>
                    );
                  })}
                </Card>
              )}
            </>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: spacing.lg, paddingBottom: layout.tabBarClearance },
  overviewCard: { flexDirection: 'row', alignItems: 'center' },
  streakPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: colors.warningBg,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    marginTop: 8,
  },
  monthNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  subjectRow: { paddingVertical: spacing.xs },
  subjectRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSoft,
    marginBottom: spacing.xs,
    paddingBottom: spacing.sm,
  },
  subjectHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});
