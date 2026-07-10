import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card, AppText, Badge, BadgeTone } from '@components/ui';
import { colors, spacing, accentForKey } from '@theme';
import { Homework } from '@/types';
import { dueInLabel, friendlyDateShort } from '@utils/date';

interface HomeworkCardProps {
  homework: Homework;
  onPress: () => void;
}

const statusMeta: Record<Homework['status'], { label: string; tone: BadgeTone }> = {
  pending: { label: 'Pending', tone: 'warning' },
  submitted: { label: 'Submitted', tone: 'info' },
  graded: { label: 'Graded', tone: 'success' },
  overdue: { label: 'Overdue', tone: 'danger' },
};

export function HomeworkCard({ homework, onPress }: HomeworkCardProps) {
  const accent = accentForKey(homework.subject);
  const status = statusMeta[homework.status];
  const due = dueInLabel(homework.dueDate);
  const isSettled = homework.status === 'submitted' || homework.status === 'graded';
  const showUrgent = due.overdue && !isSettled;

  return (
    <Card onPress={onPress} style={styles.card}>
      <View style={styles.row}>
        <View style={[styles.iconWrap, { backgroundColor: accent.bg }]}>
          <Ionicons name="book-outline" size={18} color={accent.fg} />
        </View>
        <View style={{ flex: 1, marginLeft: spacing.sm }}>
          <View style={styles.topRow}>
            <AppText variant="caption" color={accent.fg}>
              {homework.subject}
            </AppText>
            <Badge label={status.label} tone={status.tone} size="sm" />
          </View>
          <AppText variant="bodySemibold" numberOfLines={2} style={{ marginTop: 3 }}>
            {homework.title}
          </AppText>
          <View style={styles.metaRow}>
            <Ionicons
              name="time-outline"
              size={13}
              color={showUrgent ? colors.danger : colors.textTertiary}
            />
            <AppText
              variant="tiny"
              color={showUrgent ? colors.danger : colors.textTertiary}
              style={{ marginLeft: 4 }}
            >
              {isSettled ? `Due ${friendlyDateShort(homework.dueDate)}` : due.label}
            </AppText>
            {homework.attachments.length > 0 && (
              <View style={styles.metaRow}>
                <Ionicons
                  name="attach-outline"
                  size={13}
                  color={colors.textTertiary}
                  style={{ marginLeft: 10 }}
                />
                <AppText variant="tiny" color={colors.textTertiary} style={{ marginLeft: 2 }}>
                  {homework.attachments.length}
                </AppText>
              </View>
            )}
          </View>
        </View>
        <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
});
