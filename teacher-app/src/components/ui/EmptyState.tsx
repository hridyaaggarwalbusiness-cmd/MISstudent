import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from './AppText';
import { Button } from './Button';
import { colors, spacing, radius } from '@theme';

interface EmptyStateProps {
  icon?: keyof typeof Ionicons.glyphMap;
  title: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
  style?: ViewStyle;
  compact?: boolean;
}

export function EmptyState({
  icon = 'file-tray-outline',
  title,
  message,
  actionLabel,
  onAction,
  style,
  compact = false,
}: EmptyStateProps) {
  return (
    <View style={[styles.container, compact && styles.compact, style]}>
      <View style={styles.iconWrap}>
        <Ionicons name={icon} size={34} color={colors.primary} />
      </View>
      <AppText variant="h3" align="center" style={{ marginTop: spacing.md }}>
        {title}
      </AppText>
      {message && (
        <AppText
          variant="body"
          color={colors.textSecondary}
          align="center"
          style={{ marginTop: 6, maxWidth: 280 }}
        >
          {message}
        </AppText>
      )}
      {actionLabel && onAction && (
        <Button label={actionLabel} onPress={onAction} size="sm" style={{ marginTop: spacing.lg }} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxxl,
    paddingHorizontal: spacing.lg,
  },
  compact: {
    paddingVertical: spacing.lg,
  },
  iconWrap: {
    width: 72,
    height: 72,
    borderRadius: radius.lg,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
