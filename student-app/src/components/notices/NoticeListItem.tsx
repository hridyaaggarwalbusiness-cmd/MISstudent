import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card, AppText } from '@components/ui';
import { colors, spacing, radius } from '@theme';
import { Notice } from '@/types';
import { relativeTime } from '@utils/date';

const categoryMeta: Record<Notice['category'], { label: string; icon: keyof typeof Ionicons.glyphMap; bg: string; fg: string }> = {
  general: { label: 'General', icon: 'information-circle-outline', bg: colors.surfaceAlt, fg: colors.textSecondary },
  holiday: { label: 'Holiday', icon: 'sunny-outline', bg: colors.dangerBg, fg: colors.dangerStrong },
  event: { label: 'Event', icon: 'sparkles-outline', bg: colors.primarySoft, fg: colors.primary },
  exam: { label: 'Exam', icon: 'document-text-outline', bg: colors.warningBg, fg: colors.warningStrong },
  circular: { label: 'Circular', icon: 'reader-outline', bg: colors.infoBg, fg: colors.infoStrong },
  competition: { label: 'Competition', icon: 'ribbon-outline', bg: colors.successBg, fg: colors.successStrong },
};

export function NoticeListItem({ notice, onPress }: { notice: Notice; onPress: () => void }) {
  const meta = categoryMeta[notice.category];
  return (
    <Card
      onPress={onPress}
      elevation="xs"
      style={[styles.card, notice.pinned && { borderColor: colors.primary, borderWidth: 1.5 }]}
    >
      <View style={styles.row}>
        <View style={[styles.iconWrap, { backgroundColor: meta.bg }]}>
          <Ionicons name={meta.icon} size={20} color={meta.fg} />
        </View>
        <View style={{ flex: 1, marginLeft: spacing.sm }}>
          <View style={styles.topRow}>
            <View style={styles.categoryRow}>
              {notice.pinned && <Ionicons name="pin" size={11} color={colors.primary} style={{ marginRight: 4 }} />}
              <AppText variant="caption" color={meta.fg} style={{ fontWeight: '700' }}>
                {meta.label.toUpperCase()}
              </AppText>
            </View>
            <AppText variant="tiny" color={colors.textTertiary}>
              {relativeTime(notice.postedAt)}
            </AppText>
          </View>
          <AppText
            variant={notice.isRead ? 'bodyMedium' : 'bodySemibold'}
            numberOfLines={2}
            style={styles.title}
          >
            {notice.title}
          </AppText>
          <AppText variant="caption" color={colors.textSecondary} numberOfLines={2} style={styles.body}>
            {notice.body}
          </AppText>
        </View>
        {!notice.isRead && <View style={styles.unreadDot} />}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: spacing.sm },
  row: { flexDirection: 'row', alignItems: 'flex-start' },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  categoryRow: { flexDirection: 'row', alignItems: 'center' },
  title: { marginTop: 4, fontSize: 15 },
  body: { marginTop: 3, lineHeight: 18 },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
    marginLeft: 8,
    marginTop: 6,
  },
});
