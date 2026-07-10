import React, { useEffect, useMemo, useState } from 'react';
import { View, ScrollView, StyleSheet, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, RouteProp } from '@react-navigation/native';
import { AppText, Card, Chip, Button, DetailHeader, EmptyState } from '@components/ui';
import { colors, spacing, radius } from '@theme';
import { RootStackParamList } from '@navigation/types';
import { useAuthStore } from '@store/useAuthStore';
import { repo } from '@data/repositories';
import { Exam, Student, ExamResult } from '@/types';

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

  useEffect(() => {
    if (!classId) return;
    return repo.exams.subscribeForClass(classId, setExams);
  }, [classId]);

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

  if (!selectedExamId) {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
        <DetailHeader title="Enter Marks" />
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <AppText variant="h3" style={{ marginBottom: spacing.sm }}>
            Select an exam
          </AppText>
          {mySubjectExams.length === 0 ? (
            <EmptyState icon="document-text-outline" title="No exams found" />
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

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxxl },
  row: { flexDirection: 'row', alignItems: 'center' },
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
});
