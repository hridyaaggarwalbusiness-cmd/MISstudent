import React from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, { useAnimatedStyle, withSpring, useDerivedValue } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { AppText } from '@components/ui';
import { colors, radius, shadows, spacing } from '@theme';

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
    <View style={[styles.wrapper, { paddingBottom: Math.max(insets.bottom, 12) }]}>
      <View style={[styles.container, shadows.lg]}>
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
  const progress = useDerivedValue(() => withSpring(focused ? 1 : 0, { damping: 16, stiffness: 180 }));

  const bubbleStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ scale: 0.7 + progress.value * 0.3 }],
  }));

  return (
    <Pressable style={styles.tabButton} onPress={onPress}>
      <View style={styles.iconSlot}>
        <Animated.View style={[styles.activeBubble, bubbleStyle]} />
        <Ionicons
          name={icon}
          size={20}
          color={focused ? colors.primary : colors.textTertiary}
        />
      </View>
      <AppText
        variant="tiny"
        color={focused ? colors.primary : colors.textTertiary}
        style={{ fontSize: 10.5, marginTop: 3 }}
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
    backgroundColor: 'transparent',
  },
  container: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    paddingVertical: 10,
    paddingHorizontal: 6,
    borderWidth: 1,
    borderColor: colors.borderSoft,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  iconSlot: {
    width: 40,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeBubble: {
    position: 'absolute',
    width: 40,
    height: 32,
    borderRadius: radius.md,
    backgroundColor: colors.primarySoft,
  },
});
