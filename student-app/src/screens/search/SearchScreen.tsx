import React, { useEffect, useMemo, useState } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '@navigation/types';
import { IconButton, SearchBar, AppText, EmptyState, AnimatedPressable } from '@components/ui';
import { HomeworkCard } from '@components/homework/HomeworkCard';
import { NoticeListItem } from '@components/notices/NoticeListItem';
import { MaterialCard } from '@components/materials/MaterialCard';
import { ResultCard } from '@components/results/ResultCard';
import { colors, spacing } from '@theme';
import { repo } from '@data/repositories';
import { useHomeworkStore } from '@store/useHomeworkStore';
import { useNoticesStore } from '@store/useNoticesStore';
import { useAuthStore } from '@store/useAuthStore';
import { StudyMaterial, ExamResult } from '@/types';
import { Ionicons } from '@expo/vector-icons';

const QUICK_LINKS: { key: string; label: string; icon: keyof typeof Ionicons.glyphMap; onPress: (nav: NativeStackNavigationProp<RootStackParamList>) => void }[] = [
  { key: 'homework', label: 'Homework', icon: 'book-outline', onPress: (nav) => nav.navigate('MainTabs', { screen: 'HomeworkTab' }) },
  { key: 'timetable', label: 'Timetable', icon: 'calendar-outline', onPress: (nav) => nav.navigate('MainTabs', { screen: 'TimetableTab' }) },
  { key: 'attendance', label: 'Attendance', icon: 'checkmark-done-outline', onPress: (nav) => nav.navigate('Attendance') },
  { key: 'results', label: 'Results', icon: 'stats-chart-outline', onPress: (nav) => nav.navigate('Results') },
  { key: 'materials', label: 'Materials', icon: 'library-outline', onPress: (nav) => nav.navigate('StudyMaterials') },
  { key: 'calendar', label: 'Calendar', icon: 'today-outline', onPress: (nav) => nav.navigate('AcademicCalendar') },
];

export function SearchScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const authStudent = useAuthStore((s) => s.student);
  const { items: homeworkItems, fetch: fetchHomework } = useHomeworkStore();
  const { items: noticeItems, fetch: fetchNotices } = useNoticesStore();
  const [materials, setMaterials] = useState<StudyMaterial[]>([]);
  const [results, setResults] = useState<ExamResult[]>([]);
  const [query, setQuery] = useState('');

  useEffect(() => {
    fetchHomework();
    fetchNotices();
  }, [fetchHomework, fetchNotices]);

  useEffect(() => {
    if (!authStudent) return;
    repo.materials.list(authStudent.classId).then(setMaterials);
    repo.results.list(authStudent.id).then(setResults);
  }, [authStudent?.id, authStudent?.classId]);

  const q = query.trim().toLowerCase();

  const matchedHomework = useMemo(
    () =>
      q
        ? homeworkItems.filter(
            (h) => h.title.toLowerCase().includes(q) || h.subject.toLowerCase().includes(q),
          ).slice(0, 6)
        : [],
    [homeworkItems, q],
  );

  const matchedNotices = useMemo(
    () =>
      q
        ? noticeItems.filter(
            (n) => n.title.toLowerCase().includes(q) || n.body.toLowerCase().includes(q),
          ).slice(0, 6)
        : [],
    [noticeItems, q],
  );

  const matchedMaterials = useMemo(
    () =>
      q
        ? materials.filter(
            (m) => m.title.toLowerCase().includes(q) || m.subject.toLowerCase().includes(q),
          ).slice(0, 6)
        : [],
    [materials, q],
  );

  const matchedResults = useMemo(
    () =>
      q
        ? results.filter(
            (r) =>
              r.examName.toLowerCase().includes(q) ||
              r.subjects.some((s) => s.subject.toLowerCase().includes(q)),
          ).slice(0, 6)
        : [],
    [results, q],
  );

  const totalMatches =
    matchedHomework.length + matchedNotices.length + matchedMaterials.length + matchedResults.length;

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <View style={styles.headerRow}>
        <IconButton icon="chevron-back" onPress={() => navigation.goBack()} />
        <SearchBar
          value={query}
          onChangeText={setQuery}
          placeholder="Search homework, notices, materials, results"
          style={{ flex: 1, marginLeft: spacing.xs }}
        />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {!q && (
          <View>
            <AppText variant="overline" color={colors.textTertiary} style={styles.sectionLabel}>
              QUICK LINKS
            </AppText>
            <View style={styles.quickGrid}>
              {QUICK_LINKS.map((link) => (
                <AnimatedPressable
                  key={link.key}
                  onPress={() => link.onPress(navigation)}
                  style={styles.quickTile}
                  scaleTo={0.96}
                >
                  <View style={styles.quickIconWrap}>
                    <Ionicons name={link.icon} size={18} color={colors.primary} />
                  </View>
                  <AppText variant="bodyMedium" style={{ flex: 1 }}>
                    {link.label}
                  </AppText>
                  <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />
                </AnimatedPressable>
              ))}
            </View>
          </View>
        )}

        {q && totalMatches === 0 && (
          <EmptyState icon="search-outline" title="No results" message={`Nothing matches "${query}".`} />
        )}

        {matchedHomework.length > 0 && (
          <Section title="Homework">
            {matchedHomework.map((hw) => (
              <HomeworkCard key={hw.id} homework={hw} onPress={() => navigation.navigate('HomeworkDetail', { id: hw.id })} />
            ))}
          </Section>
        )}

        {matchedNotices.length > 0 && (
          <Section title="Notices">
            {matchedNotices.map((n) => (
              <NoticeListItem key={n.id} notice={n} onPress={() => navigation.navigate('NoticeDetail', { id: n.id })} />
            ))}
          </Section>
        )}

        {matchedResults.length > 0 && (
          <Section title="Results">
            {matchedResults.map((r) => (
              <ResultCard key={r.id} result={r} onPress={() => navigation.navigate('ResultDetail', { id: r.id })} />
            ))}
          </Section>
        )}

        {matchedMaterials.length > 0 && (
          <Section title="Materials">
            {matchedMaterials.map((m) => (
              <MaterialCard key={m.id} material={m} onPress={() => navigation.navigate('StudyMaterials')} />
            ))}
          </Section>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={{ marginBottom: spacing.lg }}>
      <AppText variant="overline" color={colors.textTertiary} style={styles.sectionLabel}>
        {title.toUpperCase()}
      </AppText>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
  },
  content: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxxl },
  sectionLabel: { marginBottom: spacing.sm, marginTop: spacing.xs },
  quickGrid: { gap: spacing.xs },
  quickTile: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: spacing.md,
  },
  quickIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
});
