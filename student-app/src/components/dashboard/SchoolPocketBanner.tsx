import React from 'react';
import { View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Polygon, Circle, Line, Rect } from 'react-native-svg';
import { AppText, AnimatedPressable } from '@components/ui';
import { spacing, radius } from '@theme';

function GraduationCap() {
  return (
    <Svg width={64} height={50} viewBox="0 0 70 55">
      <Polygon points="35,2 68,18 35,34 2,18" fill="#241C4D" />
      <Rect x="30" y="18" width="10" height="14" rx="2" fill="#241C4D" />
      <Circle cx="35" cy="18" r="3" fill="#FBBF24" />
      <Line x1="35" y1="18" x2="48" y2="34" stroke="#FBBF24" strokeWidth={2} />
      <Circle cx="48" cy="36" r="3" fill="#FBBF24" />
    </Svg>
  );
}

const PHONE_ICONS: { icon: keyof typeof Ionicons.glyphMap; bg: string }[] = [
  { icon: 'book', bg: '#8B5CF6' },
  { icon: 'megaphone', bg: '#F2711F' },
  { icon: 'calendar', bg: '#E5487A' },
  { icon: 'bar-chart', bg: '#22A55E' },
];

function PhoneMockup() {
  return (
    <View style={styles.phone}>
      <View style={styles.phoneScreen}>
        <View style={styles.phoneRow}>
          {PHONE_ICONS.slice(0, 2).map((p) => (
            <View key={p.icon} style={[styles.phoneIcon, { backgroundColor: p.bg }]}>
              <Ionicons name={p.icon} size={13} color="#fff" />
            </View>
          ))}
        </View>
        <View style={styles.phoneRow}>
          {PHONE_ICONS.slice(2, 4).map((p) => (
            <View key={p.icon} style={[styles.phoneIcon, { backgroundColor: p.bg }]}>
              <Ionicons name={p.icon} size={13} color="#fff" />
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

export function SchoolPocketBanner({ onExplore, activeDot = 0 }: { onExplore: () => void; activeDot?: number }) {
  return (
    <View>
      <View style={styles.cardClip}>
      <LinearGradient colors={['#8B6FEA', '#4F2FCB']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.card}>
        <View style={styles.illustrationWrap} pointerEvents="none">
          <View style={styles.capWrap}>
            <GraduationCap />
          </View>
          <Ionicons name="paper-plane-outline" size={20} color="rgba(255,255,255,0.55)" style={styles.plane} />
          <View style={styles.phoneWrap}>
            <PhoneMockup />
          </View>
          <View style={[styles.sparkleDot, { top: 10, left: 90, width: 6, height: 6 }]} />
          <View style={[styles.sparkleDot, { top: 70, left: 40, width: 4, height: 4 }]} />
          <View style={[styles.sparkleDot, { top: 100, right: 90, width: 5, height: 5 }]} />
        </View>

        <View style={styles.badge}>
          <Ionicons name="sparkles" size={11} color="#fff" />
          <AppText variant="tiny" color="#fff" style={{ marginLeft: 4, fontWeight: '700' }}>
            Everything You Need
          </AppText>
        </View>

        <AppText style={styles.heroTitle}>Your School,</AppText>
        <View style={{ flexDirection: 'row' }}>
          <AppText style={styles.heroTitle}>Now in </AppText>
          <AppText style={[styles.heroTitle, { color: '#E4D9FF' }]}>Your Pocket</AppText>
        </View>

        <AppText variant="caption" color="rgba(255,255,255,0.78)" style={{ marginTop: spacing.xs, maxWidth: '65%' }}>
          Homework · Notices · Timetable · Results
        </AppText>

        <AnimatedPressable onPress={onExplore} style={styles.exploreBtn}>
          <AppText variant="bodySemibold" color="#4F2FCB">
            Explore
          </AppText>
          <Ionicons name="arrow-forward" size={16} color="#4F2FCB" style={{ marginLeft: 6 }} />
        </AnimatedPressable>
      </LinearGradient>
      </View>

      <View style={styles.dotsRow}>
        {[0, 1, 2].map((i) => (
          <View key={i} style={[styles.dot, i === activeDot && styles.dotActive]} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  cardClip: {
    borderRadius: radius.xl,
    overflow: 'hidden',
  },
  card: {
    padding: spacing.lg,
    minHeight: 200,
  },
  illustrationWrap: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  },
  capWrap: {
    position: 'absolute',
    top: 8,
    right: 14,
    transform: [{ rotate: '-8deg' }],
  },
  plane: {
    position: 'absolute',
    top: 54,
    right: 78,
    transform: [{ rotate: '-18deg' }],
  },
  phoneWrap: {
    position: 'absolute',
    right: 24,
    top: 62,
    transform: [{ rotate: '8deg' }],
  },
  phone: {
    width: 62,
    height: 96,
    borderRadius: 12,
    backgroundColor: '#1F1B3A',
    padding: 4,
  },
  phoneScreen: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  phoneRow: {
    flexDirection: 'row',
    gap: 5,
    marginVertical: 3,
  },
  phoneIcon: {
    width: 20,
    height: 20,
    borderRadius: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sparkleDot: {
    position: 'absolute',
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.6)',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.35)',
    borderRadius: radius.pill,
    paddingHorizontal: 9,
    paddingVertical: 3,
    marginBottom: spacing.sm,
  },
  heroTitle: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 24,
    lineHeight: 30,
    color: '#fff',
  },
  exploreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#fff',
    borderRadius: radius.pill,
    paddingHorizontal: 16,
    paddingVertical: 9,
    marginTop: spacing.md,
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.sm,
    gap: 5,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#D6CCF5',
  },
  dotActive: {
    width: 16,
    backgroundColor: '#4F2FCB',
  },
});
