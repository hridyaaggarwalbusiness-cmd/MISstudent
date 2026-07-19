import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AnimatedPressable, AppText } from '@components/ui';
import { spacing, radius, shadows } from '@theme';

const CARD_BG = '#F1ECFC';
const ACCENT = '#7C5CE0';

export function AIPracticeTestBanner({ onPress }: { onPress: () => void }) {
  return (
    <AnimatedPressable onPress={onPress} scaleTo={0.98} style={styles.card}>
      <View style={{ flex: 1 }}>
        <View style={styles.titleRow}>
          <Ionicons name="sparkles" size={15} color={ACCENT} />
          <AppText variant="bodySemibold" style={{ marginLeft: 6 }}>
            AI Practice Test
          </AppText>
        </View>
        <AppText variant="caption" color="#6B6B80" style={{ marginTop: 3 }}>
          Generate CBSE-style practice papers for any topic.
        </AppText>
      </View>
      <View style={styles.arrowBtn}>
        <Ionicons name="arrow-forward" size={18} color="#fff" />
      </View>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radius.xl,
    padding: spacing.md,
    backgroundColor: CARD_BG,
    ...shadows.sm,
  },
  titleRow: { flexDirection: 'row', alignItems: 'center' },
  arrowBtn: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    backgroundColor: ACCENT,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: spacing.sm,
  },
});
