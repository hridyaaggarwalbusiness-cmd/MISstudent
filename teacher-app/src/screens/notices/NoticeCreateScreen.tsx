import React, { useState } from 'react';
import { View, ScrollView, StyleSheet, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { AppText, Card, Chip, Button, DetailHeader } from '@components/ui';
import { colors, spacing, radius } from '@theme';
import { useAuthStore } from '@store/useAuthStore';
import { repo } from '@data/repositories';
import { NoticeCategory } from '@/types';

const CATEGORIES: NoticeCategory[] = ['general', 'holiday', 'event', 'exam', 'circular', 'competition'];

export function NoticeCreateScreen() {
  const navigation = useNavigation();
  const { teacher } = useAuthStore();
  const [category, setCategory] = useState<NoticeCategory>('general');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [saving, setSaving] = useState(false);

  const onSubmit = async () => {
    if (!teacher) return;
    if (!title.trim() || !body.trim()) {
      Alert.alert('Missing details', 'Please add a title and message.');
      return;
    }
    setSaving(true);
    try {
      await repo.notices.create({
        title: title.trim(),
        body: body.trim(),
        category,
        postedBy: teacher.id,
        postedByName: teacher.name,
        postedAt: new Date().toISOString(),
        targetClassIds: teacher.classIds,
        attachments: [],
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
