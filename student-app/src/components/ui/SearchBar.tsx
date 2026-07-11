import React from 'react';
import { View, TextInput, StyleSheet, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing } from '@theme';
import { AnimatedPressable } from './AnimatedPressable';

interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  onFilterPress?: () => void;
  style?: ViewStyle;
}

export function SearchBar({
  value,
  onChangeText,
  placeholder = 'Search',
  onFilterPress,
  style,
}: SearchBarProps) {
  return (
    <View style={[styles.container, style]}>
      <Ionicons name="search" size={18} color={colors.textTertiary} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textTertiary}
        style={styles.input}
        returnKeyType="search"
      />
      {value.length > 0 && (
        <AnimatedPressable onPress={() => onChangeText('')} haptic={false}>
          <Ionicons name="close-circle" size={18} color={colors.textTertiary} />
        </AnimatedPressable>
      )}
      {onFilterPress && (
        <AnimatedPressable onPress={onFilterPress} style={styles.filterBtn}>
          <Ionicons name="options-outline" size={18} color={colors.primary} />
        </AnimatedPressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    height: 44,
  },
  input: {
    flex: 1,
    marginLeft: spacing.xs,
    fontSize: 14,
    color: colors.textPrimary,
    fontFamily: 'Inter_400Regular',
  },
  filterBtn: {
    marginLeft: spacing.xs,
    paddingLeft: spacing.xs,
    borderLeftWidth: 1,
    borderLeftColor: colors.borderSoft,
  },
});
