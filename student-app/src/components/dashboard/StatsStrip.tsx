import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText, AnimatedPressable } from '@components/ui';
import { colors, radius, spacing, shadows } from '@theme';

export interface StatItem {
  key: string;
  icon: keyof typeof Ionicons.glyphMap;
  value: string;
  label: string;
  tint: string;
  tintBg: string;
  onPress?: () => void;
}

export function StatsStrip({ items }: { items: StatItem[] }) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
    >
      {items.map((item) => (
        <AnimatedPressable
          key={item.key}
          onPress={item.onPress}
          disabled={!item.onPress}
          style={[styles.card, shadows.sm]}
          scaleTo={0.97}
        >
          <View style={[styles.iconWrap, { backgroundColor: item.tintBg }]}>
            <Ionicons name={item.icon} size={16} color={item.tint} />
          </View>
          <AppText variant="h2" style={{ marginTop: spacing.sm, fontSize: 20 }}>
            {item.value}
          </AppText>
          <AppText variant="tiny" color={colors.textTertiary} numberOfLines={1} style={{ marginTop: 1 }}>
            {item.label}
          </AppText>
        </AnimatedPressable>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: {
    gap: spacing.sm,
    paddingRight: spacing.lg,
  },
  card: {
    width: 108,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    padding: spacing.sm,
  },
  iconWrap: {
    width: 30,
    height: 30,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
