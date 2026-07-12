import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card, AppText } from '@components/ui';
import { colors, spacing, radius, accentForKey } from '@theme';
import { Homework } from '@/types';

interface HomeworkCardProps {
  homework: Homework;
  onPress: () => void;
}

export function HomeworkCard({ homework, onPress }: HomeworkCardProps) {
  const accent = accentForKey(homework.subject);

  return (
    <Card onPress={onPress} elevation="xs" style={styles.card}>
      <View style={styles.row}>
        <View style={[styles.iconWrap, { backgroundColor: accent.bg }]}>
          <Ionicons name="book-outline" size={22} color={accent.fg} />
        </View>
        <View style={{ flex: 1, marginLeft: spacing.sm }}>
          <AppText variant="caption" color={accent.fg} style={{ fontWeight: '700' }}>
            {homework.subject.toUpperCase()}
          </AppText>
          <AppText variant="bodySemibold" numberOfLines={1} style={styles.title}>
            {homework.title}
          </AppText>
          {!!homework.instructions && (
            <AppText variant="caption" color={colors.textSecondary} numberOfLines={2} style={styles.preview}>
              {homework.instructions}
            </AppText>
          )}
          <AppText variant="tiny" color={colors.textTertiary} style={styles.teacher}>
            {homework.teacher}
          </AppText>
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
  title: {
    marginTop: 4,
    fontSize: 15.5,
    lineHeight: 21,
  },
  preview: {
    marginTop: 3,
    lineHeight: 18,
  },
  teacher: {
    marginTop: 6,
  },
});
