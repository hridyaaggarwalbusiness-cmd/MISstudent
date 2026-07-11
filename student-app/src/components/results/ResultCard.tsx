import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card, AppText, Badge } from '@components/ui';
import { colors, spacing, radius } from '@theme';
import { ExamResult } from '@/types';
import { friendlyDate } from '@utils/date';
import { gradeColor } from '@utils/grade';

export function ResultCard({ result, onPress }: { result: ExamResult; onPress: () => void }) {
  const grade = gradeColor(result.grade);
  return (
    <Card onPress={onPress} style={[styles.card, { borderLeftWidth: 3, borderLeftColor: grade.fg }]}>
      <View style={styles.row}>
        <View style={[styles.gradeCircle, { backgroundColor: grade.bg }]}>
          <AppText variant="h2" color={grade.fg} style={{ fontSize: 18 }}>
            {result.grade}
          </AppText>
        </View>
        <View style={{ flex: 1, marginLeft: spacing.sm }}>
          <AppText variant="bodySemibold" style={{ fontSize: 15 }}>{result.examName}</AppText>
          <AppText variant="caption" color={colors.textSecondary}>
            {result.term} · {friendlyDate(result.date)}
          </AppText>
          <View style={styles.metaRow}>
            <AppText variant="tiny" color={colors.textTertiary}>
              {result.totalObtained}/{result.totalMax} marks · {result.percentage}%
            </AppText>
            {result.rank && (
              <Badge label={`Rank ${result.rank}`} tone="success" size="sm" style={{ marginLeft: 8 }} />
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
    width: 48,
    height: 48,
    borderRadius: radius.md,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metaRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
});
