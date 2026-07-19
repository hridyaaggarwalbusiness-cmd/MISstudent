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
  onPress: () => void;
}

export function QuickAccessGrid({ items }: { items: QuickAccessItem[] }) {
  return (
    <View style={styles.grid}>
      {items.map((item) => (
        <AnimatedPressable key={item.key} onPress={item.onPress} style={styles.item} scaleTo={0.96}>
          <View style={[styles.iconWrap, { backgroundColor: item.color }]}>
            <Ionicons name={item.icon} size={26} color="#fff" />
          </View>
          <AppText
            variant="bodyMedium"
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.8}
            style={{ fontWeight: '700', marginTop: spacing.sm }}
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
    flexBasis: '47%',
    flexGrow: 1,
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    borderRadius: radius.lg,
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.xs,
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
