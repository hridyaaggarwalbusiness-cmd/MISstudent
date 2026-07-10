import React from 'react';
import { View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { AppText, Avatar, IconButton, AnimatedPressable } from '@components/ui';
import { colors, spacing, gradients, radius } from '@theme';
import { greetingForNow } from '@utils/date';

interface DashboardHeaderProps {
  name: string;
  photoUrl?: string | null;
  className: string;
  section: string;
  unreadNotifications: number;
  onAvatarPress: () => void;
  onBellPress: () => void;
}

export function DashboardHeader({
  name,
  photoUrl,
  className,
  section,
  unreadNotifications,
  onAvatarPress,
  onBellPress,
}: DashboardHeaderProps) {
  const firstName = name.split(' ')[0];

  return (
    <LinearGradient colors={gradients.primary} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.wrap}>
      <View style={styles.row}>
        <AnimatedPressable onPress={onAvatarPress} style={styles.avatarRow} haptic={false}>
          <Avatar uri={photoUrl} name={name} size={48} ringColor="rgba(255,255,255,0.5)" />
          <View style={{ marginLeft: spacing.sm }}>
            <AppText variant="caption" color="rgba(255,255,255,0.8)">
              {greetingForNow()},
            </AppText>
            <AppText variant="h2" color={colors.textInverse}>
              {firstName}
            </AppText>
            <AppText variant="tiny" color="rgba(255,255,255,0.75)" style={{ marginTop: 1 }}>
              {className} · Section {section}
            </AppText>
          </View>
        </AnimatedPressable>
        <IconButton
          icon="notifications-outline"
          onPress={onBellPress}
          color={colors.textInverse}
          backgroundColor="rgba(255,255,255,0.18)"
          badge={unreadNotifications > 0}
        />
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xxl,
    borderBottomLeftRadius: radius.xl,
    borderBottomRightRadius: radius.xl,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
});
