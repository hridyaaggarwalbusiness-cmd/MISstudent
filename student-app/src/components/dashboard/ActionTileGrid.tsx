import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AnimatedPressable, AppText } from '@components/ui';
import { radius, spacing, shadows } from '@theme';

export interface ActionTile {
  key: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  textColor: string;
  onPress: () => void;
}

export function ActionTileGrid({ tiles }: { tiles: ActionTile[] }) {
  return (
    <View style={styles.grid}>
      {tiles.map((tile) => (
        <AnimatedPressable
          key={tile.key}
          onPress={tile.onPress}
          style={[styles.tile, { backgroundColor: tile.color }, shadows.sm]}
          scaleTo={0.96}
        >
          <Ionicons name={tile.icon} size={22} color={tile.textColor} />
          <AppText variant="bodySemibold" color={tile.textColor} style={{ marginTop: 8 }} numberOfLines={1}>
            {tile.label}
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
  tile: {
    flexBasis: '47%',
    flexGrow: 1,
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
  },
});
