import React from 'react';
import { View, StyleSheet } from 'react-native';
import { AppText } from '@components/ui';
import { colors, spacing, radius } from '@theme';

export interface UpcomingStat {
  key: string;
  value: number;
  valueColor: string;
  label: string;
  sublabel: string;
}

export function UpcomingStats({ stats }: { stats: UpcomingStat[] }) {
  return (
    <View style={styles.row}>
      {stats.map((s) => (
        <View key={s.key} style={styles.tile}>
          <AppText variant="displayMd" color={s.valueColor} style={styles.value}>
            {s.value}
          </AppText>
          <AppText variant="bodySemibold" numberOfLines={1}>
            {s.label}
          </AppText>
          <AppText variant="tiny" color={colors.textTertiary} numberOfLines={1}>
            {s.sublabel}
          </AppText>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  tile: {
    flex: 1,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    borderRadius: radius.lg,
    padding: spacing.md,
  },
  value: {
    fontSize: 26,
    marginBottom: 2,
  },
});
