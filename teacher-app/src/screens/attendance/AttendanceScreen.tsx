import React, { useEffect, useMemo, useState } from 'react';
import { View, ScrollView, StyleSheet, Alert, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { format, addDays, subDays, isSameDay } from 'date-fns';
import { AppText, Card, Button, IconButton, EmptyState, Skeleton } from '@components/ui';
import { colors, spacing, radius, layout } from '@theme';
import { useAuthStore } from '@store/useAuthStore';
import { repo } from '@data/repositories';
import { Student, AttendanceRecord, AttendanceStatus } from '@/types';

const STATUS_OPTIONS: { key: AttendanceStatus; label: string; tone: string }[] = [
  { key: 'present', label: 'P', tone: colors.success },
  { key: 'late', label: 'L', tone: colors.warning },
  { key: 'absent', label: 'A', tone: colors.danger },
  { key: 'leave', label: 'Lv', tone: colors.info },
];

export function AttendanceScreen() {
  const { teacher } = useAuthStore();
  const classId = teacher?.classIds?.[0];
  const [date, setDate] = useState(new Date());
  const [students, setStudents] = useState<Student[] | null>(null);
  const [existing, setExisting] = useState<AttendanceRecord[]>([]);
  const [statuses, setStatuses] = useState<Record<string, AttendanceStatus>>({});
  const [saving, setSaving] = useState(false);

  const dateStr = format(date, 'yyyy-MM-dd');

  useEffect(() => {
    if (!classId) return;
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

  const isFuture = useMemo(() => date > new Date() && !isSameDay(date, new Date()), [date]);

  const setStatus = (studentId: string, status: AttendanceStatus) => {
    setStatuses((s) => ({ ...s, [studentId]: status }));
  };

  const save = async () => {
    if (!classId || !teacher || !students) return;
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

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <AppText variant="displayMd">Attendance</AppText>
      </View>

      <Card style={styles.dateCard}>
        <View style={styles.dateNav}>
          <IconButton icon="chevron-back" onPress={() => setDate((d) => subDays(d, 1))} size={34} />
          <AppText variant="h3">{format(date, 'EEEE, d MMM yyyy')}</AppText>
          <IconButton
            icon="chevron-forward"
            onPress={() => !isFuture && setDate((d) => addDays(d, 1))}
            size={34}
            color={isFuture ? colors.textTertiary : colors.textPrimary}
          />
        </View>
      </Card>

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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: { paddingHorizontal: spacing.lg, paddingTop: spacing.sm, marginBottom: spacing.md },
  dateCard: { marginHorizontal: spacing.lg, marginBottom: spacing.md },
  dateNav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
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
});
