import React from 'react';
import { View, Pressable, StyleSheet, Platform } from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import Animated, { useAnimatedStyle, withSpring, useDerivedValue } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { AppText } from '@components/ui';
import { colors, radius, spacing, shadows } from '@theme';

const ICONS: Record<string, { active: keyof typeof Ionicons.glyphMap; inactive: keyof typeof Ionicons.glyphMap }> = {
  HomeTab: { active: 'home', inactive: 'home-outline' },
  TimetableTab: { active: 'calendar', inactive: 'calendar-outline' },
  HomeworkTab: { active: 'book', inactive: 'book-outline' },
  NoticesTab: { active: 'megaphone', inactive: 'megaphone-outline' },
  ProfileTab: { active: 'person', inactive: 'person-outline' },
};

const LABELS: Record<string, string> = {
  HomeTab: 'Home',
  TimetableTab: 'Timetable',
  HomeworkTab: 'Homework',
  NoticesTab: 'Notices',
  ProfileTab: 'Profile',
};

export function CustomTabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.wrapper, { paddingBottom: Math.max(insets.bottom, 14) }]}>
      <View style={styles.pill}>
        <BlurView intensity={55} tint="dark" style={StyleSheet.absoluteFill} />
        <View style={styles.tint} />
        <View style={styles.row}>
          {state.routes.map((route, index) => {
            const isFocused = state.index === index;
            const icons = ICONS[route.name] ?? ICONS.HomeTab;

            const onPress = () => {
              Haptics.selectionAsync().catch(() => {});
              const event = navigation.emit({
                type: 'tabPress',
                target: route.key,
                canPreventDefault: true,
              });
              if (!isFocused && !event.defaultPrevented) {
                navigation.navigate(route.name);
              }
            };

            return (
              <TabButton
                key={route.key}
                label={LABELS[route.name] ?? route.name}
                icon={isFocused ? icons.active : icons.inactive}
                focused={isFocused}
                onPress={onPress}
              />
            );
          })}
        </View>
      </View>
    </View>
  );
}

function TabButton({
  label,
  icon,
  focused,
  onPress,
}: {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  focused: boolean;
  onPress: () => void;
}) {
  const progress = useDerivedValue(() => withSpring(focused ? 1 : 0, { damping: 16, stiffness: 200 }));

  const bubbleStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ scale: 0.6 + progress.value * 0.4 }],
  }));

  return (
    <Pressable style={styles.tabButton} onPress={onPress} hitSlop={6}>
      <View style={styles.iconSlot}>
        <Animated.View style={[styles.bubble, shadows.glow(colors.primary), bubbleStyle]} />
        <Ionicons name={icon} size={19} color={focused ? colors.textInverse : colors.textTertiary} />
      </View>
      <AppText
        variant="tiny"
        color={focused ? colors.primary : colors.textTertiary}
        style={{ fontSize: 10, marginTop: 4 }}
      >
        {label}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: spacing.md,
  },
  pill: {
    borderRadius: radius.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.borderStrong,
    ...Platform.select({ android: { backgroundColor: 'rgba(14,15,20,0.92)' } }),
  },
  tint: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(14, 15, 20, 0.62)',
  },
  row: {
    flexDirection: 'row',
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  iconSlot: {
    width: 38,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bubble: {
    position: 'absolute',
    width: 38,
    height: 30,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
  },
});
