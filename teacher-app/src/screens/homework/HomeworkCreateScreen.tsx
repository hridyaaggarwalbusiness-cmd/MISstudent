import React, { useEffect, useState } from 'react';
import { View, ScrollView, StyleSheet, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import * as DocumentPicker from 'expo-document-picker';
import { formatISO, addDays } from 'date-fns';
import { AppText, Button, DetailHeader, SelectField, AttachmentRow, AnimatedPressable } from '@components/ui';
import { colors, spacing, radius } from '@theme';
import { useAuthStore } from '@store/useAuthStore';
import { repo, MAX_ATTACHMENT_BYTES } from '@data/repositories';
import { Attachment, Homework, SchoolClass } from '@/types';

export function HomeworkCreateScreen() {
  const navigation = useNavigation();
  const { teacher } = useAuthStore();
  const subjects = teacher?.subjects ?? [];

  const [classInfo, setClassInfo] = useState<Record<string, SchoolClass | null>>({});
  const [classId, setClassId] = useState(teacher?.classIds?.[0] ?? '');
  const [subject, setSubject] = useState(subjects[0] ?? '');
  const [title, setTitle] = useState('');
  const [homeworkText, setHomeworkText] = useState('');
  const [classWork, setClassWork] = useState('');
  const [pickedFile, setPickedFile] = useState<DocumentPicker.DocumentPickerAsset | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!teacher) return;
    Promise.all(teacher.classIds.map((id) => repo.classes.get(id).then((info) => [id, info] as const))).then(
      (entries) => {
        setClassInfo(Object.fromEntries(entries));
      },
    );
  }, [teacher]);

  const classOptions = (teacher?.classIds ?? []).map((id) => {
    const info = classInfo[id];
    return { value: id, label: info ? `${info.name} · Section ${info.section}` : id };
  });
  const subjectOptions = subjects.map((s) => ({ value: s, label: s }));

  const pickFile = async () => {
    const result = await DocumentPicker.getDocumentAsync({ multiple: false });
    if (!result.canceled && result.assets?.[0]) {
      const asset = result.assets[0];
      if (asset.size && asset.size > MAX_ATTACHMENT_BYTES) {
        Alert.alert(
          'File too large',
          `Cloud Storage isn't enabled on this project, so attachments are limited to ${Math.round(MAX_ATTACHMENT_BYTES / 1024)} KB.`,
        );
        return;
      }
      setPickedFile(asset);
    }
  };

  const onSubmit = async () => {
    if (!classId || !teacher) return;
    if (!title.trim() || !homeworkText.trim() || !subject) {
      Alert.alert('Missing details', 'Please fill in class, subject, title, and homework.');
      return;
    }
    setSaving(true);
    try {
      let attachments: Attachment[] = [];
      if (pickedFile) {
        const response = await fetch(pickedFile.uri);
        const blob = await response.blob();
        const url = await repo.storage.upload(blob);
        attachments = [
          {
            id: `${Date.now()}`,
            name: pickedFile.name,
            type: pickedFile.mimeType?.includes('pdf') ? 'pdf' : 'doc',
            url,
            sizeLabel: pickedFile.size ? `${Math.round(pickedFile.size / 1024)} KB` : undefined,
          },
        ];
      }
      const payload: Omit<Homework, 'id'> = {
        classId,
        subject,
        title: title.trim(),
        instructions: homeworkText.trim(),
        teacherId: teacher.id,
        teacherName: teacher.name,
        assignedDate: formatISO(new Date(), { representation: 'date' }),
        // Due dates aren't shown anywhere in the UI, but the field is still
        // part of the Homework schema, so keep writing a placeholder value.
        dueDate: formatISO(addDays(new Date(), 7), { representation: 'date' }),
        attachments,
      };
      // Firestore rejects `undefined` field values outright (this project
      // isn't configured with ignoreUndefinedProperties), so an empty
      // Class Work must be an absent key, not classWork: undefined.
      if (classWork.trim()) payload.classWork = classWork.trim();
      await repo.homework.create(payload);
      navigation.goBack();
    } catch (e) {
      Alert.alert('Could not post homework', e instanceof Error ? e.message : 'Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <DetailHeader
        title="Add Homework"
        rightAction={
          <AnimatedPressable onPress={onSubmit} haptic={false} disabled={saving}>
            <AppText variant="bodySemibold" color={colors.primary}>
              Publish
            </AppText>
          </AnimatedPressable>
        }
      />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Field label="Select Class">
          <SelectField value={classId} options={classOptions} onChange={setClassId} placeholder="Select a class" title="Select Class" />
        </Field>

        <Field label="Subject">
          <SelectField value={subject} options={subjectOptions} onChange={setSubject} placeholder="Select a subject" title="Subject" />
        </Field>

        <Field label="Title">
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="e.g. Quadratic Equations — Practice Set 4"
            placeholderTextColor={colors.textTertiary}
            style={styles.input}
          />
        </Field>

        <Field label="Homework">
          <TextInput
            value={homeworkText}
            onChangeText={setHomeworkText}
            placeholder="What students need to do at home..."
            placeholderTextColor={colors.textTertiary}
            multiline
            style={[styles.input, styles.textArea]}
          />
        </Field>

        <Field label="Class Work">
          <TextInput
            value={classWork}
            onChangeText={setClassWork}
            placeholder="What was covered in class today..."
            placeholderTextColor={colors.textTertiary}
            multiline
            style={[styles.input, styles.textArea]}
          />
        </Field>

        <Field label="Attach File (Optional)">
          {pickedFile ? (
            <AttachmentRow
              attachment={{ id: 'pending', name: pickedFile.name, type: 'doc', url: pickedFile.uri }}
              onRemove={() => setPickedFile(null)}
            />
          ) : (
            <Button label="Attach a File" variant="outline" icon="attach-outline" onPress={pickFile} />
          )}
        </Field>

        <Button label="Publish" onPress={onSubmit} loading={saving} fullWidth style={{ marginTop: spacing.sm }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={{ marginBottom: spacing.lg }}>
      <AppText variant="caption" color={colors.textSecondary} style={{ marginBottom: 6 }}>
        {label}
      </AppText>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg, paddingBottom: spacing.xxxl },
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
  textArea: { height: 90, paddingTop: 10, textAlignVertical: 'top' },
});
