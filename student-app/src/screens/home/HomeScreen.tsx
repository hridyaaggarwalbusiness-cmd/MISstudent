import React, { useMemo } from 'react';
import { View, ScrollView, StyleSheet, RefreshControl } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '@navigation/types';
import {
  SectionHeader,
  SkeletonCard,
  Skeleton,
  EmptyState,
  ErrorState,
} from '@components/ui';
import { DashboardHeader } from '@components/dashboard/DashboardHeader';
import { QuickActionsGrid, QuickAction } from '@components/dashboard/QuickActionsGrid';
import { StatsStrip, StatItem } from '@components/dashboard/StatsStrip';
import { PeriodCard } from '@components/dashboard/PeriodCard';
import { AttendanceSummaryCard } from '@components/dashboard/AttendanceSummaryCard';
import { LatestMarksCard } from '@components/dashboard/LatestMarksCard';
import { ExamCountdownCard } from '@components/dashboard/ExamCountdownCard';
import { HomeworkCard } from '@components/homework/HomeworkCard';
import { NoticeListItem } from '@components/notices/NoticeListItem';
import { colors, spacing, layout } from '@theme';
import { repo } from '@data/repositories';
import { useAsyncResource } from '@hooks/useAsyncResource';
import { useStudentStore } from '@store/useStudentStore';
import { useHomeworkStore } from '@store/useHomeworkStore';
import { useNoticesStore } from '@store/useNoticesStore';
import { useNotificationsStore } from '@store/useNotificationsStore';
import { useAuthStore } from '@store/useAuthStore';
import { todayDayCode } from '@utils/date';
import { overallAttendancePercentage } from '@utils/attendance';

async function loadDashboard(classId: string, studentId: string) {
  const [timetable, exams, attendanceMonth, results] = await Promise.all([
    repo.timetable.getAll(classId),
    repo.exams.list(classId),
    repo.attendance.getCurrentMonth(studentId),
    repo.results.list(studentId),
  ]);
  return { timetable, exams, attendanceMonth, results };
}

function toMinutes(t: string) {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

export function HomeScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const authStudent = useAuthStore((s) => s.student);
  const { student, fetch: fetchStudent } = useStudentStore();
  const { items: homeworkItems, fetch: fetchHomework } = useHomeworkStore();
  const { items: noticeItems, fetch: fetchNotices } = useNoticesStore();
  const { unreadCount, fetch: fetchNotifications } = useNotificationsStore();
  const { data, loading, refreshing, error, refresh } = useAsyncResource(
    () =>
      authStudent
        ? loadDashboard(authStudent.classId, authStudent.id)
        : Promise.resolve({ timetable: [], exams: [], attendanceMonth: [], results: [] }),
    [authStudent?.id],
  );

  React.useEffect(() => {
    fetchStudent();
    fetchHomework();
    fetchNotices();
    fetchNotifications();
  }, [fetchStudent, fetchHomework, fetchNotices, fetchNotifications]);

  const today = todayDayCode();

  const todaysPeriods = useMemo(() => {
    if (!data) return [];
    return data.timetable.filter((p) => p.day === today);
  }, [data, today]);

  const currentPeriodId = useMemo(() => {
    if (todaysPeriods.length === 0) return null;
    const nowMinutes = new Date().getHours() * 60 + new Date().getMinutes();
    const current = todaysPeriods.find(
      (p) => nowMinutes >= toMinutes(p.startTime) && nowMinutes < toMinutes(p.endTime),
    );
    return current?.id ?? null;
  }, [todaysPeriods]);

  const nextPeriodId = useMemo(() => {
    if (todaysPeriods.length === 0) return null;
    const nowMinutes = new Date().getHours() * 60 + new Date().getMinutes();
    const upcoming = todaysPeriods.find((p) => toMinutes(p.startTime) > nowMinutes && !p.isBreak);
    return upcoming?.id ?? null;
  }, [todaysPeriods]);

  const todaysHomework = useMemo(() => {
    const todayIso = new Date().toISOString().slice(0, 10);
    return homeworkItems.filter((h) => h.dueDate === todayIso);
  }, [homeworkItems]);

  const upcomingHomework = useMemo(
    () => homeworkItems.filter((h) => h.status === 'pending' || h.status === 'overdue').slice(0, 4),
    [homeworkItems],
  );

  const upcomingExams = useMemo(() => {
    if (!data) return [];
    return data.exams.filter((e) => e.status === 'upcoming').slice(0, 4);
  }, [data]);

  const recentNotices = useMemo(() => noticeItems.slice(0, 3), [noticeItems]);

  const attendancePct = useMemo(() => {
    if (!data) return 0;
    return overallAttendancePercentage(data.attendanceMonth);
  }, [data]);

  const presentDays = useMemo(() => {
    if (!data) return { present: 0, total: 0 };
    const countable = data.attendanceMonth.filter(
      (d) => d.status !== 'weekend' && d.status !== 'future' && d.status !== 'holiday' && d.status !== 'unmarked',
    );
    const present = countable.filter((d) => d.status === 'present' || d.status === 'late').length;
    return { present, total: countable.length };
  }, [data]);

  const latestResult = data?.results[data.results.length - 1];

  const nextPeriod = useMemo(
    () => todaysPeriods.find((p) => p.id === nextPeriodId || p.id === currentPeriodId),
    [todaysPeriods, nextPeriodId, currentPeriodId],
  );

  const quickActions: QuickAction[] = [
    {
      key: 'homework',
      label: 'Homework',
      icon: 'book-outline',
      bg: colors.infoBg,
      fg: colors.infoStrong,
      onPress: () => navigation.navigate('MainTabs', { screen: 'HomeworkTab' }),
    },
    {
      key: 'timetable',
      label: 'Timetable',
      icon: 'calendar-outline',
      bg: colors.primarySoft,
      fg: colors.primary,
      onPress: () => navigation.navigate('MainTabs', { screen: 'TimetableTab' }),
    },
    {
      key: 'attendance',
      label: 'Attendance',
      icon: 'checkmark-done-outline',
      bg: colors.successBg,
      fg: colors.successStrong,
      onPress: () => navigation.navigate('Attendance'),
    },
    {
      key: 'results',
      label: 'Results',
      icon: 'stats-chart-outline',
      bg: '#F5F3FF',
      fg: colors.secondary,
      onPress: () => navigation.navigate('Results'),
    },
    {
      key: 'materials',
      label: 'Materials',
      icon: 'library-outline',
      bg: colors.infoBg,
      fg: colors.infoStrong,
      onPress: () => navigation.navigate('StudyMaterials'),
    },
    {
      key: 'calendar',
      label: 'Calendar',
      icon: 'today-outline',
      bg: colors.warningBg,
      fg: colors.warningStrong,
      onPress: () => navigation.navigate('AcademicCalendar'),
    },
    {
      key: 'notices',
      label: 'Notices',
      icon: 'megaphone-outline',
      bg: colors.dangerBg,
      fg: colors.dangerStrong,
      onPress: () => navigation.navigate('MainTabs', { screen: 'NoticesTab' }),
    },
    {
      key: 'profile',
      label: 'Profile',
      icon: 'person-outline',
      bg: colors.primarySoft,
      fg: colors.primary,
      onPress: () => navigation.navigate('MainTabs', { screen: 'ProfileTab' }),
    },
  ];

  const statItems: StatItem[] = [
    {
      key: 'pending',
      icon: 'book-outline',
      value: String(upcomingHomework.length),
      label: 'Pending tasks',
      tint: colors.infoStrong,
      tintBg: colors.infoBg,
      onPress: () => navigation.navigate('MainTabs', { screen: 'HomeworkTab' }),
    },
    {
      key: 'attendance-stat',
      icon: 'checkmark-done-outline',
      value: `${attendancePct}%`,
      label: 'Attendance',
      tint: colors.successStrong,
      tintBg: colors.successBg,
      onPress: () => navigation.navigate('Attendance'),
    },
    {
      key: 'notices-stat',
      icon: 'notifications-outline',
      value: String(unreadCount),
      label: 'Unread',
      tint: colors.dangerStrong,
      tintBg: colors.dangerBg,
      onPress: () => navigation.navigate('Notifications'),
    },
    {
      key: 'next-class',
      icon: 'time-outline',
      value: nextPeriod ? nextPeriod.startTime : '—',
      label: nextPeriod ? nextPeriod.subject : 'No more classes',
      tint: colors.warningStrong,
      tintBg: colors.warningBg,
      onPress: () => navigation.navigate('MainTabs', { screen: 'TimetableTab' }),
    },
  ];

  if (error && !data) {
    return (
      <View style={styles.safe}>
        <ErrorState onRetry={refresh} />
      </View>
    );
  }

  return (
    <View style={styles.safe}>
      <DashboardHeader
        name={student?.name ?? 'Student'}
        photoUrl={student?.photoUrl}
        className={student?.className ?? ''}
        section={student?.section ?? ''}
        unreadNotifications={unreadCount}
        onAvatarPress={() => navigation.navigate('MainTabs', { screen: 'ProfileTab' })}
        onBellPress={() => navigation.navigate('Notifications')}
      />
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      >
        <View style={{ marginTop: -spacing.xl, paddingHorizontal: spacing.lg }}>
          {loading ? (
            <SkeletonCard lines={2} />
          ) : (
            <View style={styles.quickActionsCard}>
              <QuickActionsGrid actions={quickActions} />
            </View>
          )}
        </View>

        <View style={[styles.section, { marginTop: spacing.lg }]}>
          {loading ? <Skeleton height={80} borderRadius={16} /> : <StatsStrip items={statItems} />}
        </View>

        <View style={styles.section}>
          <SectionHeader title="Today's Classes" />
          {loading ? (
            <Skeleton height={90} borderRadius={16} />
          ) : todaysPeriods.filter((p) => !p.isBreak).length === 0 ? (
            <EmptyState
              icon="calendar-clear-outline"
              title="No classes today"
              message="Enjoy your day off! Check the timetable for upcoming school days."
              compact
            />
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {todaysPeriods
                .filter((p) => !p.isBreak)
                .map((p) => (
                  <PeriodCard
                    key={p.id}
                    period={p}
                    compact
                    isCurrent={p.id === currentPeriodId}
                    isNext={p.id === nextPeriodId}
                  />
                ))}
            </ScrollView>
          )}
        </View>

        <View style={styles.section}>
          <SectionHeader
            title="Today's Homework"
            onActionPress={() => navigation.navigate('MainTabs', { screen: 'HomeworkTab' })}
          />
          {loading ? (
            <SkeletonCard lines={2} />
          ) : todaysHomework.length === 0 ? (
            <EmptyState icon="checkmark-circle-outline" title="All caught up" message="No homework due today." compact />
          ) : (
            todaysHomework.map((hw) => (
              <HomeworkCard
                key={hw.id}
                homework={hw}
                onPress={() => navigation.navigate('HomeworkDetail', { id: hw.id })}
              />
            ))
          )}
        </View>

        <View style={styles.section}>
          <SectionHeader
            title="Upcoming Assignments"
            onActionPress={() => navigation.navigate('MainTabs', { screen: 'HomeworkTab' })}
          />
          {loading ? (
            <SkeletonCard lines={2} />
          ) : upcomingHomework.length === 0 ? (
            <EmptyState icon="book-outline" title="Nothing pending" message="No upcoming assignments." compact />
          ) : (
            upcomingHomework.map((hw) => (
              <HomeworkCard
                key={hw.id}
                homework={hw}
                onPress={() => navigation.navigate('HomeworkDetail', { id: hw.id })}
              />
            ))
          )}
        </View>

        <View style={styles.section}>
          <SectionHeader title="Upcoming Exams" onActionPress={() => navigation.navigate('AcademicCalendar')} />
          {loading ? (
            <Skeleton height={80} borderRadius={16} />
          ) : upcomingExams.length === 0 ? (
            <EmptyState icon="document-text-outline" title="No exams scheduled" compact />
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {upcomingExams.map((exam) => (
                <ExamCountdownCard key={exam.id} exam={exam} />
              ))}
            </ScrollView>
          )}
        </View>

        <View style={styles.section}>
          <SectionHeader title="Attendance Summary" onActionPress={() => navigation.navigate('Attendance')} />
          {loading ? (
            <SkeletonCard lines={1} />
          ) : (
            <AttendanceSummaryCard
              percentage={attendancePct}
              presentDays={presentDays.present}
              totalDays={presentDays.total}
              onPress={() => navigation.navigate('Attendance')}
            />
          )}
        </View>

        <View style={styles.section}>
          <SectionHeader title="Latest Marks" onActionPress={() => navigation.navigate('Results')} />
          {loading ? (
            <SkeletonCard lines={1} />
          ) : latestResult ? (
            <LatestMarksCard result={latestResult} onPress={() => navigation.navigate('Results')} />
          ) : (
            <EmptyState icon="stats-chart-outline" title="No results yet" compact />
          )}
        </View>

        <View style={[styles.section, { marginBottom: spacing.xxxl }]}>
          <SectionHeader
            title="Recent Notices"
            onActionPress={() => navigation.navigate('MainTabs', { screen: 'NoticesTab' })}
          />
          {loading ? (
            <SkeletonCard lines={2} />
          ) : recentNotices.length === 0 ? (
            <EmptyState icon="megaphone-outline" title="No notices yet" compact />
          ) : (
            recentNotices.map((notice) => (
              <NoticeListItem
                key={notice.id}
                notice={notice}
                onPress={() => navigation.navigate('NoticeDetail', { id: notice.id })}
              />
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scrollContent: { paddingBottom: layout.tabBarClearance },
  section: {
    paddingHorizontal: spacing.lg,
    marginTop: spacing.xl,
  },
  quickActionsCard: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderSoft,
  },
});
