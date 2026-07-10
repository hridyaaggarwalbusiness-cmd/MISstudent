import React from 'react';
import { Text, TextProps, TextStyle } from 'react-native';
import { colors, typography } from '@theme';

type Variant = keyof typeof typography;

export interface AppTextProps extends TextProps {
  variant?: Variant;
  color?: string;
  align?: TextStyle['textAlign'];
  children: React.ReactNode;
}

export function AppText({
  variant = 'body',
  color = colors.textPrimary,
  align,
  style,
  children,
  ...rest
}: AppTextProps) {
  return (
    <Text
      style={[typography[variant], { color, textAlign: align }, style]}
      {...rest}
    >
      {children}
    </Text>
  );
}
