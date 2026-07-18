import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AnimatedPressable, AppText } from '@components/ui';
import { colors, radius, spacing } from '@theme';

interface OptionCardProps {
  title: string;
  description?: string;
  selected: boolean;
  onPress: () => void;
}

export function OptionCard({ title, description, selected, onPress }: OptionCardProps) {
  return (
    <AnimatedPressable
      onPress={onPress}
      scaleTo={0.98}
      style={[styles.card, selected && styles.cardSelected]}
    >
      <View style={{ flex: 1 }}>
        <AppText variant="bodySemibold" color={selected ? colors.primary : colors.textPrimary}>
          {title}
        </AppText>
        {description && (
          <AppText variant="tiny" color={colors.textTertiary} style={{ marginTop: 2 }}>
            {description}
          </AppText>
        )}
      </View>
      <View style={[styles.radio, selected && styles.radioSelected]}>
        {selected && <Ionicons name="checkmark" size={13} color={colors.textInverse} />}
      </View>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.borderSoft,
    backgroundColor: colors.surface,
    marginBottom: spacing.xs,
  },
  cardSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
  },
  radio: {
    width: 24,
    height: 24,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    borderColor: colors.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: spacing.sm,
  },
  radioSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
});
