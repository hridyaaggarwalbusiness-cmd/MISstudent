import React, { useMemo } from 'react';
import { View, ScrollView, StyleSheet, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
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
import { BentoStats } from '@components/dashboard/BentoStats';
import { ActionTileGrid, ActionTile } from '@components/dashboard/ActionTileGrid';
import { PeriodCard } from '@components/dashboard/PeriodCard';
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

  // A single, correctly-prioritized list instead of two overlapping "today" /
  // "upcoming" sections — anything still pending or overdue, soonest due first.
  const priorityHomework = useMemo(
    () =>
      homeworkItems
        .filter((h) => h.status === 'pending' || h.status === 'overdue')
        .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
        .slice(0, 5),
    [homeworkItems],
  );

  const upcomingExams = useMemo(() => {
    if (!data) return [];
    return data.exams.filter((e) => e.status === 'upcoming').slice(0, 4);
  }, [data]);

  const recentNotices = useMemo(() => noticeItems.slice(0, 2), [noticeItems]);

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

  const actionTiles: ActionTile[] = [
    {
      key: 'homework',
      label: 'Homework',
      icon: 'book-outline',
      color: colors.primary,
      textColor: colors.textInverse,
      onPress: () => navigation.navigate('MainTabs', { screen: 'HomeworkTab' }),
    },
    {
      key: 'timetable',
      label: 'Timetable',
      icon: 'calendar-outline',
      color: colors.success,
      textColor: colors.textInverse,
      onPress: () => navigation.navigate('MainTabs', { screen: 'TimetableTab' }),
    },
    {
      key: 'calendar',
      label: 'Calendar',
      icon: 'today-outline',
      color: colors.warning,
      textColor: colors.textOnAccent,
      onPress: () => navigation.navigate('AcademicCalendar'),
    },
    {
      key: 'results',
      label: 'Exams & Results',
      icon: 'stats-chart-outline',
      color: colors.danger,
      textColor: colors.textInverse,
      onPress: () => navigation.navigate('Results'),
    },
    {
      key: 'attendance',
      label: 'Attendance',
      icon: 'checkmark-done-outline',
      color: colors.secondary,
      textColor: colors.textInverse,
      onPress: () => navigation.navigate('Attendance'),
    },
    {
      key: 'materials',
      label: 'Materials',
      icon: 'library-outline',
      color: colors.tileTeal,
      textColor: colors.textInverse,
      onPress: () => navigation.navigate('StudyMaterials'),
    },
    {
      key: 'notices',
      label: 'Notices',
      icon: 'megaphone-outline',
      color: colors.tileOrange,
      textColor: colors.textInverse,
      onPress: () => navigation.navigate('MainTabs', { screen: 'NoticesTab' }),
    },
    {
      key: 'notifications',
      label: 'Notifications',
      icon: 'notifications-outline',
      color: colors.info,
      textColor: colors.textInverse,
      onPress: () => navigation.navigate('Notifications'),
    },
  ];

  if (error && !data) {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
        <ErrorState onRetry={refresh} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <DashboardHeader
        name={student?.name ?? 'Student'}
        photoUrl={student?.photoUrl}
        className={student?.className ?? ''}
        section={student?.section ?? ''}
        unreadNotifications={unreadCount}
        onAvatarPress={() => navigation.navigate('MainTabs', { screen: 'ProfileTab' })}
        onBellPress={() => navigation.navigate('Notifications')}
        onSearchPress={() => navigation.navigate('Search')}
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
        <View style={{ paddingHorizontal: spacing.lg }}>
          {loading ? (
            <Skeleton height={280} borderRadius={18} />
          ) : (
            <ActionTileGrid tiles={actionTiles} />
          )}
        </View>

        <View style={styles.section}>
          {loading ? (
            <Skeleton height={150} borderRadius={18} />
          ) : (
            <BentoStats
              attendancePct={attendancePct}
              presentDays={presentDays.present}
              totalDays={presentDays.total}
              pendingCount={priorityHomework.length}
              unreadCount={unreadCount}
              nextPeriod={nextPeriod}
              onAttendancePress={() => navigation.navigate('Attendance')}
              onHomeworkPress={() => navigation.navigate('MainTabs', { screen: 'HomeworkTab' })}
              onNotificationsPress={() => navigation.navigate('Notifications')}
              onTimetablePress={() => navigation.navigate('MainTabs', { screen: 'TimetableTab' })}
            />
          )}
        </View>

        <View style={styles.section}>
          <SectionHeader title="Today's Schedule" onActionPress={() => navigation.navigate('MainTabs', { screen: 'TimetableTab' })} />
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
            title="Priorities"
            subtitle={priorityHomework.length > 0 ? `${priorityHomework.length} need your attention` : undefined}
            onActionPress={() => navigation.navigate('MainTabs', { screen: 'HomeworkTab' })}
          />
          {loading ? (
            <SkeletonCard lines={2} />
          ) : priorityHomework.length === 0 ? (
            <EmptyState icon="checkmark-circle-outline" title="All caught up" message="No pending homework right now." compact />
          ) : (
            priorityHomework.map((hw) => (
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
          <SectionHeader title="Latest Result" onActionPress={() => navigation.navigate('Results')} />
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scrollContent: { paddingBottom: layout.tabBarClearance },
  section: {
    paddingHorizontal: spacing.lg,
    marginTop: spacing.xl,
  },
});
