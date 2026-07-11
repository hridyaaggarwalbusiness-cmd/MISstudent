import React from 'react';
import { View, ViewProps, ViewStyle, StyleProp, StyleSheet } from 'react-native';
import { colors, radius, spacing, shadows } from '@theme';
import { AnimatedPressable } from './AnimatedPressable';

interface CardProps extends ViewProps {
  onPress?: () => void;
  padded?: boolean;
  elevation?: 'none' | 'xs' | 'sm' | 'md' | 'lg';
  style?: StyleProp<ViewStyle>;
  bordered?: boolean;
  children: React.ReactNode;
}

export function Card({
  onPress,
  padded = true,
  elevation = 'sm',
  bordered = true,
  style,
  children,
  ...rest
}: CardProps) {
  const cardStyle = [
    styles.base,
    padded && styles.padded,
    bordered && styles.border,
    shadows[elevation],
    style,
  ];

  if (onPress) {
    return (
      <AnimatedPressable onPress={onPress} style={cardStyle} scaleTo={0.98}>
        {children}
      </AnimatedPressable>
    );
  }

  return (
    <View style={cardStyle} {...rest}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
  },
  padded: {
    padding: spacing.md,
  },
  border: {
    borderWidth: 1,
    borderColor: colors.borderSoft,
  },
});
