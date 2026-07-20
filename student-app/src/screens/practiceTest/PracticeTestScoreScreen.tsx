import React, { useState } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { useRoute, RouteProp, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '@navigation/types';
import { AppText, Button, Card, DetailHeader, ProgressRing } from '@components/ui';
import { colors, radius, spacing } from '@theme';
import { QuestionResult } from '@/types';

const GRADE_COLOR: Record<string, string> = {
  'A+': colors.successStrong,
  A: colors.successStrong,
  'B+': colors.success,
  B: colors.success,
  C: colors.warningStrong,
  D: colors.warningStrong,
  F: colors.dangerStrong,
};

export function PracticeTestScoreScreen() {
  const route = useRoute<RouteProp<RootStackParamList, 'PracticeTestScore'>>();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { paper, result } = route.params;
  const [showReview, setShowReview] = useState(true);

  const gradeColor = GRADE_COLOR[result.grade] ?? colors.primary;
  const allQuestions = paper.sections.flatMap((s) => s.questions);

  return (
    <View style={styles.safe}>
      <DetailHeader title="Your Score" />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Card style={styles.scoreCard}>
          <AppText variant="caption" color={colors.textTertiary}>
            {paper.title}
          </AppText>
          <View style={{ marginTop: spacing.md }}>
            <ProgressRing
              value={result.percentage}
              size={140}
              strokeWidth={14}
              goodThreshold={75}
              warningThreshold={50}
              centerContent={
                <View style={{ alignItems: 'center' }}>
                  <AppText variant="displayLg">{result.percentage}%</AppText>
                  <View style={[styles.gradeBadge, { backgroundColor: `${gradeColor}22` }]}>
                    <AppText variant="tiny" color={gradeColor} style={{ fontWeight: '800' }}>
                      GRADE {result.grade}
                    </AppText>
                  </View>
                </View>
              }
            />
          </View>
          <AppText variant="h2" style={{ marginTop: spacing.md }}>
            {result.totalMarksAwarded} / {result.totalMaxMarks} marks
          </AppText>
          <View style={styles.summaryRow}>
            <SummaryStat
              icon="checkmark-circle"
              color={colors.successStrong}
              value={result.questionResults.filter((r) => r.correct).length}
              label="Correct"
            />
            <SummaryStat
              icon="close-circle"
              color={colors.dangerStrong}
              value={result.questionResults.filter((r) => !r.correct && r.method !== 'unanswered').length}
              label="Incorrect"
            />
            <SummaryStat
              icon="help-circle"
              color={colors.textTertiary}
              value={result.questionResults.filter((r) => r.method === 'unanswered').length}
              label="Skipped"
            />
          </View>
        </Card>

        <View style={styles.actionsRow}>
          <Button
            label="Try Again"
            variant="outline"
            icon="refresh"
            style={{ flex: 1, marginRight: spacing.sm }}
            onPress={() => navigation.replace('PracticeTestAttempt', { paper })}
          />
          <Button
            label="Generate Another"
            icon="sparkles"
            style={{ flex: 1 }}
            onPress={() => navigation.navigate('PracticeTestGenerator')}
          />
        </View>

        <Card
          onPress={() => setShowReview((v) => !v)}
          style={{ marginTop: spacing.md, flexDirection: 'row', alignItems: 'center' }}
        >
          <AppText variant="h3" style={{ flex: 1 }}>
            Review Answers
          </AppText>
          <Ionicons name={showReview ? 'chevron-up' : 'chevron-down'} size={18} color={colors.textSecondary} />
        </Card>

        {showReview && (
          <View style={{ marginTop: spacing.sm }}>
            {result.questionResults.map((r) => {
              const q = allQuestions.find((item) => item.id === r.questionId);
              return <ReviewCard key={r.questionId} result={r} questionText={q?.text} questionNumber={q?.number} />;
            })}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

function SummaryStat({ icon, color, value, label }: { icon: keyof typeof Ionicons.glyphMap; color: string; value: number; label: string }) {
  return (
    <View style={styles.summaryStat}>
      <Ionicons name={icon} size={18} color={color} />
      <AppText variant="h3" style={{ marginTop: 4 }}>
        {value}
      </AppText>
      <AppText variant="tiny" color={colors.textTertiary}>
        {label}
      </AppText>
    </View>
  );
}

function ReviewCard({ result, questionText, questionNumber }: { result: QuestionResult; questionText?: string; questionNumber?: number }) {
  const statusColor = result.method === 'unanswered' ? colors.textTertiary : result.correct ? colors.successStrong : colors.dangerStrong;
  const statusIcon = result.method === 'unanswered' ? 'remove-circle' : result.correct ? 'checkmark-circle' : 'close-circle';

  return (
    <Card style={{ marginBottom: spacing.sm }}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
        <Ionicons name={statusIcon} size={18} color={statusColor} style={{ marginTop: 2 }} />
        <View style={{ flex: 1, marginLeft: 8 }}>
          <AppText variant="bodySemibold">
            {questionNumber ? `Q${questionNumber}. ` : ''}
            {questionText}
          </AppText>
        </View>
        <View style={[styles.marksPill, { backgroundColor: `${statusColor}18` }]}>
          <AppText variant="tiny" color={statusColor} style={{ fontWeight: '700' }}>
            {result.marksAwarded}/{result.maxMarks}
          </AppText>
        </View>
      </View>

      <View style={styles.answerRow}>
        <AppText variant="tiny" color={colors.textTertiary}>
          YOUR ANSWER
        </AppText>
        <AppText variant="caption" color={result.method === 'unanswered' ? colors.textTertiary : colors.textPrimary} style={{ marginTop: 2 }}>
          {result.studentAnswerText}
        </AppText>
      </View>

      {!result.correct && (
        <View style={styles.answerRow}>
          <AppText variant="tiny" color={colors.successStrong}>
            {result.method === 'ai' ? 'SAMPLE FULL-MARKS ANSWER' : 'CORRECT ANSWER'}
          </AppText>
          <AppText variant="caption" color={colors.textPrimary} style={{ marginTop: 2 }}>
            {result.correctAnswerText}
          </AppText>
        </View>
      )}

      {result.method === 'ai' && (result.explanation || result.missingConcepts?.length || result.incorrectConcepts?.length || result.suggestions) && (
        <View style={styles.answerRow}>
          <AppText variant="tiny" color={colors.textTertiary}>
            EXAMINER'S NOTES
          </AppText>
          {result.explanation && (
            <AppText variant="caption" color={colors.textPrimary} style={{ marginTop: 4 }}>
              {result.explanation}
            </AppText>
          )}
          {!!result.missingConcepts?.length && (
            <ConceptList label="Missing" color={colors.warningStrong} items={result.missingConcepts} />
          )}
          {!!result.incorrectConcepts?.length && (
            <ConceptList label="Incorrect" color={colors.dangerStrong} items={result.incorrectConcepts} />
          )}
          {result.suggestions && (
            <AppText variant="tiny" color={colors.primary} style={{ marginTop: 6, fontStyle: 'italic' }}>
              💡 {result.suggestions}
            </AppText>
          )}
        </View>
      )}
    </Card>
  );
}

function ConceptList({ label, color, items }: { label: string; color: string; items: string[] }) {
  return (
    <View style={{ marginTop: 4 }}>
      <AppText variant="tiny" color={color} style={{ fontWeight: '700' }}>
        {label}:
      </AppText>
      {items.map((item, i) => (
        <AppText key={i} variant="tiny" color={colors.textSecondary} style={{ marginTop: 1 }}>
          • {item}
        </AppText>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.xxxl },
  scoreCard: { alignItems: 'center', paddingVertical: spacing.xl },
  gradeBadge: {
    marginTop: 4,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: radius.pill,
  },
  summaryRow: {
    flexDirection: 'row',
    marginTop: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.borderSoft,
    width: '100%',
  },
  summaryStat: { flex: 1, alignItems: 'center' },
  actionsRow: { flexDirection: 'row', marginTop: spacing.md },
  marksPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.pill,
    marginLeft: 8,
  },
  answerRow: {
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.borderSoft,
  },
});
