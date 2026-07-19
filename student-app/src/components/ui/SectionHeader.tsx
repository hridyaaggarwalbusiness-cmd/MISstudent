import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { AppText } from './AppText';
import { AnimatedPressable } from './AnimatedPressable';
import { colors, spacing } from '@theme';
import { Ionicons } from '@expo/vector-icons';

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
  actionLabel?: string;
  actionIcon?: keyof typeof Ionicons.glyphMap;
  onActionPress?: () => void;
  style?: ViewStyle;
}

export function SectionHeader({
  title,
  subtitle,
  icon,
  iconColor,
  actionLabel = 'See all',
  actionIcon = 'chevron-forward',
  onActionPress,
  style,
}: SectionHeaderProps) {
  return (
    <View style={[styles.row, style]}>
      <View style={styles.titleRow}>
        {icon ? (
          <Ionicons name={icon} size={17} color={iconColor ?? colors.primary} style={styles.leadingIcon} />
        ) : (
          <View style={styles.accentBar} />
        )}
        <View style={{ flex: 1 }}>
          <AppText variant="h2">{title}</AppText>
          {subtitle && (
            <AppText variant="body" color={colors.textSecondary} style={{ marginTop: 2 }}>
              {subtitle}
            </AppText>
          )}
        </View>
      </View>
      {onActionPress && (
        <AnimatedPressable onPress={onActionPress} style={styles.action}>
          <AppText variant="bodyMedium" color={colors.primary}>
            {actionLabel}
          </AppText>
          <Ionicons name={actionIcon} size={16} color={colors.primary} />
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
  titleRow: {
    flexDirection: 'row',
    flex: 1,
  },
  accentBar: {
    width: 4,
    borderRadius: 2,
    backgroundColor: colors.primary,
    marginRight: spacing.xs,
    alignSelf: 'stretch',
  },
  leadingIcon: {
    marginRight: spacing.xs,
    alignSelf: 'center',
  },
  action: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
