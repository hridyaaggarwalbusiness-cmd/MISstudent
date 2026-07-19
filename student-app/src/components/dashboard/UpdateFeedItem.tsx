import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card, AppText } from '@components/ui';
import { colors, spacing, radius } from '@theme';

export interface UpdateFeedItemData {
  key: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  iconBg: string;
  accentColor: string;
  cardBg: string;
  categoryLabel: string;
  categoryColor: string;
  title: string;
  badge?: { label: string; icon?: keyof typeof Ionicons.glyphMap; color: string; bg: string };
  subtitle: string;
  onPress?: () => void;
}

export function UpdateFeedItem({ item }: { item: UpdateFeedItemData }) {
  return (
    <Card
      onPress={item.onPress}
      elevation="none"
      bordered={false}
      style={[styles.card, { backgroundColor: item.cardBg, borderLeftColor: item.accentColor }]}
    >
      <View style={styles.row}>
        <View style={[styles.iconCircle, { backgroundColor: item.iconBg }]}>
          <Ionicons name={item.icon} size={17} color={item.iconColor} />
        </View>
        <View style={{ flex: 1, marginLeft: spacing.sm }}>
          <AppText variant="tiny" color={item.categoryColor} style={{ fontWeight: '700' }}>
            {item.categoryLabel}
          </AppText>
          <View style={styles.titleRow}>
            <AppText variant="bodySemibold" numberOfLines={1} style={styles.title}>
              {item.title}
            </AppText>
            {item.badge && (
              <View style={[styles.badge, { backgroundColor: item.badge.bg }]}>
                {item.badge.icon && <Ionicons name={item.badge.icon} size={10} color={item.badge.color} style={{ marginRight: 3 }} />}
                <AppText variant="tiny" color={item.badge.color} style={{ fontWeight: '700' }}>
                  {item.badge.label}
                </AppText>
              </View>
            )}
          </View>
          <AppText variant="caption" color={colors.textSecondary} style={styles.subtitle}>
            {item.subtitle}
          </AppText>
        </View>
        <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: spacing.sm,
    borderLeftWidth: 4,
  },
  row: { flexDirection: 'row', alignItems: 'center' },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 1,
  },
  title: { fontSize: 15, flexShrink: 1 },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: radius.pill,
  },
  subtitle: { marginTop: 2 },
});
