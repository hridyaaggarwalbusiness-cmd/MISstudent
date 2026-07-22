import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withSequence, withTiming, withDelay, Easing } from 'react-native-reanimated';
import { colors } from '@theme';

function Dot({ delay, color }: { delay: number; color: string }) {
  const bounce = useSharedValue(0);

  useEffect(() => {
    bounce.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 320, easing: Easing.out(Easing.ease) }),
          withTiming(0, { duration: 320, easing: Easing.in(Easing.ease) }),
          withTiming(0, { duration: 360 }),
        ),
        -1,
        false,
      ),
    );
  }, [bounce, delay]);

  const style = useAnimatedStyle(() => ({
    transform: [{ translateY: -bounce.value * 5 }],
    opacity: 0.5 + bounce.value * 0.5,
  }));

  return <Animated.View style={[styles.dot, { backgroundColor: color }, style]} />;
}

// Three bouncing dots, the universal "still working, not stuck" signal - sits
// under the loading text on the AI generate/grade screens.
export function TypingDots({ color = colors.primary }: { color?: string }) {
  return (
    <View style={styles.row}>
      <Dot delay={0} color={color} />
      <Dot delay={140} color={color} />
      <Dot delay={280} color={color} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
});
