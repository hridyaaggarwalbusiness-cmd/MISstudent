import React from 'react';
import { View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
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
        <AppText
          variant="bodyMedium"
          color="rgba(255,255,255,0.92)"
          style={{ marginTop: status.minutesLabel ? spacing.xs : 4 }}
        >
          {status.sublabel}
        </AppText>
      </View>
      <AppText style={styles.illustration}>🏫</AppText>
      <AppText style={styles.cloud}>☁️</AppText>
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
  illustration: {
    fontSize: 64,
    marginLeft: spacing.sm,
  },
  cloud: {
    position: 'absolute',
    top: 14,
    right: 90,
    fontSize: 18,
    opacity: 0.8,
  },
});
