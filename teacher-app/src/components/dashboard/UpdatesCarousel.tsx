import React, { useRef, useState } from 'react';
import { View, ScrollView, StyleSheet, NativeSyntheticEvent, NativeScrollEvent, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText, AnimatedPressable } from '@components/ui';
import { colors, spacing, radius } from '@theme';
import { relativeTime } from '@utils/date';

export interface UpdateCard {
  key: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  title: string;
  subtitle: string;
  time: string; // ISO
  onPress: () => void;
}

const CARD_WIDTH = Dimensions.get('window').width - spacing.lg * 2;

export function UpdatesCarousel({ items }: { items: UpdateCard[] }) {
  const [index, setIndex] = useState(0);
  const scrollRef = useRef<ScrollView>(null);

  function onScroll(e: NativeSyntheticEvent<NativeScrollEvent>) {
    const page = Math.round(e.nativeEvent.contentOffset.x / CARD_WIDTH);
    if (page !== index) setIndex(page);
  }

  return (
    <View>
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
        snapToInterval={CARD_WIDTH}
        decelerationRate="fast"
      >
        {items.map((item) => (
          <AnimatedPressable key={item.key} onPress={item.onPress} haptic={false} style={[styles.card, { width: CARD_WIDTH }]}>
            <View style={[styles.iconWrap, { backgroundColor: item.color }]}>
              <Ionicons name={item.icon} size={18} color="#fff" />
            </View>
            <View style={{ flex: 1, marginLeft: spacing.sm }}>
              <AppText variant="bodySemibold" numberOfLines={1}>
                {item.title}
              </AppText>
              <AppText variant="caption" color={colors.textSecondary} numberOfLines={2} style={{ marginTop: 2 }}>
                {item.subtitle}
              </AppText>
            </View>
            <AppText variant="tiny" color={colors.textTertiary}>
              {relativeTime(item.time)}
            </AppText>
          </AnimatedPressable>
        ))}
      </ScrollView>
      {items.length > 1 && (
        <View style={styles.dots}>
          {items.map((item, i) => (
            <View key={item.key} style={[styles.dot, i === index && styles.dotActive]} />
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.sm,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  dots: { flexDirection: 'row', justifyContent: 'center', marginTop: spacing.sm },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.borderSoft,
    marginHorizontal: 3,
  },
  dotActive: { backgroundColor: colors.primary, width: 16 },
});
