import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AnimatedPressable, AppText } from '@components/ui';
import { colors, spacing, radius } from '@theme';

export interface QuickAccessItem {
  key: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  bg: string;
  onPress: () => void;
}

export function QuickAccessGrid({ items }: { items: QuickAccessItem[] }) {
  return (
    <View style={styles.grid}>
      {items.map((item) => (
        <AnimatedPressable key={item.key} onPress={item.onPress} style={styles.item} scaleTo={0.96}>
          <View style={[styles.iconWrap, { backgroundColor: item.bg }]}>
            <Ionicons name={item.icon} size={20} color={item.color} />
          </View>
          <AppText
            variant="tiny"
            numberOfLines={2}
            style={{ fontWeight: '700', marginTop: spacing.xs, textAlign: 'center' }}
          >
            {item.label}
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
    gap: spacing.sm,
  },
  item: {
    flexBasis: '30%',
    flexGrow: 1,
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xs,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
