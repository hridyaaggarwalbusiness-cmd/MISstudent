import React, { useEffect, useState } from 'react';
import { View, ScrollView, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import {
  AppText,
  Card,
  Badge,
  Button,
  BarChart,
  DetailHeader,
  SkeletonCard,
  ErrorState,
} from '@components/ui';
import { colors, spacing, radius } from '@theme';
import { RootStackParamList } from '@navigation/types';
import { repo } from '@data/repositories';
import { ExamResult } from '@/types';
import { friendlyDate } from '@utils/date';
import { useAuthStore } from '@store/useAuthStore';

export function ResultDetailScreen() {
  const route = useRoute<RouteProp<RootStackParamList, 'ResultDetail'>>();
  const studentId = useAuthStore((s) => s.student?.id);
  const [result, setResult] = useState<ExamResult | null | undefined>(undefined);

  useEffect(() => {
    if (!studentId) return;
    let active = true;
    repo.results.list(studentId).then((all) => {
      if (active) setResult(all.find((r) => r.id === route.params.id) ?? null);
    });
    return () => {
      active = false;
    };
  }, [route.params.id, studentId]);

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <DetailHeader title="Report Card" />
      {result === undefined ? (
        <View style={{ padding: spacing.lg }}>
          <SkeletonCard lines={3} />
        </View>
      ) : result === null ? (
        <ErrorState title="Result not found" message="This result may have been removed." />
      ) : (
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <Card>
            <AppText variant="caption" color={colors.textSecondary}>
              {result.term} · {friendlyDate(result.date)}
            </AppText>
            <AppText variant="displayLg" style={{ marginTop: 2 }}>
              {result.examName}
            </AppText>
            <View style={styles.summaryRow}>
              <SummaryStat label="Percentage" value={`${result.percentage}%`} />
              <SummaryStat label="Grade" value={result.grade} />
              <SummaryStat
                label="Rank"
                value={result.rank ? `${result.rank}/${result.outOf}` : '—'}
              />
            </View>
          </Card>

          <Card style={{ marginTop: spacing.lg }}>
            <AppText variant="h3" style={{ marginBottom: spacing.sm }}>
              Subject-wise Marks
            </AppText>
            <BarChart data={result.subjects.map((s) => ({ label: shortSubject(s.subject), value: s.marksObtained }))} />
          </Card>

          <View style={{ marginTop: spacing.lg }}>
            {result.subjects.map((s, idx) => (
              <Card
                key={s.subject}
                style={[styles.subjectCard, idx !== result.subjects.length - 1 && { marginBottom: spacing.sm }]}
              >
                <View style={styles.subjectRow}>
                  <AppText variant="bodyMedium">{s.subject}</AppText>
                  <View style={styles.subjectRight}>
                    <AppText variant="bodySemibold">
                      {s.marksObtained}/{s.maxMarks}
                    </AppText>
                    <Badge label={s.grade} tone="primary" size="sm" style={{ marginLeft: spacing.xs }} />
                  </View>
                </View>
              </Card>
            ))}
          </View>

          {result.teacherRemark && (
            <Card style={{ marginTop: spacing.lg }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Ionicons name="chatbubble-ellipses-outline" size={18} color={colors.primary} />
                <AppText variant="h3" style={{ marginLeft: 6 }}>
                  Teacher's Remark
                </AppText>
              </View>
              <AppText variant="body" color={colors.textSecondary} style={{ marginTop: spacing.sm, lineHeight: 22 }}>
                {result.teacherRemark}
              </AppText>
            </Card>
          )}

          <Button
            label="Download Report Card"
            icon="download-outline"
            variant="outline"
            fullWidth
            style={{ marginTop: spacing.xl }}
            onPress={() =>
              Alert.alert('Coming soon', 'Downloading report cards will be available once connected to the school system.')
            }
          />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

function shortSubject(subject: string): string {
  const map: Record<string, string> = {
    Mathematics: 'Math',
    'Social Studies': 'SST',
    'Computer Science': 'CS',
  };
  return map[subject] ?? subject;
}

function SummaryStat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.statItem}>
      <AppText variant="h1" style={{ fontSize: 20 }}>
        {value}
      </AppText>
      <AppText variant="tiny" color={colors.textSecondary}>
        {label}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxxl },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.lg,
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  statItem: { alignItems: 'center', flex: 1 },
  subjectCard: { paddingVertical: spacing.sm },
  subjectRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  subjectRight: { flexDirection: 'row', alignItems: 'center' },
});
