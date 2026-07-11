import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { AppText } from './AppText';
import { colors, radius, spacing } from '@theme';

export type BadgeTone = 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'neutral';

interface BadgeProps {
  label: string;
  tone?: BadgeTone;
  style?: ViewStyle;
  dot?: boolean;
  size?: 'sm' | 'md';
}

const toneMap: Record<BadgeTone, { bg: string; fg: string }> = {
  primary: { bg: colors.primarySoft, fg: colors.primary },
  success: { bg: colors.successBg, fg: colors.successStrong },
  warning: { bg: colors.warningBg, fg: colors.warningStrong },
  danger: { bg: colors.dangerBg, fg: colors.dangerStrong },
  info: { bg: colors.infoBg, fg: colors.infoStrong },
  neutral: { bg: colors.surfaceAlt, fg: colors.textSecondary },
};

export function Badge({ label, tone = 'neutral', style, dot = false, size = 'md' }: BadgeProps) {
  const c = toneMap[tone];
  return (
    <View
      style={[
        styles.base,
        { backgroundColor: c.bg, paddingVertical: size === 'sm' ? 4 : 6 },
        style,
      ]}
    >
      {dot && <View style={[styles.dot, { backgroundColor: c.fg }]} />}
      <AppText variant={size === 'sm' ? 'tiny' : 'caption'} color={c.fg}>
        {label}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm,
    borderRadius: radius.pill,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 5,
  },
});
