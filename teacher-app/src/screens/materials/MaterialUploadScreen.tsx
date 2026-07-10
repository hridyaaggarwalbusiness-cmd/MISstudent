import React, { useState } from 'react';
import { View, ScrollView, StyleSheet, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import * as DocumentPicker from 'expo-document-picker';
import { AppText, Card, Chip, Button, DetailHeader, AttachmentRow } from '@components/ui';
import { colors, spacing, radius } from '@theme';
import { useAuthStore } from '@store/useAuthStore';
import { repo, MAX_ATTACHMENT_BYTES } from '@data/repositories';
import { Attachment, MaterialType } from '@/types';

const TYPES: { key: MaterialType; label: string }[] = [
  { key: 'note', label: 'Notes' },
  { key: 'presentation', label: 'Presentation' },
  { key: 'worksheet', label: 'Worksheet' },
  { key: 'question_bank', label: 'Question Bank' },
  { key: 'video', label: 'Video Lecture' },
];

export function MaterialUploadScreen() {
  const navigation = useNavigation();
  const { teacher } = useAuthStore();
  const classId = teacher?.classIds?.[0];
  const subjects = teacher?.subjects ?? [];

  const [type, setType] = useState<MaterialType>('note');
  const [subject, setSubject] = useState(subjects[0] ?? '');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [pickedFile, setPickedFile] = useState<DocumentPicker.DocumentPickerAsset | null>(null);
  const [saving, setSaving] = useState(false);

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
    if (!title.trim() || !subject || !pickedFile) {
      Alert.alert('Missing details', 'Please add a title, subject, and attach a file.');
      return;
    }
    setSaving(true);
    try {
      const response = await fetch(pickedFile.uri);
      const blob = await response.blob();
      const url = await repo.storage.upload(blob);

      const attachment: Attachment = {
        id: `${Date.now()}`,
        name: pickedFile.name,
        type: pickedFile.mimeType?.includes('pdf') ? 'pdf' : pickedFile.mimeType?.includes('video') ? 'video' : 'doc',
        url,
        sizeLabel: pickedFile.size ? `${Math.round(pickedFile.size / 1024)} KB` : undefined,
      };

      await repo.materials.create({
        classId,
        title: title.trim(),
        description: description.trim() || undefined,
        subject,
        type,
        uploadedBy: teacher.id,
        uploadedByName: teacher.name,
        attachment,
      });
      navigation.goBack();
    } catch (e) {
      Alert.alert('Could not upload', e instanceof Error ? e.message : 'Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <DetailHeader title="Upload Material" />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Card>
          <AppText variant="caption" color={colors.textSecondary} style={{ marginBottom: 6 }}>
            Type
          </AppText>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs }}>
            {TYPES.map((t) => (
              <Chip key={t.key} label={t.label} active={type === t.key} onPress={() => setType(t.key)} />
            ))}
          </View>

          <AppText variant="caption" color={colors.textSecondary} style={{ marginTop: spacing.md, marginBottom: 6 }}>
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
          <TextInput value={title} onChangeText={setTitle} placeholderTextColor={colors.textTertiary} style={styles.input} />

          <AppText variant="caption" color={colors.textSecondary} style={{ marginTop: spacing.md, marginBottom: 6 }}>
            Description (optional)
          </AppText>
          <TextInput
            value={description}
            onChangeText={setDescription}
            multiline
            placeholderTextColor={colors.textTertiary}
            style={[styles.input, styles.textArea]}
          />

          <AppText variant="caption" color={colors.textSecondary} style={{ marginTop: spacing.md, marginBottom: 6 }}>
            File
          </AppText>
          {pickedFile ? (
            <AttachmentRow
              attachment={{ id: 'pending', name: pickedFile.name, type: 'doc', url: pickedFile.uri }}
              onRemove={() => setPickedFile(null)}
            />
          ) : (
            <Button label="Choose File" variant="outline" icon="attach-outline" onPress={pickFile} />
          )}
        </Card>

        <Button
          label="Upload"
          onPress={onSubmit}
          loading={saving}
          fullWidth
          icon="cloud-upload-outline"
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
  textArea: { height: 80, paddingTop: 10, textAlignVertical: 'top' },
});
