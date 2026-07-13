import React, { useMemo, useState } from 'react';
import { View, ScrollView, StyleSheet, RefreshControl, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '@navigation/types';
import { AppText, IconButton, SectionHeader, Skeleton, EmptyState, ErrorState, AnimatedPressable } from '@components/ui';
import { SchoolStatusBanner } from '@components/dashboard/SchoolStatusBanner';
import { UpdateFeedItem, UpdateFeedItemData } from '@components/dashboard/UpdateFeedItem';
import { UpcomingStats } from '@components/dashboard/UpcomingStats';
import { QuickAccessGrid, QuickAccessItem } from '@components/dashboard/QuickAccessGrid';
import { MoreMenuModal } from '@components/dashboard/MoreMenuModal';
import { colors, spacing, layout } from '@theme';
import { repo } from '@data/repositories';
import { useAsyncResource } from '@hooks/useAsyncResource';
import { useStudentStore } from '@store/useStudentStore';
import { useHomeworkStore } from '@store/useHomeworkStore';
import { useNoticesStore } from '@store/useNoticesStore';
import { useNotificationsStore } from '@store/useNotificationsStore';
import { useAuthStore } from '@store/useAuthStore';
import { todayDayCode, greetingForNow, relativeTime } from '@utils/date';
import { computeSchoolStatus } from '@utils/schoolStatus';
import { eventTypeMeta } from '@data/calendarEventTypeMeta';

async function loadDashboard(classId: string, studentId: string) {
  const [timetable, exams, attendanceMonth, results, calendarEvents] = await Promise.all([
    repo.timetable.getAll(classId),
    repo.exams.list(classId),
    repo.attendance.getCurrentMonth(studentId),
    repo.results.list(studentId),
    repo.calendar.list(),
  ]);
  return { timetable, exams, attendanceMonth, results, calendarEvents };
}

function isRecent(dateIso: string, days: number): boolean {
  const then = new Date(dateIso).getTime();
  if (Number.isNaN(then)) return false;
  return Date.now() - then <= days * 24 * 60 * 60 * 1000;
}

function isoToday(): string {
  return new Date().toISOString().slice(0, 10);
}

function BellButton({ count, onPress }: { count: number; onPress: () => void }) {
  return (
    <AnimatedPressable onPress={onPress} style={styles.bell} haptic={false}>
      <Ionicons name="notifications-outline" size={19} color={colors.textPrimary} />
      {count > 0 && (
        <View style={styles.bellBadge}>
          <AppText variant="tiny" color="#fff" style={{ fontSize: 9, fontWeight: '700' }}>
            {count > 9 ? '9+' : count}
          </AppText>
        </View>
      )}
    </AnimatedPressable>
  );
}

export function HomeScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const authStudent = useAuthStore((s) => s.student);
  const signOut = useAuthStore((s) => s.signOut);
  const { student, fetch: fetchStudent } = useStudentStore();
  const { items: homeworkItems, fetch: fetchHomework } = useHomeworkStore();
  const { items: noticeItems, fetch: fetchNotices } = useNoticesStore();
  const { unreadCount, fetch: fetchNotifications } = useNotificationsStore();
  const [moreVisible, setMoreVisible] = useState(false);

  const { data, loading, refreshing, error, refresh } = useAsyncResource(
    () =>
      authStudent
        ? loadDashboard(authStudent.classId, authStudent.id)
        : Promise.resolve({ timetable: [], exams: [], attendanceMonth: [], results: [], calendarEvents: [] }),
    [authStudent?.id],
  );

  React.useEffect(() => {
    fetchStudent();
    fetchHomework();
    fetchNotices();
    fetchNotifications();
  }, [fetchStudent, fetchHomework, fetchNotices, fetchNotifications]);

  const today = todayDayCode();
  const todayIso = isoToday();

  const todaysPeriods = useMemo(() => {
    if (!data) return [];
    return data.timetable.filter((p) => p.day === today);
  }, [data, today]);

  const schoolStatus = useMemo(() => computeSchoolStatus(todaysPeriods), [todaysPeriods]);

  const todaysEvents = useMemo(() => {
    if (!data) return [];
    return data.calendarEvents.filter((e) => e.date <= todayIso && (e.endDate ?? e.date) >= todayIso);
  }, [data, todayIso]);

  const latestResult = data?.results[data.results.length - 1];

  // A single chronological feed instead of separate homework/notice/event/
  // result sections, so the home screen leads with "what's new" first.
  const feedItems: UpdateFeedItemData[] = useMemo(() => {
    const entries: { ts: number; item: UpdateFeedItemData }[] = [];

    homeworkItems.forEach((hw) => {
      entries.push({
        ts: new Date(hw.assignedDate).getTime() || 0,
        item: {
          key: `hw-${hw.id}`,
          icon: 'book',
          color: colors.tileBlue,
          category: 'HOMEWORK',
          title: `${hw.subject} homework added`,
          subtitle: hw.title,
          meta: relativeTime(hw.assignedDate),
          badge: isRecent(hw.assignedDate, 2) ? 'New' : undefined,
          onPress: () => navigation.navigate('HomeworkDetail', { id: hw.id }),
        },
      });
    });

    noticeItems.forEach((n) => {
      entries.push({
        ts: new Date(n.postedAt).getTime() || 0,
        item: {
          key: `notice-${n.id}`,
          icon: 'megaphone',
          color: colors.tileOrange,
          category: 'NOTICE',
          title: n.title,
          meta: relativeTime(n.postedAt),
          badge: isRecent(n.postedAt, 2) ? 'New' : undefined,
          onPress: () => navigation.navigate('NoticeDetail', { id: n.id }),
        },
      });
    });

    todaysEvents.forEach((e) => {
      entries.push({
        ts: Date.now(),
        item: {
          key: `event-${e.id}`,
          icon: (eventTypeMeta[e.type]?.icon as UpdateFeedItemData['icon']) ?? 'calendar',
          color: colors.tileGreen,
          category: 'EVENT',
          title: e.title,
          subtitle: e.location || e.description,
          meta: 'Today',
          badge: 'Today',
          onPress: () => navigation.navigate('AcademicCalendar'),
        },
      });
    });

    if (latestResult) {
      entries.push({
        ts: new Date(latestResult.date).getTime() || 0,
        item: {
          key: `result-${latestResult.id}`,
          icon: 'stats-chart',
          color: colors.tileViolet,
          category: 'RESULTS',
          title: `${latestResult.examName} results published`,
          subtitle: 'Check your marks now',
          meta: relativeTime(latestResult.date),
          onPress: () => navigation.navigate('Results'),
        },
      });
    }

    return entries
      .sort((a, b) => b.ts - a.ts)
      .slice(0, 4)
      .map((e) => e.item);
  }, [homeworkItems, noticeItems, todaysEvents, latestResult, navigation]);

  const upcomingStats = useMemo(() => {
    const homeworkDueToday = homeworkItems.filter((h) => h.dueDate === todayIso).length;
    const examsThisWeek = (data?.exams ?? []).filter((e) => {
      const diff = (new Date(e.date).getTime() - Date.now()) / 86_400_000;
      return diff >= 0 && diff <= 7;
    }).length;
    const classesToday = todaysPeriods.filter((p) => !p.isBreak).length;

    return [
      { key: 'hw', value: homeworkDueToday, valueColor: colors.tileRed, label: 'Homework', sublabel: 'Due today' },
      { key: 'exam', value: examsThisWeek, valueColor: colors.tileOrange, label: 'Exam', sublabel: 'This week' },
      {
        key: 'classes',
        value: classesToday,
        valueColor: classesToday === 0 ? colors.tileGreen : colors.primary,
        label: 'Classes',
        sublabel: classesToday === 0 ? 'Free today' : 'Today',
      },
    ];
  }, [homeworkItems, data, todaysPeriods, todayIso]);

  const quickAccess: QuickAccessItem[] = [
    {
      key: 'timetable',
      label: 'Timetable',
      icon: 'calendar-outline',
      color: colors.tileGreen,
      onPress: () => navigation.navigate('MainTabs', { screen: 'TimetableTab' }),
    },
    {
      key: 'attendance',
      label: 'Attendance',
      icon: 'checkmark-done-outline',
      color: colors.tileViolet,
      onPress: () => navigation.navigate('Attendance'),
    },
    {
      key: 'results',
      label: 'Results',
      icon: 'stats-chart-outline',
      color: colors.tileRed,
      onPress: () => navigation.navigate('Results'),
    },
    {
      key: 'materials',
      label: 'Materials',
      icon: 'library-outline',
      color: colors.tileSky,
      onPress: () => navigation.navigate('StudyMaterials'),
    },
    {
      key: 'calendar',
      label: 'Calendar',
      icon: 'today-outline',
      color: colors.tileOrange,
      onPress: () => navigation.navigate('AcademicCalendar'),
    },
    {
      key: 'more',
      label: 'More',
      icon: 'ellipsis-horizontal',
      color: colors.textTertiary,
      onPress: () => setMoreVisible(true),
    },
  ];

  if (error && !data) {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
        <ErrorState onRetry={refresh} />
      </SafeAreaView>
    );
  }

  const firstName = student?.name.split(' ')[0] ?? 'Student';

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <IconButton icon="menu-outline" onPress={() => setMoreVisible(true)} />
          <View style={{ flex: 1, marginLeft: spacing.sm }}>
            <AppText variant="caption" color={colors.textTertiary}>
              {greetingForNow()}
            </AppText>
            <AppText variant="h1" numberOfLines={1}>
              {firstName} 👋
            </AppText>
          </View>
          <BellButton count={unreadCount} onPress={() => navigation.navigate('Notifications')} />
        </View>
        {student && (
          <View style={styles.classPill}>
            <AppText variant="caption" color={colors.textSecondary}>
              {student.className} · Section {student.section}
            </AppText>
          </View>
        )}
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.primary} colors={[colors.primary]} />
        }
      >
        <View style={{ paddingHorizontal: spacing.lg }}>
          {loading ? <Skeleton height={130} borderRadius={20} /> : <SchoolStatusBanner status={schoolStatus} />}
        </View>

        <View style={styles.section}>
          <SectionHeader title="Today's Updates" onActionPress={() => navigation.navigate('Notifications')} />
          {loading ? (
            <Skeleton height={90} borderRadius={16} />
          ) : feedItems.length === 0 ? (
            <EmptyState icon="sparkles-outline" title="All quiet for now" message="New homework, notices and events will show up here." compact />
          ) : (
            feedItems.map((item) => <UpdateFeedItem key={item.key} item={item} />)
          )}
        </View>

        <View style={styles.section}>
          <SectionHeader title="Upcoming" />
          {loading ? <Skeleton height={90} borderRadius={16} /> : <UpcomingStats stats={upcomingStats} />}
        </View>

        <View style={[styles.section, { marginBottom: spacing.xxxl }]}>
          <SectionHeader
            title="Quick Access"
            actionLabel="Edit"
            onActionPress={() => Alert.alert('Customize Quick Access', 'Rearranging shortcuts is coming in a future update.')}
          />
          <QuickAccessGrid items={quickAccess} />
        </View>
      </ScrollView>

      <MoreMenuModal
        visible={moreVisible}
        onClose={() => setMoreVisible(false)}
        actions={[
          { key: 'search', label: 'Search', icon: 'search-outline', onPress: () => navigation.navigate('Search') },
          {
            key: 'notifications',
            label: 'Notifications',
            icon: 'notifications-outline',
            onPress: () => navigation.navigate('Notifications'),
          },
          {
            key: 'signout',
            label: 'Log Out',
            icon: 'log-out-outline',
            destructive: true,
            onPress: () =>
              Alert.alert('Log Out', 'Are you sure you want to log out?', [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Log Out', style: 'destructive', onPress: () => signOut() },
              ]),
          },
        ]}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: { paddingHorizontal: spacing.lg, paddingTop: spacing.xs, paddingBottom: spacing.md },
  headerRow: { flexDirection: 'row', alignItems: 'center' },
  classPill: {
    alignSelf: 'flex-start',
    marginTop: spacing.md,
    backgroundColor: colors.surfaceAlt,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  bell: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bellBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    paddingHorizontal: 3,
    backgroundColor: colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: colors.surface,
  },
  scrollContent: { paddingBottom: layout.tabBarClearance },
  section: {
    paddingHorizontal: spacing.lg,
    marginTop: spacing.xl,
  },
});
