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

// A break row is derived purely from the shared PeriodSchedule (no Firestore
// timetable document backs it, so it never gets a period number). A period
// row pairs the schedule's teaching-only period number with this class's
// saved TimetablePeriod document for that slot.
export type TimetableAgendaRowData =
  | { type: 'break'; key: string; label: string; startTime: string; endTime: string }
  | { type: 'period'; key: string; periodNumber: number; period: TimetablePeriod };

export function TimetableAgendaRow({ row, isLast }: { row: TimetableAgendaRowData; isLast: boolean }) {
  if (row.type === 'break') {
    const isLunch = row.label.toLowerCase().includes('lunch');
    return (
      <View style={[styles.row, !isLast && styles.rowDivider, { backgroundColor: colors.warningBg }]}>
        <View style={styles.timeCol}>
          <AppText variant="caption" color={colors.textSecondary}>
            {formatTime(row.startTime)}
          </AppText>
          <AppText variant="tiny" color={colors.textTertiary} style={{ marginTop: 2 }}>
            {formatTime(row.endTime)}
          </AppText>
        </View>
        <View style={[styles.iconWrap, { backgroundColor: colors.tileOrange }]}>
          <Ionicons name={isLunch ? 'restaurant-outline' : 'cafe-outline'} size={20} color="#fff" />
        </View>
        <View style={{ flex: 1, marginLeft: spacing.sm }}>
          <AppText variant="bodySemibold">{row.label}</AppText>
        </View>
      </View>
    );
  }

  const { period, periodNumber } = row;

  return (
    <View style={[styles.row, !isLast && styles.rowDivider]}>
      <View style={styles.timeCol}>
        <AppText variant="caption" color={colors.textSecondary}>
          {formatTime(period.startTime)}
        </AppText>
        <AppText variant="tiny" color={colors.textTertiary} style={{ marginTop: 2 }}>
          {formatTime(period.endTime)}
        </AppText>
      </View>
      <View style={styles.periodBadge}>
        <AppText variant="tiny" color={colors.textTertiary}>
          P{periodNumber}
        </AppText>
      </View>
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
  periodBadge: {
    width: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: spacing.xs,
  },
});
