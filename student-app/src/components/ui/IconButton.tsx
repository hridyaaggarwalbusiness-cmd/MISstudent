import React from 'react';
import { StyleSheet, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AnimatedPressable } from './AnimatedPressable';
import { colors } from '@theme';
import { View } from 'react-native';

interface IconButtonProps {
  icon: keyof typeof Ionicons.glyphMap;
  onPress?: () => void;
  size?: number;
  color?: string;
  backgroundColor?: string;
  style?: ViewStyle;
  badge?: boolean;
}

export function IconButton({
  icon,
  onPress,
  size = 40,
  color = colors.textPrimary,
  backgroundColor = colors.surfaceAlt,
  style,
  badge = false,
}: IconButtonProps) {
  return (
    <AnimatedPressable
      onPress={onPress}
      style={[
        styles.base,
        { width: size, height: size, borderRadius: size / 2, backgroundColor, borderColor: colors.borderSoft },
        style,
      ]}
    >
      <Ionicons name={icon} size={size * 0.48} color={color} />
      {badge && <View style={styles.badgeDot} />}
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  badgeDot: {
    position: 'absolute',
    top: 8,
    right: 9,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.danger,
    borderWidth: 1.5,
    borderColor: colors.surface,
  },
});
