import React from 'react';
import { View, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { Card, AppText, Badge } from '@components/ui';
import { colors, spacing, accentForKey } from '@theme';
import { TimetablePeriod } from '@/types';

interface PeriodCardProps {
  period: TimetablePeriod;
  isCurrent?: boolean;
  isNext?: boolean;
  style?: StyleProp<ViewStyle>;
  compact?: boolean;
}

export function PeriodCard({ period, isCurrent, isNext, style, compact }: PeriodCardProps) {
  if (period.isBreak) {
    return (
      <View style={[styles.breakWrap, style]}>
        <AppText variant="caption" color={colors.textTertiary}>
          {period.startTime} – {period.endTime} · Recess
        </AppText>
      </View>
    );
  }

  const accent = accentForKey(period.subject);

  return (
    <Card
      elevation={isCurrent ? 'sm' : 'xs'}
      style={[
        styles.card,
        compact && styles.compactCard,
        isCurrent && { borderColor: colors.primary, borderWidth: 1.5 },
        style,
      ]}
    >
      <View style={styles.row}>
        <View style={[styles.timeBlock, { backgroundColor: accent.bg }]}>
          <AppText variant="bodySemibold" color={accent.fg} style={{ fontSize: 13 }}>
            {period.startTime}
          </AppText>
          <AppText variant="tiny" color={accent.fg}>
            {period.endTime}
          </AppText>
        </View>
        <View style={{ flex: 1, marginLeft: spacing.sm }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <AppText variant="bodySemibold" numberOfLines={1} style={{ flex: 1 }}>
              {period.subject}
            </AppText>
            {isCurrent && <Badge label="Now" tone="success" size="sm" />}
            {isNext && !isCurrent && <Badge label="Next" tone="primary" size="sm" />}
          </View>
          <AppText variant="caption" color={colors.textSecondary} numberOfLines={1} style={{ marginTop: 2 }}>
            {period.teacher} {period.room ? `· ${period.room}` : ''}
          </AppText>
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: spacing.sm,
  },
  compactCard: {
    width: 240,
    marginRight: spacing.sm,
    marginBottom: 0,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeBlock: {
    width: 58,
    borderRadius: 10,
    paddingVertical: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  breakWrap: {
    paddingVertical: spacing.xs,
    alignItems: 'center',
  },
});
