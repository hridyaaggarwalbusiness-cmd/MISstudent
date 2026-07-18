import React from 'react';
import { View, TextInput, StyleSheet } from 'react-native';
import { AnimatedPressable, AppText } from '@components/ui';
import { colors, radius, spacing } from '@theme';
import { AttemptAnswer, PaperQuestion } from '@/types';

const OPTION_LABELS = ['a', 'b', 'c', 'd', 'e', 'f'];

interface AttemptQuestionBlockProps {
  question: PaperQuestion;
  answer: AttemptAnswer | undefined;
  onChange: (answer: AttemptAnswer) => void;
}

export function AttemptQuestionBlock({ question: q, answer, onChange }: AttemptQuestionBlockProps) {
  const answered = q.type === 'match_following' ? (answer?.matchSelections?.some((s) => s >= 0) ?? false) : !!answer?.response?.trim();

  function setResponse(response: string) {
    onChange({ questionId: q.id, response });
  }

  function setMatchSelection(leftIndex: number, rightIndex: number) {
    const pairs = q.matchPairs ?? [];
    const current = answer?.matchSelections ?? pairs.map(() => -1);
    const next = [...current];
    next[leftIndex] = rightIndex;
    onChange({ questionId: q.id, response: '', matchSelections: next });
  }

  return (
    <View style={styles.wrap}>
      <View style={styles.headRow}>
        <AppText variant="body" style={{ flex: 1 }}>
          <AppText variant="bodySemibold">{`Q${q.number}. `}</AppText>
          {q.text}
        </AppText>
        <View style={[styles.marksBadge, answered && styles.marksBadgeDone]}>
          <AppText variant="tiny" color={answered ? colors.successStrong : colors.primary} style={{ fontWeight: '700' }}>
            {q.marks} {q.marks === 1 ? 'mark' : 'marks'}
          </AppText>
        </View>
      </View>

      {q.caseText && (
        <View style={styles.caseBox}>
          <AppText variant="caption" color={colors.textSecondary} style={{ fontStyle: 'italic' }}>
            {q.caseText}
          </AppText>
        </View>
      )}

      {(q.type === 'mcq' || (q.type === 'assertion_reason' && q.options)) && q.options && (
        <View style={{ marginTop: spacing.sm }}>
          {q.options.map((opt, i) => {
            const selected = answer?.response === opt;
            return (
              <AnimatedPressable
                key={i}
                onPress={() => setResponse(opt)}
                haptic={false}
                style={[styles.optionRow, selected && styles.optionRowSelected]}
              >
                <View style={[styles.radio, selected && styles.radioSelected]} />
                <AppText variant="caption" color={selected ? colors.primary : colors.textPrimary} style={{ flex: 1, marginLeft: 8 }}>
                  {q.type === 'mcq' ? `(${OPTION_LABELS[i]}) ${opt}` : opt}
                </AppText>
              </AnimatedPressable>
            );
          })}
        </View>
      )}

      {q.type === 'true_false' && (
        <View style={styles.trueFalseRow}>
          {['True', 'False'].map((opt) => {
            const selected = answer?.response === opt;
            return (
              <AnimatedPressable
                key={opt}
                onPress={() => setResponse(opt)}
                haptic={false}
                style={[styles.tfBtn, selected && styles.tfBtnSelected]}
              >
                <AppText variant="bodySemibold" color={selected ? colors.textInverse : colors.textPrimary}>
                  {opt}
                </AppText>
              </AnimatedPressable>
            );
          })}
        </View>
      )}

      {q.type === 'match_following' && q.matchPairs && (
        <View style={styles.matchWrap}>
          {q.matchPairs.map((pair, leftIndex) => {
            const selectedRight = answer?.matchSelections?.[leftIndex];
            return (
              <View key={leftIndex} style={styles.matchItem}>
                <AppText variant="caption" style={{ marginBottom: 6 }}>
                  {leftIndex + 1}. {pair.left}
                </AppText>
                <View style={styles.matchOptionRow}>
                  {q.matchPairs!.map((opt, rightIndex) => {
                    const selected = selectedRight === rightIndex;
                    return (
                      <AnimatedPressable
                        key={rightIndex}
                        onPress={() => setMatchSelection(leftIndex, rightIndex)}
                        haptic={false}
                        style={[styles.matchChip, selected && styles.matchChipSelected]}
                      >
                        <AppText variant="tiny" color={selected ? colors.textInverse : colors.textSecondary} numberOfLines={1}>
                          {opt.right}
                        </AppText>
                      </AnimatedPressable>
                    );
                  })}
                </View>
              </View>
            );
          })}
        </View>
      )}

      {(q.type === 'fill_blank' || q.type === 'very_short' || q.type === 'numerical') && (
        <TextInput
          value={answer?.response ?? ''}
          onChangeText={setResponse}
          placeholder="Type your answer..."
          placeholderTextColor={colors.textTertiary}
          style={styles.shortInput}
        />
      )}

      {(q.type === 'short' || q.type === 'long' || q.type === 'case_study' || (q.type === 'assertion_reason' && !q.options)) && (
        <TextInput
          value={answer?.response ?? ''}
          onChangeText={setResponse}
          placeholder="Write your answer..."
          placeholderTextColor={colors.textTertiary}
          multiline
          style={[styles.longInput, q.type === 'long' && { height: 120 }]}
          textAlignVertical="top"
        />
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
  marksBadgeDone: {
    backgroundColor: colors.successBg,
  },
  caseBox: {
    marginTop: spacing.xs,
    padding: spacing.sm,
    borderRadius: radius.sm,
    backgroundColor: colors.surfaceAlt,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: radius.sm,
    borderWidth: 1.5,
    borderColor: colors.borderSoft,
    marginBottom: 6,
  },
  optionRowSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
  },
  radio: {
    width: 18,
    height: 18,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    borderColor: colors.borderStrong,
  },
  radioSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  trueFalseRow: {
    flexDirection: 'row',
    marginTop: spacing.sm,
  },
  tfBtn: {
    flex: 1,
    height: 44,
    borderRadius: radius.sm,
    borderWidth: 1.5,
    borderColor: colors.borderSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  tfBtnSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  matchWrap: { marginTop: spacing.sm },
  matchItem: { marginBottom: spacing.sm },
  matchOptionRow: { flexDirection: 'row', flexWrap: 'wrap' },
  matchChip: {
    paddingHorizontal: 10,
    height: 32,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
    marginBottom: 6,
    maxWidth: 160,
  },
  matchChipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  shortInput: {
    marginTop: spacing.sm,
    height: 44,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    backgroundColor: colors.surfaceAlt,
    paddingHorizontal: spacing.md,
    fontSize: 14,
    color: colors.textPrimary,
    fontFamily: 'Inter_500Medium',
  },
  longInput: {
    marginTop: spacing.sm,
    minHeight: 70,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    backgroundColor: colors.surfaceAlt,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    fontSize: 14,
    color: colors.textPrimary,
    fontFamily: 'Inter_500Medium',
  },
});
