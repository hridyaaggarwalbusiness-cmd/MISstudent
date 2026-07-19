import React, { useMemo, useState } from 'react';
import { View, ScrollView, StyleSheet, RefreshControl, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '@navigation/types';
import { AppText, IconButton, Avatar, SectionHeader, Skeleton, EmptyState, ErrorState, AnimatedPressable } from '@components/ui';
import { TodaysOverviewCard, SnapshotStat } from '@components/dashboard/TodaysOverviewCard';
import { AIPracticeTestBanner } from '@components/dashboard/AIPracticeTestBanner';
import { UpdateFeedItem, UpdateFeedItemData } from '@components/dashboard/UpdateFeedItem';
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
import { todayDayCode, greetingForNow, noticeTimeLabel, dueDateLabel } from '@utils/date';
import { overallAttendancePercentage } from '@utils/attendance';
import { eventTypeMeta } from '@data/calendarEventTypeMeta';
import { subjectMeta } from '@data/subjectMeta';

const FEED_COLLAPSED_LIMIT = 4;
const FEED_EXPANDED_LIMIT = 10;
// Extra bottom padding so scrolled content never sits under the fixed
// AI Practice Test banner, which floats above the tab bar independent
// of scroll position.
const BANNER_RESERVED_SPACE = 100;

async function loadDashboard(classId: string, studentId: string) {
  const [timetable, exams, attendanceMonth, results, calendarEvents, materials] = await Promise.all([
    repo.timetable.getAll(classId),
    repo.exams.list(classId),
    repo.attendance.getCurrentMonth(studentId),
    repo.results.list(studentId),
    repo.calendar.list(),
    repo.materials.list(classId),
  ]);
  return { timetable, exams, attendanceMonth, results, calendarEvents, materials };
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
  const [feedExpanded, setFeedExpanded] = useState(false);

  const { data, loading, refreshing, error, refresh } = useAsyncResource(
    () =>
      authStudent
        ? loadDashboard(authStudent.classId, authStudent.id)
        : Promise.resolve({ timetable: [], exams: [], attendanceMonth: [], results: [], calendarEvents: [], materials: [] }),
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

  const todaysEvents = useMemo(() => {
    if (!data) return [];
    return data.calendarEvents.filter((e) => e.date <= todayIso && (e.endDate ?? e.date) >= todayIso);
  }, [data, todayIso]);

  const attendancePct = useMemo(
    () => (data ? overallAttendancePercentage(data.attendanceMonth) : 0),
    [data],
  );

  const snapshotStats: SnapshotStat[] = useMemo(
    () => [
      {
        key: 'hw',
        icon: 'book',
        value: String(homeworkItems.length),
        label: 'Homework',
        iconBg: '#E4D9FB',
        iconColor: '#6D3FD6',
      },
      {
        key: 'notices',
        icon: 'megaphone',
        value: String(noticeItems.filter((n) => !n.isRead).length),
        label: 'Notices',
        iconBg: '#DCEAFF',
        iconColor: '#2C52D9',
      },
      {
        key: 'attendance',
        icon: 'checkmark-circle',
        value: `${Math.round(attendancePct)}%`,
        label: 'Attendance',
        iconBg: '#DCF5E3',
        iconColor: '#16803F',
      },
    ],
    [homeworkItems, noticeItems, attendancePct],
  );

  const latestResult = data?.results[data.results.length - 1];

  // A single chronological feed instead of separate homework/notice/event/
  // result sections, so the home screen leads with "what's new" first.
  const feedItems: UpdateFeedItemData[] = useMemo(() => {
    const entries: { ts: number; item: UpdateFeedItemData }[] = [];

    homeworkItems.forEach((hw) => {
      const meta = subjectMeta(hw.subject);
      entries.push({
        ts: new Date(hw.assignedDate).getTime() || 0,
        item: {
          key: `hw-${hw.id}`,
          icon: meta.icon,
          color: meta.gradient[1],
          categoryLabel: 'Homework',
          categoryColor: colors.tileOrange,
          title: hw.title,
          meta: `Due: ${dueDateLabel(hw.dueDate)}`,
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
          categoryLabel: 'Notice',
          categoryColor: colors.tileOrange,
          title: n.title,
          meta: `By ${n.postedBy} · ${noticeTimeLabel(n.postedAt)}`,
          onPress: () => navigation.navigate('NoticeDetail', { id: n.id }),
        },
      });
    });

    (data?.materials ?? []).forEach((m) => {
      entries.push({
        ts: new Date(m.uploadedAt).getTime() || 0,
        item: {
          key: `material-${m.id}`,
          icon: 'document-text',
          color: colors.tileGreen,
          categoryLabel: 'Material',
          categoryColor: colors.tileGreen,
          title: m.title,
          meta: `Uploaded ${noticeTimeLabel(m.uploadedAt)}`,
          onPress: () => navigation.navigate('StudyMaterials'),
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
          categoryLabel: 'Event',
          categoryColor: colors.tileGreen,
          title: e.title,
          meta: e.location || 'Today',
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
          categoryLabel: 'Result',
          categoryColor: colors.tileViolet,
          title: `${latestResult.examName} results published`,
          meta: `Check your marks · ${noticeTimeLabel(latestResult.date)}`,
          onPress: () => navigation.navigate('MainTabs', { screen: 'ResultsTab' }),
        },
      });
    }

    return entries
      .sort((a, b) => b.ts - a.ts)
      .slice(0, FEED_EXPANDED_LIMIT)
      .map((e) => e.item);
  }, [homeworkItems, noticeItems, todaysEvents, latestResult, data?.materials, navigation]);

  const visibleFeedItems = feedExpanded ? feedItems : feedItems.slice(0, FEED_COLLAPSED_LIMIT);
  const canExpandFeed = feedItems.length > FEED_COLLAPSED_LIMIT;
  const feedActionLabel = !feedExpanded && canExpandFeed ? 'View more' : 'View all';
  const onFeedActionPress = !feedExpanded && canExpandFeed
    ? () => setFeedExpanded(true)
    : () => navigation.navigate('Notifications');

  const quickAccess: QuickAccessItem[] = [
    {
      key: 'homework',
      label: 'Homework',
      icon: 'book',
      color: colors.tileViolet,
      onPress: () => navigation.navigate('MainTabs', { screen: 'HomeworkTab' }),
    },
    {
      key: 'timetable',
      label: 'Timetable',
      icon: 'calendar',
      color: colors.tileGreen,
      onPress: () => navigation.navigate('MainTabs', { screen: 'TimetableTab' }),
    },
    {
      key: 'results',
      label: 'Results',
      icon: 'bar-chart',
      color: colors.tileGreen,
      onPress: () => navigation.navigate('MainTabs', { screen: 'ResultsTab' }),
    },
    {
      key: 'attendance',
      label: 'Attendance',
      icon: 'checkmark-circle',
      color: colors.tileViolet,
      onPress: () => navigation.navigate('Attendance'),
    },
    {
      key: 'materials',
      label: 'Study Material',
      icon: 'folder',
      color: colors.tileBlue,
      onPress: () => navigation.navigate('StudyMaterials'),
    },
    {
      key: 'fees',
      label: 'Fee Receipts',
      icon: 'receipt',
      color: colors.tileOrange,
      onPress: () => navigation.navigate('FeeReceipts'),
    },
    {
      key: 'calendar',
      label: 'Calendar',
      icon: 'today',
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
          <IconButton icon="menu-outline" onPress={() => setMoreVisible(true)} size={36} />
          <View style={{ flex: 1 }} />
          <BellButton count={unreadCount} onPress={() => navigation.navigate('Notifications')} />
          <Avatar name={student?.name ?? firstName} size={36} style={{ marginLeft: spacing.sm }} />
        </View>
        <AppText variant="caption" color={colors.textTertiary} style={{ marginTop: spacing.md }}>
          {greetingForNow()},
        </AppText>
        <AppText variant="displayMd" numberOfLines={1}>
          {student?.name ?? firstName} 👋
        </AppText>
        {student && (
          <AppText variant="caption" color={colors.textTertiary} style={{ marginTop: 2 }}>
            {student.className} · Section {student.section}
          </AppText>
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
          {loading ? (
            <Skeleton height={172} borderRadius={20} />
          ) : (
            <TodaysOverviewCard stats={snapshotStats} />
          )}
        </View>

        <View style={styles.section}>
          <SectionHeader title="What's New" actionLabel={feedActionLabel} onActionPress={onFeedActionPress} />
          {loading ? (
            <Skeleton height={90} borderRadius={16} />
          ) : feedItems.length === 0 ? (
            <EmptyState icon="sparkles-outline" title="All quiet for now" message="New homework, notices and events will show up here." compact />
          ) : (
            <>
              {visibleFeedItems.map((item) => <UpdateFeedItem key={item.key} item={item} />)}
              {feedExpanded && (
                <AnimatedPressable onPress={() => setFeedExpanded(false)} style={styles.viewLess} haptic={false}>
                  <AppText variant="bodyMedium" color={colors.primary}>
                    View less
                  </AppText>
                  <Ionicons name="chevron-up" size={16} color={colors.primary} />
                </AnimatedPressable>
              )}
            </>
          )}
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

      <View style={styles.fixedBanner}>
        <AIPracticeTestBanner onPress={() => navigation.navigate('PracticeTestGenerator')} />
      </View>

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
    width: 36,
    height: 36,
    borderRadius: 18,
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
  scrollContent: { paddingBottom: layout.tabBarClearance + BANNER_RESERVED_SPACE },
  section: {
    paddingHorizontal: spacing.lg,
    marginTop: spacing.xl,
  },
  fixedBanner: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
    bottom: spacing.md,
  },
  viewLess: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
  },
});
