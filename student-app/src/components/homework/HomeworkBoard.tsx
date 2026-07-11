import React from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { AppText } from '@components/ui';
import { HomeworkCard } from './HomeworkCard';
import { colors, spacing, radius } from '@theme';
import { Homework, HomeworkStatus } from '@/types';

const COLUMNS: { key: HomeworkStatus; label: string }[] = [
  { key: 'overdue', label: 'Overdue' },
  { key: 'pending', label: 'Pending' },
  { key: 'submitted', label: 'Submitted' },
  { key: 'graded', label: 'Graded' },
];

interface HomeworkBoardProps {
  items: Homework[];
  onPressItem: (id: string) => void;
}

export function HomeworkBoard({ items, onPressItem }: HomeworkBoardProps) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
      {COLUMNS.map((col) => {
        const colItems = items.filter((h) => h.status === col.key);
        return (
          <View key={col.key} style={styles.column}>
            <View style={styles.columnHeader}>
              <AppText variant="bodySemibold">{col.label}</AppText>
              <View style={styles.countPill}>
                <AppText variant="tiny" color={colors.textSecondary}>
                  {colItems.length}
                </AppText>
              </View>
            </View>
            {colItems.length === 0 ? (
              <AppText variant="captionRegular" color={colors.textTertiary} style={{ paddingVertical: spacing.md }}>
                Nothing here
              </AppText>
            ) : (
              colItems.map((hw) => (
                <HomeworkCard key={hw.id} homework={hw} onPress={() => onPressItem(hw.id)} />
              ))
            )}
          </View>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: { gap: spacing.sm, paddingRight: spacing.lg },
  column: { width: 268 },
  columnHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
    paddingHorizontal: 2,
  },
  countPill: {
    backgroundColor: colors.surfaceAlt,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.pill,
  },
});
