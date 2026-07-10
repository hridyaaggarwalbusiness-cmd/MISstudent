import React, { useState } from 'react';
import { View, ScrollView, StyleSheet, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, RouteProp } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { Ionicons } from '@expo/vector-icons';
import {
  AppText,
  Card,
  Badge,
  BadgeTone,
  Button,
  DetailHeader,
  AttachmentRow,
  ErrorState,
  Skeleton,
} from '@components/ui';
import { colors, spacing, radius } from '@theme';
import { RootStackParamList } from '@navigation/types';
import { useHomeworkStore } from '@store/useHomeworkStore';
import { friendlyDate, dueInLabel } from '@utils/date';
import { Attachment } from '@/types';

const statusMeta: Record<string, { label: string; tone: BadgeTone }> = {
  pending: { label: 'Pending', tone: 'warning' },
  submitted: { label: 'Submitted', tone: 'info' },
  graded: { label: 'Graded', tone: 'success' },
  overdue: { label: 'Overdue', tone: 'danger' },
};

export function HomeworkDetailScreen() {
  const route = useRoute<RouteProp<RootStackParamList, 'HomeworkDetail'>>();
  const { items, loading, submit } = useHomeworkStore();
  const homework = items.find((h) => h.id === route.params.id);

  const [note, setNote] = useState('');
  const [draftAttachments, setDraftAttachments] = useState<Attachment[]>([]);
  const [submitting, setSubmitting] = useState(false);

  if (!homework) {
    return (
      <SafeAreaView style={styles.safe}>
        <DetailHeader title="Homework" />
        {loading ? (
          <View style={{ padding: spacing.lg }}>
            <Skeleton height={120} borderRadius={16} />
          </View>
        ) : (
          <ErrorState title="Homework not found" message="This assignment may have been removed." />
        )}
      </SafeAreaView>
    );
  }

  const due = dueInLabel(homework.dueDate);
  const status = statusMeta[homework.status];
  const canSubmit = homework.status === 'pending' || homework.status === 'overdue';

  const addPhoto = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permission needed', 'Allow photo library access to attach an image.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({ quality: 0.7 });
    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      setDraftAttachments((prev) => [
        ...prev,
        {
          id: `draft_${Date.now()}`,
          name: asset.fileName ?? `photo-${prev.length + 1}.jpg`,
          type: 'image',
          url: asset.uri,
        },
      ]);
    }
  };

  const addDocument = async () => {
    const result = await DocumentPicker.getDocumentAsync({ multiple: false });
    if (!result.canceled && result.assets && result.assets[0]) {
      const asset = result.assets[0];
      setDraftAttachments((prev) => [
        ...prev,
        {
          id: `draft_${Date.now()}`,
          name: asset.name,
          type: asset.mimeType?.includes('pdf') ? 'pdf' : 'doc',
          url: asset.uri,
          sizeLabel: asset.size ? `${Math.round(asset.size / 1024)} KB` : undefined,
        },
      ]);
    }
  };

  const removeDraft = (id: string) => {
    setDraftAttachments((prev) => prev.filter((a) => a.id !== id));
  };

  const handleSubmit = async () => {
    if (draftAttachments.length === 0 && !note.trim()) {
      Alert.alert('Nothing to submit', 'Attach a file or add a note before submitting.');
      return;
    }
    setSubmitting(true);
    try {
      await submit(homework.id, { attachments: draftAttachments, note: note.trim() || undefined });
      setNote('');
      setDraftAttachments([]);
    } catch (e) {
      Alert.alert('Could not submit', e instanceof Error ? e.message : 'Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <DetailHeader title="Homework" />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.topRow}>
          <Badge label={homework.subject} tone="neutral" />
          <Badge label={status.label} tone={status.tone} />
        </View>
        <AppText variant="displayMd" style={{ marginTop: spacing.sm }}>
          {homework.title}
        </AppText>

        <View style={styles.metaGrid}>
          <MetaItem icon="person-outline" label="Teacher" value={homework.teacher} />
          <MetaItem icon="calendar-outline" label="Assigned" value={friendlyDate(homework.assignedDate)} />
          <MetaItem
            icon="time-outline"
            label="Due date"
            value={friendlyDate(homework.dueDate)}
            valueColor={due.overdue ? colors.danger : undefined}
          />
        </View>

        <Card style={{ marginTop: spacing.lg }}>
          <AppText variant="h3">Instructions</AppText>
          <AppText variant="body" color={colors.textSecondary} style={{ marginTop: spacing.xs, lineHeight: 22 }}>
            {homework.instructions}
          </AppText>
        </Card>

        {homework.attachments.length > 0 && (
          <View style={{ marginTop: spacing.lg }}>
            <AppText variant="h3" style={{ marginBottom: spacing.sm }}>
              Attachments
            </AppText>
            {homework.attachments.map((a) => (
              <AttachmentRow
                key={a.id}
                attachment={a}
                onPress={() => Alert.alert(a.name, 'Preview isn’t available for this file type in this build yet.')}
              />
            ))}
          </View>
        )}

        {homework.submission && (
          <Card style={{ marginTop: spacing.lg }} bordered={false} elevation="none">
            <View>
              <View style={styles.submissionHeader}>
                <Ionicons name="checkmark-circle" size={20} color={colors.success} />
                <AppText variant="h3" style={{ marginLeft: 6 }}>
                  Your Submission
                </AppText>
              </View>
              <AppText variant="caption" color={colors.textSecondary} style={{ marginTop: 2 }}>
                Submitted {friendlyDate(homework.submission.submittedAt)}
              </AppText>
              {homework.submission.note && (
                <AppText variant="body" style={{ marginTop: spacing.sm }}>
                  {homework.submission.note}
                </AppText>
              )}
              {homework.submission.attachments.map((a) => (
                <AttachmentRow key={a.id} attachment={a} onPress={() => {}} />
              ))}
            </View>
          </Card>
        )}

        {homework.remarks && (
          <Card style={{ marginTop: spacing.lg }}>
            <View style={styles.remarksHeader}>
              <AppText variant="h3">Teacher Remarks</AppText>
              {homework.remarks.grade && <Badge label={`Grade ${homework.remarks.grade}`} tone="success" />}
            </View>
            {homework.remarks.marks !== undefined && (
              <AppText variant="displayMd" style={{ marginTop: spacing.sm, fontSize: 22 }}>
                {homework.remarks.marks}
                <AppText variant="body" color={colors.textSecondary}>
                  {' '}
                  / {homework.remarks.maxMarks}
                </AppText>
              </AppText>
            )}
            <AppText variant="body" color={colors.textSecondary} style={{ marginTop: spacing.sm, lineHeight: 22 }}>
              {homework.remarks.comment}
            </AppText>
            <AppText variant="tiny" color={colors.textTertiary} style={{ marginTop: spacing.sm }}>
              Graded on {friendlyDate(homework.remarks.gradedAt)}
            </AppText>
          </Card>
        )}

        {canSubmit && (
          <Card style={{ marginTop: spacing.lg }}>
            <AppText variant="h3">Submit your work</AppText>
            <TextInput
              value={note}
              onChangeText={setNote}
              placeholder="Add a note for your teacher (optional)"
              placeholderTextColor={colors.textTertiary}
              multiline
              style={styles.noteInput}
            />
            {draftAttachments.map((a) => (
              <AttachmentRow key={a.id} attachment={a} onRemove={() => removeDraft(a.id)} />
            ))}
            <View style={styles.attachRow}>
              <Button label="Add Photo" icon="image-outline" variant="outline" size="sm" onPress={addPhoto} />
              <Button label="Add File" icon="document-outline" variant="outline" size="sm" onPress={addDocument} />
            </View>
            <Button
              label={submitting ? 'Submitting…' : 'Submit Homework'}
              onPress={handleSubmit}
              loading={submitting}
              fullWidth
              style={{ marginTop: spacing.md }}
              icon="paper-plane-outline"
            />
          </Card>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function MetaItem({
  icon,
  label,
  value,
  valueColor,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  valueColor?: string;
}) {
  return (
    <View style={styles.metaItem}>
      <View style={styles.metaIconWrap}>
        <Ionicons name={icon} size={15} color={colors.textSecondary} />
      </View>
      <View style={{ marginLeft: 8 }}>
        <AppText variant="tiny" color={colors.textTertiary}>
          {label}
        </AppText>
        <AppText variant="bodyMedium" color={valueColor ?? colors.textPrimary}>
          {value}
        </AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxxl },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  metaGrid: {
    marginTop: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    padding: spacing.md,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  metaIconWrap: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submissionHeader: { flexDirection: 'row', alignItems: 'center' },
  remarksHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  noteInput: {
    marginTop: spacing.sm,
    minHeight: 80,
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.sm,
    padding: spacing.sm,
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: colors.textPrimary,
    textAlignVertical: 'top',
  },
  attachRow: {
    flexDirection: 'row',
    marginTop: spacing.sm,
    gap: spacing.xs,
  },
});
