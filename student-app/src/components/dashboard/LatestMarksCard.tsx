import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card, AppText, Badge } from '@components/ui';
import { colors, spacing, radius } from '@theme';
import { ExamResult } from '@/types';
import { gradeColor } from '@utils/grade';

interface LatestMarksCardProps {
  result: ExamResult;
  onPress: () => void;
}

export function LatestMarksCard({ result, onPress }: LatestMarksCardProps) {
  const grade = gradeColor(result.grade);
  return (
    <Card onPress={onPress} style={[styles.card, { borderLeftWidth: 3, borderLeftColor: grade.fg }]}>
      <View style={styles.row}>
        <View style={[styles.gradeCircle, { backgroundColor: grade.bg }]}>
          <AppText variant="h1" color={grade.fg} style={{ fontSize: 20 }}>
            {result.grade}
          </AppText>
        </View>
        <View style={{ marginLeft: spacing.md, flex: 1 }}>
          <AppText variant="caption" color={colors.textSecondary}>
            {result.examName} · {result.term}
          </AppText>
          <AppText variant="h3" style={{ marginTop: 2 }}>
            {result.percentage}% overall
          </AppText>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
            {result.rank && (
              <Badge label={`Rank ${result.rank} of ${result.outOf}`} tone="success" size="sm" />
            )}
          </View>
        </View>
        <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: spacing.sm },
  row: { flexDirection: 'row', alignItems: 'center' },
  gradeCircle: {
    width: 52,
    height: 52,
    borderRadius: radius.md,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
