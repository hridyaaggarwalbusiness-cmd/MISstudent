import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card, AppText } from '@components/ui';
import { colors, spacing, radius, accentForKey } from '@theme';
import { Homework } from '@/types';
import { dueInLabel, friendlyDateShort } from '@utils/date';

interface HomeworkCardProps {
  homework: Homework;
  onPress: () => void;
}

export function HomeworkCard({ homework, onPress }: HomeworkCardProps) {
  const accent = accentForKey(homework.subject);
  const due = dueInLabel(homework.dueDate);
  const dueColor = due.overdue ? colors.danger : due.urgent ? colors.warningStrong : colors.textTertiary;

  return (
    <Card onPress={onPress} elevation="xs" style={styles.card}>
      <View style={styles.row}>
        <View style={[styles.iconWrap, { backgroundColor: accent.bg }]}>
          <Ionicons name="book-outline" size={22} color={accent.fg} />
        </View>
        <View style={{ flex: 1, marginLeft: spacing.sm }}>
          <View style={styles.topRow}>
            <AppText variant="caption" color={accent.fg} style={{ fontWeight: '700' }}>
              {homework.subject.toUpperCase()}
            </AppText>
            <View style={[styles.duePill, { backgroundColor: `${dueColor}17` }]}>
              <AppText variant="tiny" color={dueColor} style={{ fontWeight: '700' }}>
                {due.label}
              </AppText>
            </View>
          </View>
          <AppText variant="bodySemibold" numberOfLines={2} style={styles.title}>
            {homework.title}
          </AppText>
          <View style={styles.metaRow}>
            <Ionicons name="person-outline" size={13} color={colors.textTertiary} />
            <AppText variant="tiny" color={colors.textTertiary} style={{ marginLeft: 4 }}>
              {homework.teacher}
            </AppText>
            <AppText variant="tiny" color={colors.textTertiary} style={{ marginHorizontal: 6 }}>
              ·
            </AppText>
            <AppText variant="tiny" color={colors.textTertiary}>
              Due {friendlyDateShort(homework.dueDate)}
            </AppText>
            {homework.attachments.length > 0 && (
              <View style={styles.metaRow}>
                <Ionicons name="attach-outline" size={13} color={colors.textTertiary} style={{ marginLeft: 8 }} />
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
    width: 44,
    height: 44,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  duePill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.pill,
  },
  title: {
    marginTop: 4,
    fontSize: 15.5,
    lineHeight: 21,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 7,
  },
});
