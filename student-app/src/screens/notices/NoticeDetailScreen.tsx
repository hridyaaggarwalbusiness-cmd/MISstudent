import React, { useEffect } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { AppText, Card, DetailHeader, AttachmentRow, ErrorState } from '@components/ui';
import { colors, spacing, radius } from '@theme';
import { RootStackParamList } from '@navigation/types';
import { useNoticesStore } from '@store/useNoticesStore';
import { friendlyDate } from '@utils/date';
import { NoticeCategory } from '@/types';

const categoryMeta: Record<NoticeCategory, { label: string; icon: keyof typeof Ionicons.glyphMap; bg: string; fg: string }> = {
  general: { label: 'General', icon: 'information-circle-outline', bg: colors.surfaceAlt, fg: colors.textSecondary },
  holiday: { label: 'Holiday', icon: 'sunny-outline', bg: colors.dangerBg, fg: colors.dangerStrong },
  event: { label: 'Event', icon: 'sparkles-outline', bg: colors.primarySoft, fg: colors.primary },
  exam: { label: 'Exam', icon: 'document-text-outline', bg: colors.warningBg, fg: colors.warningStrong },
  circular: { label: 'Circular', icon: 'reader-outline', bg: colors.infoBg, fg: colors.infoStrong },
  competition: { label: 'Competition', icon: 'ribbon-outline', bg: colors.successBg, fg: colors.successStrong },
};

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

  const meta = categoryMeta[notice.category];

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <DetailHeader title="Notice" />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.headerRow}>
          <View style={[styles.iconWrap, { backgroundColor: meta.bg }]}>
            <Ionicons name={meta.icon} size={22} color={meta.fg} />
          </View>
          <View style={{ marginLeft: spacing.sm }}>
            <AppText variant="caption" color={meta.fg} style={{ fontWeight: '700' }}>
              {meta.label.toUpperCase()}
            </AppText>
            <AppText variant="tiny" color={colors.textTertiary}>
              {notice.postedBy} · {friendlyDate(notice.postedAt)}
            </AppText>
          </View>
        </View>
        <AppText variant="displayMd" style={{ marginTop: spacing.md }}>
          {notice.title}
        </AppText>

        <Card style={{ marginTop: spacing.lg }}>
          <AppText variant="body" style={{ lineHeight: 23 }}>
            {notice.body}
          </AppText>
        </Card>

        {notice.attachments && notice.attachments.length > 0 && (
          <View style={{ marginTop: spacing.lg }}>
            <AppText variant="h3" style={{ marginBottom: spacing.sm }}>
              Attachments
            </AppText>
            {notice.attachments.map((a) => (
              <AttachmentRow key={a.id} attachment={a} onPress={() => {}} />
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
  headerRow: { flexDirection: 'row', alignItems: 'center' },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
