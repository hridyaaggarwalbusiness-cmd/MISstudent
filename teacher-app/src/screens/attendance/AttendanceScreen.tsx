import React, { useEffect, useMemo, useState } from 'react';
import { View, ScrollView, StyleSheet, Alert, Pressable, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import {
  format,
  isSameDay,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  getDay,
} from 'date-fns';
import { AppText, Card, Button, IconButton, EmptyState, Skeleton, AnimatedPressable } from '@components/ui';
import { colors, spacing, radius, layout } from '@theme';
import { RootStackParamList } from '@navigation/types';
import { useAuthStore } from '@store/useAuthStore';
import { repo } from '@data/repositories';
import { Student, AttendanceRecord, AttendanceStatus, SchoolClass } from '@/types';

const STATUS_OPTIONS: { key: AttendanceStatus; label: string; tone: string }[] = [
  { key: 'present', label: 'P', tone: colors.success },
  { key: 'late', label: 'L', tone: colors.warning },
  { key: 'absent', label: 'A', tone: colors.danger },
  { key: 'leave', label: 'Lv', tone: colors.info },
];
const WEEKDAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

export function AttendanceScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { teacher } = useAuthStore();
  // Attendance can only be marked by the class's incharge teacher, not just
  // any teacher who happens to teach a period there.
  const classId = teacher?.isClassTeacherOf ?? null;
  const [classInfo, setClassInfo] = useState<SchoolClass | null>(null);
  const [date, setDate] = useState(new Date());
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerMonth, setPickerMonth] = useState(new Date());
  const [students, setStudents] = useState<Student[] | null>(null);
  const [existing, setExisting] = useState<AttendanceRecord[]>([]);
  const [statuses, setStatuses] = useState<Record<string, AttendanceStatus>>({});
  const [saving, setSaving] = useState(false);

  const dateStr = format(date, 'yyyy-MM-dd');

  useEffect(() => {
    if (!classId) return;
    repo.classes.get(classId).then(setClassInfo);
    repo.classes.listStudents(classId).then(setStudents);
  }, [classId]);

  useEffect(() => {
    if (!classId) return;
    const unsub = repo.attendance.subscribeForClassDate(classId, dateStr, setExisting);
    return unsub;
  }, [classId, dateStr]);

  useEffect(() => {
    const map: Record<string, AttendanceStatus> = {};
    existing.forEach((r) => {
      map[r.studentId] = r.status;
    });
    setStatuses(map);
  }, [existing]);

  const setStatus = (studentId: string, status: AttendanceStatus) => {
    setStatuses((s) => ({ ...s, [studentId]: status }));
  };

  const markAllPresent = () => {
    if (!students) return;
    const map: Record<string, AttendanceStatus> = {};
    students.forEach((s) => {
      map[s.id] = 'present';
    });
    setStatuses(map);
  };

  const save = async () => {
    if (!classId || !teacher || !students) return;
    // Anyone not explicitly marked is assumed present — the same rule that
    // already applies to a day nobody has opened attendance for at all.
    const records = students.map((s) => ({ studentId: s.id, status: statuses[s.id] ?? 'present' }));
    setSaving(true);
    try {
      await repo.attendance.markBulk(classId, dateStr, records, teacher.id);
      Alert.alert('Saved', 'Attendance has been recorded.');
    } catch (e) {
      Alert.alert('Could not save', e instanceof Error ? e.message : 'Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const total = students?.length ?? 0;
  const presentCount = students ? students.filter((s) => (statuses[s.id] ?? 'present') === 'present').length : 0;
  const absentCount = total - presentCount;

  const { leadingBlanks, monthDays } = useMemo(() => {
    const start = startOfMonth(pickerMonth);
    const end = endOfMonth(pickerMonth);
    return { leadingBlanks: getDay(start), monthDays: eachDayOfInterval({ start, end }) };
  }, [pickerMonth]);

  if (!classId) {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
        <View style={styles.header}>
          <IconButton icon="arrow-back" onPress={() => navigation.navigate('MainTabs', { screen: 'HomeTab' })} size={36} />
          <AppText variant="h2" align="center" style={{ flex: 1 }}>
            Attendance
          </AppText>
          <View style={{ width: 36 }} />
        </View>
        <EmptyState
          icon="shield-outline"
          title="No class assigned"
          message="Attendance can only be marked by a class's incharge teacher."
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <IconButton icon="arrow-back" onPress={() => navigation.navigate('MainTabs', { screen: 'HomeTab' })} size={36} />
        <AppText variant="h2" align="center" style={{ flex: 1 }}>
          Attendance
        </AppText>
        <IconButton icon="stats-chart-outline" onPress={() => navigation.navigate('AttendanceReport')} size={36} style={{ marginRight: spacing.xs }} />
        <IconButton
          icon="calendar-outline"
          onPress={() => {
            setPickerMonth(date);
            setPickerOpen(true);
          }}
          size={36}
        />
      </View>

      <View style={{ paddingHorizontal: spacing.lg }}>
        <View style={styles.summaryCard}>
          <AppText variant="h3" color={colors.textInverse}>
            {classInfo ? `${classInfo.name} · Section ${classInfo.section}` : classId}
          </AppText>
          <AppText variant="caption" color="rgba(255,255,255,0.85)" style={{ marginTop: 2 }}>
            {format(date, 'd MMMM yyyy (EEEE)')}
          </AppText>

          <View style={styles.summaryStatsRow}>
            <SummaryStat label="Total Students" value={total} />
            <SummaryStat label="Present" value={presentCount} valueColor="#7CF2B0" />
            <SummaryStat label="Absent" value={absentCount} valueColor="#FF9C9C" />
          </View>

          <AnimatedPressable onPress={markAllPresent} haptic={false} style={styles.markAllBtn}>
            <AppText variant="bodySemibold" color={colors.textInverse} align="center">
              Mark All Present
            </AppText>
          </AnimatedPressable>
        </View>
      </View>

      {!students ? (
        <View style={{ paddingHorizontal: spacing.lg, marginTop: spacing.md }}>
          <Skeleton height={200} borderRadius={16} />
        </View>
      ) : students.length === 0 ? (
        <EmptyState icon="people-outline" title="No students found" />
      ) : (
        <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
          {students.map((student) => {
            const current = statuses[student.id] ?? 'present';
            return (
              <Card key={student.id} style={{ marginBottom: spacing.sm }}>
                <View style={styles.studentRow}>
                  <View style={{ flex: 1 }}>
                    <AppText variant="bodyMedium">{student.name}</AppText>
                    <AppText variant="tiny" color={colors.textTertiary}>
                      Roll No. {student.rollNumber}
                    </AppText>
                  </View>
                  <View style={styles.statusRow}>
                    {STATUS_OPTIONS.map((opt) => {
                      const active = current === opt.key;
                      return (
                        <Pressable
                          key={opt.key}
                          style={[
                            styles.statusChip,
                            { backgroundColor: active ? opt.tone : colors.surfaceAlt },
                          ]}
                          onPress={() => setStatus(student.id, opt.key)}
                        >
                          <AppText variant="caption" color={active ? colors.textInverse : colors.textSecondary}>
                            {opt.label}
                          </AppText>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>
              </Card>
            );
          })}
          <Button label="Save Attendance" onPress={save} loading={saving} fullWidth style={{ marginTop: spacing.md }} />
        </ScrollView>
      )}

      <Modal visible={pickerOpen} transparent animationType="fade" onRequestClose={() => setPickerOpen(false)}>
        <Pressable style={styles.overlay} onPress={() => setPickerOpen(false)}>
          <Pressable style={styles.pickerCard} onPress={(e) => e.stopPropagation()}>
            <View style={styles.monthNav}>
              <AnimatedPressable onPress={() => setPickerMonth((d) => subMonths(d, 1))} haptic={false} style={styles.navBtn}>
                <Ionicons name="chevron-back" size={18} color={colors.textPrimary} />
              </AnimatedPressable>
              <AppText variant="h3">{format(pickerMonth, 'MMMM yyyy')}</AppText>
              <AnimatedPressable onPress={() => setPickerMonth((d) => addMonths(d, 1))} haptic={false} style={styles.navBtn}>
                <Ionicons name="chevron-forward" size={18} color={colors.textPrimary} />
              </AnimatedPressable>
            </View>
            <View style={styles.weekdayRow}>
              {WEEKDAY_LABELS.map((label, i) => (
                <View key={i} style={styles.gridCell}>
                  <AppText variant="tiny" color={colors.textTertiary}>
                    {label}
                  </AppText>
                </View>
              ))}
            </View>
            <View style={styles.grid}>
              {Array.from({ length: leadingBlanks }).map((_, i) => (
                <View key={`blank-${i}`} style={styles.gridCell} />
              ))}
              {monthDays.map((d) => {
                const isSelected = isSameDay(d, date);
                const disabled = d > new Date() && !isSameDay(d, new Date());
                return (
                  <View key={d.toISOString()} style={styles.gridCell}>
                    <AnimatedPressable
                      onPress={() => {
                        if (disabled) return;
                        setDate(d);
                        setPickerOpen(false);
                      }}
                      haptic={false}
                      style={[styles.dayCircle, isSelected && { backgroundColor: colors.primary }]}
                    >
                      <AppText variant="bodyMedium" color={disabled ? colors.textTertiary : isSelected ? colors.textInverse : colors.textPrimary}>
                        {format(d, 'd')}
                      </AppText>
                    </AnimatedPressable>
                  </View>
                );
              })}
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

function SummaryStat({ label, value, valueColor }: { label: string; value: number; valueColor?: string }) {
  return (
    <View style={{ flex: 1, alignItems: 'center' }}>
      <AppText variant="h3" color={valueColor ?? colors.textInverse}>
        {value}
      </AppText>
      <AppText variant="tiny" color="rgba(255,255,255,0.8)" align="center">
        {label}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.xs,
    paddingTop: spacing.xs,
    marginBottom: spacing.md,
  },
  summaryCard: {
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  summaryStatsRow: {
    flexDirection: 'row',
    marginTop: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255,255,255,0.25)',
  },
  markAllBtn: {
    marginTop: spacing.md,
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: radius.sm,
    paddingVertical: spacing.sm + 2,
  },
  list: { paddingHorizontal: spacing.lg, paddingBottom: layout.tabBarClearance },
  studentRow: { flexDirection: 'row', alignItems: 'center' },
  statusRow: { flexDirection: 'row', gap: 6 },
  statusChip: {
    width: 34,
    height: 34,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  overlay: { flex: 1, backgroundColor: colors.overlay, justifyContent: 'center', padding: spacing.lg },
  pickerCard: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.lg },
  monthNav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.sm },
  navBtn: { width: 34, height: 34, alignItems: 'center', justifyContent: 'center' },
  weekdayRow: { flexDirection: 'row' },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  gridCell: { width: `${100 / 7}%`, aspectRatio: 1, alignItems: 'center', justifyContent: 'center' },
  dayCircle: { width: 32, height: 32, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
});
