import React, { useState } from 'react';
import { View, Modal, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  getDay,
  format,
  formatISO,
  isSameDay,
  parseISO,
} from 'date-fns';
import { AppText } from './AppText';
import { AnimatedPressable } from './AnimatedPressable';
import { colors, spacing, radius } from '@theme';

const WEEKDAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const CELL_SIZE = `${100 / 7}%` as const;

interface DatePickerFieldProps {
  value: string; // ISO date (yyyy-MM-dd)
  onChange: (value: string) => void;
  minDate?: Date;
}

export function DatePickerField({ value, onChange, minDate }: DatePickerFieldProps) {
  const [open, setOpen] = useState(false);
  const selected = value ? parseISO(value) : new Date();
  const [monthDate, setMonthDate] = useState(selected);

  const { leadingBlanks, monthDays } = React.useMemo(() => {
    const start = startOfMonth(monthDate);
    const end = endOfMonth(monthDate);
    return { leadingBlanks: getDay(start), monthDays: eachDayOfInterval({ start, end }) };
  }, [monthDate]);

  const openPicker = () => {
    setMonthDate(selected);
    setOpen(true);
  };

  const pick = (date: Date) => {
    onChange(formatISO(date, { representation: 'date' }));
    setOpen(false);
  };

  return (
    <>
      <AnimatedPressable onPress={openPicker} haptic={false} style={styles.field}>
        <Ionicons name="calendar-outline" size={16} color={colors.textSecondary} />
        <AppText variant="bodyMedium" style={{ marginLeft: spacing.xs }}>
          {value ? format(selected, 'EEE, d MMM yyyy') : 'Select a date'}
        </AppText>
      </AnimatedPressable>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.overlay} onPress={() => setOpen(false)}>
          <Pressable style={styles.card} onPress={(e) => e.stopPropagation()}>
            <View style={styles.monthNav}>
              <AnimatedPressable onPress={() => setMonthDate((d) => subMonths(d, 1))} haptic={false} style={styles.navBtn}>
                <Ionicons name="chevron-back" size={18} color={colors.textPrimary} />
              </AnimatedPressable>
              <AppText variant="h3">{format(monthDate, 'MMMM yyyy')}</AppText>
              <AnimatedPressable onPress={() => setMonthDate((d) => addMonths(d, 1))} haptic={false} style={styles.navBtn}>
                <Ionicons name="chevron-forward" size={18} color={colors.textPrimary} />
              </AnimatedPressable>
            </View>

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
              {Array.from({ length: leadingBlanks }).map((_, i) => (
                <View key={`blank-${i}`} style={styles.cell} />
              ))}
              {monthDays.map((date) => {
                const isSelected = isSameDay(date, selected);
                const disabled = minDate ? date < minDate : false;
                return (
                  <View key={date.toISOString()} style={styles.cell}>
                    <AnimatedPressable
                      onPress={() => !disabled && pick(date)}
                      haptic={false}
                      style={[styles.dayCircle, isSelected && { backgroundColor: colors.primary }]}
                    >
                      <AppText
                        variant="bodyMedium"
                        color={disabled ? colors.textTertiary : isSelected ? colors.textInverse : colors.textPrimary}
                      >
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
    </>
  );
}

const styles = StyleSheet.create({
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 46,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceAlt,
    paddingHorizontal: spacing.sm,
  },
  overlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'center',
    padding: spacing.lg,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
  },
  monthNav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.sm },
  navBtn: { width: 34, height: 34, alignItems: 'center', justifyContent: 'center' },
  weekdayRow: { flexDirection: 'row' },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: { width: CELL_SIZE, aspectRatio: 1, alignItems: 'center', justifyContent: 'center' },
  dayCircle: { width: 32, height: 32, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
});
