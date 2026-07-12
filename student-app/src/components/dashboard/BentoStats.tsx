import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText, AnimatedPressable, ProgressRing } from '@components/ui';
import { colors, spacing, radius } from '@theme';
import { TimetablePeriod } from '@/types';

interface BentoStatsProps {
  attendancePct: number;
  presentDays: number;
  totalDays: number;
  homeworkCount: number;
  unreadCount: number;
  nextPeriod?: TimetablePeriod;
  onAttendancePress: () => void;
  onHomeworkPress: () => void;
  onNotificationsPress: () => void;
  onTimetablePress: () => void;
}

export function BentoStats({
  attendancePct,
  presentDays,
  totalDays,
  homeworkCount,
  unreadCount,
  nextPeriod,
  onAttendancePress,
  onHomeworkPress,
  onNotificationsPress,
  onTimetablePress,
}: BentoStatsProps) {
  return (
    <View style={styles.grid}>
      <AnimatedPressable onPress={onAttendancePress} style={[styles.tile, styles.cell]} scaleTo={0.97}>
        <ProgressRing value={attendancePct} size={58} strokeWidth={7} />
        <AppText variant="tiny" color={colors.textTertiary} numberOfLines={1} style={{ marginTop: spacing.sm }}>
          Attendance · {presentDays}/{totalDays}d
        </AppText>
      </AnimatedPressable>

      <AnimatedPressable onPress={onTimetablePress} style={[styles.tile, styles.cell]} scaleTo={0.97}>
        <View style={[styles.iconChip, { backgroundColor: colors.infoBg }]}>
          <Ionicons name="time-outline" size={16} color={colors.infoStrong} />
        </View>
        <AppText variant="h3" numberOfLines={1} style={{ marginTop: spacing.sm }}>
          {nextPeriod ? nextPeriod.subject : 'Free day'}
        </AppText>
        <AppText variant="tiny" color={colors.textTertiary} numberOfLines={1}>
          {nextPeriod ? `Next · ${nextPeriod.startTime}` : 'No more classes'}
        </AppText>
      </AnimatedPressable>

      <AnimatedPressable onPress={onHomeworkPress} style={[styles.tile, styles.cell]} scaleTo={0.97}>
        <View style={[styles.iconChip, { backgroundColor: colors.warningBg }]}>
          <Ionicons name="book-outline" size={16} color={colors.warningStrong} />
        </View>
        <AppText variant="h2" style={{ marginTop: spacing.sm }}>
          {homeworkCount}
        </AppText>
        <AppText variant="tiny" color={colors.textTertiary}>
          Homework
        </AppText>
      </AnimatedPressable>

      <AnimatedPressable onPress={onNotificationsPress} style={[styles.tile, styles.cell]} scaleTo={0.97}>
        <View style={[styles.iconChip, { backgroundColor: colors.dangerBg }]}>
          <Ionicons name="notifications-outline" size={16} color={colors.dangerStrong} />
        </View>
        <AppText variant="h2" style={{ marginTop: spacing.sm }}>
          {unreadCount}
        </AppText>
        <AppText variant="tiny" color={colors.textTertiary}>
          Unread updates
        </AppText>
      </AnimatedPressable>
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  tile: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    borderRadius: radius.lg,
    padding: spacing.md,
  },
  cell: {
    flexBasis: '47%',
    flexGrow: 1,
  },
  iconChip: {
    width: 30,
    height: 30,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
