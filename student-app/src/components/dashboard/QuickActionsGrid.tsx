import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AnimatedPressable, AppText } from '@components/ui';
import { colors, radius, spacing } from '@theme';

export interface QuickAction {
  key: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  bg: string;
  fg: string;
  onPress: () => void;
}

export function QuickActionsRow({ actions }: { actions: QuickAction[] }) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
    >
      {actions.map((action) => (
        <AnimatedPressable key={action.key} onPress={action.onPress} style={styles.pill} scaleTo={0.95}>
          <View style={[styles.iconWrap, { backgroundColor: action.bg }]}>
            <Ionicons name={action.icon} size={15} color={action.fg} />
          </View>
          <AppText variant="bodyMedium" color={colors.textSecondary} style={{ marginLeft: 7 }}>
            {action.label}
          </AppText>
        </AnimatedPressable>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: {
    gap: spacing.xs,
    paddingRight: spacing.lg,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    borderRadius: radius.pill,
    paddingVertical: 6,
    paddingRight: 14,
    paddingLeft: 6,
  },
  iconWrap: {
    width: 28,
    height: 28,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
