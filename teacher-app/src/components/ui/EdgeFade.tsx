import React from 'react';
import { StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '@theme';

// Pins a fade-to-background gradient over the trailing edge of a horizontal
// scroller so clipped content reads as "more to scroll" instead of "cut off
// by a bug" — used wherever a row can overflow the viewport (chip filters,
// pinned-card rails, the timetable grid).
export function EdgeFade({ backgroundColor = colors.background }: { backgroundColor?: string }) {
  return (
    <LinearGradient
      pointerEvents="none"
      colors={[`${backgroundColor}00`, backgroundColor] as [string, string]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      style={styles.fade}
    />
  );
}

const styles = StyleSheet.create({
  fade: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: 28,
  },
});
