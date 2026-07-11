import React from 'react';
import { View, StyleSheet } from 'react-native';
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

export function QuickActionsGrid({ actions }: { actions: QuickAction[] }) {
  return (
    <View style={styles.grid}>
      {actions.map((action) => (
        <AnimatedPressable key={action.key} onPress={action.onPress} style={styles.item} scaleTo={0.94}>
          <View style={[styles.iconWrap, { backgroundColor: action.bg }]}>
            <Ionicons name={action.icon} size={21} color={action.fg} />
          </View>
          <AppText
            variant="tiny"
            color={colors.textSecondary}
            align="center"
            style={{ marginTop: 7, fontSize: 11.5 }}
            numberOfLines={1}
          >
            {action.label}
          </AppText>
        </AnimatedPressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  item: {
    width: '25%',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  iconWrap: {
    width: 52,
    height: 52,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
