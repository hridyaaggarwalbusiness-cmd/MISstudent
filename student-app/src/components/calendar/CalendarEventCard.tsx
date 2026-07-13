import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Card, AppText } from '@components/ui';
import { colors, spacing, radius } from '@theme';
import { CalendarEvent } from '@/types';
import { eventTypeMeta } from '@data/calendarEventTypeMeta';
import { dayMonth } from '@utils/date';

const bgColorMap: Record<string, string> = {
  rose: colors.dangerBg,
  indigo: colors.primarySoft,
  violet: '#F5F3FF',
  emerald: colors.successBg,
  sky: colors.infoBg,
  amber: colors.warningBg,
  slate: colors.surfaceAlt,
};

const fgColorMap: Record<string, string> = {
  rose: colors.accentRose,
  indigo: colors.accentIndigo,
  violet: colors.accentViolet,
  emerald: colors.accentEmerald,
  sky: colors.accentSky,
  amber: colors.accentAmber,
  slate: colors.textSecondary,
};

export function CalendarEventCard({
  event,
  showDescription = false,
}: {
  event: CalendarEvent;
  showDescription?: boolean;
}) {
  const meta = eventTypeMeta[event.type];
  const { day, month } = dayMonth(event.date);
  const bg = bgColorMap[meta.color] ?? colors.surfaceAlt;
  const fg = fgColorMap[meta.color] ?? colors.textSecondary;

  return (
    <Card style={styles.card}>
      <View style={styles.row}>
        <View style={[styles.dateBlock, { backgroundColor: bg }]}>
          <AppText variant="h2" color={fg} style={{ fontSize: 18 }}>
            {day}
          </AppText>
          <AppText variant="tiny" color={fg}>
            {month}
          </AppText>
        </View>
        <View style={{ marginLeft: spacing.sm, flex: 1 }}>
          <AppText variant="bodySemibold" numberOfLines={showDescription ? undefined : 2}>
            {event.title}
          </AppText>
          <AppText variant="caption" color={colors.textSecondary} numberOfLines={1} style={{ marginTop: 2 }}>
            {event.location || 'All Day'}
          </AppText>
          {showDescription && !!event.description && (
            <AppText variant="caption" color={colors.textSecondary} style={{ marginTop: 6, lineHeight: 18 }}>
              {event.description}
            </AppText>
          )}
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: spacing.sm },
  row: { flexDirection: 'row', alignItems: 'center' },
  dateBlock: {
    width: 48,
    height: 48,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
