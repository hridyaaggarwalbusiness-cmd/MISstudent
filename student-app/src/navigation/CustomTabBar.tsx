import React from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, { useAnimatedStyle, withTiming, useDerivedValue } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { AppText } from '@components/ui';
import { colors, spacing } from '@theme';

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
    <View style={[styles.wrapper, { paddingBottom: Math.max(insets.bottom, 10) }]}>
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
  const progress = useDerivedValue(() => withTiming(focused ? 1 : 0, { duration: 180 }));

  const indicatorStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ scaleX: 0.4 + progress.value * 0.6 }],
  }));

  return (
    <Pressable style={styles.tabButton} onPress={onPress} hitSlop={6}>
      <Animated.View style={[styles.indicator, indicatorStyle]} />
      <Ionicons name={icon} size={21} color={focused ? colors.primary : colors.textTertiary} />
      <AppText
        variant="tiny"
        color={focused ? colors.primary : colors.textTertiary}
        style={{ fontSize: 10.5, marginTop: 4 }}
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
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    paddingTop: spacing.xs,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  indicator: {
    position: 'absolute',
    top: 0,
    width: 28,
    height: 2.5,
    borderRadius: 2,
    backgroundColor: colors.primary,
  },
});
