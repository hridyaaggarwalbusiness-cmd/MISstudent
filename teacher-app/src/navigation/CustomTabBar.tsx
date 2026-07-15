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
  ClassesTab: { active: 'people', inactive: 'people-outline' },
  HomeworkTab: { active: 'book', inactive: 'book-outline' },
  AttendanceTab: { active: 'checkmark-done', inactive: 'checkmark-done-outline' },
  ProfileTab: { active: 'person', inactive: 'person-outline' },
};

const LABELS: Record<string, string> = {
  HomeTab: 'Home',
  ClassesTab: 'Classes',
  HomeworkTab: 'Homework',
  AttendanceTab: 'Attendance',
  ProfileTab: 'Profile',
};

const DISPLAY_ORDER = ['HomeTab', 'ClassesTab', 'HomeworkTab', 'AttendanceTab', 'ProfileTab'];

export function CustomTabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();

  const visibleRoutes = state.routes
    .map((route, index) => ({ route, index }))
    .filter(({ route }) => !!LABELS[route.name])
    .sort((a, b) => DISPLAY_ORDER.indexOf(a.route.name) - DISPLAY_ORDER.indexOf(b.route.name));

  function renderTab({ route, index }: (typeof visibleRoutes)[number]) {
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
      <Pressable key={route.key} style={styles.tabButton} onPress={onPress} hitSlop={4}>
        <Ionicons
          name={isFocused ? icons.active : icons.inactive}
          size={20}
          color={isFocused ? colors.primary : colors.textTertiary}
        />
        <AppText
          variant="tiny"
          color={isFocused ? colors.primary : colors.textTertiary}
          numberOfLines={1}
          style={{ fontSize: 9.5, marginTop: 2 }}
        >
          {LABELS[route.name] ?? route.name}
        </AppText>
      </Pressable>
    );
  }

  return (
    <View style={[styles.wrapper, { paddingBottom: Math.max(insets.bottom, 10) }]}>
      {visibleRoutes.map(renderTab)}
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
