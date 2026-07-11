import React from 'react';
import { View, StyleSheet } from 'react-native';
import { AppText, Badge } from '@components/ui';
import { colors, spacing, radius, accentForKey } from '@theme';
import { TimetablePeriod } from '@/types';

interface DayTimelineProps {
  periods: TimetablePeriod[];
  currentPeriodId: string | null;
  nextPeriodId: string | null;
}

export function DayTimeline({ periods, currentPeriodId, nextPeriodId }: DayTimelineProps) {
  return (
    <View>
      {periods.map((period, index) => {
        const isLast = index === periods.length - 1;
        const isCurrent = period.id === currentPeriodId;
        const isNext = period.id === nextPeriodId;

        if (period.isBreak) {
          return (
            <View key={period.id} style={styles.row}>
              <View style={styles.timeCol}>
                <AppText variant="tiny" color={colors.textTertiary}>
                  {period.startTime}
                </AppText>
              </View>
              <View style={styles.rail}>
                <View style={styles.breakDot} />
                {!isLast && <View style={styles.line} />}
              </View>
              <View style={styles.breakContent}>
                <AppText variant="captionRegular" color={colors.textTertiary}>
                  Recess · until {period.endTime}
                </AppText>
              </View>
            </View>
          );
        }

        const accent = accentForKey(period.subject);

        return (
          <View key={period.id} style={styles.row}>
            <View style={styles.timeCol}>
              <AppText variant={isCurrent ? 'bodySemibold' : 'caption'} color={isCurrent ? colors.primary : colors.textSecondary}>
                {period.startTime}
              </AppText>
              <AppText variant="tiny" color={colors.textTertiary}>
                {period.endTime}
              </AppText>
            </View>
            <View style={styles.rail}>
              <View style={[styles.dot, isCurrent && styles.dotCurrent]} />
              {!isLast && <View style={styles.line} />}
            </View>
            <View
              style={[
                styles.content,
                { borderLeftColor: accent.fg },
                isCurrent && { backgroundColor: colors.surfaceRaised, borderColor: colors.primary },
              ]}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <AppText variant="bodySemibold" style={{ flex: 1 }} numberOfLines={1}>
                  {period.subject}
                </AppText>
                {isCurrent && <Badge label="Now" tone="success" size="sm" />}
                {isNext && !isCurrent && <Badge label="Next" tone="primary" size="sm" />}
              </View>
              <AppText variant="caption" color={colors.textSecondary} numberOfLines={1} style={{ marginTop: 2 }}>
                {period.teacher}
                {period.room ? ` · ${period.room}` : ''}
              </AppText>
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row' },
  timeCol: { width: 50, paddingTop: 3 },
  rail: { width: 20, alignItems: 'center' },
  dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.borderStrong, marginTop: 5 },
  dotCurrent: { backgroundColor: colors.primary, width: 12, height: 12, borderRadius: 6, marginTop: 4 },
  breakDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.borderStrong, marginTop: 8 },
  line: { flex: 1, width: 2, backgroundColor: colors.borderSoft, marginTop: 2, marginBottom: 2, borderRadius: 1 },
  breakContent: { flex: 1, marginLeft: spacing.sm, paddingVertical: spacing.xs, marginBottom: spacing.sm },
  content: {
    flex: 1,
    marginLeft: spacing.sm,
    marginBottom: spacing.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    borderLeftWidth: 3,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    backgroundColor: colors.surface,
  },
});
