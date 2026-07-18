import React from 'react';
import { View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { AnimatedPressable, AppText } from '@components/ui';
import { colors, spacing, radius } from '@theme';

export function AIPracticeTestBanner({ onPress }: { onPress: () => void }) {
  return (
    <AnimatedPressable onPress={onPress} scaleTo={0.98}>
      <LinearGradient
        colors={[colors.secondary, colors.accentIndigo]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.card}
      >
        <View style={styles.iconWrap}>
          <Ionicons name="sparkles" size={24} color="#fff" />
        </View>
        <View style={{ flex: 1, marginLeft: spacing.md }}>
          <View style={styles.titleRow}>
            <AppText variant="bodySemibold" color="#fff">
              AI Practice Test Generator
            </AppText>
            <View style={styles.premiumBadge}>
              <AppText variant="tiny" color="#fff" style={{ fontWeight: '700' }}>
                PREMIUM
              </AppText>
            </View>
          </View>
          <AppText variant="tiny" color="rgba(255,255,255,0.85)" style={{ marginTop: 3 }}>
            Instant CBSE-style question papers on any chapter
          </AppText>
        </View>
        <Ionicons name="chevron-forward" size={18} color="rgba(255,255,255,0.85)" />
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
  },
  iconWrap: {
    width: 46,
    height: 46,
    borderRadius: radius.md,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' },
  premiumBadge: {
    marginLeft: 8,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255,255,255,0.22)',
  },
});
