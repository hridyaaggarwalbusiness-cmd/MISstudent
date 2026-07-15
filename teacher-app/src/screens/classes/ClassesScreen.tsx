import React, { useEffect, useState } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '@navigation/types';
import { AppText, Card, AnimatedPressable, SkeletonCard, EmptyState } from '@components/ui';
import { colors, spacing, radius, layout } from '@theme';
import { useAuthStore } from '@store/useAuthStore';
import { repo } from '@data/repositories';
import { SchoolClass } from '@/types';

interface ClassRow {
  classId: string;
  info: SchoolClass | null;
  studentCount: number;
}

const QUICK_LINKS: { key: string; label: string; icon: keyof typeof Ionicons.glyphMap; target: keyof RootStackParamList | 'MainTabs' }[] = [
  { key: 'timetable', label: 'Timetable', icon: 'calendar-outline', target: 'MainTabs' },
  { key: 'attendance', label: 'Attendance', icon: 'checkmark-done-outline', target: 'MainTabs' },
  { key: 'homework', label: 'Homework', icon: 'book-outline', target: 'MainTabs' },
  { key: 'results', label: 'Results', icon: 'stats-chart-outline', target: 'ResultEntry' },
];

export function ClassesScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { teacher } = useAuthStore();
  const [rows, setRows] = useState<ClassRow[] | null>(null);

  useEffect(() => {
    if (!teacher) return;
    let cancelled = false;
    Promise.all(
      teacher.classIds.map(async (classId) => {
        const [info, students] = await Promise.all([repo.classes.get(classId), repo.classes.listStudents(classId)]);
        return { classId, info, studentCount: students.length };
      }),
    ).then((result) => {
      if (!cancelled) setRows(result);
    });
    return () => {
      cancelled = true;
    };
  }, [teacher]);

  function onQuickLink(link: (typeof QUICK_LINKS)[number]) {
    if (link.key === 'timetable') navigation.navigate('MainTabs', { screen: 'TimetableTab' });
    else if (link.key === 'attendance') navigation.navigate('MainTabs', { screen: 'AttendanceTab' });
    else if (link.key === 'homework') navigation.navigate('MainTabs', { screen: 'HomeworkTab' });
    else navigation.navigate('ResultEntry', {});
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <AppText variant="displayMd">Classes</AppText>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {rows === null ? (
          <SkeletonCard lines={3} />
        ) : rows.length === 0 ? (
          <EmptyState icon="people-outline" title="No classes assigned" />
        ) : (
          rows.map((row, index) => (
            <Card key={row.classId} style={{ marginBottom: spacing.md }}>
              <View style={styles.classHeader}>
                <View style={styles.classIconWrap}>
                  <Ionicons name="people" size={20} color={colors.primary} />
                </View>
                <View style={{ flex: 1, marginLeft: spacing.sm }}>
                  <AppText variant="h3">
                    {row.info ? `${row.info.name} · Section ${row.info.section}` : row.classId}
                  </AppText>
                  <AppText variant="caption" color={colors.textSecondary}>
                    {row.studentCount} student{row.studentCount === 1 ? '' : 's'}
                    {teacher?.isClassTeacherOf === row.classId ? ' · Class Teacher' : ''}
                  </AppText>
                </View>
              </View>

              {index === 0 ? (
                <View style={styles.quickLinkRow}>
                  {QUICK_LINKS.map((link) => (
                    <AnimatedPressable key={link.key} onPress={() => onQuickLink(link)} style={styles.quickLink} haptic={false}>
                      <Ionicons name={link.icon} size={18} color={colors.primary} />
                      <AppText variant="tiny" color={colors.textSecondary} style={{ marginTop: 4 }}>
                        {link.label}
                      </AppText>
                    </AnimatedPressable>
                  ))}
                </View>
              ) : (
                <AppText variant="tiny" color={colors.textTertiary} style={{ marginTop: spacing.sm }}>
                  Switch classes from the tab bar to manage this class's timetable, attendance and homework.
                </AppText>
              )}
            </Card>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: { paddingHorizontal: spacing.lg, paddingTop: spacing.xs, paddingBottom: spacing.md },
  content: { paddingHorizontal: spacing.lg, paddingBottom: layout.tabBarClearance },
  classHeader: { flexDirection: 'row', alignItems: 'center' },
  classIconWrap: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickLinkRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.borderSoft,
  },
  quickLink: { alignItems: 'center', flex: 1 },
});
