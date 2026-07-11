import React from 'react';
import { View, StyleSheet } from 'react-native';
import { AppText, AnimatedPressable } from '@components/ui';
import { colors, spacing, radius } from '@theme';
import { DayOfWeek } from '@/types';

const DAYS: { code: DayOfWeek; label: string }[] = [
  { code: 'Mon', label: 'M' },
  { code: 'Tue', label: 'T' },
  { code: 'Wed', label: 'W' },
  { code: 'Thu', label: 'T' },
  { code: 'Fri', label: 'F' },
  { code: 'Sat', label: 'S' },
];

interface WeekStripProps {
  selectedDay: DayOfWeek;
  todayCode: string;
  hasClasses: (day: DayOfWeek) => boolean;
  onSelect: (day: DayOfWeek) => void;
}

export function WeekStrip({ selectedDay, todayCode, hasClasses, onSelect }: WeekStripProps) {
  return (
    <View style={styles.row}>
      {DAYS.map((d) => {
        const isSelected = d.code === selectedDay;
        const isToday = d.code === todayCode;
        return (
          <AnimatedPressable
            key={d.code}
            onPress={() => onSelect(d.code)}
            style={[styles.cell, isSelected && styles.cellSelected]}
            scaleTo={0.94}
          >
            <AppText variant="tiny" color={isSelected ? colors.textInverse : colors.textTertiary}>
              {d.label}
            </AppText>
            <View
              style={[
                styles.marker,
                isToday && !isSelected && styles.markerToday,
                hasClasses(d.code) && !isSelected && styles.markerDot,
                isSelected && styles.markerSelected,
              ]}
            />
          </AnimatedPressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: spacing.xs },
  cell: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderSoft,
  },
  cellSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  marker: { width: 5, height: 5, borderRadius: 3, marginTop: 6, backgroundColor: 'transparent' },
  markerDot: { backgroundColor: colors.textTertiary },
  markerToday: { backgroundColor: colors.warning },
  markerSelected: { backgroundColor: colors.textInverse },
});
