import React from 'react';
import { View, TextInput, Image, StyleSheet, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { AnimatedPressable, AppText } from '@components/ui';
import { colors, radius, spacing } from '@theme';
import { AttemptAnswer, PaperQuestion } from '@/types';

const OPTION_LABELS = ['a', 'b', 'c', 'd', 'e', 'f'];

// Question types answered by free-text/handwriting - these are the only
// ones offered the "upload a photo instead" option (MCQ/True-False/Match
// are selection-based, so there's nothing to photograph).
const IMAGE_UPLOAD_TYPES = new Set(['fill_blank', 'very_short', 'numerical', 'short', 'long', 'case_study']);

function supportsImageUpload(q: PaperQuestion): boolean {
  if (IMAGE_UPLOAD_TYPES.has(q.type)) return true;
  return q.type === 'assertion_reason' && !q.options;
}

interface AttemptQuestionBlockProps {
  question: PaperQuestion;
  answer: AttemptAnswer | undefined;
  onChange: (answer: AttemptAnswer) => void;
}

export function AttemptQuestionBlock({ question: q, answer, onChange }: AttemptQuestionBlockProps) {
  const answered =
    q.type === 'match_following' ? (answer?.matchSelections?.some((s) => s >= 0) ?? false) : !!answer?.response?.trim() || !!answer?.answerImage;

  function setResponse(response: string) {
    onChange({ questionId: q.id, response, answerImage: undefined });
  }

  function setMatchSelection(leftIndex: number, rightIndex: number) {
    const pairs = q.matchPairs ?? [];
    const current = answer?.matchSelections ?? pairs.map(() => -1);
    const next = [...current];
    next[leftIndex] = rightIndex;
    onChange({ questionId: q.id, response: '', matchSelections: next });
  }

  async function pickAnswerImage() {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        base64: true,
        quality: 0.5,
      });
      if (result.canceled) return;
      const asset = result.assets?.[0];
      if (!asset?.base64) {
        Alert.alert("Couldn't read that photo", 'Please try picking the image again.');
        return;
      }
      const mimeType = asset.mimeType ?? 'image/jpeg';
      onChange({ questionId: q.id, response: '', answerImage: `data:${mimeType};base64,${asset.base64}` });
    } catch {
      Alert.alert("Couldn't open your photos", 'Please try again, or type your answer instead.');
    }
  }

  function clearAnswerImage() {
    onChange({ questionId: q.id, response: answer?.response ?? '', answerImage: undefined });
  }

  function renderTextOrImageAnswer(multiline: boolean) {
    if (answer?.answerImage) {
      return (
        <View style={styles.imageAnswerWrap}>
          <Image source={{ uri: answer.answerImage }} style={styles.imageAnswerPreview} resizeMode="contain" />
          <AnimatedPressable onPress={clearAnswerImage} haptic={false} style={styles.imageRemoveBtn}>
            <Ionicons name="close-circle" size={16} color={colors.textInverse} />
            <AppText variant="tiny" color={colors.textInverse} style={{ marginLeft: 4, fontWeight: '700' }}>
              Remove photo
            </AppText>
          </AnimatedPressable>
        </View>
      );
    }

    return (
      <>
        <TextInput
          value={answer?.response ?? ''}
          onChangeText={setResponse}
          placeholder={multiline ? 'Write your answer...' : 'Type your answer...'}
          placeholderTextColor={colors.textTertiary}
          multiline={multiline}
          style={[multiline ? styles.longInput : styles.shortInput, multiline && q.type === 'long' && { height: 120 }]}
          textAlignVertical={multiline ? 'top' : undefined}
        />
        {supportsImageUpload(q) && (
          <AnimatedPressable onPress={pickAnswerImage} haptic={false} style={styles.uploadBtn}>
            <Ionicons name="camera-outline" size={15} color={colors.primary} />
            <AppText variant="tiny" color={colors.primary} style={{ marginLeft: 5, fontWeight: '700' }}>
              Or upload a photo of your answer (e.g. a diagram)
            </AppText>
          </AnimatedPressable>
        )}
      </>
    );
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

      {(q.type === 'fill_blank' || q.type === 'very_short' || q.type === 'numerical') && renderTextOrImageAnswer(false)}

      {(q.type === 'short' || q.type === 'long' || q.type === 'case_study' || (q.type === 'assertion_reason' && !q.options)) &&
        renderTextOrImageAnswer(true)}
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
  uploadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  imageAnswerWrap: {
    marginTop: spacing.sm,
  },
  imageAnswerPreview: {
    width: '100%',
    height: 180,
    borderRadius: radius.sm,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.borderSoft,
  },
  imageRemoveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginTop: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.pill,
    backgroundColor: colors.dangerStrong,
  },
});
