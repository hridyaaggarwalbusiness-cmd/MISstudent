import React from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { AppText } from '@components/ui';
import { colors, spacing, radius, shadows } from '@theme';

const ICONS: Record<string, { active: keyof typeof Ionicons.glyphMap; inactive: keyof typeof Ionicons.glyphMap }> = {
  HomeTab: { active: 'home', inactive: 'home-outline' },
  ClassesTab: { active: 'people', inactive: 'people-outline' },
  ActivityTab: { active: 'pulse', inactive: 'pulse-outline' },
  ProfileTab: { active: 'person', inactive: 'person-outline' },
};

const LABELS: Record<string, string> = {
  HomeTab: 'Home',
  ClassesTab: 'Classes',
  ActivityTab: 'Activity',
  ProfileTab: 'Profile',
};

interface CustomTabBarProps extends BottomTabBarProps {
  onCreatePress?: () => void;
}

export function CustomTabBar({ state, navigation, onCreatePress }: CustomTabBarProps) {
  const insets = useSafeAreaInsets();

  const visibleRoutes = state.routes
    .map((route, index) => ({ route, index }))
    .filter(({ route }) => !!LABELS[route.name]);

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
  }

  return (
    <View style={[styles.wrapper, { paddingBottom: Math.max(insets.bottom, 10) }]}>
      {visibleRoutes.slice(0, 2).map(renderTab)}
      <View style={styles.fabSlot}>
        <Pressable
          style={styles.fab}
          onPress={() => {
            Haptics.selectionAsync().catch(() => {});
            onCreatePress?.();
          }}
          hitSlop={6}
        >
          <Ionicons name="add" size={26} color={colors.textInverse} />
        </Pressable>
      </View>
      {visibleRoutes.slice(2).map(renderTab)}
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
  fabSlot: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  fab: {
    width: 50,
    height: 50,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -22,
    ...shadows.md,
  },
});
