import React, { useEffect, useMemo, useState } from 'react';
import { View, ScrollView, StyleSheet, Modal, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, RouteProp } from '@react-navigation/native';
import { AppText, Card, Badge, BadgeTone, Button, DetailHeader, EmptyState, Skeleton } from '@components/ui';
import { colors, spacing, radius } from '@theme';
import { RootStackParamList } from '@navigation/types';
import { repo } from '@data/repositories';
import { useAuthStore } from '@store/useAuthStore';
import { Homework, HomeworkSubmission, Student } from '@/types';
import { friendlyDate } from '@utils/date';

const statusMeta: Record<string, { label: string; tone: BadgeTone }> = {
  pending: { label: 'Not submitted', tone: 'warning' },
  submitted: { label: 'Submitted', tone: 'info' },
  graded: { label: 'Graded', tone: 'success' },
};

export function HomeworkDetailScreen() {
  const route = useRoute<RouteProp<RootStackParamList, 'HomeworkDetail'>>();
  const { teacher } = useAuthStore();
  const classId = teacher?.classIds?.[0];

  const [homework, setHomework] = useState<Homework | undefined>(undefined);
  const [students, setStudents] = useState<Student[]>([]);
  const [submissions, setSubmissions] = useState<HomeworkSubmission[]>([]);
  const [grading, setGrading] = useState<Student | null>(null);
  const [form, setForm] = useState({ grade: '', marks: '', maxMarks: '100', comment: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!classId) return;
    repo.classes.listStudents(classId).then(setStudents);
  }, [classId]);

  useEffect(() => {
    const unsub = repo.homework.subscribeSubmissions(route.params.id, setSubmissions);
    return unsub;
  }, [route.params.id]);

  useEffect(() => {
    if (!classId) return;
    const unsub = repo.homework.subscribeForClass(classId, (items) => {
      setHomework(items.find((h) => h.id === route.params.id));
    });
    return unsub;
  }, [classId, route.params.id]);

  const submissionByStudent = useMemo(() => {
    const map = new Map<string, HomeworkSubmission>();
    submissions.forEach((s) => map.set(s.studentId, s));
    return map;
  }, [submissions]);

  const openGrading = (student: Student) => {
    const sub = submissionByStudent.get(student.id);
    setForm({
      grade: sub?.grade ?? '',
      marks: sub?.marks?.toString() ?? '',
      maxMarks: sub?.maxMarks?.toString() ?? '100',
      comment: sub?.comment ?? '',
    });
    setGrading(student);
  };

  const saveGrade = async () => {
    if (!grading) return;
    if (!form.grade.trim() || !form.marks.trim()) {
      Alert.alert('Missing details', 'Please provide a grade and marks.');
      return;
    }
    setSaving(true);
    try {
      await repo.homework.gradeSubmission(route.params.id, grading.id, {
        grade: form.grade.trim(),
        marks: Number(form.marks),
        maxMarks: Number(form.maxMarks) || 100,
        comment: form.comment.trim(),
      });
      setGrading(null);
    } catch (e) {
      Alert.alert('Could not save grade', e instanceof Error ? e.message : 'Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (!homework) {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
        <DetailHeader title="Homework" />
        <View style={{ padding: spacing.lg }}>
          <Skeleton height={100} borderRadius={16} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <DetailHeader title="Homework" />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Badge label={homework.subject} tone="neutral" />
        <AppText variant="displayMd" style={{ marginTop: spacing.sm }}>
          {homework.title}
        </AppText>
        <AppText variant="body" color={colors.textSecondary} style={{ marginTop: spacing.sm, lineHeight: 22 }}>
          {homework.instructions}
        </AppText>
        <AppText variant="caption" color={colors.textTertiary} style={{ marginTop: spacing.sm }}>
          Due {friendlyDate(homework.dueDate)}
        </AppText>

        <AppText variant="h3" style={{ marginTop: spacing.xl, marginBottom: spacing.sm }}>
          Submissions ({submissions.length}/{students.length})
        </AppText>

        {students.length === 0 ? (
          <EmptyState icon="people-outline" title="No students found" compact />
        ) : (
          students.map((student) => {
            const sub = submissionByStudent.get(student.id);
            const status = sub ? statusMeta[sub.status] : statusMeta.pending;
            return (
              <Card key={student.id} onPress={() => openGrading(student)} style={{ marginBottom: spacing.sm }}>
                <View style={styles.row}>
                  <View style={{ flex: 1 }}>
                    <AppText variant="bodyMedium">{student.name}</AppText>
                    <AppText variant="tiny" color={colors.textTertiary}>
                      Roll No. {student.rollNumber}
                    </AppText>
                  </View>
                  <Badge label={status.label} tone={status.tone} size="sm" />
                </View>
              </Card>
            );
          })
        )}
      </ScrollView>

      <Modal visible={!!grading} transparent animationType="fade" onRequestClose={() => setGrading(null)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <AppText variant="h2">Grade {grading?.name}</AppText>
            <FormField label="Grade (e.g. A, B+)" value={form.grade} onChangeText={(v) => setForm((f) => ({ ...f, grade: v }))} />
            <View style={{ flexDirection: 'row', gap: spacing.sm }}>
              <View style={{ flex: 1 }}>
                <FormField label="Marks" value={form.marks} onChangeText={(v) => setForm((f) => ({ ...f, marks: v }))} keyboardType="numeric" />
              </View>
              <View style={{ flex: 1 }}>
                <FormField label="Out of" value={form.maxMarks} onChangeText={(v) => setForm((f) => ({ ...f, maxMarks: v }))} keyboardType="numeric" />
              </View>
            </View>
            <FormField label="Comment" value={form.comment} onChangeText={(v) => setForm((f) => ({ ...f, comment: v }))} />
            <View style={{ flexDirection: 'row', marginTop: spacing.lg, gap: spacing.sm }}>
              <Button label="Cancel" variant="outline" onPress={() => setGrading(null)} style={{ flex: 1 }} />
              <Button label="Save Grade" onPress={saveGrade} loading={saving} style={{ flex: 1 }} />
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function FormField({
  label,
  value,
  onChangeText,
  keyboardType,
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  keyboardType?: 'default' | 'numeric';
}) {
  return (
    <View style={{ marginTop: spacing.md }}>
      <AppText variant="caption" color={colors.textSecondary} style={{ marginBottom: 4 }}>
        {label}
      </AppText>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
        style={styles.input}
        placeholderTextColor={colors.textTertiary}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxxl },
  row: { flexDirection: 'row', alignItems: 'center' },
  modalOverlay: { flex: 1, backgroundColor: colors.overlay, justifyContent: 'center', padding: spacing.lg },
  modalCard: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.lg },
  input: {
    height: 44,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.sm,
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: colors.textPrimary,
  },
});
