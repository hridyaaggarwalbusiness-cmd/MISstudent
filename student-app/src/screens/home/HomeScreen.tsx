import React, { useMemo, useState } from 'react';
import { View, ScrollView, StyleSheet, RefreshControl, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { RootStackParamList } from '@navigation/types';
import { AppText, IconButton, Avatar, SectionHeader, Skeleton, EmptyState, ErrorState, AnimatedPressable } from '@components/ui';
import { SchoolPocketBanner } from '@components/dashboard/SchoolPocketBanner';
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
import { useBusTrackingStore, requestBusNotificationPermission } from '@store/useBusTrackingStore';
import { greetingForNow, noticeTimeLabel, dueInLabelLong, parseDate } from '@utils/date';
import { subjectMeta } from '@data/subjectMeta';

const FEED_COLLAPSED_LIMIT = 4;
const FEED_EXPANDED_LIMIT = 10;

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

  React.useEffect(() => {
    if (authStudent?.assignedBusId) {
      requestBusNotificationPermission();
      useBusTrackingStore.getState().init(authStudent.assignedBusId, authStudent.assignedStopId);
    }
  }, [authStudent?.assignedBusId, authStudent?.assignedStopId]);

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
          iconColor: '#6D3FD6',
          iconBg: '#EAE1FB',
          accentColor: '#8B5CF6',
          cardBg: '#F7F3FD',
          categoryLabel: 'Homework',
          categoryColor: '#6D3FD6',
          title: hw.title,
          badge: { label: dueInLabelLong(hw.dueDate), icon: 'calendar-outline', color: '#6D3FD6', bg: '#EAE1FB' },
          subtitle: `By ${hw.teacher} · ${noticeTimeLabel(hw.assignedDate)}`,
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
          iconColor: '#F2711F',
          iconBg: '#FFE7D1',
          accentColor: '#F2711F',
          cardBg: '#FFF6EE',
          categoryLabel: 'New Notice',
          categoryColor: '#F2711F',
          title: n.title,
          subtitle: `By ${n.postedBy} · ${noticeTimeLabel(n.postedAt)}`,
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
          iconColor: '#2C52D9',
          iconBg: '#DCEAFF',
          accentColor: '#3E6BFA',
          cardBg: '#EFF5FF',
          categoryLabel: 'New Study Material',
          categoryColor: '#2C52D9',
          title: m.title,
          badge: { label: m.attachment?.type === 'pdf' ? 'PDF' : 'New', icon: 'document-outline', color: '#2C52D9', bg: '#DCEAFF' },
          subtitle: `By ${m.uploadedBy} · ${noticeTimeLabel(m.uploadedAt)}`,
          onPress: () => navigation.navigate('StudyMaterials'),
        },
      });
    });

    (data?.feePayments ?? []).forEach((p) => {
      const badge =
        p.statusAfter === 'paid'
          ? { label: 'Paid', icon: 'checkmark' as const, color: '#16803F', bg: '#D9F5E3' }
          : p.statusAfter === 'partial'
            ? { label: 'Partial', color: '#B4720C', bg: '#FFF0CE' }
            : { label: 'Unpaid', color: '#C22A2F', bg: '#FFDCDC' };
      entries.push({
        ts: new Date(p.createdAt).getTime() || 0,
        item: {
          key: `fee-${p.id}`,
          icon: 'receipt',
          iconColor: '#16803F',
          iconBg: '#D9F5E3',
          accentColor: '#22A55E',
          cardBg: '#EEFBF3',
          categoryLabel: 'Fee Receipt',
          categoryColor: '#16803F',
          title: `${format(parseDate(p.paymentDate), 'MMMM')} Fee Receipt Available`,
          badge,
          subtitle: `By ${p.collectedByName || 'Accounts Office'} · ${noticeTimeLabel(p.createdAt)}`,
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
          iconColor: '#6D3FD6',
          iconBg: '#EAE1FB',
          accentColor: '#8B5CF6',
          cardBg: '#F7F3FD',
          categoryLabel: 'Result',
          categoryColor: '#6D3FD6',
          title: `${latestResult.examName} results published`,
          subtitle: `Check your marks · ${noticeTimeLabel(latestResult.date)}`,
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
      key: 'timetable',
      label: 'Timetable',
      icon: 'calendar',
      color: '#2C52D9',
      bg: '#E3EDFF',
      onPress: () => navigation.navigate('MainTabs', { screen: 'TimetableTab' }),
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
      key: 'attendance',
      label: 'Attendance',
      icon: 'checkmark-circle',
      color: '#6D3FD6',
      bg: '#EDE8FC',
      onPress: () => navigation.navigate('Attendance'),
    },
    {
      key: 'materials',
      label: 'Study Material',
      icon: 'folder',
      color: '#0876AE',
      bg: '#EAF7FF',
      onPress: () => navigation.navigate('StudyMaterials'),
    },
    {
      key: 'fees',
      label: 'Fee Receipts',
      icon: 'pricetag',
      color: '#B4720C',
      bg: '#FFF3DE',
      onPress: () => navigation.navigate('FeeReceipts'),
    },
    {
      key: 'calendar',
      label: 'Calendar',
      icon: 'today',
      color: '#C22A2F',
      bg: '#FFEEEE',
      onPress: () => navigation.navigate('AcademicCalendar'),
    },
    ...(student?.assignedBusId
      ? [
          {
            key: 'bus',
            label: 'Live Bus',
            icon: 'bus' as const,
            color: '#0876AE',
            bg: '#EAF7FF',
            onPress: () => navigation.navigate('LiveBusTracking'),
          },
        ]
      : []),
    {
      key: 'more',
      label: 'More',
      icon: 'ellipsis-horizontal',
      color: colors.textTertiary,
      bg: colors.surfaceAlt,
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
        <View style={{ paddingHorizontal: spacing.md, marginTop: -spacing.xs }}>
          <SchoolPocketBanner onExplore={() => navigation.navigate('Search')} />
        </View>

        <View style={styles.section}>
          <SectionHeader
            title="Today for you"
            icon="sparkles"
            actionLabel={feedActionLabel}
            onActionPress={onFeedActionPress}
          />
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

        <View style={styles.section}>
          <SectionHeader
            title="Quick Access"
            icon="grid"
            actionLabel="Edit"
            actionIcon="pencil-outline"
            onActionPress={() => Alert.alert('Customize Quick Access', 'Rearranging shortcuts is coming in a future update.')}
          />
          <QuickAccessGrid items={quickAccess} />
        </View>

        <View style={[styles.section, { marginBottom: spacing.xxxl }]}>
          <AIPracticeTestBanner onPress={() => navigation.navigate('PracticeTestGenerator')} />
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
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xs,
    paddingBottom: spacing.md,
    overflow: 'hidden',
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
  scrollContent: { paddingBottom: layout.tabBarClearance },
  section: {
    paddingHorizontal: spacing.lg,
    marginTop: spacing.xl,
  },
  viewLess: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
  },
});
