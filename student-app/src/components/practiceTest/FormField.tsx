import React from 'react';
import { TextInput, View, StyleSheet, TextInputProps } from 'react-native';
import { AppText } from '@components/ui';
import { colors, radius, spacing } from '@theme';

interface FormFieldProps extends TextInputProps {
  label?: string;
  hint?: string;
}

export function FormField({ label, hint, style, ...rest }: FormFieldProps) {
  return (
    <View style={{ marginBottom: spacing.md }}>
      {label && (
        <AppText variant="bodySemibold" style={{ marginBottom: 6 }}>
          {label}
        </AppText>
      )}
      <TextInput
        placeholderTextColor={colors.textTertiary}
        style={[styles.input, style]}
        {...rest}
      />
      {hint && (
        <AppText variant="tiny" color={colors.textTertiary} style={{ marginTop: 5 }}>
          {hint}
        </AppText>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  input: {
    height: 46,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    backgroundColor: colors.surfaceAlt,
    paddingHorizontal: spacing.md,
    fontSize: 14,
    color: colors.textPrimary,
    fontFamily: 'Inter_500Medium',
  },
});
