import React, { useEffect } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { AppText, Card, Badge, BadgeTone, DetailHeader, AttachmentRow, ErrorState } from '@components/ui';
import { colors, spacing } from '@theme';
import { RootStackParamList } from '@navigation/types';
import { useNoticesStore } from '@store/useNoticesStore';
import { friendlyDate } from '@utils/date';
import { NoticeCategory } from '@/types';

const categoryMeta: Record<NoticeCategory, { label: string; tone: BadgeTone; icon: keyof typeof Ionicons.glyphMap }> = {
  general: { label: 'General', tone: 'neutral', icon: 'information-circle-outline' },
  holiday: { label: 'Holiday', tone: 'danger', icon: 'sunny-outline' },
  event: { label: 'Event', tone: 'primary', icon: 'sparkles-outline' },
  exam: { label: 'Exam', tone: 'warning', icon: 'document-text-outline' },
  circular: { label: 'Circular', tone: 'info', icon: 'reader-outline' },
  competition: { label: 'Competition', tone: 'success', icon: 'ribbon-outline' },
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
        <Badge label={meta.label} tone={meta.tone} />
        <AppText variant="displayMd" style={{ marginTop: spacing.sm }}>
          {notice.title}
        </AppText>
        <View style={styles.metaRow}>
          <Ionicons name="person-circle-outline" size={16} color={colors.textSecondary} />
          <AppText variant="caption" color={colors.textSecondary} style={{ marginLeft: 6 }}>
            {notice.postedBy} · {friendlyDate(notice.postedAt)}
          </AppText>
        </View>

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
  metaRow: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.sm },
});
