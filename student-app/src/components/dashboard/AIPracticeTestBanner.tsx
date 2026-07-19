import React from 'react';
import { View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { AnimatedPressable, AppText } from '@components/ui';
import { spacing, radius, shadows } from '@theme';

export function AIPracticeTestBanner({ onPress }: { onPress: () => void }) {
  return (
    <AnimatedPressable onPress={onPress} scaleTo={0.98}>
      <LinearGradient colors={['#8B6FEA', '#4F2FCB']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.card}>
        <View style={styles.iconWrap}>
          <Ionicons name="sparkles" size={18} color="#fff" />
        </View>
        <View style={{ flex: 1, marginLeft: spacing.md }}>
          <View style={styles.titleRow}>
            <AppText variant="bodySemibold" color="#fff">
              AI Practice Test
            </AppText>
            <View style={styles.premiumBadge}>
              <AppText variant="tiny" color="#fff" style={{ fontWeight: '700', fontSize: 9 }}>
                PREMIUM
              </AppText>
            </View>
          </View>
          <AppText variant="caption" color="rgba(255,255,255,0.8)" style={{ marginTop: 2 }}>
            Generate CBSE-style practice papers for any topic
          </AppText>
        </View>
        <View style={styles.arrowBtn}>
          <Ionicons name="arrow-forward" size={18} color="#fff" />
        </View>
      </LinearGradient>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radius.xl,
    padding: spacing.md,
    ...shadows.md,
  },
  titleRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' },
  premiumBadge: {
    marginLeft: 8,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255,255,255,0.22)',
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
