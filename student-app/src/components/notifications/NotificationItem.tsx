import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card, AppText } from '@components/ui';
import { colors, spacing, radius } from '@theme';
import { AppNotification, NotificationType } from '@/types';
import { relativeTime } from '@utils/date';

const typeMeta: Record<NotificationType, { icon: keyof typeof Ionicons.glyphMap; bg: string; fg: string }> = {
  homework: { icon: 'book-outline', bg: colors.primarySoft, fg: colors.primary },
  exam: { icon: 'document-text-outline', bg: colors.warningBg, fg: colors.warningStrong },
  material: { icon: 'library-outline', bg: colors.infoBg, fg: colors.infoStrong },
  attendance: { icon: 'checkmark-done-outline', bg: colors.successBg, fg: colors.successStrong },
  result: { icon: 'stats-chart-outline', bg: '#F5F3FF', fg: colors.accentViolet },
  notice: { icon: 'megaphone-outline', bg: colors.dangerBg, fg: colors.dangerStrong },
  bus: { icon: 'bus-outline', bg: colors.infoBg, fg: colors.infoStrong },
  timetable: { icon: 'calendar-outline', bg: colors.primarySoft, fg: colors.primary },
};

export function NotificationItem({
  notification,
  onPress,
}: {
  notification: AppNotification;
  onPress: () => void;
}) {
  const meta = typeMeta[notification.type];
  return (
    <Card
      onPress={onPress}
      style={[
        styles.card,
        { borderLeftWidth: 3, borderLeftColor: meta.fg },
        !notification.isRead && styles.unreadCard,
      ]}
      bordered
    >
      <View style={styles.row}>
        <View style={[styles.iconWrap, { backgroundColor: meta.bg }]}>
          <Ionicons name={meta.icon} size={18} color={meta.fg} />
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
            {relativeTime(notification.createdAt)}
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
