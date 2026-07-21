import React, { useEffect, useMemo, useState } from 'react';
import { View, ScrollView, StyleSheet, Modal, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import {
  addDays,
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  format,
  getDay,
  isSameDay,
  parse as parseTime,
  startOfMonth,
  startOfWeek,
  subMonths,
} from 'date-fns';
import { RootStackParamList } from '@navigation/types';
import { AppText, IconButton, AnimatedPressable, SkeletonCard, EmptyState } from '@components/ui';
import { colors, spacing, radius, layout } from '@theme';
import { useTeacherSchedule, slotsForDay, ScheduleSlot } from '@hooks/useTeacherSchedule';
import { repo } from '@data/repositories';
import { SchoolClass, DayOfWeek } from '@/types';

const DAY_CODE_BY_INDEX: (DayOfWeek | 'Sun')[] = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const WEEKDAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const PERIOD_COLORS = [
  colors.tileViolet,
  colors.tileGreen,
  colors.tileOrange,
  colors.tileBlue,
  colors.tileRed,
  colors.tileTeal,
  colors.tileSky,
  colors.tileYellow,
];

function formatTime(t: string): string {
  try {
    return format(parseTime(t, 'HH:mm', new Date()), 'h:mm a');
  } catch {
    return t;
  }
}

export function ClassesScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { slotsByDay, loading } = useTeacherSchedule();
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const [classInfo, setClassInfo] = useState<Record<string, SchoolClass | null>>({});
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerMonth, setPickerMonth] = useState(() => new Date());
  const [detail, setDetail] = useState<ScheduleSlot | null>(null);

  const selectedDay = DAY_CODE_BY_INDEX[selectedDate.getDay()];
  const daySlots = useMemo(() => slotsForDay(slotsByDay, selectedDay), [slotsByDay, selectedDay]);

  const weekStart = useMemo(() => startOfWeek(selectedDate, { weekStartsOn: 1 }), [selectedDate]);
  const stripDays = useMemo(() => Array.from({ length: 5 }).map((_, i) => addDays(weekStart, i)), [weekStart]);

  useEffect(() => {
    if (!slotsByDay) return;
    const ids = new Set<string>();
    Object.values(slotsByDay).forEach((slots) => slots.forEach((s) => s.taught && ids.add(s.taught.classId)));
    const missing = [...ids].filter((id) => !(id in classInfo));
    if (missing.length === 0) return;
    Promise.all(missing.map((id) => repo.classes.get(id).then((info) => [id, info] as const))).then((entries) => {
      setClassInfo((prev) => {
        const next = { ...prev };
        entries.forEach(([id, info]) => {
          next[id] = info;
        });
        return next;
      });
    });
  }, [slotsByDay, classInfo]);

  const periodSlots = useMemo(() => daySlots.filter((s) => s.type === 'period'), [daySlots]);
  const taughtCount = periodSlots.filter((s) => s.taught).length;
  const freeCount = periodSlots.length - taughtCount;

  const { leadingBlanks, monthDays } = useMemo(() => {
    const start = startOfMonth(pickerMonth);
    const end = endOfMonth(pickerMonth);
    return { leadingBlanks: getDay(start), monthDays: eachDayOfInterval({ start, end }) };
  }, [pickerMonth]);

  let colorCursor = -1;

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <IconButton
          icon="arrow-back"
          onPress={() => navigation.navigate('MainTabs', { screen: 'HomeTab' })}
          size={36}
        />
        <AppText variant="h2" align="center" style={{ flex: 1 }}>
          My Classes
        </AppText>
        <IconButton
          icon="calendar-outline"
          onPress={() => {
            setPickerMonth(selectedDate);
            setPickerOpen(true);
          }}
          size={36}
        />
      </View>

      <View style={styles.dayStrip}>
        {stripDays.map((date) => {
          const active = isSameDay(date, selectedDate);
          return (
            <AnimatedPressable
              key={date.toISOString()}
              onPress={() => setSelectedDate(date)}
              haptic={false}
              style={[styles.dayCell, active && styles.dayCellActive]}
            >
              <AppText variant="tiny" color={active ? colors.textInverse : colors.textTertiary}>
                {format(date, 'EEE')}
              </AppText>
              <AppText variant="bodySemibold" color={active ? colors.textInverse : colors.textPrimary} style={{ marginTop: 2 }}>
                {format(date, 'd')}
              </AppText>
              <AppText variant="tiny" color={active ? colors.textInverse : colors.textTertiary}>
                {format(date, 'MMM')}
              </AppText>
            </AnimatedPressable>
          );
        })}
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <View style={[styles.statIconWrap, { backgroundColor: colors.primarySoft }]}>
              <Ionicons name="book" size={16} color={colors.primary} />
            </View>
            <View style={{ marginLeft: spacing.sm }}>
              <AppText variant="h3">{taughtCount}</AppText>
              <AppText variant="tiny" color={colors.textSecondary}>
                Classes
              </AppText>
            </View>
          </View>
          <View style={styles.statCard}>
            <View style={[styles.statIconWrap, { backgroundColor: colors.surfaceAlt }]}>
              <Ionicons name="time" size={16} color={colors.textSecondary} />
            </View>
            <View style={{ marginLeft: spacing.sm }}>
              <AppText variant="h3">{freeCount}</AppText>
              <AppText variant="tiny" color={colors.textSecondary}>
                Free Periods
              </AppText>
            </View>
          </View>
        </View>

        {loading ? (
          <SkeletonCard lines={4} />
        ) : daySlots.length === 0 ? (
          <EmptyState icon="calendar-outline" title="No periods scheduled" message="Nothing on the timetable for this day yet." />
        ) : (
          daySlots.map((slot) => {
            if (slot.type === 'break') {
              return (
                <View key={slot.id} style={styles.breakRow}>
                  <View style={[styles.periodBadge, styles.breakBadge]}>
                    <Ionicons name="cafe-outline" size={20} color={colors.textSecondary} />
                  </View>
                  <View style={{ flex: 1, marginLeft: spacing.sm }}>
                    <AppText variant="bodySemibold" color={colors.textSecondary}>
                      {slot.label}
                    </AppText>
                    <AppText variant="tiny" color={colors.textTertiary} style={{ marginTop: 2 }}>
                      {formatTime(slot.startTime)} – {formatTime(slot.endTime)}
                    </AppText>
                  </View>
                </View>
              );
            }
            const isFree = !slot.taught;
            if (!isFree) colorCursor += 1;
            const color = isFree ? colors.textTertiary : PERIOD_COLORS[colorCursor % PERIOD_COLORS.length];
            const info = slot.taught ? classInfo[slot.taught.classId] : null;
            const classLabel = slot.taught
              ? info
                ? `${info.name} · Section ${info.section}`
                : slot.taught.classId
              : 'Free Period';
            return (
              <AnimatedPressable
                key={slot.id}
                onPress={() => slot.taught && setDetail(slot)}
                haptic={false}
                style={styles.periodRow}
                disabled={isFree}
              >
                <View style={[styles.periodBadge, { backgroundColor: color }]}>
                  <AppText variant="tiny" color={colors.textInverse}>
                    Period
                  </AppText>
                  <AppText variant="h3" color={colors.textInverse}>
                    {slot.periodNumber}
                  </AppText>
                </View>
                <View style={{ flex: 1, marginLeft: spacing.sm }}>
                  <AppText variant="bodySemibold">{classLabel}</AppText>
                  {slot.taught && (
                    <AppText variant="caption" color={colors.textSecondary}>
                      {slot.taught.subject}
                    </AppText>
                  )}
                  <AppText variant="tiny" color={colors.textTertiary} style={{ marginTop: 2 }}>
                    {formatTime(slot.startTime)} – {formatTime(slot.endTime)}
                  </AppText>
                </View>
                {!isFree && <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />}
              </AnimatedPressable>
            );
          })
        )}
      </ScrollView>

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
              {monthDays.map((date) => {
                const isSelected = isSameDay(date, selectedDate);
                return (
                  <View key={date.toISOString()} style={styles.gridCell}>
                    <AnimatedPressable
                      onPress={() => {
                        setSelectedDate(date);
                        setPickerOpen(false);
                      }}
                      haptic={false}
                      style={[styles.dayCircle, isSelected && { backgroundColor: colors.primary }]}
                    >
                      <AppText variant="bodyMedium" color={isSelected ? colors.textInverse : colors.textPrimary}>
                        {format(date, 'd')}
                      </AppText>
                    </AnimatedPressable>
                  </View>
                );
              })}
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal visible={!!detail} transparent animationType="fade" onRequestClose={() => setDetail(null)}>
        <Pressable style={styles.overlay} onPress={() => setDetail(null)}>
          <Pressable style={styles.detailCard} onPress={(e) => e.stopPropagation()}>
            {detail?.taught && (
              <>
                <AppText variant="h3">
                  {(() => {
                    const info = classInfo[detail.taught.classId];
                    return info ? `${info.name} · Section ${info.section}` : detail.taught.classId;
                  })()}
                </AppText>
                <View style={styles.detailRow}>
                  <Ionicons name="book-outline" size={16} color={colors.textSecondary} />
                  <AppText variant="bodyMedium" style={{ marginLeft: spacing.xs }}>
                    {detail.taught.subject}
                  </AppText>
                </View>
                <View style={styles.detailRow}>
                  <Ionicons name="time-outline" size={16} color={colors.textSecondary} />
                  <AppText variant="bodyMedium" style={{ marginLeft: spacing.xs }}>
                    {formatTime(detail.startTime)} – {formatTime(detail.endTime)}
                  </AppText>
                </View>
                {!!detail.taught.room && (
                  <View style={styles.detailRow}>
                    <Ionicons name="location-outline" size={16} color={colors.textSecondary} />
                    <AppText variant="bodyMedium" style={{ marginLeft: spacing.xs }}>
                      Room {detail.taught.room}
                    </AppText>
                  </View>
                )}
              </>
            )}
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.xs,
    paddingTop: spacing.xs,
  },
  dayStrip: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    marginTop: spacing.sm,
    marginBottom: spacing.md,
    gap: spacing.xs,
  },
  dayCell: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderSoft,
  },
  dayCellActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  content: { paddingHorizontal: spacing.lg, paddingBottom: layout.tabBarClearance },
  statsRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
  statCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    padding: spacing.sm,
  },
  statIconWrap: {
    width: 32,
    height: 32,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  periodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    padding: spacing.sm,
    marginBottom: spacing.sm,
  },
  periodBadge: {
    width: 52,
    height: 52,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  breakRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    borderStyle: 'dashed',
    padding: spacing.sm,
    marginBottom: spacing.sm,
  },
  breakBadge: {
    backgroundColor: colors.surface,
  },
  overlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'center',
    padding: spacing.lg,
  },
  pickerCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
  },
  monthNav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.sm },
  navBtn: { width: 34, height: 34, alignItems: 'center', justifyContent: 'center' },
  weekdayRow: { flexDirection: 'row' },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  gridCell: { width: `${100 / 7}%`, aspectRatio: 1, alignItems: 'center', justifyContent: 'center' },
  dayCircle: { width: 32, height: 32, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
  detailCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
  },
  detailRow: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.sm },
});
