import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card, AppText } from '@components/ui';
import { colors, spacing, radius } from '@theme';
import { relativeTime } from '@utils/date';

export interface FeedNotification {
  id: string;
  icon: keyof typeof Ionicons.glyphMap;
  bg: string;
  fg: string;
  title: string;
  body: string;
  time: string; // ISO
  isRead: boolean;
  onPress: () => void;
}

export function NotificationItem({ notification }: { notification: FeedNotification }) {
  return (
    <Card
      onPress={notification.onPress}
      style={[
        styles.card,
        { borderLeftWidth: 3, borderLeftColor: notification.fg },
        !notification.isRead && styles.unreadCard,
      ]}
      bordered
    >
      <View style={styles.row}>
        <View style={[styles.iconWrap, { backgroundColor: notification.bg }]}>
          <Ionicons name={notification.icon} size={18} color={notification.fg} />
        </View>
        <View style={{ flex: 1, marginLeft: spacing.sm }}>
          <View style={styles.topRow}>
            <AppText variant={notification.isRead ? 'bodyMedium' : 'bodySemibold'} style={{ flex: 1 }} numberOfLines={1}>
              {notification.title}
            </AppText>
            {!notification.isRead && <View style={styles.dot} />}
          </View>
          <AppText variant="caption" color={colors.textSecondary} numberOfLines={2} style={{ marginTop: 2 }}>
            {notification.body}
          </AppText>
          <AppText variant="tiny" color={colors.textTertiary} style={{ marginTop: 4 }}>
            {relativeTime(notification.time)}
          </AppText>
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: spacing.sm },
  unreadCard: { backgroundColor: colors.primarySoft },
  row: { flexDirection: 'row', alignItems: 'flex-start' },
  iconWrap: {
    width: 38,
    height: 38,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topRow: { flexDirection: 'row', alignItems: 'center' },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.primary, marginLeft: 6 },
});
