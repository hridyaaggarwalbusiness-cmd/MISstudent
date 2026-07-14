import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card, AppText } from '@components/ui';
import { colors, spacing, radius } from '@theme';

export interface UpdateFeedItemData {
  key: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
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
          <AppText variant="bodySemibold" numberOfLines={2} style={styles.title}>
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
  title: { fontSize: 15 },
  meta: { marginTop: 3 },
});
