import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AnimatedPressable, AppText } from '@components/ui';
import { spacing, radius, shadows } from '@theme';

const CARD_BG = '#5B3DE0';

export function AIPracticeTestBanner({ onPress }: { onPress: () => void }) {
  return (
    <AnimatedPressable onPress={onPress} scaleTo={0.98} style={styles.card}>
      <View style={styles.iconWrap}>
        <Ionicons name="sparkles" size={18} color="#fff" />
      </View>
      <View style={{ flex: 1, marginLeft: spacing.md }}>
        <AppText variant="bodySemibold" color="#fff">
          AI Practice Test
        </AppText>
        <AppText variant="caption" color="rgba(255,255,255,0.8)" style={{ marginTop: 2 }}>
          Generate CBSE-style practice papers for any topic
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
    ...shadows.md,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrowBtn: {
    width: 38,
    height: 38,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255,255,255,0.22)',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: spacing.sm,
  },
});
