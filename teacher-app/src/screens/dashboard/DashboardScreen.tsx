import React, { useEffect, useMemo, useState } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { AppText, Card, Avatar, IconButton, SectionHeader, SkeletonCard, EmptyState } from '@components/ui';
import { QuickActionsGrid, QuickAction } from '@components/dashboard/QuickActionsGrid';
import { PeriodCard } from '@components/dashboard/PeriodCard';
import { colors, spacing, gradients, radius, layout } from '@theme';
import { RootStackParamList } from '@navigation/types';
import { useAuthStore } from '@store/useAuthStore';
import { repo } from '@data/repositories';
import { greetingForNow, todayDayCode } from '@utils/date';
import { Homework, TimetablePeriod } from '@/types';

export function DashboardScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { teacher, signOut } = useAuthStore();
  const classId = teacher?.classIds?.[0];

  const [periods, setPeriods] = useState<TimetablePeriod[] | null>(null);
  const [homework, setHomework] = useState<Homework[] | null>(null);

  useEffect(() => {
    if (!classId) return;
    const unsubTt = repo.timetable.subscribeForClass(classId, setPeriods);
    const unsubHw = repo.homework.subscribeForClass(classId, setHomework);
    return () => {
      unsubTt();
      unsubHw();
    };
  }, [classId]);

  const today = todayDayCode();
  const todaysPeriods = useMemo(
    () => (periods ?? []).filter((p) => p.day === today && !p.isBreak),
    [periods, today],
  );

  const recentHomework = useMemo(() => (homework ?? []).slice(0, 3), [homework]);

  const quickActions: QuickAction[] = [
    {
      key: 'homework',
      label: 'Post Homework',
      icon: 'book-outline',
      bg: colors.primarySoft,
      fg: colors.primary,
      onPress: () => navigation.navigate('HomeworkCreate'),
    },
    {
      key: 'attendance',
      label: 'Attendance',
      icon: 'checkmark-done-outline',
      bg: colors.successBg,
      fg: colors.successStrong,
      onPress: () => navigation.navigate('MainTabs', { screen: 'AttendanceTab' }),
    },
    {
      key: 'results',
      label: 'Enter Marks',
      icon: 'stats-chart-outline',
      bg: '#F5F3FF',
      fg: colors.accentViolet,
      onPress: () => navigation.navigate('ResultEntry', {}),
    },
    {
      key: 'notice',
      label: 'Post Notice',
      icon: 'megaphone-outline',
      bg: colors.dangerBg,
      fg: colors.dangerStrong,
      onPress: () => navigation.navigate('NoticeCreate'),
    },
    {
      key: 'materials',
      label: 'Upload Material',
      icon: 'cloud-upload-outline',
      bg: colors.infoBg,
      fg: colors.infoStrong,
      onPress: () => navigation.navigate('MaterialUpload'),
    },
    {
      key: 'calendar',
      label: 'Calendar',
      icon: 'calendar-outline',
      bg: colors.warningBg,
      fg: colors.warningStrong,
      onPress: () => navigation.navigate('AcademicCalendar'),
    },
  ];

  return (
    <View style={styles.safe}>
      <LinearGradient colors={gradients.primary} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.header}>
        <View style={styles.headerRow}>
          <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
            <Avatar uri={teacher?.photoUrl} name={teacher?.name ?? 'Teacher'} size={48} ringColor="rgba(255,255,255,0.5)" />
            <View style={{ marginLeft: spacing.sm }}>
              <AppText variant="caption" color="rgba(255,255,255,0.8)">
                {greetingForNow()},
              </AppText>
              <AppText variant="h2" color={colors.textInverse}>
                {teacher?.name?.split(' ')[0] ?? 'Teacher'}
              </AppText>
              <AppText variant="tiny" color="rgba(255,255,255,0.75)" style={{ marginTop: 1 }}>
                {teacher?.subjects?.join(', ')}
              </AppText>
            </View>
          </View>
          <IconButton
            icon="log-out-outline"
            onPress={() => signOut()}
            color={colors.textInverse}
            backgroundColor="rgba(255,255,255,0.18)"
          />
        </View>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={{ marginTop: -spacing.xl, paddingHorizontal: spacing.lg }}>
          <View style={styles.quickActionsCard}>
            <QuickActionsGrid actions={quickActions} />
          </View>
        </View>

        <View style={styles.section}>
          <SectionHeader title="Today's Classes" />
          {!periods ? (
            <SkeletonCard lines={2} />
          ) : todaysPeriods.length === 0 ? (
            <EmptyState icon="calendar-clear-outline" title="No classes today" compact />
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {todaysPeriods.map((p) => (
                <PeriodCard key={p.id} period={p} compact />
              ))}
            </ScrollView>
          )}
        </View>

        <View style={[styles.section, { marginBottom: spacing.xxxl }]}>
          <SectionHeader
            title="Recent Homework"
            onActionPress={() => navigation.navigate('MainTabs', { screen: 'HomeworkTab' })}
          />
          {!homework ? (
            <SkeletonCard lines={2} />
          ) : recentHomework.length === 0 ? (
            <EmptyState icon="book-outline" title="No homework posted yet" compact />
          ) : (
            recentHomework.map((hw) => (
              <Card key={hw.id} style={{ marginBottom: spacing.sm }} onPress={() => navigation.navigate('HomeworkDetail', { id: hw.id })}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <View style={{ flex: 1 }}>
                    <AppText variant="caption" color={colors.primary}>
                      {hw.subject}
                    </AppText>
                    <AppText variant="bodySemibold" style={{ marginTop: 2 }}>
                      {hw.title}
                    </AppText>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
                </View>
              </Card>
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xxl,
    paddingBottom: spacing.xxl,
    borderBottomLeftRadius: radius.xl,
    borderBottomRightRadius: radius.xl,
  },
  headerRow: { flexDirection: 'row', alignItems: 'center' },
  scrollContent: { paddingBottom: layout.tabBarClearance },
  section: { paddingHorizontal: spacing.lg, marginTop: spacing.xl },
  quickActionsCard: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderSoft,
  },
});
