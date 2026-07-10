import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { Image } from 'expo-image';
import { AppText } from './AppText';
import { accentForKey } from '@theme';

interface AvatarProps {
  uri?: string | null;
  name: string;
  size?: number;
  style?: ViewStyle;
  ringColor?: string;
}

function initialsFor(name: string) {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function Avatar({ uri, name, size = 44, style, ringColor }: AvatarProps) {
  const accent = accentForKey(name);
  const dimension = { width: size, height: size, borderRadius: size / 2 };

  const wrapperStyle = [
    dimension,
    ringColor
      ? { borderWidth: 2, borderColor: ringColor, padding: 2 }
      : undefined,
    style,
  ];

  if (uri) {
    return (
      <View style={wrapperStyle}>
        <Image
          source={{ uri }}
          style={[dimension, { width: '100%', height: '100%' }]}
          contentFit="cover"
          transition={200}
        />
      </View>
    );
  }

  return (
    <View
      style={[
        dimension,
        styles.fallback,
        { backgroundColor: accent.bg },
        style,
      ]}
    >
      <AppText
        variant="bodySemibold"
        color={accent.fg}
        style={{ fontSize: size * 0.36 }}
      >
        {initialsFor(name)}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  fallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
