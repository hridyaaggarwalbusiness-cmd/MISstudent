import React, { useEffect, useMemo, useState } from 'react';
import { View, ScrollView, StyleSheet, TextInput, Alert, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, RouteProp } from '@react-navigation/native';
import { AppText, Card, Chip, Button, DetailHeader, EmptyState, IconButton, DatePickerField, SubjectSelectField } from '@components/ui';
import { colors, spacing, radius } from '@theme';
import { RootStackParamList } from '@navigation/types';
import { useAuthStore } from '@store/useAuthStore';
import { repo } from '@data/repositories';
import { subjectOptions, parseGrade } from '@data/subjects';
import { Exam, SchoolClass, Student, ExamResult } from '@/types';

const emptyExamForm = { name: '', subject: '', date: '', startTime: '', endTime: '', room: '' };

function gradeFor(pct: number): string {
  if (pct >= 90) return 'A+';
  if (pct >= 80) return 'A';
  if (pct >= 70) return 'B+';
  if (pct >= 60) return 'B';
  if (pct >= 50) return 'C';
  return 'D';
}

export function ResultEntryScreen() {
  const route = useRoute<RouteProp<RootStackParamList, 'ResultEntry'>>();
  const { teacher } = useAuthStore();
  const classId = teacher?.classIds?.[0];

  const [exams, setExams] = useState<Exam[] | null>(null);
  const [selectedExamId, setSelectedExamId] = useState<string | undefined>(route.params?.examId);
  const [students, setStudents] = useState<Student[]>([]);
  const [existingResults, setExistingResults] = useState<ExamResult[]>([]);
  const [marks, setMarks] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<string | null>(null);
  const [creatingExam, setCreatingExam] = useState(false);
  const [examForm, setExamForm] = useState(emptyExamForm);
  const [savingExam, setSavingExam] = useState(false);
  const [classInfo, setClassInfo] = useState<SchoolClass | null>(null);

  useEffect(() => {
    if (!classId) return;
    return repo.exams.subscribeForClass(classId, setExams);
  }, [classId]);

  useEffect(() => {
    if (!classId) return;
    repo.classes.get(classId).then(setClassInfo);
  }, [classId]);

  const newExamSubjects = useMemo(
    () => subjectOptions('results', classInfo ? parseGrade(classInfo.name) : null),
    [classInfo],
  );

  useEffect(() => {
    if (!classId) return;
    repo.classes.listStudents(classId).then(setStudents);
  }, [classId]);

  useEffect(() => {
    if (!classId) return;
    return repo.results.subscribeForClass(classId, setExistingResults);
  }, [classId]);

  const selectedExam = useMemo(() => exams?.find((e) => e.id === selectedExamId), [exams, selectedExamId]);
  const mySubjectExams = useMemo(
    () => (exams ?? []).filter((e) => teacher?.subjects.includes(e.subject)),
    [exams, teacher],
  );

  useEffect(() => {
    if (!selectedExamId) return;
    const initial: Record<string, string> = {};
    existingResults
      .filter((r) => r.examId === selectedExamId)
      .forEach((r) => {
        initial[r.studentId] = String(r.marksObtained);
      });
    setMarks(initial);
  }, [selectedExamId, existingResults]);

  const saveOne = async (student: Student) => {
    if (!selectedExam || !classId || !teacher) return;
    const raw = marks[student.id];
    if (raw === undefined || raw.trim() === '') {
      Alert.alert('Enter marks', `Please enter marks for ${student.name}.`);
      return;
    }
    const marksObtained = Number(raw);
    const maxMarks = 100;
    setSaving(student.id);
    try {
      await repo.results.upsert({
        id: `${student.id}_${selectedExam.id}`,
        studentId: student.id,
        classId,
        examId: selectedExam.id,
        examName: selectedExam.name,
        subject: selectedExam.subject,
        term: selectedExam.name,
        date: selectedExam.date,
        marksObtained,
        maxMarks,
        grade: gradeFor((marksObtained / maxMarks) * 100),
        gradedBy: teacher.id,
        gradedAt: new Date().toISOString(),
      });
    } catch (e) {
      Alert.alert('Could not save', e instanceof Error ? e.message : 'Please try again.');
    } finally {
      setSaving(null);
    }
  };

  const openCreateExam = () => {
    setExamForm({ ...emptyExamForm, subject: newExamSubjects[0] ?? '' });
    setCreatingExam(true);
  };

  const saveNewExam = async () => {
    if (!classId) return;
    if (!examForm.name.trim() || !examForm.subject.trim() || !examForm.date.trim()) {
      Alert.alert('Missing details', 'Please provide at least a name, subject and date.');
      return;
    }
    setSavingExam(true);
    try {
      const created = await repo.exams.create({
        classId,
        name: examForm.name.trim(),
        subject: examForm.subject.trim(),
        date: examForm.date.trim(),
        startTime: examForm.startTime.trim(),
        endTime: examForm.endTime.trim(),
        room: examForm.room.trim(),
        status: 'upcoming',
      });
      setCreatingExam(false);
      setSelectedExamId(created.id);
    } catch (e) {
      Alert.alert('Could not create exam', e instanceof Error ? e.message : 'Please try again.');
    } finally {
      setSavingExam(false);
    }
  };

  const examFormModal = (
    <Modal visible={creatingExam} transparent animationType="fade" onRequestClose={() => setCreatingExam(false)}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>
          <AppText variant="h2">New Exam</AppText>
          <FormField label="Name (e.g. Unit Test 2)" value={examForm.name} onChangeText={(v) => setExamForm((f) => ({ ...f, name: v }))} />
          <View style={{ marginTop: spacing.md }}>
            <AppText variant="caption" color={colors.textSecondary} style={{ marginBottom: 4 }}>
              Subject
            </AppText>
            <SubjectSelectField
              key={classId}
              value={examForm.subject}
              options={newExamSubjects}
              onChange={(v) => setExamForm((f) => ({ ...f, subject: v }))}
              title="Subject"
            />
          </View>
          <View style={{ marginTop: spacing.md }}>
            <AppText variant="caption" color={colors.textSecondary} style={{ marginBottom: 4 }}>
              Date
            </AppText>
            <DatePickerField value={examForm.date} onChange={(v) => setExamForm((f) => ({ ...f, date: v }))} />
          </View>
          <View style={{ flexDirection: 'row', gap: spacing.sm }}>
            <View style={{ flex: 1 }}>
              <FormField label="Start (HH:mm)" value={examForm.startTime} onChangeText={(v) => setExamForm((f) => ({ ...f, startTime: v }))} />
            </View>
            <View style={{ flex: 1 }}>
              <FormField label="End (HH:mm)" value={examForm.endTime} onChangeText={(v) => setExamForm((f) => ({ ...f, endTime: v }))} />
            </View>
          </View>
          <FormField label="Room" value={examForm.room} onChangeText={(v) => setExamForm((f) => ({ ...f, room: v }))} />
          <View style={{ flexDirection: 'row', marginTop: spacing.lg, gap: spacing.sm }}>
            <Button label="Cancel" variant="outline" onPress={() => setCreatingExam(false)} style={{ flex: 1 }} />
            <Button label="Create" onPress={saveNewExam} loading={savingExam} style={{ flex: 1 }} />
          </View>
        </View>
      </View>
    </Modal>
  );

  if (!selectedExamId) {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
        <DetailHeader title="Enter Marks" />
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.selectHeaderRow}>
            <AppText variant="h3">Select an exam</AppText>
            <IconButton icon="add" onPress={openCreateExam} backgroundColor={colors.primary} color={colors.textInverse} size={32} />
          </View>
          {mySubjectExams.length === 0 ? (
            <EmptyState icon="document-text-outline" title="No exams found" message="Tap + to schedule your first exam." />
          ) : (
            mySubjectExams.map((exam) => (
              <Chip
                key={exam.id}
                label={`${exam.name} — ${exam.subject}`}
                onPress={() => setSelectedExamId(exam.id)}
                style={{ marginBottom: spacing.sm, alignSelf: 'flex-start' }}
              />
            ))
          )}
        </ScrollView>
        {examFormModal}
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <DetailHeader title={selectedExam?.name ?? 'Enter Marks'} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <AppText variant="caption" color={colors.textSecondary} style={{ marginBottom: spacing.md }}>
          {selectedExam?.subject} · Marks out of 100
        </AppText>
        {students.map((student) => (
          <Card key={student.id} style={{ marginBottom: spacing.sm }}>
            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <AppText variant="bodyMedium">{student.name}</AppText>
                <AppText variant="tiny" color={colors.textTertiary}>
                  Roll No. {student.rollNumber}
                </AppText>
              </View>
              <TextInput
                value={marks[student.id] ?? ''}
                onChangeText={(v) => setMarks((m) => ({ ...m, [student.id]: v }))}
                keyboardType="numeric"
                placeholder="—"
                placeholderTextColor={colors.textTertiary}
                style={styles.marksInput}
                onBlur={() => saveOne(student)}
              />
              {saving === student.id && (
                <AppText variant="tiny" color={colors.primary} style={{ marginLeft: spacing.xs }}>
                  Saving…
                </AppText>
              )}
            </View>
          </Card>
        ))}
        <Button
          label="Done"
          onPress={() => Alert.alert('Saved', 'Marks are saved automatically as you enter them.')}
          fullWidth
          style={{ marginTop: spacing.md }}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

function FormField({
  label,
  value,
  onChangeText,
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
}) {
  return (
    <View style={{ marginTop: spacing.md }}>
      <AppText variant="caption" color={colors.textSecondary} style={{ marginBottom: 4 }}>
        {label}
      </AppText>
      <TextInput
        value={value}
        onChangeText={onChangeText}
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
  selectHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.sm },
  marksInput: {
    width: 64,
    height: 40,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    textAlign: 'center',
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
    color: colors.textPrimary,
  },
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
