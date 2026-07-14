import React from 'react';
import { View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { AppText, ProgressRing } from '@components/ui';
import { colors, spacing, radius } from '@theme';

interface OverviewStat {
  key: string;
  icon: keyof typeof Ionicons.glyphMap;
  value: number;
  label: string;
}

export function TodaysOverviewCard({ stats, attendancePct }: { stats: OverviewStat[]; attendancePct: number }) {
  return (
    <LinearGradient
      colors={[colors.accentIndigo, colors.accentViolet]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.card}
    >
      <AppText variant="caption" color="rgba(255,255,255,0.85)">
        Today's Overview
      </AppText>
      <View style={styles.row}>
        <View style={styles.statsCol}>
          {stats.map((s) => (
            <View key={s.key} style={styles.statBox}>
              <Ionicons name={s.icon} size={16} color="#fff" />
              <AppText variant="h3" color="#fff" style={{ marginTop: 6 }}>
                {s.value}
              </AppText>
              <AppText variant="tiny" color="rgba(255,255,255,0.85)">
                {s.label}
              </AppText>
            </View>
          ))}
        </View>
        <ProgressRing
          value={attendancePct}
          size={78}
          strokeWidth={7}
          colorOverride="#fff"
          centerContent={
            <View style={{ alignItems: 'center' }}>
              <AppText variant="bodySemibold" color="#fff">
                {Math.round(attendancePct)}%
              </AppText>
              <AppText variant="tiny" color="rgba(255,255,255,0.85)">
                Attendance
              </AppText>
            </View>
          }
        />
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.xl,
    padding: spacing.lg,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.md,
  },
  statsCol: {
    flexDirection: 'row',
    flex: 1,
  },
  statBox: {
    width: 64,
    alignItems: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    marginRight: spacing.sm,
  },
});
