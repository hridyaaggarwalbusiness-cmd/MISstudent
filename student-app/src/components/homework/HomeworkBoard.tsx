import React from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { AppText } from '@components/ui';
import { HomeworkCard } from './HomeworkCard';
import { colors, spacing, radius } from '@theme';
import { Homework, HomeworkStatus } from '@/types';

const COLUMNS: { key: HomeworkStatus; label: string; accent: string }[] = [
  { key: 'overdue', label: 'Overdue', accent: colors.dangerStrong },
  { key: 'pending', label: 'Pending', accent: colors.warningStrong },
  { key: 'submitted', label: 'Submitted', accent: colors.infoStrong },
  { key: 'graded', label: 'Graded', accent: colors.successStrong },
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
              <View style={styles.columnTitle}>
                <View style={[styles.columnDot, { backgroundColor: col.accent }]} />
                <AppText variant="bodySemibold">{col.label}</AppText>
              </View>
              <View style={[styles.countPill, { backgroundColor: `${col.accent}1F` }]}>
                <AppText variant="tiny" color={col.accent}>
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
  columnTitle: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  columnDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  countPill: {
    backgroundColor: colors.surfaceAlt,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.pill,
  },
});
