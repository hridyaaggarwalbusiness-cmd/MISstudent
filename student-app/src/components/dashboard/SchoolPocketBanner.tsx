import React from 'react';
import { Image, StyleSheet } from 'react-native';
import { AnimatedPressable } from '@components/ui';
import { radius } from '@theme';

const BANNER_ASPECT_RATIO = 1905 / 826;

export function SchoolPocketBanner({ onExplore }: { onExplore: () => void }) {
  return (
    <AnimatedPressable onPress={onExplore} style={styles.wrap}>
      <Image
        source={require('@/assets/dashboard/school-pocket-banner.png')}
        style={styles.image}
        resizeMode="contain"
        accessibilityLabel="Your School, Now in Your Pocket"
      />
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: '100%',
    aspectRatio: BANNER_ASPECT_RATIO,
    borderRadius: radius.xl,
    overflow: 'hidden',
  },
  image: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
  },
});
