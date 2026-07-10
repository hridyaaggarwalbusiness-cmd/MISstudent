import React from 'react';
import {
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  StyleProp,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { AnimatedPressable } from './AnimatedPressable';
import { AppText } from './AppText';
import { colors, radius, gradients } from '@theme';
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
  sm: { height: 36, fontSize: 13, paddingH: 14, iconSize: 16 },
  md: { height: 48, fontSize: 15, paddingH: 20, iconSize: 18 },
  lg: { height: 56, fontSize: 16, paddingH: 24, iconSize: 20 },
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

  const content = (
    <>
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'outline' || variant === 'ghost' ? colors.primary : colors.textInverse}
        />
      ) : (
        <>
          {icon && iconPosition === 'left' && (
            <Ionicons
              name={icon}
              size={dims.iconSize}
              color={textColorFor(variant)}
              style={{ marginRight: 8 }}
            />
          )}
          <AppText
            variant={size === 'sm' ? 'bodySemibold' : 'bodySemibold'}
            color={textColorFor(variant)}
            style={{ fontSize: dims.fontSize }}
          >
            {label}
          </AppText>
          {icon && iconPosition === 'right' && (
            <Ionicons
              name={icon}
              size={dims.iconSize}
              color={textColorFor(variant)}
              style={{ marginLeft: 8 }}
            />
          )}
        </>
      )}
    </>
  );

  const baseStyle: StyleProp<ViewStyle> = [
    styles.base,
    {
      height: dims.height,
      paddingHorizontal: dims.paddingH,
      width: fullWidth ? '100%' : undefined,
      opacity: isDisabled ? 0.55 : 1,
    },
    variant === 'secondary' && styles.secondary,
    variant === 'outline' && styles.outline,
    variant === 'ghost' && styles.ghost,
    variant === 'danger' && styles.danger,
    style,
  ];

  if (variant === 'primary') {
    return (
      <AnimatedPressable
        onPress={isDisabled ? undefined : onPress}
        disabled={isDisabled}
        style={[{ width: fullWidth ? '100%' : undefined }, style]}
      >
        <LinearGradient
          colors={gradients.primary}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[
            styles.base,
            {
              height: dims.height,
              paddingHorizontal: dims.paddingH,
              opacity: isDisabled ? 0.6 : 1,
            },
          ]}
        >
          {content}
        </LinearGradient>
      </AnimatedPressable>
    );
  }

  return (
    <AnimatedPressable onPress={isDisabled ? undefined : onPress} disabled={isDisabled} style={baseStyle}>
      {content}
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
    borderRadius: radius.md,
  },
  secondary: {
    backgroundColor: colors.primarySoft,
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  danger: {
    backgroundColor: colors.danger,
  },
});
