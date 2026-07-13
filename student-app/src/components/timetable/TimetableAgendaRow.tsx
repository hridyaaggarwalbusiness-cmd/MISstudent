import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { AppText } from '@components/ui';
import { colors, spacing, radius } from '@theme';
import { TimetablePeriod } from '@/types';
import { subjectMeta, subjectTextColor } from '@data/subjectMeta';

function formatTime(t: string): string {
  const [h, m] = t.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${String(hour12).padStart(2, '0')}:${String(m).padStart(2, '0')} ${period}`;
}

export function TimetableAgendaRow({ period, isLast }: { period: TimetablePeriod; isLast: boolean }) {
  const isLunch = period.isBreak && period.subject.toLowerCase().includes('lunch');
  const isBreak = !!period.isBreak;

  const content = isBreak ? (
    <>
      <View style={[styles.iconWrap, { backgroundColor: isLunch ? colors.tileOrange : colors.tileOrange }]}>
        <Ionicons name={isLunch ? 'restaurant-outline' : 'cafe-outline'} size={20} color="#fff" />
      </View>
      <View style={{ flex: 1, marginLeft: spacing.sm }}>
        <AppText variant="bodySemibold">{period.subject || (isLunch ? 'Lunch Break' : 'Break')}</AppText>
      </View>
    </>
  ) : (
    <>
      <LinearGradient
        colors={subjectMeta(period.subject).gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.iconWrap}
      >
        <Ionicons name={subjectMeta(period.subject).icon} size={20} color="#fff" />
      </LinearGradient>
      <View style={{ flex: 1, marginLeft: spacing.sm }}>
        <AppText variant="bodySemibold" color={subjectTextColor(period.subject)}>
          {period.subject}
        </AppText>
        {!!period.teacher && (
          <AppText variant="caption" color={colors.textSecondary} style={{ marginTop: 2 }}>
            {period.teacher}
          </AppText>
        )}
      </View>
    </>
  );

  return (
    <View
      style={[
        styles.row,
        !isLast && styles.rowDivider,
        isLunch && { backgroundColor: colors.warningBg },
      ]}
    >
      <View style={styles.timeCol}>
        <AppText variant="caption" color={colors.textSecondary}>
          {formatTime(period.startTime)}
        </AppText>
        <AppText variant="tiny" color={colors.textTertiary} style={{ marginTop: 2 }}>
          {formatTime(period.endTime)}
        </AppText>
      </View>
      {content}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
  },
  rowDivider: {
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSoft,
  },
  timeCol: {
    width: 68,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: spacing.sm,
  },
});
