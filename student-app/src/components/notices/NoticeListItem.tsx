import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card, AppText, Badge, BadgeTone } from '@components/ui';
import { colors, spacing } from '@theme';
import { Notice } from '@/types';
import { relativeTime } from '@utils/date';

const categoryMeta: Record<Notice['category'], { label: string; tone: BadgeTone; icon: keyof typeof Ionicons.glyphMap }> = {
  general: { label: 'General', tone: 'neutral', icon: 'information-circle-outline' },
  holiday: { label: 'Holiday', tone: 'danger', icon: 'sunny-outline' },
  event: { label: 'Event', tone: 'primary', icon: 'sparkles-outline' },
  exam: { label: 'Exam', tone: 'warning', icon: 'document-text-outline' },
  circular: { label: 'Circular', tone: 'info', icon: 'reader-outline' },
  competition: { label: 'Competition', tone: 'success', icon: 'ribbon-outline' },
};

export function NoticeListItem({ notice, onPress }: { notice: Notice; onPress: () => void }) {
  const meta = categoryMeta[notice.category];
  return (
    <Card onPress={onPress} style={styles.card}>
      <View style={styles.row}>
        {!notice.isRead && <View style={styles.unreadDot} />}
        <View style={{ flex: 1 }}>
          <View style={styles.topRow}>
            <Badge label={meta.label} tone={meta.tone} size="sm" />
            <AppText variant="tiny" color={colors.textTertiary}>
              {relativeTime(notice.postedAt)}
            </AppText>
          </View>
          <AppText
            variant={notice.isRead ? 'bodyMedium' : 'bodySemibold'}
            numberOfLines={2}
            style={{ marginTop: 6 }}
          >
            {notice.title}
          </AppText>
          <AppText variant="caption" color={colors.textSecondary} numberOfLines={2} style={{ marginTop: 3 }}>
            {notice.body}
          </AppText>
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: spacing.sm },
  row: { flexDirection: 'row' },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  unreadDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.primary,
    marginRight: 8,
    marginTop: 6,
  },
});
