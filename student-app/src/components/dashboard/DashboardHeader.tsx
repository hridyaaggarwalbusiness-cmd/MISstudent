import React from 'react';
import { View, StyleSheet } from 'react-native';
import { AppText, Avatar, IconButton, AnimatedPressable } from '@components/ui';
import { colors, spacing } from '@theme';
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
  onSearchPress: () => void;
}

export function DashboardHeader({
  name,
  photoUrl,
  className,
  section,
  unreadNotifications,
  onAvatarPress,
  onBellPress,
  onSearchPress,
}: DashboardHeaderProps) {
  const firstName = name.split(' ')[0] || 'Student';

  return (
    <View style={styles.wrap}>
      <View style={styles.topRow}>
        <AnimatedPressable onPress={onAvatarPress} style={styles.identity} haptic={false}>
          <Avatar uri={photoUrl} name={name} size={44} ringColor={colors.primary} />
          <View style={{ marginLeft: spacing.sm }}>
            <AppText variant="caption" color={colors.textTertiary}>
              {greetingForNow()}
            </AppText>
            <AppText variant="h1" numberOfLines={1}>
              {firstName}
            </AppText>
          </View>
        </AnimatedPressable>
        <View style={styles.actions}>
          <IconButton icon="search-outline" onPress={onSearchPress} size={38} />
          <IconButton
            icon="notifications-outline"
            onPress={onBellPress}
            size={38}
            style={{ marginLeft: spacing.xs }}
            badge={unreadNotifications > 0}
          />
        </View>
      </View>

      <View style={styles.metaRow}>
        <View style={styles.classPill}>
          <AppText variant="caption" color={colors.textSecondary}>
            {className} · Section {section}
          </AppText>
        </View>
        <AppText variant="captionRegular" color={colors.textTertiary}>
          {format(new Date(), 'EEEE, d MMMM')}
        </AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xs,
    paddingBottom: spacing.md,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  identity: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 1,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.md,
  },
  classPill: {
    backgroundColor: colors.surfaceAlt,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
});
