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

// The middle tab is raised into a floating action button instead of sitting
// flush in the bar, so the bar is no longer just five identical slots.
const RAISED_ROUTE = 'HomeworkTab';

export function CustomTabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const raisedIndex = state.routes.findIndex((r) => r.name === RAISED_ROUTE);
  const raisedFocused = state.index === raisedIndex;

  const goTo = (index: number) => {
    const route = state.routes[index];
    const isFocused = state.index === index;
    Haptics.selectionAsync().catch(() => {});
    const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
    if (!isFocused && !event.defaultPrevented) {
      navigation.navigate(route.name);
    }
  };

  return (
    <View style={[styles.wrapper, { paddingBottom: Math.max(insets.bottom, 14) }]}>
      <View style={styles.pill}>
        <BlurView intensity={65} tint="light" style={StyleSheet.absoluteFill} />
        <View style={styles.tint} />
        <View style={styles.row}>
          {state.routes.map((route, index) => {
            if (index === raisedIndex) return <View key={route.key} style={styles.tabButton} />;
            const isFocused = state.index === index;
            const icons = ICONS[route.name] ?? ICONS.HomeTab;
            return (
              <TabButton
                key={route.key}
                label={LABELS[route.name] ?? route.name}
                icon={isFocused ? icons.active : icons.inactive}
                focused={isFocused}
                onPress={() => goTo(index)}
              />
            );
          })}
        </View>
      </View>

      {raisedIndex >= 0 && (
        <Pressable
          style={styles.raisedWrap}
          onPress={() => goTo(raisedIndex)}
          hitSlop={8}
        >
          <View style={[styles.raisedButton, shadows.glow(colors.primary), raisedFocused && styles.raisedButtonFocused]}>
            <Ionicons
              name={raisedFocused ? ICONS[RAISED_ROUTE].active : ICONS[RAISED_ROUTE].inactive}
              size={22}
              color={colors.textInverse}
            />
          </View>
          <AppText variant="tiny" color={raisedFocused ? colors.primary : colors.textTertiary} style={{ fontSize: 10, marginTop: 3 }}>
            {LABELS[RAISED_ROUTE]}
          </AppText>
        </Pressable>
      )}
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
    borderColor: colors.borderSoft,
    ...shadows.md,
    ...Platform.select({ android: { backgroundColor: 'rgba(255,255,255,0.96)' } }),
  },
  tint: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.72)',
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
  raisedWrap: {
    position: 'absolute',
    top: -22,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  raisedButton: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: colors.background,
  },
  raisedButtonFocused: {
    backgroundColor: colors.primaryDark,
  },
});
