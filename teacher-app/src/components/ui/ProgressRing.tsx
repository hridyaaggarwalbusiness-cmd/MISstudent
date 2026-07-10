import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { AppText } from './AppText';
import { colors } from '@theme';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface ProgressRingProps {
  value: number; // 0-100
  size?: number;
  strokeWidth?: number;
  label?: string;
  sublabel?: string;
  goodThreshold?: number;
  warningThreshold?: number;
  colorOverride?: string;
  showValueLabel?: boolean;
}

function statusColorFor(value: number, good: number, warn: number) {
  if (value >= good) return { fg: colors.success, track: colors.successBg };
  if (value >= warn) return { fg: colors.warning, track: colors.warningBg };
  return { fg: colors.danger, track: colors.dangerBg };
}

export function ProgressRing({
  value,
  size = 120,
  strokeWidth = 12,
  label,
  sublabel,
  goodThreshold = 85,
  warningThreshold = 75,
  colorOverride,
  showValueLabel = true,
}: ProgressRingProps) {
  const clamped = Math.max(0, Math.min(100, value));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withTiming(clamped, { duration: 900, easing: Easing.out(Easing.cubic) });
  }, [clamped, progress]);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: circumference * (1 - progress.value / 100),
  }));

  const status = colorOverride
    ? { fg: colorOverride, track: colors.surfaceAlt }
    : statusColorFor(clamped, goodThreshold, warningThreshold);

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={status.track}
          strokeWidth={strokeWidth}
          fill="none"
        />
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={status.fg}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={`${circumference} ${circumference}`}
          animatedProps={animatedProps}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      {showValueLabel && (
        <View style={{ alignItems: 'center' }}>
          <AppText variant="displayMd" style={{ fontSize: size * 0.22 }}>
            {Math.round(clamped)}%
          </AppText>
          {label && (
            <AppText variant="caption" color={colors.textSecondary} style={{ marginTop: 2 }}>
              {label}
            </AppText>
          )}
          {sublabel && (
            <AppText variant="tiny" color={colors.textTertiary}>
              {sublabel}
            </AppText>
          )}
        </View>
      )}
    </View>
  );
}
