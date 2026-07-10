import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Card, AppText } from '@components/ui';
import { colors, spacing, radius, accentForKey } from '@theme';
import { Exam } from '@/types';
import { dayMonth } from '@utils/date';
import { differenceInCalendarDays, parseISO } from 'date-fns';

export function ExamCountdownCard({ exam }: { exam: Exam }) {
  const { day, month } = dayMonth(exam.date);
  const daysLeft = differenceInCalendarDays(parseISO(exam.date), new Date());
  const accent = accentForKey(exam.subject);

  return (
    <Card style={styles.card} elevation="xs">
      <View style={styles.row}>
        <View style={[styles.dateBlock, { backgroundColor: accent.bg }]}>
          <AppText variant="h2" color={accent.fg} style={{ fontSize: 18 }}>
            {day}
          </AppText>
          <AppText variant="tiny" color={accent.fg}>
            {month}
          </AppText>
        </View>
        <View style={{ marginLeft: spacing.sm, flex: 1 }}>
          <AppText variant="bodySemibold" numberOfLines={1}>
            {exam.subject}
          </AppText>
          <AppText variant="caption" color={colors.textSecondary} numberOfLines={1}>
            {exam.name}
          </AppText>
          <AppText variant="tiny" color={colors.primary} style={{ marginTop: 3 }}>
            {daysLeft === 0 ? 'Today' : `In ${daysLeft} day${daysLeft === 1 ? '' : 's'}`}
          </AppText>
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 200,
    marginRight: spacing.sm,
  },
  row: { flexDirection: 'row', alignItems: 'center' },
  dateBlock: {
    width: 46,
    height: 46,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
