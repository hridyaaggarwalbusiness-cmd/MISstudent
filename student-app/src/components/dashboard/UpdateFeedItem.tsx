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
  subtitle?: string;
  badge?: { label: string; color: string; bg: string };
  timestamp: string;
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
          <View style={styles.titleRow}>
            <AppText variant="bodySemibold" numberOfLines={1} style={styles.title}>
              {item.title}
            </AppText>
            {item.badge && (
              <View style={[styles.badge, { backgroundColor: item.badge.bg }]}>
                <AppText variant="tiny" color={item.badge.color} style={{ fontWeight: '700' }}>
                  {item.badge.label}
                </AppText>
              </View>
            )}
          </View>
          {item.subtitle && (
            <AppText variant="caption" color={colors.textSecondary} style={styles.subtitle}>
              {item.subtitle}
            </AppText>
          )}
        </View>
        <View style={styles.right}>
          <AppText variant="tiny" color={colors.textTertiary}>
            {item.timestamp}
          </AppText>
          <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} style={{ marginTop: 6 }} />
        </View>
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
  categoryLabel: {
    fontWeight: '800',
    fontSize: 10.5,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  title: { fontSize: 15, flexShrink: 1 },
  badge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: radius.pill,
  },
  subtitle: { marginTop: 2 },
  right: {
    alignItems: 'flex-end',
    marginLeft: spacing.xs,
  },
});
