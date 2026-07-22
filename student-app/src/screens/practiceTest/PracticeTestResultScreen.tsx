import React, { useEffect, useState } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { useRoute, RouteProp, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '@navigation/types';
import { AnimatedPressable, AppText, Button, Card, DetailHeader, IconButton } from '@components/ui';
import { QuestionBlock } from '@components/practiceTest/QuestionBlock';
import { colors, radius, spacing } from '@theme';
import { repo } from '@data/repositories';
import { paperProvider, PaperGenerationError } from '@services/ai';
import { downloadPracticeTestPdf, sharePracticeTestPdf, viewPracticeTestPdf } from '@utils/practiceTestPdf';
import { DIFFICULTY_LABEL, LANGUAGE_LABEL, PAPER_TYPE_LABEL } from '@data/practiceTestOptions';
import { GeneratedPaper } from '@/types';

type School = { name: string; address: string; phone: string };

export function PracticeTestResultScreen() {
  const route = useRoute<RouteProp<RootStackParamList, 'PracticeTestResult'>>();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [paper, setPaper] = useState<GeneratedPaper>(route.params.paper);
  const [showAnswers, setShowAnswers] = useState(false);
  const [regeneratingId, setRegeneratingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [school, setSchool] = useState<School>({ name: 'MIS School', address: '', phone: '' });

  useEffect(() => repo.school.subscribe((s) => s && setSchool(s)), []);

  const totalQuestions = paper.sections.reduce((sum, s) => sum + s.questions.length, 0);

  async function handleRegenerate(sectionId: string, questionId: string) {
    const section = paper.sections.find((s) => s.id === sectionId);
    const question = section?.questions.find((q) => q.id === questionId);
    if (!section || !question) return;

    setRegeneratingId(questionId);
    setActionError(null);
    try {
      const existingQuestionTexts = paper.sections.flatMap((s) => s.questions.map((q) => q.text)).filter((t) => t !== question.text);
      const replacement = await paperProvider.regenerateQuestion({
        request: {
          classLabel: paper.classLabel,
          subject: paper.subject,
          topics: paper.topics,
          paperType: paper.paperType,
          totalMarks: paper.totalMarks,
          difficulty: paper.difficulty,
          language: paper.language,
          durationMinutes: paper.durationMinutes,
        },
        existingQuestionTexts,
        sectionTitle: section.title,
        questionType: question.type,
        marks: question.marks,
      });

      setPaper((prev) => ({
        ...prev,
        sections: prev.sections.map((s) =>
          s.id !== sectionId
            ? s
            : {
                ...s,
                questions: s.questions.map((q) =>
                  q.id !== questionId
                    ? q
                    : { ...replacement, id: q.id, number: q.number, marks: q.marks, type: q.type },
                ),
              },
        ),
      }));
    } catch (err) {
      setActionError(err instanceof PaperGenerationError ? err.message : 'Could not regenerate that question. Please try again.');
    } finally {
      setRegeneratingId(null);
    }
  }

  return (
    <View style={styles.safe}>
      <DetailHeader
        title="Generated Paper"
        rightAction={
          <IconButton
            icon={showAnswers ? 'eye-off-outline' : 'key-outline'}
            onPress={() => setShowAnswers((v) => !v)}
            size={36}
          />
        }
      />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Card style={{ marginBottom: spacing.md }}>
          <View style={styles.badgeRow}>
            <Ionicons name="sparkles" size={14} color={colors.primary} />
            <AppText variant="tiny" color={colors.primary} style={{ marginLeft: 4, fontWeight: '700' }}>
              AI-GENERATED · {totalQuestions} QUESTIONS
            </AppText>
          </View>
          <AppText variant="h2" style={{ marginTop: 6 }}>
            {paper.title}
          </AppText>

          <View style={styles.metaGrid}>
            <MetaItem label="Class" value={paper.classLabel} />
            <MetaItem label="Subject" value={paper.subject} />
            <MetaItem label={paper.topics.length > 1 ? 'Topics' : 'Topic'} value={paper.topics.join(', ')} />
            <MetaItem label="Paper Type" value={PAPER_TYPE_LABEL[paper.paperType]} />
            <MetaItem label="Total Marks" value={String(paper.totalMarks)} />
            <MetaItem label="Difficulty" value={DIFFICULTY_LABEL[paper.difficulty]} />
            <MetaItem label="Language" value={LANGUAGE_LABEL[paper.language]} />
            <MetaItem label="Duration" value={paper.durationMinutes ? `${paper.durationMinutes} min` : 'Not specified'} />
          </View>

          {paper.generalInstructions.length > 0 && (
            <View style={styles.instructionsBox}>
              <AppText variant="tiny" color={colors.textTertiary} style={{ fontWeight: '700', marginBottom: 4 }}>
                GENERAL INSTRUCTIONS
              </AppText>
              {paper.generalInstructions.map((line, i) => (
                <AppText key={i} variant="caption" color={colors.textSecondary} style={{ marginTop: 2 }}>
                  {i + 1}. {line}
                </AppText>
              ))}
            </View>
          )}
        </Card>

        <Button
          label="Attempt This Test"
          icon="create"
          fullWidth
          onPress={() => navigation.navigate('PracticeTestAttempt', { paper })}
          style={{ marginBottom: spacing.md }}
        />

        {actionError && (
          <View style={styles.errorBox}>
            <Ionicons name="alert-circle" size={16} color={colors.danger} />
            <AppText variant="caption" color={colors.dangerStrong} style={{ marginLeft: 6, flex: 1 }}>
              {actionError}
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
                <QuestionBlock
                  key={q.id}
                  question={q}
                  showAnswer={showAnswers}
                  regenerating={regeneratingId === q.id}
                  onRegenerate={() => handleRegenerate(section.id, q.id)}
                />
              ))}
            </View>
          </Card>
        ))}

        <View style={styles.actionsGrid}>
          <ActionButton icon="refresh-circle-outline" label="Generate Another" onPress={() => navigation.goBack()} />
          <ActionButton
            icon={showAnswers ? 'eye-off-outline' : 'key-outline'}
            label={showAnswers ? 'Hide Answer Key' : 'Show Answer Key'}
            onPress={() => setShowAnswers((v) => !v)}
          />
          <ActionButton icon="download-outline" label="Download PDF" onPress={() => downloadPracticeTestPdf(paper, school)} />
          <ActionButton icon="print-outline" label="Print Paper" onPress={() => viewPracticeTestPdf(paper, school)} />
          <ActionButton icon="share-social-outline" label="Share PDF" onPress={() => sharePracticeTestPdf(paper, school)} />
        </View>

        <Button
          label="Generate Another Paper"
          variant="outline"
          icon="add-circle-outline"
          fullWidth
          onPress={() => navigation.goBack()}
          style={{ marginTop: spacing.sm }}
        />
      </ScrollView>
    </View>
  );
}

function MetaItem({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metaItem}>
      <AppText variant="tiny" color={colors.textTertiary}>
        {label}
      </AppText>
      <AppText variant="bodySemibold" style={{ marginTop: 1 }}>
        {value}
      </AppText>
    </View>
  );
}

function ActionButton({ icon, label, onPress }: { icon: keyof typeof Ionicons.glyphMap; label: string; onPress: () => void }) {
  return (
    <AnimatedPressable onPress={onPress} scaleTo={0.94} style={styles.actionCell}>
      <View pointerEvents="none">
        <IconButton icon={icon} size={46} />
      </View>
      <AppText variant="tiny" color={colors.textSecondary} align="center" style={{ marginTop: 4 }}>
        {label}
      </AppText>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.xxxl },
  badgeRow: { flexDirection: 'row', alignItems: 'center' },
  metaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.borderSoft,
  },
  metaItem: { width: '50%', marginBottom: spacing.sm },
  instructionsBox: {
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.borderSoft,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.dangerBg,
    borderRadius: radius.sm,
    padding: spacing.sm,
    marginBottom: spacing.md,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
  },
  actionCell: { width: '20%', alignItems: 'center', marginBottom: spacing.sm },
});
