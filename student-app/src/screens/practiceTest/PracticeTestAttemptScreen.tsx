import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, ScrollView, StyleSheet, Alert } from 'react-native';
import { useRoute, RouteProp, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '@navigation/types';
import { AppText, Button, Card, DetailHeader } from '@components/ui';
import { AttemptQuestionBlock } from '@components/practiceTest/AttemptQuestionBlock';
import { colors, radius, spacing } from '@theme';
import { gradeAttempt } from '@utils/gradePaper';
import { PaperGenerationError } from '@services/ai';
import { AttemptAnswer } from '@/types';

function formatClock(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export function PracticeTestAttemptScreen() {
  const route = useRoute<RouteProp<RootStackParamList, 'PracticeTestAttempt'>>();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { paper } = route.params;

  const allQuestions = useMemo(() => paper.sections.flatMap((s) => s.questions), [paper]);
  const [answers, setAnswers] = useState<Record<string, AttemptAnswer>>({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [secondsLeft, setSecondsLeft] = useState<number | null>(paper.durationMinutes ? paper.durationMinutes * 60 : null);
  const submittedRef = useRef(false);

  const answeredCount = allQuestions.filter((q) => {
    const a = answers[q.id];
    if (q.type === 'match_following') return a?.matchSelections?.some((s) => s >= 0) ?? false;
    return !!a?.response?.trim() || !!a?.answerImage;
  }).length;

  function updateAnswer(a: AttemptAnswer) {
    setAnswers((prev) => ({ ...prev, [a.questionId]: a }));
  }

  async function doSubmit() {
    if (submittedRef.current) return;
    submittedRef.current = true;
    setSubmitting(true);
    setError(null);
    try {
      const result = await gradeAttempt(paper, Object.values(answers));
      navigation.replace('PracticeTestScore', { paper, result });
    } catch (err) {
      submittedRef.current = false;
      setSubmitting(false);
      setError(err instanceof PaperGenerationError ? err.message : 'Could not grade your answers. Please try again.');
    }
  }

  function handleSubmitPress() {
    const unanswered = allQuestions.length - answeredCount;
    if (unanswered > 0) {
      Alert.alert(
        'Submit test?',
        `You still have ${unanswered} unanswered ${unanswered === 1 ? 'question' : 'questions'}. Submit anyway?`,
        [
          { text: 'Keep Attempting', style: 'cancel' },
          { text: 'Submit', style: 'destructive', onPress: doSubmit },
        ],
      );
    } else {
      doSubmit();
    }
  }

  useEffect(() => {
    if (secondsLeft === null) return;
    if (secondsLeft <= 0) {
      doSubmit();
      return;
    }
    const timer = setTimeout(() => setSecondsLeft((s) => (s !== null ? s - 1 : null)), 1000);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [secondsLeft]);

  if (submitting) {
    return (
      <View style={styles.loadingSafe}>
        <View style={styles.loadingIconWrap}>
          <Ionicons name="checkmark-done" size={36} color={colors.primary} />
        </View>
        <AppText variant="h2" align="center" style={{ marginTop: spacing.lg }}>
          Grading your answers...
        </AppText>
        <AppText variant="body" color={colors.textSecondary} align="center" style={{ marginTop: 6, maxWidth: 280 }}>
          Objective questions are scored instantly; written answers are being reviewed by AI. This usually takes a few seconds.
        </AppText>
      </View>
    );
  }

  return (
    <View style={styles.safe}>
      <DetailHeader
        title="Attempt Test"
        rightAction={
          secondsLeft !== null ? (
            <View style={[styles.timerBadge, secondsLeft <= 60 && styles.timerBadgeUrgent]}>
              <Ionicons name="time-outline" size={14} color={secondsLeft <= 60 ? colors.dangerStrong : colors.primary} />
              <AppText variant="tiny" color={secondsLeft <= 60 ? colors.dangerStrong : colors.primary} style={{ marginLeft: 4, fontWeight: '700' }}>
                {formatClock(secondsLeft)}
              </AppText>
            </View>
          ) : (
            <View style={styles.progressBadge}>
              <AppText variant="tiny" color={colors.primary} style={{ fontWeight: '700' }}>
                {answeredCount}/{allQuestions.length}
              </AppText>
            </View>
          )
        }
      />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Card style={{ marginBottom: spacing.md }}>
          <AppText variant="h3">{paper.title}</AppText>
          <AppText variant="caption" color={colors.textTertiary} style={{ marginTop: 4 }}>
            {answeredCount} of {allQuestions.length} questions answered · {paper.totalMarks} marks total
          </AppText>
        </Card>

        {error && (
          <View style={styles.errorBox}>
            <Ionicons name="alert-circle" size={16} color={colors.danger} />
            <AppText variant="caption" color={colors.dangerStrong} style={{ marginLeft: 6, flex: 1 }}>
              {error}
            </AppText>
          </View>
        )}

        {paper.sections.map((section) => (
          <Card key={section.id} style={{ marginBottom: spacing.md }}>
            <AppText variant="h3">{section.title}</AppText>
            {section.instructions && (
              <AppText variant="caption" color={colors.textTertiary} style={{ marginTop: 2, fontStyle: 'italic' }}>
                {section.instructions}
              </AppText>
            )}
            <View style={{ marginTop: spacing.sm }}>
              {section.questions.map((q) => (
                <AttemptQuestionBlock key={q.id} question={q} answer={answers[q.id]} onChange={updateAnswer} />
              ))}
            </View>
          </Card>
        ))}

        <Button label="Submit Test" icon="checkmark-circle" fullWidth onPress={handleSubmitPress} style={{ marginTop: spacing.sm }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.xxxl },
  progressBadge: {
    paddingHorizontal: 10,
    height: 30,
    borderRadius: radius.pill,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    height: 30,
    borderRadius: radius.pill,
    backgroundColor: colors.primarySoft,
  },
  timerBadgeUrgent: {
    backgroundColor: colors.dangerBg,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.dangerBg,
    borderRadius: radius.sm,
    padding: spacing.sm,
    marginBottom: spacing.md,
  },
  loadingSafe: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xxl,
  },
  loadingIconWrap: {
    width: 84,
    height: 84,
    borderRadius: radius.xl,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
