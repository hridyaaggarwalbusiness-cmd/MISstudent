import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card, AppText, ProgressRing } from '@components/ui';
import { colors, spacing } from '@theme';

interface AttendanceSummaryCardProps {
  percentage: number;
  presentDays: number;
  totalDays: number;
  onPress: () => void;
}

export function AttendanceSummaryCard({
  percentage,
  presentDays,
  totalDays,
  onPress,
}: AttendanceSummaryCardProps) {
  return (
    <Card onPress={onPress} style={styles.card}>
      <View style={styles.row}>
        <ProgressRing value={percentage} size={72} strokeWidth={8} showValueLabel={false} />
        <View style={{ marginLeft: spacing.md, flex: 1 }}>
          <AppText variant="caption" color={colors.textSecondary}>
            Attendance
          </AppText>
          <AppText variant="displayMd" style={{ marginTop: 2, fontSize: 24 }}>
            {percentage}%
          </AppText>
          <AppText variant="tiny" color={colors.textTertiary} style={{ marginTop: 2 }}>
            {presentDays}/{totalDays} days present
          </AppText>
        </View>
        <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: spacing.sm },
  row: { flexDirection: 'row', alignItems: 'center' },
});
