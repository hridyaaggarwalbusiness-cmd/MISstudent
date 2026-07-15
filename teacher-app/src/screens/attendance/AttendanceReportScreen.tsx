import React, { useEffect, useMemo, useState } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isWeekend, isAfter } from 'date-fns';
import { AppText, Card, IconButton, ProgressBar, DetailHeader, EmptyState, SkeletonCard } from '@components/ui';
import { colors, spacing, radius, layout } from '@theme';
import { useAuthStore } from '@store/useAuthStore';
import { repo } from '@data/repositories';
import { AttendanceRecord, CalendarEvent, SchoolClass, Student } from '@/types';

const AT_RISK_THRESHOLD = 75;

// A school day nobody explicitly marked is assumed present (same rule as an
// unchanged row on the teacher's daily save) — so the denominator here is
// actual school days in the month, not just days that happen to have a
// record, with holidays/weekends/future days excluded either way.
function schoolDaysInMonth(monthDate: Date, holidayDates: Set<string>): string[] {
  const start = startOfMonth(monthDate);
  const end = endOfMonth(monthDate);
  const today = new Date();
  return eachDayOfInterval({ start, end })
    .filter((d) => !isWeekend(d) && !isAfter(d, today))
    .map((d) => format(d, 'yyyy-MM-dd'))
    .filter((iso) => !holidayDates.has(iso));
}

export function AttendanceReportScreen() {
  const { teacher } = useAuthStore();
  const classId = teacher?.isClassTeacherOf ?? null;
  const [classInfo, setClassInfo] = useState<SchoolClass | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [records, setRecords] = useState<AttendanceRecord[] | null>(null);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [monthDate, setMonthDate] = useState(new Date());

  useEffect(() => {
    if (!classId) return;
    repo.classes.get(classId).then(setClassInfo);
    repo.classes.listStudents(classId).then(setStudents);
  }, [classId]);

  useEffect(() => {
    if (!classId) return;
    return repo.attendance.subscribeForClassMonth(classId, setRecords);
  }, [classId]);

  useEffect(() => repo.calendar.subscribeAll(setEvents), []);

  const holidayDates = useMemo(() => {
    const set = new Set<string>();
    events
      .filter((e) => e.type === 'holiday')
      .forEach((e) => {
        eachDayOfInterval({ start: new Date(e.date), end: new Date(e.endDate || e.date) }).forEach((d) =>
          set.add(format(d, 'yyyy-MM-dd')),
        );
      });
    return set;
  }, [events]);

  const schoolDays = useMemo(() => schoolDaysInMonth(monthDate, holidayDates), [monthDate, holidayDates]);

  const monthKey = format(monthDate, 'yyyy-MM');
  const monthRecords = useMemo(() => (records ?? []).filter((r) => r.date.startsWith(monthKey)), [records, monthKey]);

  const perStudent = useMemo(() => {
    return students
      .map((s) => {
        let present = 0;
        let absent = 0;
        let late = 0;
        let leave = 0;
        schoolDays.forEach((day) => {
          const record = monthRecords.find((r) => r.studentId === s.id && r.date === day);
          const status = record?.status ?? 'present';
          if (status === 'present') present++;
          else if (status === 'absent') absent++;
          else if (status === 'late') late++;
          else if (status === 'leave') leave++;
        });
        const total = schoolDays.length;
        const pct = total > 0 ? Math.round(((present + late) / total) * 1000) / 10 : 0;
        return { student: s, present, absent, late, leave, marked: total, pct };
      })
      .sort((a, b) => a.pct - b.pct);
  }, [students, schoolDays, monthRecords]);

  const overallPct = useMemo(() => {
    if (perStudent.length === 0) return 0;
    const avg = perStudent.reduce((sum, p) => sum + p.pct, 0) / perStudent.length;
    return Math.round(avg * 10) / 10;
  }, [perStudent]);
  const atRiskCount = perStudent.filter((p) => p.marked > 0 && p.pct < AT_RISK_THRESHOLD).length;

  if (!classId) {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
        <DetailHeader title="Attendance Report" />
        <EmptyState
          icon="shield-outline"
          title="No class assigned"
          message="Attendance reports are available to a class's incharge teacher."
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <DetailHeader title="Attendance Report" />
      <View style={styles.monthNav}>
        <IconButton icon="chevron-back" onPress={() => setMonthDate((d) => subMonths(d, 1))} size={34} />
        <AppText variant="h3">{format(monthDate, 'MMMM yyyy')}</AppText>
        <IconButton icon="chevron-forward" onPress={() => setMonthDate((d) => addMonths(d, 1))} size={34} />
      </View>

      {records === null ? (
        <View style={{ paddingHorizontal: spacing.lg }}>
          <SkeletonCard lines={4} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.statsRow}>
            <StatTile label="Class Average" value={`${overallPct}%`} color={colors.primary} bg={colors.primarySoft} />
            <StatTile label="School Days" value={String(schoolDays.length)} color={colors.tileSky} bg={colors.surfaceAlt} />
            <StatTile
              label={`Below ${AT_RISK_THRESHOLD}%`}
              value={String(atRiskCount)}
              color={atRiskCount > 0 ? colors.danger : colors.success}
              bg={atRiskCount > 0 ? colors.dangerBg : colors.successBg}
            />
          </View>

          {students.length === 0 ? (
            <EmptyState icon="people-outline" title="No students found" />
          ) : schoolDays.length === 0 ? (
            <EmptyState icon="calendar-outline" title="No school days this month" message="Nothing to report for this month yet." />
          ) : (
            <Card padded={false}>
              {perStudent.map((p, i) => (
                <View key={p.student.id} style={[styles.row, i > 0 && styles.rowBorder]}>
                  <View style={{ flex: 1 }}>
                    <AppText variant="bodyMedium" numberOfLines={1}>
                      {p.student.name}
                    </AppText>
                    <AppText variant="tiny" color={colors.textTertiary}>
                      Roll No. {p.student.rollNumber}
                    </AppText>
                    <ProgressBar
                      value={p.pct}
                      style={{ marginTop: 6 }}
                      fillColor={p.pct < AT_RISK_THRESHOLD ? colors.danger : colors.success}
                    />
                  </View>
                  <View style={styles.rowRight}>
                    <AppText variant="bodySemibold" color={p.marked > 0 && p.pct < AT_RISK_THRESHOLD ? colors.danger : colors.textPrimary}>
                      {p.marked > 0 ? `${p.pct}%` : '—'}
                    </AppText>
                    <AppText variant="tiny" color={colors.textTertiary}>
                      {p.present}P · {p.absent}A · {p.late}L · {p.leave}Lv
                    </AppText>
                  </View>
                </View>
              ))}
            </Card>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

function StatTile({ label, value, color, bg }: { label: string; value: string; color: string; bg: string }) {
  return (
    <View style={[styles.statTile, { backgroundColor: bg }]}>
      <AppText variant="h3" color={color}>
        {value}
      </AppText>
      <AppText variant="tiny" color={colors.textSecondary} numberOfLines={2}>
        {label}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  monthNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    marginTop: spacing.sm,
  },
  content: { paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: layout.tabBarClearance },
  statsRow: { flexDirection: 'row', gap: spacing.xs, marginBottom: spacing.md },
  statTile: { flex: 1, borderRadius: radius.md, padding: spacing.sm, alignItems: 'flex-start' },
  row: { flexDirection: 'row', alignItems: 'center', padding: spacing.md },
  rowBorder: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.borderSoft },
  rowRight: { alignItems: 'flex-end', marginLeft: spacing.sm },
});
