import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText, AnimatedPressable } from '@components/ui';
import { colors, spacing, radius } from '@theme';

interface TeacherBentoStatsProps {
  classesToday: number;
  nextClassLabel: string;
  homeworkPosted: number;
  noticesThisWeek: number;
  onClassesPress: () => void;
  onHomeworkPress: () => void;
  onNoticesPress: () => void;
}

export function TeacherBentoStats({
  classesToday,
  nextClassLabel,
  homeworkPosted,
  noticesThisWeek,
  onClassesPress,
  onHomeworkPress,
  onNoticesPress,
}: TeacherBentoStatsProps) {
  return (
    <View style={styles.grid}>
      <AnimatedPressable onPress={onClassesPress} style={[styles.tile, styles.wide]} scaleTo={0.97}>
        <View style={[styles.iconChip, { backgroundColor: colors.infoBg }]}>
          <Ionicons name="time-outline" size={16} color={colors.infoStrong} />
        </View>
        <AppText variant="h2" style={{ marginTop: spacing.sm }}>
          {classesToday}
        </AppText>
        <AppText variant="tiny" color={colors.textTertiary} numberOfLines={1}>
          {classesToday > 0 ? `Classes today · Next: ${nextClassLabel}` : 'No classes today'}
        </AppText>
      </AnimatedPressable>

      <AnimatedPressable onPress={onHomeworkPress} style={[styles.tile, styles.cell]} scaleTo={0.97}>
        <View style={[styles.iconChip, { backgroundColor: colors.warningBg }]}>
          <Ionicons name="book-outline" size={16} color={colors.warningStrong} />
        </View>
        <AppText variant="h2" style={{ marginTop: spacing.sm }}>
          {homeworkPosted}
        </AppText>
        <AppText variant="tiny" color={colors.textTertiary}>
          Homework posted
        </AppText>
      </AnimatedPressable>

      <AnimatedPressable onPress={onNoticesPress} style={[styles.tile, styles.cell]} scaleTo={0.97}>
        <View style={[styles.iconChip, { backgroundColor: colors.dangerBg }]}>
          <Ionicons name="megaphone-outline" size={16} color={colors.dangerStrong} />
        </View>
        <AppText variant="h2" style={{ marginTop: spacing.sm }}>
          {noticesThisWeek}
        </AppText>
        <AppText variant="tiny" color={colors.textTertiary}>
          Notices this week
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
  wide: {
    flexBasis: '100%',
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
