import React from 'react';
import {
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  StyleProp,
} from 'react-native';
import { AnimatedPressable } from './AnimatedPressable';
import { AppText } from './AppText';
import { colors, radius, shadows } from '@theme';
import { Ionicons } from '@expo/vector-icons';

type Variant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps {
  label: string;
  onPress?: () => void;
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  disabled?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
  style?: StyleProp<ViewStyle>;
}

const sizeMap: Record<Size, { height: number; fontSize: number; paddingH: number; iconSize: number }> = {
  sm: { height: 36, fontSize: 13.5, paddingH: 14, iconSize: 15 },
  md: { height: 48, fontSize: 15, paddingH: 20, iconSize: 17 },
  lg: { height: 54, fontSize: 16, paddingH: 24, iconSize: 19 },
};

export function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon,
  iconPosition = 'left',
  fullWidth = false,
  style,
}: ButtonProps) {
  const dims = sizeMap[size];
  const isDisabled = disabled || loading;
  const textColor = textColorFor(variant);

  return (
    <AnimatedPressable
      onPress={isDisabled ? undefined : onPress}
      disabled={isDisabled}
      style={[
        styles.base,
        {
          height: dims.height,
          paddingHorizontal: dims.paddingH,
          width: fullWidth ? '100%' : undefined,
          opacity: isDisabled ? 0.5 : 1,
        },
        variant === 'primary' && [styles.primary, shadows.sm],
        variant === 'secondary' && styles.secondary,
        variant === 'outline' && styles.outline,
        variant === 'ghost' && styles.ghost,
        variant === 'danger' && [styles.danger, shadows.sm],
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={textColor} />
      ) : (
        <>
          {icon && iconPosition === 'left' && (
            <Ionicons name={icon} size={dims.iconSize} color={textColor} style={{ marginRight: 7 }} />
          )}
          <AppText variant="bodySemibold" color={textColor} style={{ fontSize: dims.fontSize }}>
            {label}
          </AppText>
          {icon && iconPosition === 'right' && (
            <Ionicons name={icon} size={dims.iconSize} color={textColor} style={{ marginLeft: 7 }} />
          )}
        </>
      )}
    </AnimatedPressable>
  );
}

function textColorFor(variant: Variant) {
  if (variant === 'primary' || variant === 'danger') return colors.textInverse;
  if (variant === 'secondary') return colors.primary;
  return colors.textPrimary;
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.sm,
  },
  primary: {
    backgroundColor: colors.primary,
  },
  secondary: {
    backgroundColor: colors.primarySoft,
  },
  outline: {
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.borderStrong,
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  danger: {
    backgroundColor: colors.danger,
  },
});
