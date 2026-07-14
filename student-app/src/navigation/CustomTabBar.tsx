import React from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { AppText } from '@components/ui';
import { colors, spacing } from '@theme';

const ICONS: Record<string, { active: keyof typeof Ionicons.glyphMap; inactive: keyof typeof Ionicons.glyphMap }> = {
  HomeTab: { active: 'home', inactive: 'home-outline' },
  TimetableTab: { active: 'calendar', inactive: 'calendar-outline' },
  HomeworkTab: { active: 'book', inactive: 'book-outline' },
  NoticesTab: { active: 'megaphone', inactive: 'megaphone-outline' },
  ProfileTab: { active: 'ellipsis-horizontal', inactive: 'ellipsis-horizontal' },
};

const LABELS: Record<string, string> = {
  HomeTab: 'Home',
  TimetableTab: 'Timetable',
  HomeworkTab: 'Homework',
  NoticesTab: 'Notices',
  ProfileTab: 'More',
};

export function CustomTabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.wrapper, { paddingBottom: Math.max(insets.bottom, 10) }]}>
      {state.routes.map((route, index) => {
        if (!LABELS[route.name]) return null;
        const isFocused = state.index === index;
        const icons = ICONS[route.name] ?? ICONS.HomeTab;

        const onPress = () => {
          Haptics.selectionAsync().catch(() => {});
          const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        return (
          <Pressable key={route.key} style={styles.tabButton} onPress={onPress} hitSlop={6}>
            <Ionicons
              name={isFocused ? icons.active : icons.inactive}
              size={22}
              color={isFocused ? colors.primary : colors.textTertiary}
            />
            <AppText
              variant="tiny"
              color={isFocused ? colors.primary : colors.textTertiary}
              style={{ fontSize: 10.5, marginTop: 3 }}
            >
              {LABELS[route.name] ?? route.name}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
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
});
