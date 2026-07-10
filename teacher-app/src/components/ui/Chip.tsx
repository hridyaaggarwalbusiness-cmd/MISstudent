import React from 'react';
import { StyleSheet, ViewStyle } from 'react-native';
import { AnimatedPressable } from './AnimatedPressable';
import { AppText } from './AppText';
import { colors, radius, spacing } from '@theme';
import { Ionicons } from '@expo/vector-icons';

interface ChipProps {
  label: string;
  active?: boolean;
  onPress?: () => void;
  icon?: keyof typeof Ionicons.glyphMap;
  style?: ViewStyle;
}

export function Chip({ label, active = false, onPress, icon, style }: ChipProps) {
  return (
    <AnimatedPressable
      onPress={onPress}
      scaleTo={0.95}
      style={[styles.base, active ? styles.active : styles.inactive, style]}
    >
      {icon && (
        <Ionicons
          name={icon}
          size={14}
          color={active ? colors.textInverse : colors.textSecondary}
          style={{ marginRight: 6 }}
        />
      )}
      <AppText variant="bodyMedium" color={active ? colors.textInverse : colors.textSecondary}>
        {label}
      </AppText>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    height: 36,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  active: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  inactive: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
  },
});
