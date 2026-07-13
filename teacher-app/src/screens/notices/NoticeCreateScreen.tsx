import React, { useState } from 'react';
import { View, ScrollView, StyleSheet, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import * as DocumentPicker from 'expo-document-picker';
import { AppText, Card, Chip, Button, DetailHeader, AttachmentRow } from '@components/ui';
import { colors, spacing, radius } from '@theme';
import { useAuthStore } from '@store/useAuthStore';
import { repo, MAX_ATTACHMENT_BYTES } from '@data/repositories';
import { Attachment, NoticeCategory } from '@/types';

const CATEGORIES: NoticeCategory[] = ['general', 'academic', 'event', 'holiday'];

export function NoticeCreateScreen() {
  const navigation = useNavigation();
  const { teacher } = useAuthStore();
  const [category, setCategory] = useState<NoticeCategory>('general');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [pickedFile, setPickedFile] = useState<DocumentPicker.DocumentPickerAsset | null>(null);
  const [saving, setSaving] = useState(false);

  const pickFile = async () => {
    const result = await DocumentPicker.getDocumentAsync({ multiple: false, type: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'] });
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
    if (!teacher) return;
    if (!title.trim() || !body.trim()) {
      Alert.alert('Missing details', 'Please add a title and message.');
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
      await repo.notices.create({
        title: title.trim(),
        body: body.trim(),
        category,
        postedBy: teacher.id,
        postedByName: teacher.name,
        postedAt: new Date().toISOString(),
        targetClassIds: teacher.classIds,
        attachments,
      });
      navigation.goBack();
    } catch (e) {
      Alert.alert('Could not post notice', e instanceof Error ? e.message : 'Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <DetailHeader title="Post Notice" />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Card>
          <AppText variant="caption" color={colors.textSecondary} style={{ marginBottom: 6 }}>
            Category
          </AppText>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs }}>
            {CATEGORIES.map((c) => (
              <Chip key={c} label={c} active={category === c} onPress={() => setCategory(c)} />
            ))}
          </View>

          <AppText variant="caption" color={colors.textSecondary} style={{ marginTop: spacing.md, marginBottom: 6 }}>
            Title
          </AppText>
          <TextInput value={title} onChangeText={setTitle} placeholderTextColor={colors.textTertiary} style={styles.input} />

          <AppText variant="caption" color={colors.textSecondary} style={{ marginTop: spacing.md, marginBottom: 6 }}>
            Message
          </AppText>
          <TextInput
            value={body}
            onChangeText={setBody}
            multiline
            placeholderTextColor={colors.textTertiary}
            style={[styles.input, styles.textArea]}
          />

          <AppText variant="caption" color={colors.textSecondary} style={{ marginTop: spacing.md, marginBottom: 6 }}>
            Attachment (optional)
          </AppText>
          {pickedFile ? (
            <AttachmentRow
              attachment={{ id: 'pending', name: pickedFile.name, type: 'doc', url: pickedFile.uri }}
              onRemove={() => setPickedFile(null)}
            />
          ) : (
            <Button label="Attach PDF or Document" variant="outline" icon="attach-outline" onPress={pickFile} />
          )}
        </Card>

        <Button label="Post Notice" onPress={onSubmit} loading={saving} fullWidth icon="megaphone-outline" style={{ marginTop: spacing.lg }} />
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
  textArea: { height: 120, paddingTop: 10, textAlignVertical: 'top' },
});
