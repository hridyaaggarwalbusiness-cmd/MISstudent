import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '@components/ui';
import { spacing, radius } from '@theme';
import { SchoolIllustration } from './SchoolIllustration';

export interface SnapshotStat {
  key: string;
  icon: keyof typeof Ionicons.glyphMap;
  value: string;
  label: string;
  iconBg: string;
  iconColor: string;
}

const CARD_BG = '#F1ECFC';
const ACCENT = '#7C5CE0';

export function TodaysOverviewCard({ stats }: { stats: SnapshotStat[] }) {
  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <Ionicons name="sparkles" size={14} color={ACCENT} />
        <AppText variant="bodySemibold" color={ACCENT} style={{ marginLeft: 6 }}>
          Today's Snapshot
        </AppText>
      </View>

      <View style={styles.statsRow}>
        {stats.map((s) => (
          <View key={s.key} style={styles.statItem}>
            <View style={[styles.statIcon, { backgroundColor: s.iconBg }]}>
              <Ionicons name={s.icon} size={18} color={s.iconColor} />
            </View>
            <AppText variant="h3" style={{ marginTop: spacing.sm }}>
              {s.value}
            </AppText>
            <AppText variant="tiny" color="#6B6B80">
              {s.label}
            </AppText>
          </View>
        ))}
      </View>

      <View style={styles.illustrationWrap} pointerEvents="none">
        <SchoolIllustration width={130} height={100} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.xl,
    padding: spacing.lg,
    backgroundColor: CARD_BG,
    minHeight: 172,
    overflow: 'hidden',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    marginTop: spacing.lg,
    maxWidth: '62%',
    gap: spacing.md,
  },
  statItem: {
    alignItems: 'flex-start',
  },
  statIcon: {
    width: 38,
    height: 38,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  illustrationWrap: {
    position: 'absolute',
    right: 4,
    bottom: 0,
  },
});
