import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '@components/ui';
import { colors, spacing } from '@theme';

interface InfoRowProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  isLast?: boolean;
}

export function InfoRow({ icon, label, value, isLast }: InfoRowProps) {
  return (
    <View style={[styles.row, !isLast && styles.border]}>
      <View style={styles.iconWrap}>
        <Ionicons name={icon} size={15} color={colors.textSecondary} />
      </View>
      <View style={{ marginLeft: spacing.sm, flex: 1 }}>
        <AppText variant="tiny" color={colors.textTertiary}>
          {label}
        </AppText>
        <AppText variant="bodyMedium" style={{ marginTop: 1 }}>
          {value}
        </AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  border: {
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSoft,
  },
  iconWrap: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
