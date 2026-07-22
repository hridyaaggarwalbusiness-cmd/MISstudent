import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { colors } from '@theme';

// A breathing icon with an expanding "ping" ring behind it - used on the
// full-screen loading states while the AI is generating or grading, so a
// long wait doesn't look like the screen has frozen.
export function PulsingIcon({
  name,
  size = 84,
  iconSize = 36,
  color = colors.primary,
  background = colors.primarySoft,
}: {
  name: React.ComponentProps<typeof Ionicons>['name'];
  size?: number;
  iconSize?: number;
  color?: string;
  background?: string;
}) {
  const ping = useSharedValue(0);
  const breathe = useSharedValue(0);

  useEffect(() => {
    ping.value = withRepeat(withTiming(1, { duration: 1600, easing: Easing.out(Easing.ease) }), -1, false);
    breathe.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 850, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 850, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      false,
    );
  }, [ping, breathe]);

  const ringStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 1 + ping.value * 0.45 }],
    opacity: 0.35 * (1 - ping.value),
  }));

  const iconWrapStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 1 + breathe.value * 0.06 }],
  }));

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Animated.View
        style={[
          styles.ring,
          { width: size, height: size, borderRadius: size / 2, backgroundColor: background },
          ringStyle,
        ]}
      />
      <Animated.View
        style={[
          styles.iconWrap,
          {
            width: size * 0.72,
            height: size * 0.72,
            borderRadius: (size * 0.72) / 2,
            backgroundColor: background,
          },
          iconWrapStyle,
        ]}
      >
        <Ionicons name={name} size={iconSize} color={color} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  ring: {
    position: 'absolute',
  },
  iconWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
