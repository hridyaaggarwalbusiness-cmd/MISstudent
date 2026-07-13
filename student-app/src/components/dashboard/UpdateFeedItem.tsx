import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card, AppText } from '@components/ui';
import { colors, spacing, radius } from '@theme';

export interface UpdateFeedItemData {
  key: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  category: string;
  title: string;
  subtitle?: string;
  meta: string;
  badge?: string;
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
          <View style={styles.topRow}>
            <AppText variant="overline" color={item.color}>
              {item.category}
            </AppText>
            {item.badge && (
              <View style={[styles.badge, { backgroundColor: `${item.color}1F` }]}>
                <AppText variant="tiny" color={item.color} style={{ fontWeight: '700' }}>
                  {item.badge}
                </AppText>
              </View>
            )}
          </View>
          <AppText variant="bodySemibold" numberOfLines={2} style={styles.title}>
            {item.title}
          </AppText>
          {item.subtitle && (
            <AppText variant="caption" color={colors.textSecondary} numberOfLines={1} style={styles.subtitle}>
              {item.subtitle}
            </AppText>
          )}
          <AppText variant="tiny" color={colors.textTertiary} style={styles.meta}>
            {item.meta}
          </AppText>
        </View>
        {!item.badge && <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: spacing.sm },
  row: { flexDirection: 'row', alignItems: 'flex-start' },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.pill,
  },
  title: { marginTop: 3, fontSize: 15 },
  subtitle: { marginTop: 2 },
  meta: { marginTop: 5 },
});
