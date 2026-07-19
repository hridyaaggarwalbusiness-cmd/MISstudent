import React, { useEffect } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, RouteProp } from '@react-navigation/native';
import { AppText, Card, DetailHeader, ErrorState } from '@components/ui';
import { colors, spacing, radius } from '@theme';
import { RootStackParamList } from '@navigation/types';
import { useNoticesStore } from '@store/useNoticesStore';
import { friendlyDate, officialNoticeDate } from '@utils/date';
import { noticeCategoryMeta } from '@data/noticeCategoryMeta';
import { NoticeAttachmentChip } from '@components/notices/NoticeAttachmentChip';
import { OfficialNoticeView } from '@components/notices/OfficialNoticeView';

export function NoticeDetailScreen() {
  const route = useRoute<RouteProp<RootStackParamList, 'NoticeDetail'>>();
  const { items, markRead } = useNoticesStore();
  const notice = items.find((n) => n.id === route.params.id);

  useEffect(() => {
    if (notice && !notice.isRead) {
      markRead(notice.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [notice?.id]);

  if (!notice) {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
        <DetailHeader title="Notice" />
        <ErrorState title="Notice not found" message="This notice may have been removed." />
      </SafeAreaView>
    );
  }

  const meta = noticeCategoryMeta[notice.category];
  const badgeLabel = notice.pinned ? 'Important' : meta.label;
  const badgeColor = notice.pinned ? colors.danger : meta.fg;
  const badgeBg = notice.pinned ? colors.dangerBg : meta.bg;

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <DetailHeader title="Notice" />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={[styles.badge, { backgroundColor: badgeBg }]}>
          <AppText variant="caption" color={badgeColor} style={{ fontWeight: '700' }}>
            {badgeLabel}
          </AppText>
        </View>
        <AppText variant="displayMd" style={{ marginTop: spacing.md }}>
          {notice.title}
        </AppText>
        <AppText variant="tiny" color={colors.textTertiary} style={{ marginTop: 4 }}>
          {friendlyDate(notice.postedAt)} · By {notice.postedBy}
        </AppText>

        {notice.noticeType ? (
          <View style={{ marginTop: spacing.lg }}>
            <OfficialNoticeView
              data={{
                date: officialNoticeDate(notice.noticeDate ?? notice.postedAt),
                body: notice.body,
              }}
              fileBaseName={notice.title}
              pageImages={notice.pageImages}
            />
          </View>
        ) : (
          <Card style={{ marginTop: spacing.lg }}>
            <AppText variant="body" style={{ lineHeight: 23 }}>
              {notice.body}
            </AppText>
          </Card>
        )}

        {notice.attachments && notice.attachments.length > 0 && (
          <View style={{ marginTop: spacing.lg }}>
            <AppText variant="h3" style={{ marginBottom: spacing.sm }}>
              Attachments
            </AppText>
            {notice.attachments.map((a) => (
              <NoticeAttachmentChip key={a.id} attachment={a} />
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxxl },
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.pill,
    alignSelf: 'flex-start',
  },
});
