import React from 'react';
import { View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '@components/ui';
import { colors, spacing, radius, shadows } from '@theme';
import { SchoolStatus } from '@utils/schoolStatus';

export function SchoolStatusBanner({ status }: { status: SchoolStatus }) {
  return (
    <LinearGradient
      colors={[colors.accentIndigo, colors.accentViolet]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.card}
    >
      <View style={styles.textCol}>
        <AppText variant="bodyMedium" color="rgba(255,255,255,0.85)">
          {status.headline}
        </AppText>
        {status.minutesLabel && (
          <AppText variant="displayLg" color="#fff" style={styles.minutes}>
            {status.minutesLabel}
          </AppText>
        )}
        <View style={[styles.sublabelRow, { marginTop: status.minutesLabel ? spacing.xs : 4 }]}>
          <Ionicons name={status.icon} size={15} color="rgba(255,255,255,0.92)" />
          <AppText variant="bodyMedium" color="rgba(255,255,255,0.92)" style={{ marginLeft: 5 }}>
            {status.sublabel}
          </AppText>
        </View>
      </View>
      <View style={styles.illustrationWrap}>
        <Ionicons name="school" size={40} color="#fff" />
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.xl,
    padding: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    overflow: 'hidden',
    minHeight: 130,
    ...shadows.md,
  },
  textCol: {
    flexShrink: 1,
    zIndex: 1,
  },
  minutes: {
    fontSize: 32,
    lineHeight: 38,
    marginTop: 2,
  },
  sublabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  illustrationWrap: {
    width: 68,
    height: 68,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: spacing.sm,
  },
});
