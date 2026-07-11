import React, { useMemo } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText, EdgeFade } from '@components/ui';
import { colors, spacing, radius, shadows, accentForKey } from '@theme';
import { DayOfWeek, TimetablePeriod } from '@/types';

const DAYS: { code: DayOfWeek; label: string }[] = [
  { code: 'Mon', label: 'Mon' },
  { code: 'Tue', label: 'Tue' },
  { code: 'Wed', label: 'Wed' },
  { code: 'Thu', label: 'Thu' },
  { code: 'Fri', label: 'Fri' },
  { code: 'Sat', label: 'Sat' },
];

const TIME_COL_WIDTH = 60;
const DAY_COL_WIDTH = 92;

interface TimetableGridProps {
  periods: TimetablePeriod[];
  todayCode: string;
  currentPeriodId: string | null;
}

export function TimetableGrid({ periods, todayCode, currentPeriodId }: TimetableGridProps) {
  const rows = useMemo(() => {
    const map = new Map<number, { periodNumber: number; startTime: string; endTime: string; isBreak: boolean }>();
    periods.forEach((p) => {
      if (!map.has(p.periodNumber)) {
        map.set(p.periodNumber, {
          periodNumber: p.periodNumber,
          startTime: p.startTime,
          endTime: p.endTime,
          isBreak: !!p.isBreak,
        });
      }
    });
    return [...map.values()].sort((a, b) => a.periodNumber - b.periodNumber);
  }, [periods]);

  const cellFor = (day: DayOfWeek, periodNumber: number) =>
    periods.find((p) => p.day === day && p.periodNumber === periodNumber);

  return (
    <View>
      <View style={styles.swipeHint}>
        <AppText variant="tiny" color={colors.textTertiary}>
          Swipe to see all 6 days
        </AppText>
        <Ionicons name="arrow-forward" size={12} color={colors.textTertiary} style={{ marginLeft: 4 }} />
      </View>
      <View style={styles.scrollerWrap}>
      <ScrollView horizontal showsHorizontalScrollIndicator={true}>
      <View style={styles.tableShadowWrap}>
        <View style={styles.table}>
        <View style={styles.row}>
          <View style={[styles.headerCell, { width: TIME_COL_WIDTH }]} />
          {DAYS.map((d) => (
            <View
              key={d.code}
              style={[
                styles.headerCell,
                { width: DAY_COL_WIDTH },
                d.code === todayCode && styles.headerCellToday,
              ]}
            >
              <AppText
                variant="bodySemibold"
                color={d.code === todayCode ? colors.textInverse : colors.textSecondary}
              >
                {d.label}
              </AppText>
            </View>
          ))}
        </View>

        {rows.map((row) => (
          <View key={row.periodNumber} style={styles.row}>
            <View style={[styles.timeCell, { width: TIME_COL_WIDTH }]}>
              <AppText variant="tiny" color={colors.textSecondary}>
                {row.startTime}
              </AppText>
              <AppText variant="tiny" color={colors.textTertiary}>
                {row.endTime}
              </AppText>
            </View>
            {DAYS.map((d) => {
              const period = cellFor(d.code, row.periodNumber);
              if (!period) {
                return <View key={d.code} style={[styles.cell, { width: DAY_COL_WIDTH }]} />;
              }
              if (period.isBreak) {
                return (
                  <View key={d.code} style={[styles.cell, styles.breakCell, { width: DAY_COL_WIDTH }]}>
                    <AppText variant="tiny" color={colors.textTertiary}>
                      Recess
                    </AppText>
                  </View>
                );
              }
              const accent = accentForKey(period.subject);
              const isCurrent = period.id === currentPeriodId;
              return (
                <View
                  key={d.code}
                  style={[
                    styles.cell,
                    { width: DAY_COL_WIDTH, backgroundColor: accent.bg },
                    isCurrent && { borderWidth: 2, borderColor: colors.primary },
                  ]}
                >
                  <AppText variant="caption" color={accent.fg} numberOfLines={2}>
                    {period.subject}
                  </AppText>
                  {!!period.room && (
                    <AppText variant="tiny" color={accent.fg} numberOfLines={1} style={{ marginTop: 2, opacity: 0.8 }}>
                      {period.room}
                    </AppText>
                  )}
                </View>
              );
            })}
          </View>
        ))}
        </View>
      </View>
      </ScrollView>
      <EdgeFade />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  swipeHint: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginBottom: spacing.xs,
  },
  scrollerWrap: {
    position: 'relative',
  },
  tableShadowWrap: {
    borderRadius: radius.md,
    ...shadows.sm,
  },
  table: {
    borderWidth: 1,
    borderColor: colors.borderSoft,
    borderRadius: radius.md,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
  },
  headerCell: {
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceAlt,
    borderBottomWidth: 1,
    borderRightWidth: 1,
    borderColor: colors.borderSoft,
  },
  headerCellToday: {
    backgroundColor: colors.primary,
  },
  timeCell: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceAlt,
    borderBottomWidth: 1,
    borderRightWidth: 1,
    borderColor: colors.borderSoft,
    paddingVertical: spacing.xs,
  },
  cell: {
    minHeight: 64,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    paddingVertical: spacing.xs,
    borderBottomWidth: 1,
    borderRightWidth: 1,
    borderColor: colors.borderSoft,
    backgroundColor: colors.surface,
  },
  breakCell: {
    backgroundColor: colors.surfaceAlt,
  },
});
