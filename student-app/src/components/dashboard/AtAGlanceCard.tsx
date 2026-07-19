import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText, AnimatedPressable } from '@components/ui';
import { colors, spacing, radius, shadows } from '@theme';

export interface GlanceStat {
  key: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  cardBg: string;
  tag: string;
  value: string;
  label: string;
}

export function AtAGlanceCard({ stats, onViewCalendar }: { stats: GlanceStat[]; onViewCalendar: () => void }) {
  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <View style={styles.headerTitleRow}>
          <Ionicons name="bar-chart" size={15} color={colors.secondary} />
          <AppText variant="bodySemibold" style={{ marginLeft: 6 }}>
            At a Glance
          </AppText>
        </View>
        <AnimatedPressable onPress={onViewCalendar} style={styles.action} haptic={false}>
          <AppText variant="caption" color={colors.primary} style={{ fontWeight: '700' }}>
            View calendar
          </AppText>
          <Ionicons name="chevron-forward" size={14} color={colors.primary} />
        </AnimatedPressable>
      </View>

      <View style={styles.grid}>
        {stats.map((s) => (
          <View key={s.key} style={[styles.miniCard, { backgroundColor: s.cardBg }]}>
            <View style={styles.miniHeaderRow}>
              <Ionicons name={s.icon} size={16} color={s.iconColor} />
              <AppText variant="tiny" color={colors.textSecondary} style={{ fontWeight: '700' }}>
                {s.tag}
              </AppText>
            </View>
            <AppText variant="h2" style={{ marginTop: spacing.sm }}>
              {s.value}
            </AppText>
            <AppText variant="tiny" color={colors.textSecondary}>
              {s.label}
            </AppText>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.xl,
    padding: spacing.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    ...shadows.xs,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitleRow: { flexDirection: 'row', alignItems: 'center' },
  action: { flexDirection: 'row', alignItems: 'center' },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  miniCard: {
    flexBasis: '47%',
    flexGrow: 1,
    borderRadius: radius.lg,
    padding: spacing.sm,
  },
  miniHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
});
