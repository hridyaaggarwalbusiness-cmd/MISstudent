import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card, AppText } from '@components/ui';
import { colors, spacing, radius } from '@theme';

export interface UpdateFeedItemData {
  key: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  categoryLabel: string;
  categoryColor: string;
  title: string;
  meta: string;
  onPress?: () => void;
}

export function UpdateFeedItem({ item }: { item: UpdateFeedItemData }) {
  return (
    <Card onPress={item.onPress} elevation="xs" style={styles.card}>
      <View style={styles.row}>
        <View style={[styles.iconWrap, { backgroundColor: item.color }]}>
          <Ionicons name={item.icon} size={20} color="#fff" />
        </View>
        <View style={{ flex: 1, marginLeft: spacing.sm }}>
          <AppText variant="tiny" color={item.categoryColor} style={styles.categoryLabel}>
            {item.categoryLabel}
          </AppText>
          <AppText variant="bodySemibold" numberOfLines={1} style={styles.title}>
            {item.title}
          </AppText>
          <AppText variant="caption" color={colors.textSecondary} style={styles.meta}>
            {item.meta}
          </AppText>
        </View>
        <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: spacing.sm },
  row: { flexDirection: 'row', alignItems: 'center' },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryLabel: {
    fontWeight: '800',
    fontSize: 10.5,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  title: { fontSize: 15 },
  meta: { marginTop: 2 },
});
