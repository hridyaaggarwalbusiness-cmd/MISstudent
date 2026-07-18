import React, { useState } from 'react';
import { View, TextInput, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AnimatedPressable, AppText } from '@components/ui';
import { colors, radius, spacing } from '@theme';

interface TopicTagInputProps {
  topics: string[];
  onChange: (topics: string[]) => void;
  placeholder?: string;
}

// Lets a student add several chapters/topics to one paper (e.g. "Photosynthesis"
// + "Respiration in Plants") instead of being limited to a single free-text
// field - each entry becomes its own removable chip.
export function TopicTagInput({ topics, onChange, placeholder }: TopicTagInputProps) {
  const [draft, setDraft] = useState('');

  function addDraft() {
    const value = draft.trim();
    if (!value) return;
    if (topics.some((t) => t.toLowerCase() === value.toLowerCase())) {
      setDraft('');
      return;
    }
    onChange([...topics, value]);
    setDraft('');
  }

  function removeTopic(index: number) {
    onChange(topics.filter((_, i) => i !== index));
  }

  return (
    <View>
      {topics.length > 0 && (
        <View style={styles.chipRow}>
          {topics.map((topic, i) => (
            <View key={`${topic}-${i}`} style={styles.chip}>
              <AppText variant="bodyMedium" color={colors.primary} numberOfLines={1} style={{ maxWidth: 200 }}>
                {topic}
              </AppText>
              <AnimatedPressable onPress={() => removeTopic(i)} haptic={false} style={{ marginLeft: 6 }}>
                <Ionicons name="close-circle" size={16} color={colors.primary} />
              </AnimatedPressable>
            </View>
          ))}
        </View>
      )}
      <View style={styles.inputRow}>
        <TextInput
          value={draft}
          onChangeText={setDraft}
          placeholder={placeholder ?? 'Type a chapter/topic and press +'}
          placeholderTextColor={colors.textTertiary}
          style={styles.input}
          onSubmitEditing={addDraft}
          returnKeyType="done"
        />
        <AnimatedPressable onPress={addDraft} style={styles.addBtn} haptic={false}>
          <Ionicons name="add" size={20} color={colors.textInverse} />
        </AnimatedPressable>
      </View>
      <AppText variant="tiny" color={colors.textTertiary} style={{ marginTop: 6 }}>
        Add one or more topics - the paper will include questions from every topic you add.
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: spacing.sm,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primarySoft,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    height: 34,
    marginRight: 8,
    marginBottom: 8,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    height: 46,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    backgroundColor: colors.surfaceAlt,
    paddingHorizontal: spacing.md,
    fontSize: 14,
    color: colors.textPrimary,
    fontFamily: 'Inter_500Medium',
  },
  addBtn: {
    width: 46,
    height: 46,
    borderRadius: radius.sm,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: spacing.sm,
  },
});
