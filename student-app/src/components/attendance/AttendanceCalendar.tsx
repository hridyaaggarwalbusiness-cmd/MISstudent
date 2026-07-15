import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import {
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  getDay,
  format,
  formatISO,
} from 'date-fns';
import { AppText, AnimatedPressable } from '@components/ui';
import { colors, radius, spacing } from '@theme';
import { AttendanceDay, AttendanceStatus } from '@/types';

const WEEKDAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

const statusColor: Record<AttendanceStatus, { bg: string; fg: string }> = {
  present: { bg: colors.success, fg: colors.textInverse },
  late: { bg: colors.warning, fg: colors.textInverse },
  absent: { bg: colors.danger, fg: colors.textInverse },
  leave: { bg: colors.info, fg: colors.textInverse },
  holiday: { bg: colors.surfaceAlt, fg: colors.textTertiary },
  weekend: { bg: colors.surfaceAlt, fg: colors.textTertiary },
  future: { bg: 'transparent', fg: colors.textTertiary },
};

interface AttendanceCalendarProps {
  monthDate: Date;
  days: AttendanceDay[];
  onDayPress?: (day: AttendanceDay) => void;
}

export function AttendanceCalendar({ monthDate, days, onDayPress }: AttendanceCalendarProps) {
  const dayMap = useMemo(() => {
    const map = new Map<string, AttendanceDay>();
    days.forEach((d) => map.set(d.date, d));
    return map;
  }, [days]);

  const gridCells = useMemo(() => {
    const start = startOfMonth(monthDate);
    const end = endOfMonth(monthDate);
    const monthDays = eachDayOfInterval({ start, end });
    const leadingBlanks = getDay(start);
    return { leadingBlanks, monthDays };
  }, [monthDate]);

  return (
    <View>
      <View style={styles.weekdayRow}>
        {WEEKDAY_LABELS.map((label, i) => (
          <View key={i} style={styles.cell}>
            <AppText variant="tiny" color={colors.textTertiary}>
              {label}
            </AppText>
          </View>
        ))}
      </View>
      <View style={styles.grid}>
        {Array.from({ length: gridCells.leadingBlanks }).map((_, i) => (
          <View key={`blank-${i}`} style={styles.cell} />
        ))}
        {gridCells.monthDays.map((date) => {
          const iso = formatISO(date, { representation: 'date' });
          const entry = dayMap.get(iso);
          const status = entry?.status ?? 'future';
          const colorSet = statusColor[status];
          const isDisabled = status === 'future' || !onDayPress;
          return (
            <View key={iso} style={styles.cell}>
              <AnimatedPressable
                haptic={status !== 'future'}
                disabled={isDisabled}
                onPress={() => entry && onDayPress?.(entry)}
                style={[styles.dayCircle, { backgroundColor: colorSet.bg }]}
              >
                <AppText variant="bodyMedium" color={status === 'future' ? colors.textTertiary : colorSet.fg}>
                  {format(date, 'd')}
                </AppText>
              </AnimatedPressable>
            </View>
          );
        })}
      </View>
    </View>
  );
}

export function AttendanceLegend() {
  const items: { label: string; status: AttendanceStatus }[] = [
    { label: 'Present', status: 'present' },
    { label: 'Late', status: 'late' },
    { label: 'Absent', status: 'absent' },
    { label: 'Leave', status: 'leave' },
    { label: 'Holiday', status: 'holiday' },
  ];
  return (
    <View style={styles.legendRow}>
      {items.map((item) => (
        <View key={item.status} style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: statusColor[item.status].bg }]} />
          <AppText variant="tiny" color={colors.textSecondary}>
            {item.label}
          </AppText>
        </View>
      ))}
    </View>
  );
}

const CELL_SIZE = `${100 / 7}%` as const;

const styles = StyleSheet.create({
  weekdayRow: { flexDirection: 'row' },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: {
    width: CELL_SIZE,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayCircle: {
    width: 36,
    height: 36,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  legendRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: spacing.sm,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: spacing.md,
    marginBottom: spacing.xs,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 5,
  },
});
