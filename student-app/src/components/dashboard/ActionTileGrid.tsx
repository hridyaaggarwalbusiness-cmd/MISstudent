import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AnimatedPressable, AppText } from '@components/ui';
import { radius, spacing } from '@theme';

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
          style={[styles.tile, { backgroundColor: tile.color }]}
          scaleTo={0.97}
        >
          <View style={[styles.iconWrap, { backgroundColor: 'rgba(255,255,255,0.18)' }]}>
            <Ionicons name={tile.icon} size={17} color={tile.textColor} />
          </View>
          <AppText variant="bodyMedium" color={tile.textColor} style={{ marginTop: spacing.sm }} numberOfLines={1}>
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
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
