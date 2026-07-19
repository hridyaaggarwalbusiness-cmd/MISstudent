import React, { useMemo, useState } from 'react';
import { View, ScrollView, StyleSheet, RefreshControl, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { RootStackParamList } from '@navigation/types';
import { AppText, IconButton, Avatar, SectionHeader, Skeleton, EmptyState, ErrorState, AnimatedPressable } from '@components/ui';
import { AtAGlanceCard, GlanceStat } from '@components/dashboard/AtAGlanceCard';
import { HeaderIllustration } from '@components/dashboard/HeaderIllustration';
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
import { todayDayCode, greetingForNow, noticeTimeLabel, dueInLabelLong, parseDate } from '@utils/date';
import { overallAttendancePercentage } from '@utils/attendance';
import { subjectMeta } from '@data/subjectMeta';

const FEED_COLLAPSED_LIMIT = 4;
const FEED_EXPANDED_LIMIT = 10;
// Extra bottom padding so scrolled content never sits under the fixed
// AI Practice Test banner, which floats above the tab bar independent
// of scroll position.
const BANNER_RESERVED_SPACE = 100;

async function loadDashboard(classId: string, studentId: string) {
  const [timetable, exams, attendanceMonth, results, calendarEvents, materials, feePayments] = await Promise.all([
    repo.timetable.getAll(classId),
    repo.exams.list(classId),
    repo.attendance.getCurrentMonth(studentId),
    repo.results.list(studentId),
    repo.calendar.list(),
    repo.materials.list(classId),
    repo.feePayments.list(studentId),
  ]);
  return { timetable, exams, attendanceMonth, results, calendarEvents, materials, feePayments };
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
        : Promise.resolve({ timetable: [], exams: [], attendanceMonth: [], results: [], calendarEvents: [], materials: [], feePayments: [] }),
    [authStudent?.id],
  );

  React.useEffect(() => {
    fetchStudent();
    fetchHomework();
    fetchNotices();
    fetchNotifications();
  }, [fetchStudent, fetchHomework, fetchNotices, fetchNotifications]);

  const todayIso = isoToday();

  const upcomingEventsCount = useMemo(() => {
    if (!data) return 0;
    return data.calendarEvents.filter((e) => (e.endDate ?? e.date) >= todayIso).length;
  }, [data, todayIso]);

  const attendancePct = useMemo(
    () => (data ? overallAttendancePercentage(data.attendanceMonth) : 0),
    [data],
  );

  const pendingHomeworkCount = useMemo(
    () => homeworkItems.filter((hw) => hw.status === 'pending' || hw.status === 'overdue').length,
    [homeworkItems],
  );

  const glanceStats: GlanceStat[] = useMemo(
    () => [
      {
        key: 'hw',
        icon: 'book',
        iconColor: '#6D3FD6',
        cardBg: '#EDE8FC',
        tag: 'Pending',
        value: String(pendingHomeworkCount),
        label: 'Homework',
      },
      {
        key: 'notices',
        icon: 'megaphone',
        iconColor: '#2C52D9',
        cardBg: '#E3EDFF',
        tag: 'New',
        value: String(noticeItems.filter((n) => !n.isRead).length),
        label: 'Notices',
      },
      {
        key: 'attendance',
        icon: 'checkmark-circle',
        iconColor: '#16803F',
        cardBg: '#E1F5E7',
        tag: 'This Month',
        value: `${Math.round(attendancePct)}%`,
        label: 'Attendance',
      },
      {
        key: 'events',
        icon: 'calendar',
        iconColor: '#B4720C',
        cardBg: '#FFF3DE',
        tag: 'Upcoming',
        value: String(upcomingEventsCount),
        label: 'Events',
      },
    ],
    [pendingHomeworkCount, noticeItems, attendancePct, upcomingEventsCount],
  );

  const latestResult = data?.results[data.results.length - 1];

  // A single chronological feed instead of separate homework/notice/material/
  // fee sections, so the home screen leads with "latest updates" first.
  const feedItems: UpdateFeedItemData[] = useMemo(() => {
    const entries: { ts: number; item: UpdateFeedItemData }[] = [];

    homeworkItems.forEach((hw) => {
      const meta = subjectMeta(hw.subject);
      entries.push({
        ts: new Date(hw.assignedDate).getTime() || 0,
        item: {
          key: `hw-${hw.id}`,
          icon: meta.icon,
          color: '#8B5CF6',
          categoryLabel: 'Homework',
          categoryColor: '#6D3FD6',
          title: hw.title,
          badge: { label: dueInLabelLong(hw.dueDate), color: '#6D3FD6', bg: '#F3EEFF' },
          timestamp: noticeTimeLabel(hw.assignedDate),
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
          color: '#F2711F',
          categoryLabel: 'Notice',
          categoryColor: '#F2711F',
          title: n.title,
          subtitle: `By ${n.postedBy}`,
          timestamp: noticeTimeLabel(n.postedAt),
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
          color: '#3E6BFA',
          categoryLabel: 'Study Material',
          categoryColor: '#2C52D9',
          title: m.title,
          badge: { label: m.attachment?.type === 'pdf' ? 'New PDF' : 'New', color: '#2C52D9', bg: '#EAF0FF' },
          timestamp: noticeTimeLabel(m.uploadedAt),
          onPress: () => navigation.navigate('StudyMaterials'),
        },
      });
    });

    (data?.feePayments ?? []).forEach((p) => {
      const badge =
        p.statusAfter === 'paid'
          ? { label: 'Paid', color: '#16803F', bg: '#E9FBF1' }
          : p.statusAfter === 'partial'
            ? { label: 'Partial', color: '#B4720C', bg: '#FFF6E4' }
            : { label: 'Unpaid', color: '#C22A2F', bg: '#FFEEEE' };
      entries.push({
        ts: new Date(p.createdAt).getTime() || 0,
        item: {
          key: `fee-${p.id}`,
          icon: 'receipt',
          color: '#22A55E',
          categoryLabel: 'Fee',
          categoryColor: '#16803F',
          title: `${format(parseDate(p.paymentDate), 'MMMM')} Fee Receipt`,
          badge,
          timestamp: noticeTimeLabel(p.createdAt),
          onPress: () => navigation.navigate('FeeReceipts'),
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
          subtitle: 'Check your marks',
          timestamp: noticeTimeLabel(latestResult.date),
          onPress: () => navigation.navigate('MainTabs', { screen: 'ResultsTab' }),
        },
      });
    }

    return entries
      .sort((a, b) => b.ts - a.ts)
      .slice(0, FEED_EXPANDED_LIMIT)
      .map((e) => e.item);
  }, [homeworkItems, noticeItems, latestResult, data?.materials, data?.feePayments, navigation]);

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
      color: '#6D3FD6',
      bg: '#EDE8FC',
      onPress: () => navigation.navigate('MainTabs', { screen: 'HomeworkTab' }),
    },
    {
      key: 'materials',
      label: 'Study Material',
      icon: 'folder',
      color: '#2C52D9',
      bg: '#E3EDFF',
      onPress: () => navigation.navigate('StudyMaterials'),
    },
    {
      key: 'results',
      label: 'Results',
      icon: 'bar-chart',
      color: '#16803F',
      bg: '#E1F5E7',
      onPress: () => navigation.navigate('MainTabs', { screen: 'ResultsTab' }),
    },
    {
      key: 'fees',
      label: 'Fee Receipts',
      icon: 'receipt',
      color: '#B4720C',
      bg: '#FFF3DE',
      onPress: () => navigation.navigate('FeeReceipts'),
    },
    {
      key: 'timetable',
      label: 'Timetable',
      icon: 'calendar',
      color: '#C22A2F',
      bg: '#FFEEEE',
      onPress: () => navigation.navigate('MainTabs', { screen: 'TimetableTab' }),
    },
    {
      key: 'leave',
      label: 'Leave Application',
      icon: 'document-text',
      color: '#0876AE',
      bg: '#EAF7FF',
      onPress: () => Alert.alert('Leave Application', 'Requesting leave from the app is coming in a future update.'),
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
        <View style={styles.headerIllustrationWrap} pointerEvents="none">
          <HeaderIllustration width={220} height={150} />
        </View>
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
          <View style={styles.classRow}>
            <AppText variant="caption" color={colors.textTertiary}>
              {student.className} · Section {student.section}
            </AppText>
            <Ionicons name="chevron-down" size={13} color={colors.textTertiary} style={{ marginLeft: 4 }} />
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
          {loading ? (
            <Skeleton height={190} borderRadius={20} />
          ) : (
            <AtAGlanceCard stats={glanceStats} onViewCalendar={() => navigation.navigate('AcademicCalendar')} />
          )}
        </View>

        <View style={styles.section}>
          <SectionHeader title="Latest Updates" actionLabel={feedActionLabel} onActionPress={onFeedActionPress} />
          {loading ? (
            <Skeleton height={90} borderRadius={16} />
          ) : feedItems.length === 0 ? (
            <EmptyState icon="sparkles-outline" title="All quiet for now" message="New homework, notices and updates will show up here." compact />
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
            actionLabel="Customize"
            actionIcon="pencil-outline"
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
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xs,
    paddingBottom: spacing.md,
    overflow: 'hidden',
  },
  headerIllustrationWrap: {
    position: 'absolute',
    top: -10,
    right: -20,
  },
  headerRow: { flexDirection: 'row', alignItems: 'center' },
  classRow: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
  bell: {
    width: 36,
    height: 36,
    borderRadius: 18,
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
