import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Card, AppText } from '@components/ui';
import { colors, spacing, radius } from '@theme';
import { Notice } from '@/types';
import { noticeTimeLabel } from '@utils/date';
import { noticeCategoryMeta } from '@data/noticeCategoryMeta';
import { NoticeAttachmentChip } from './NoticeAttachmentChip';

export function NoticeListItem({ notice, onPress }: { notice: Notice; onPress: () => void }) {
  const meta = noticeCategoryMeta[notice.category];
  const badgeLabel = notice.pinned ? 'Important' : meta.label;
  const badgeColor = notice.pinned ? colors.danger : meta.fg;
  const badgeBg = notice.pinned ? colors.dangerBg : meta.bg;

  return (
    <Card onPress={onPress} elevation="xs" style={styles.card}>
      <View style={styles.topRow}>
        <View style={[styles.badge, { backgroundColor: badgeBg }]}>
          <AppText variant="caption" color={badgeColor} style={{ fontWeight: '700' }}>
            {badgeLabel}
          </AppText>
        </View>
        {!notice.isRead && <View style={styles.unreadDot} />}
      </View>

      <AppText variant={notice.isRead ? 'bodyMedium' : 'bodySemibold'} numberOfLines={2} style={styles.title}>
        {notice.title}
      </AppText>
      <AppText variant="caption" color={colors.textSecondary} numberOfLines={2} style={styles.body}>
        {notice.body}
      </AppText>

      {notice.attachments && notice.attachments.length > 0 && (
        <NoticeAttachmentChip attachment={notice.attachments[0]} />
      )}

      <AppText variant="tiny" color={colors.textTertiary} style={styles.meta}>
        {noticeTimeLabel(notice.postedAt)} · By {notice.postedBy}
      </AppText>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: spacing.sm },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.pill,
    alignSelf: 'flex-start',
  },
  title: { marginTop: spacing.sm, fontSize: 15 },
  body: { marginTop: 3, lineHeight: 18 },
  meta: { marginTop: spacing.sm },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
  },
});
