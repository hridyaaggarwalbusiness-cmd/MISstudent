import React, { useEffect, useMemo, useState } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '@navigation/types';
import { IconButton, SearchBar, AppText, Card, EmptyState, AnimatedPressable } from '@components/ui';
import { colors, spacing } from '@theme';
import { repo } from '@data/repositories';
import { useAuthStore } from '@store/useAuthStore';
import { Homework, Notice, StudyMaterial, Student } from '@/types';

const QUICK_LINKS: { key: string; label: string; icon: keyof typeof Ionicons.glyphMap; onPress: (nav: NativeStackNavigationProp<RootStackParamList>) => void }[] = [
  { key: 'homework', label: 'Post Homework', icon: 'book-outline', onPress: (nav) => nav.navigate('HomeworkCreate') },
  { key: 'attendance', label: 'Attendance', icon: 'checkmark-done-outline', onPress: (nav) => nav.navigate('MainTabs', { screen: 'AttendanceTab' }) },
  { key: 'results', label: 'Enter Marks', icon: 'stats-chart-outline', onPress: (nav) => nav.navigate('ResultEntry', {}) },
  { key: 'notice', label: 'Post Notice', icon: 'megaphone-outline', onPress: (nav) => nav.navigate('NoticeCreate') },
  { key: 'calendar', label: 'Calendar', icon: 'today-outline', onPress: (nav) => nav.navigate('AcademicCalendar') },
];

export function SearchScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { teacher } = useAuthStore();
  const classId = teacher?.classIds?.[0];
  const [homeworkItems, setHomeworkItems] = useState<Homework[]>([]);
  const [noticeItems, setNoticeItems] = useState<Notice[]>([]);
  const [materials, setMaterials] = useState<StudyMaterial[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [query, setQuery] = useState('');

  useEffect(() => {
    if (!classId) return;
    const unsubHw = repo.homework.subscribeForClass(classId, setHomeworkItems);
    const unsubNotices = repo.notices.subscribeAll(setNoticeItems);
    const unsubMaterials = repo.materials.subscribeForClass(classId, setMaterials);
    repo.classes.listStudents(classId).then(setStudents);
    return () => {
      unsubHw();
      unsubNotices();
      unsubMaterials();
    };
  }, [classId]);

  const q = query.trim().toLowerCase();

  const matchedHomework = useMemo(
    () => (q ? homeworkItems.filter((h) => h.title.toLowerCase().includes(q) || h.subject.toLowerCase().includes(q)).slice(0, 6) : []),
    [homeworkItems, q],
  );

  const matchedNotices = useMemo(
    () => (q ? noticeItems.filter((n) => n.title.toLowerCase().includes(q) || n.body.toLowerCase().includes(q)).slice(0, 6) : []),
    [noticeItems, q],
  );

  const matchedMaterials = useMemo(
    () => (q ? materials.filter((m) => m.title.toLowerCase().includes(q) || m.subject.toLowerCase().includes(q)).slice(0, 6) : []),
    [materials, q],
  );

  const matchedStudents = useMemo(
    () => (q ? students.filter((s) => s.name.toLowerCase().includes(q) || s.rollNumber.toLowerCase().includes(q)).slice(0, 6) : []),
    [students, q],
  );

  const totalMatches = matchedHomework.length + matchedNotices.length + matchedMaterials.length + matchedStudents.length;

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <View style={styles.headerRow}>
        <IconButton icon="chevron-back" onPress={() => navigation.goBack()} />
        <SearchBar
          value={query}
          onChangeText={setQuery}
          placeholder="Search homework, notices, materials, students"
          style={{ flex: 1, marginLeft: spacing.xs }}
        />
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        {!q && (
          <View>
            <AppText variant="overline" color={colors.textTertiary} style={styles.sectionLabel}>
              QUICK LINKS
            </AppText>
            <View style={styles.quickGrid}>
              {QUICK_LINKS.map((link) => (
                <AnimatedPressable key={link.key} onPress={() => link.onPress(navigation)} style={styles.quickTile} scaleTo={0.96}>
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

        {q && totalMatches === 0 && <EmptyState icon="search-outline" title="No results" message={`Nothing matches "${query}".`} />}

        {matchedHomework.length > 0 && (
          <Section title="Homework">
            {matchedHomework.map((hw) => (
              <ResultRow
                key={hw.id}
                title={hw.title}
                subtitle={hw.subject}
                onPress={() => navigation.navigate('HomeworkDetail', { id: hw.id })}
              />
            ))}
          </Section>
        )}

        {matchedNotices.length > 0 && (
          <Section title="Notices">
            {matchedNotices.map((n) => (
              <ResultRow key={n.id} title={n.title} subtitle={n.postedBy} onPress={() => navigation.navigate('Notices')} />
            ))}
          </Section>
        )}

        {matchedStudents.length > 0 && (
          <Section title="Students">
            {matchedStudents.map((s) => (
              <ResultRow key={s.id} title={s.name} subtitle={`Roll No. ${s.rollNumber}`} onPress={() => {}} />
            ))}
          </Section>
        )}

        {matchedMaterials.length > 0 && (
          <Section title="Materials">
            {matchedMaterials.map((m) => (
              <ResultRow key={m.id} title={m.title} subtitle={m.subject} onPress={() => navigation.navigate('StudyMaterials')} />
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

function ResultRow({ title, subtitle, onPress }: { title: string; subtitle: string; onPress: () => void }) {
  return (
    <Card onPress={onPress} style={{ marginBottom: spacing.xs }}>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <View style={{ flex: 1 }}>
          <AppText variant="bodyMedium" numberOfLines={1}>
            {title}
          </AppText>
          <AppText variant="caption" color={colors.textSecondary} numberOfLines={1} style={{ marginTop: 2 }}>
            {subtitle}
          </AppText>
        </View>
        <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />
      </View>
    </Card>
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
