import React, { useEffect, useMemo, useState } from 'react';
import { View, ScrollView, StyleSheet, Modal, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { AppText, Card, Chip, Button, EmptyState, EdgeFade } from '@components/ui';
import { colors, spacing, radius, layout } from '@theme';
import { useAuthStore } from '@store/useAuthStore';
import { repo } from '@data/repositories';
import { todayDayCode } from '@utils/date';
import { DayOfWeek, TimetablePeriod } from '@/types';

const DAYS: DayOfWeek[] = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const dayFullName: Record<DayOfWeek, string> = {
  Mon: 'Monday', Tue: 'Tuesday', Wed: 'Wednesday', Thu: 'Thursday', Fri: 'Friday', Sat: 'Saturday',
};

export function TimetableScreen() {
  const { teacher } = useAuthStore();
  const classId = teacher?.classIds?.[0];
  const [periods, setPeriods] = useState<TimetablePeriod[] | null>(null);
  const todayCode = todayDayCode();
  const [selectedDay, setSelectedDay] = useState<DayOfWeek>(
    DAYS.includes(todayCode as DayOfWeek) ? (todayCode as DayOfWeek) : 'Mon',
  );
  const [editing, setEditing] = useState<TimetablePeriod | null>(null);
  const [form, setForm] = useState({ subject: '', startTime: '', endTime: '', room: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!classId) return;
    return repo.timetable.subscribeForClass(classId, setPeriods);
  }, [classId]);

  const dayPeriods = useMemo(
    () => (periods ?? []).filter((p) => p.day === selectedDay).sort((a, b) => a.periodNumber - b.periodNumber),
    [periods, selectedDay],
  );

  const openEditor = (period: TimetablePeriod) => {
    setEditing(period);
    setForm({
      subject: period.subject,
      startTime: period.startTime,
      endTime: period.endTime,
      room: period.room,
    });
  };

  const save = async () => {
    if (!editing || !classId || !teacher) return;
    setSaving(true);
    try {
      await repo.timetable.upsert({
        ...editing,
        subject: form.subject,
        startTime: form.startTime,
        endTime: form.endTime,
        room: form.room,
        teacher: teacher.name,
        teacherId: teacher.id,
        isBreak: false,
      });
      setEditing(null);
    } catch (e) {
      Alert.alert('Could not save', e instanceof Error ? e.message : 'Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <AppText variant="displayMd">Timetable</AppText>
        <AppText variant="caption" color={colors.textSecondary} style={{ marginTop: 2 }}>
          Tap a period to edit it
        </AppText>
      </View>

      <View style={[styles.dayPicker, { position: 'relative' }]}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: spacing.lg }}
        >
          {DAYS.map((day) => (
            <Chip
              key={day}
              label={dayFullName[day]}
              active={selectedDay === day}
              onPress={() => setSelectedDay(day)}
              style={{ marginRight: spacing.xs }}
            />
          ))}
        </ScrollView>
        <EdgeFade />
      </View>

      <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
        {!periods ? null : dayPeriods.length === 0 ? (
          <EmptyState icon="calendar-outline" title="No periods scheduled" message="Nothing set for this day yet." />
        ) : (
          dayPeriods
            .filter((p) => !p.isBreak)
            .map((p) => (
              <Card key={p.id} onPress={() => openEditor(p)} style={{ marginBottom: spacing.sm }}>
                <View style={styles.row}>
                  <View style={styles.timeBlock}>
                    <AppText variant="bodySemibold" color={colors.primary} style={{ fontSize: 13 }}>
                      {p.startTime}
                    </AppText>
                    <AppText variant="tiny" color={colors.primary}>
                      {p.endTime}
                    </AppText>
                  </View>
                  <View style={{ flex: 1, marginLeft: spacing.sm }}>
                    <AppText variant="bodySemibold">{p.subject}</AppText>
                    <AppText variant="caption" color={colors.textSecondary}>
                      {p.room}
                    </AppText>
                  </View>
                  <Ionicons name="create-outline" size={18} color={colors.textTertiary} />
                </View>
              </Card>
            ))
        )}
      </ScrollView>

      <Modal visible={!!editing} transparent animationType="fade" onRequestClose={() => setEditing(null)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <AppText variant="h2">Edit Period</AppText>
            <FormField label="Subject" value={form.subject} onChangeText={(v) => setForm((f) => ({ ...f, subject: v }))} />
            <View style={{ flexDirection: 'row', gap: spacing.sm }}>
              <View style={{ flex: 1 }}>
                <FormField label="Start (HH:mm)" value={form.startTime} onChangeText={(v) => setForm((f) => ({ ...f, startTime: v }))} />
              </View>
              <View style={{ flex: 1 }}>
                <FormField label="End (HH:mm)" value={form.endTime} onChangeText={(v) => setForm((f) => ({ ...f, endTime: v }))} />
              </View>
            </View>
            <FormField label="Room" value={form.room} onChangeText={(v) => setForm((f) => ({ ...f, room: v }))} />
            <View style={{ flexDirection: 'row', marginTop: spacing.lg, gap: spacing.sm }}>
              <Button label="Cancel" variant="outline" onPress={() => setEditing(null)} style={{ flex: 1 }} />
              <Button label="Save" onPress={save} loading={saving} style={{ flex: 1 }} />
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function FormField({
  label,
  value,
  onChangeText,
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
}) {
  return (
    <View style={{ marginTop: spacing.md }}>
      <AppText variant="caption" color={colors.textSecondary} style={{ marginBottom: 4 }}>
        {label}
      </AppText>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        style={styles.input}
        placeholderTextColor={colors.textTertiary}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: { paddingHorizontal: spacing.lg, paddingTop: spacing.sm, marginBottom: spacing.md },
  dayPicker: { marginBottom: spacing.md },
  list: { paddingHorizontal: spacing.lg, paddingBottom: layout.tabBarClearance },
  row: { flexDirection: 'row', alignItems: 'center' },
  timeBlock: {
    width: 58,
    borderRadius: 10,
    paddingVertical: 6,
    alignItems: 'center',
    backgroundColor: colors.primarySoft,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'center',
    padding: spacing.lg,
  },
  modalCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
  },
  input: {
    height: 44,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.sm,
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: colors.textPrimary,
  },
});
