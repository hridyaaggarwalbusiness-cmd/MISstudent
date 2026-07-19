import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AnimatedPressable, AppText } from '@components/ui';
import { spacing, radius } from '@theme';

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
        <AnimatedPressable key={item.key} onPress={item.onPress} style={styles.item} scaleTo={0.94}>
          <View style={[styles.iconWrap, { backgroundColor: item.bg }]}>
            <Ionicons name={item.icon} size={18} color={item.color} />
          </View>
          <AppText
            variant="tiny"
            numberOfLines={2}
            style={{ fontWeight: '700', marginTop: 6, textAlign: 'center', fontSize: 10 }}
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
    rowGap: spacing.md,
  },
  item: {
    flexBasis: '25%',
    alignItems: 'center',
    paddingHorizontal: 2,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
