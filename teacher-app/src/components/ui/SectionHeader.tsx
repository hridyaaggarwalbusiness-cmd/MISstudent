import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { AppText } from './AppText';
import { AnimatedPressable } from './AnimatedPressable';
import { colors, spacing } from '@theme';
import { Ionicons } from '@expo/vector-icons';

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onActionPress?: () => void;
  style?: ViewStyle;
}

export function SectionHeader({
  title,
  subtitle,
  actionLabel = 'See all',
  onActionPress,
  style,
}: SectionHeaderProps) {
  return (
    <View style={[styles.row, style]}>
      <View style={{ flex: 1 }}>
        <AppText variant="h2">{title}</AppText>
        {subtitle && (
          <AppText variant="body" color={colors.textSecondary} style={{ marginTop: 2 }}>
            {subtitle}
          </AppText>
        )}
      </View>
      {onActionPress && (
        <AnimatedPressable onPress={onActionPress} style={styles.action}>
          <AppText variant="bodyMedium" color={colors.primary}>
            {actionLabel}
          </AppText>
          <Ionicons name="chevron-forward" size={16} color={colors.primary} />
        </AnimatedPressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  action: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
