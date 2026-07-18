import React from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AnimatedPressable, AppText } from '@components/ui';
import { colors, radius, spacing } from '@theme';
import { PaperQuestion } from '@/types';

const OPTION_LABELS = ['a', 'b', 'c', 'd', 'e', 'f'];

interface QuestionBlockProps {
  question: PaperQuestion;
  showAnswer: boolean;
  onRegenerate?: () => void;
  regenerating?: boolean;
}

export function QuestionBlock({ question: q, showAnswer, onRegenerate, regenerating }: QuestionBlockProps) {
  const showAnswerLines = q.type === 'short' || q.type === 'long';

  return (
    <View style={styles.wrap}>
      <View style={styles.headRow}>
        <AppText variant="body" style={{ flex: 1 }}>
          <AppText variant="bodySemibold">{`Q${q.number}. `}</AppText>
          {q.text}
        </AppText>
        <View style={styles.marksBadge}>
          <AppText variant="tiny" color={colors.primary} style={{ fontWeight: '700' }}>
            {q.marks} {q.marks === 1 ? 'mark' : 'marks'}
          </AppText>
        </View>
      </View>

      {onRegenerate && (
        <AnimatedPressable onPress={onRegenerate} disabled={regenerating} style={styles.regenBtn} haptic={false}>
          {regenerating ? (
            <ActivityIndicator size="small" color={colors.textTertiary} />
          ) : (
            <>
              <Ionicons name="refresh" size={12} color={colors.textTertiary} />
              <AppText variant="tiny" color={colors.textTertiary} style={{ marginLeft: 4 }}>
                Regenerate
              </AppText>
            </>
          )}
        </AnimatedPressable>
      )}

      {q.caseText && (
        <View style={styles.caseBox}>
          <AppText variant="caption" color={colors.textSecondary} style={{ fontStyle: 'italic' }}>
            {q.caseText}
          </AppText>
        </View>
      )}

      {q.type === 'mcq' && q.options && (
        <View style={{ marginTop: spacing.xs }}>
          {q.options.map((opt, i) => {
            const isCorrect = showAnswer && q.answer.toLowerCase().includes(opt.toLowerCase());
            return (
              <View key={i} style={styles.optionRow}>
                <AppText variant="caption" color={isCorrect ? colors.successStrong : colors.textSecondary} style={{ fontWeight: isCorrect ? '700' : '500' }}>
                  ({OPTION_LABELS[i]}) {opt}
                </AppText>
                {isCorrect && <Ionicons name="checkmark-circle" size={14} color={colors.successStrong} style={{ marginLeft: 6 }} />}
              </View>
            );
          })}
        </View>
      )}

      {q.type === 'match_following' && q.matchPairs && (
        <View style={styles.matchTable}>
          <View style={styles.matchHeaderRow}>
            <AppText variant="tiny" color={colors.textTertiary} style={styles.matchCol}>
              COLUMN A
            </AppText>
            <AppText variant="tiny" color={colors.textTertiary} style={styles.matchCol}>
              COLUMN B
            </AppText>
          </View>
          {q.matchPairs.map((pair, i) => (
            <View key={i} style={styles.matchRow}>
              <AppText variant="caption" style={styles.matchCol}>
                {i + 1}. {pair.left}
              </AppText>
              <AppText variant="caption" style={styles.matchCol}>
                {String.fromCharCode(97 + i)}. {pair.right}
              </AppText>
            </View>
          ))}
        </View>
      )}

      {showAnswerLines && !showAnswer && (
        <View style={{ marginTop: spacing.xs }}>
          {Array.from({ length: q.type === 'long' ? 3 : 1 }).map((_, i) => (
            <View key={i} style={styles.answerLine} />
          ))}
        </View>
      )}

      {showAnswer && (
        <View style={styles.answerBox}>
          <AppText variant="tiny" color={colors.successStrong} style={{ fontWeight: '700' }}>
            ANSWER
          </AppText>
          <AppText variant="caption" color={colors.textPrimary} style={{ marginTop: 2 }}>
            {q.answer}
          </AppText>
          {q.explanation && (
            <AppText variant="tiny" color={colors.textTertiary} style={{ marginTop: 4 }}>
              {q.explanation}
            </AppText>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.borderSoft,
  },
  headRow: { flexDirection: 'row', alignItems: 'flex-start' },
  marksBadge: {
    marginLeft: spacing.sm,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.pill,
    backgroundColor: colors.primarySoft,
  },
  regenBtn: { flexDirection: 'row', alignItems: 'center', marginTop: 6 },
  caseBox: {
    marginTop: spacing.xs,
    padding: spacing.sm,
    borderRadius: radius.sm,
    backgroundColor: colors.surfaceAlt,
  },
  optionRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 2, paddingLeft: spacing.md },
  matchTable: { marginTop: spacing.xs, paddingLeft: spacing.md },
  matchHeaderRow: { flexDirection: 'row', marginBottom: 4 },
  matchRow: { flexDirection: 'row', paddingVertical: 2 },
  matchCol: { flex: 1 },
  answerLine: {
    height: 1,
    borderBottomWidth: 1,
    borderStyle: 'dashed',
    borderBottomColor: colors.borderStrong,
    marginTop: 12,
    marginLeft: spacing.md,
  },
  answerBox: {
    marginTop: spacing.sm,
    padding: spacing.sm,
    borderRadius: radius.sm,
    backgroundColor: colors.successBg,
  },
});
