import React from 'react';
import { View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { AppText, Avatar, IconButton, AnimatedPressable } from '@components/ui';
import { colors, spacing, gradients, radius } from '@theme';
import { greetingForNow } from '@utils/date';
import { format } from 'date-fns';

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
  const firstName = name.split(' ')[0] || 'Student';

  return (
    <LinearGradient colors={gradients.primary} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.wrap}>
      <View style={styles.topRow}>
        <AppText variant="tiny" color="rgba(255,255,255,0.7)">
          {format(new Date(), 'EEEE, d MMMM')}
        </AppText>
        <IconButton
          icon="notifications-outline"
          onPress={onBellPress}
          color={colors.textInverse}
          backgroundColor="rgba(255,255,255,0.18)"
          badge={unreadNotifications > 0}
        />
      </View>

      <AnimatedPressable onPress={onAvatarPress} style={styles.avatarRow} haptic={false}>
        <Avatar uri={photoUrl} name={name} size={54} ringColor="rgba(255,255,255,0.55)" />
        <View style={{ marginLeft: spacing.sm, flex: 1 }}>
          <AppText variant="caption" color="rgba(255,255,255,0.8)">
            {greetingForNow()},
          </AppText>
          <AppText variant="h1" color={colors.textInverse} numberOfLines={1}>
            {firstName}
          </AppText>
          <View style={styles.classPill}>
            <AppText variant="tiny" color={colors.textInverse} style={{ fontSize: 11 }}>
              {className} · Section {section}
            </AppText>
          </View>
        </View>
      </AnimatedPressable>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xxl,
    borderBottomLeftRadius: radius.lg,
    borderBottomRightRadius: radius.lg,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.md,
  },
  classPill: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.16)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.pill,
    marginTop: 4,
  },
});
