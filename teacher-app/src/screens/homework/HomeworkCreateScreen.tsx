import React, { useState } from 'react';
import { View, ScrollView, StyleSheet, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { AppText, Card, Chip, Button, DetailHeader } from '@components/ui';
import { colors, spacing, radius } from '@theme';
import { useAuthStore } from '@store/useAuthStore';
import { repo } from '@data/repositories';
import { formatISO, addDays } from 'date-fns';

export function HomeworkCreateScreen() {
  const navigation = useNavigation();
  const { teacher } = useAuthStore();
  const classId = teacher?.classIds?.[0];
  const subjects = teacher?.subjects ?? [];

  const [subject, setSubject] = useState(subjects[0] ?? '');
  const [title, setTitle] = useState('');
  const [instructions, setInstructions] = useState('');
  const [dueDate, setDueDate] = useState(formatISO(addDays(new Date(), 3), { representation: 'date' }));
  const [saving, setSaving] = useState(false);

  const onSubmit = async () => {
    if (!classId || !teacher) return;
    if (!title.trim() || !instructions.trim() || !subject) {
      Alert.alert('Missing details', 'Please fill in subject, title, and instructions.');
      return;
    }
    setSaving(true);
    try {
      await repo.homework.create({
        classId,
        subject,
        title: title.trim(),
        instructions: instructions.trim(),
        teacherId: teacher.id,
        teacherName: teacher.name,
        assignedDate: formatISO(new Date(), { representation: 'date' }),
        dueDate,
        attachments: [],
      });
      navigation.goBack();
    } catch (e) {
      Alert.alert('Could not post homework', e instanceof Error ? e.message : 'Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <DetailHeader title="Post Homework" />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Card>
          <AppText variant="caption" color={colors.textSecondary} style={{ marginBottom: 6 }}>
            Subject
          </AppText>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs }}>
            {subjects.map((s) => (
              <Chip key={s} label={s} active={subject === s} onPress={() => setSubject(s)} />
            ))}
          </View>

          <AppText variant="caption" color={colors.textSecondary} style={{ marginTop: spacing.md, marginBottom: 6 }}>
            Title
          </AppText>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="e.g. Quadratic Equations — Practice Set 4"
            placeholderTextColor={colors.textTertiary}
            style={styles.input}
          />

          <AppText variant="caption" color={colors.textSecondary} style={{ marginTop: spacing.md, marginBottom: 6 }}>
            Instructions
          </AppText>
          <TextInput
            value={instructions}
            onChangeText={setInstructions}
            placeholder="Describe what students need to do..."
            placeholderTextColor={colors.textTertiary}
            multiline
            style={[styles.input, styles.textArea]}
          />

          <AppText variant="caption" color={colors.textSecondary} style={{ marginTop: spacing.md, marginBottom: 6 }}>
            Due date (YYYY-MM-DD)
          </AppText>
          <TextInput
            value={dueDate}
            onChangeText={setDueDate}
            placeholderTextColor={colors.textTertiary}
            style={styles.input}
          />
        </Card>

        <Button
          label="Post Homework"
          onPress={onSubmit}
          loading={saving}
          fullWidth
          icon="paper-plane-outline"
          style={{ marginTop: spacing.lg }}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxxl },
  input: {
    height: 46,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceAlt,
    paddingHorizontal: spacing.sm,
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: colors.textPrimary,
  },
  textArea: { height: 100, paddingTop: 10, textAlignVertical: 'top' },
});
