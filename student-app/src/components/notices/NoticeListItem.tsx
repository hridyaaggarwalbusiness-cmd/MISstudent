import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Card, AppText, AnimatedPressable } from '@components/ui';
import { colors, spacing, radius } from '@theme';
import { Notice } from '@/types';
import { noticeTimeLabel } from '@utils/date';
import { noticeCategoryMeta } from '@data/noticeCategoryMeta';
import { NoticeAttachmentChip } from './NoticeAttachmentChip';

export function NoticeContent({ notice }: { notice: Notice }) {
  const meta = noticeCategoryMeta[notice.category];
  const badgeLabel = notice.pinned ? 'Important' : meta.label;
  const badgeColor = notice.pinned ? colors.danger : meta.fg;
  const badgeBg = notice.pinned ? colors.dangerBg : meta.bg;

  return (
    <View>
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
    </View>
  );
}

export function NoticeListItem({ notice, onPress }: { notice: Notice; onPress: () => void }) {
  return (
    <Card onPress={onPress} elevation="xs" style={styles.card}>
      <NoticeContent notice={notice} />
    </Card>
  );
}

export function NoticeGroupRow({ notice, onPress, isLast }: { notice: Notice; onPress: () => void; isLast: boolean }) {
  return (
    <AnimatedPressable onPress={onPress} haptic={false} style={[styles.groupRow, !isLast && styles.groupRowDivider]}>
      <NoticeContent notice={notice} />
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: spacing.sm },
  groupRow: { paddingVertical: spacing.md, paddingHorizontal: spacing.md },
  groupRowDivider: { borderBottomWidth: 1, borderBottomColor: colors.borderSoft },
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
