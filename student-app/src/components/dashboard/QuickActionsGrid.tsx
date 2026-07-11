import React from 'react';
import { View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { AnimatedPressable, AppText } from '@components/ui';
import { colors, radius, spacing, shadows } from '@theme';

export interface QuickAction {
  key: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  gradient: readonly [string, string, ...string[]];
  onPress: () => void;
}

export function QuickActionsGrid({ actions }: { actions: QuickAction[] }) {
  return (
    <View style={styles.grid}>
      {actions.map((action) => (
        <AnimatedPressable key={action.key} onPress={action.onPress} style={styles.item} scaleTo={0.94}>
          <LinearGradient
            colors={action.gradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.iconWrap, shadows.colored(action.gradient[0])]}
          >
            <Ionicons name={action.icon} size={22} color={colors.textInverse} />
          </LinearGradient>
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
    width: 54,
    height: 54,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
