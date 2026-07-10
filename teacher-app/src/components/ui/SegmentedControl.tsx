import React, { useState } from 'react';
import { View, StyleSheet, LayoutChangeEvent } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { AnimatedPressable } from './AnimatedPressable';
import { AppText } from './AppText';
import { colors, radius } from '@theme';

interface SegmentedControlProps {
  options: string[];
  selectedIndex: number;
  onChange: (index: number) => void;
}

export function SegmentedControl({ options, selectedIndex, onChange }: SegmentedControlProps) {
  const [segmentWidth, setSegmentWidth] = useState(0);
  const translateX = useSharedValue(0);

  const onLayout = (e: LayoutChangeEvent) => {
    const width = e.nativeEvent.layout.width / options.length;
    setSegmentWidth(width);
  };

  React.useEffect(() => {
    if (segmentWidth > 0) {
      translateX.value = withTiming(selectedIndex * segmentWidth, { duration: 220 });
    }
  }, [selectedIndex, segmentWidth, translateX]);

  const thumbStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
    width: segmentWidth,
  }));

  return (
    <View style={styles.track} onLayout={onLayout}>
      {segmentWidth > 0 && <Animated.View style={[styles.thumb, thumbStyle]} />}
      {options.map((option, index) => (
        <AnimatedPressable
          key={option}
          style={styles.segment}
          onPress={() => onChange(index)}
          haptic={false}
        >
          <AppText
            variant="bodySemibold"
            color={selectedIndex === index ? colors.textPrimary : colors.textTertiary}
          >
            {option}
          </AppText>
        </AnimatedPressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.md,
    padding: 4,
    position: 'relative',
  },
  segment: {
    flex: 1,
    paddingVertical: 9,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  thumb: {
    position: 'absolute',
    top: 4,
    bottom: 4,
    left: 0,
    backgroundColor: colors.surface,
    borderRadius: radius.sm,
    shadowColor: colors.shadow,
    shadowOpacity: 0.08,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
});
