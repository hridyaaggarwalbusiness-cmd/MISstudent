import React, { useEffect, useMemo, useState } from 'react';
import { View, ScrollView, StyleSheet, Modal, Pressable, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { formatISO } from 'date-fns';
import { AppText, Card, Avatar, IconButton, AnimatedPressable, Skeleton, SkeletonCard, EmptyState } from '@components/ui';
import { UpdatesCarousel, UpdateCard } from '@components/dashboard/UpdatesCarousel';
import { QuickActionSheet } from '@components/dashboard/QuickActionSheet';
import { colors, spacing, layout, radius } from '@theme';
import { RootStackParamList } from '@navigation/types';
import { useAuthStore } from '@store/useAuthStore';
import { useNotificationsStore } from '@store/useNotificationsStore';
import { repo } from '@data/repositories';
import { greetingForNow, todayDayCode, parseDate } from '@utils/date';
import { Homework, Notice, TimetablePeriod, AttendanceRecord, Exam, ExamResult, StudyMaterial, CalendarEvent } from '@/types';

interface Task {
  key: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  title: string;
  subtitle: string;
  priority: 'High' | 'Medium' | 'Low';
  onPress: () => void;
}

const PRIORITY_TONE: Record<Task['priority'], { bg: string; fg: string }> = {
  High: { bg: colors.dangerBg, fg: colors.dangerStrong },
  Medium: { bg: colors.warningBg, fg: colors.warningStrong },
  Low: { bg: colors.successBg, fg: colors.successStrong },
};

export function DashboardScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { teacher, signOut } = useAuthStore();
  const classId = teacher?.classIds?.[0];
  const { unreadCount, init: initNotifications } = useNotificationsStore();
  const [menuVisible, setMenuVisible] = useState(false);
  const [sheetVisible, setSheetVisible] = useState(false);

  useEffect(() => {
    initNotifications();
  }, [initNotifications]);

  const [periods, setPeriods] = useState<TimetablePeriod[] | null>(null);
  const [homework, setHomework] = useState<Homework[] | null>(null);
  const [notices, setNotices] = useState<Notice[] | null>(null);
  const [todaysAttendance, setTodaysAttendance] = useState<AttendanceRecord[] | null>(null);
  const [exams, setExams] = useState<Exam[]>([]);
  const [results, setResults] = useState<ExamResult[]>([]);
  const [materials, setMaterials] = useState<StudyMaterial[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const todayIso = useMemo(() => formatISO(new Date(), { representation: 'date' }), []);

  useEffect(() => {
    if (!classId) return;
    const unsubTt = repo.timetable.subscribeForClass(classId, setPeriods);
    const unsubHw = repo.homework.subscribeForClass(classId, setHomework);
    const unsubNotices = repo.notices.subscribeAll(setNotices);
    const unsubAttendance = repo.attendance.subscribeForClassDate(classId, todayIso, setTodaysAttendance);
    const unsubExams = repo.exams.subscribeForClass(classId, setExams);
    const unsubResults = repo.results.subscribeForClass(classId, setResults);
    const unsubMaterials = repo.materials.subscribeForClass(classId, setMaterials);
    const unsubEvents = repo.calendar.subscribeAll(setEvents);
    return () => {
      unsubTt();
      unsubHw();
      unsubNotices();
      unsubAttendance();
      unsubExams();
      unsubResults();
      unsubMaterials();
      unsubEvents();
    };
  }, [classId, todayIso]);

  const today = todayDayCode();
  const teachingPeriodsToday = useMemo(
    () => (periods ?? []).filter((p) => p.day === today && !p.isBreak && p.teacherId === teacher?.id),
    [periods, today, teacher?.id],
  );
  const allPeriodsToday = useMemo(
    () => (periods ?? []).filter((p) => p.day === today && !p.isBreak),
    [periods, today],
  );
  const freePeriods = Math.max(0, allPeriodsToday.length - teachingPeriodsToday.length);

  const loading = periods === null || homework === null;

  const tasks: Task[] = useMemo(() => {
    const list: Task[] = [];
    const mySubjects = new Set(teacher?.subjects ?? []);

    const needsMarks = exams.find(
      (e) => mySubjects.has(e.subject) && e.status !== 'upcoming' && !results.some((r) => r.examId === e.id),
    );
    if (needsMarks) {
      const overdue = new Date(needsMarks.date).getTime() < Date.now() - 86400000;
      list.push({
        key: `marks-${needsMarks.id}`,
        icon: 'clipboard-outline',
        color: colors.tileOrange,
        title: 'Enter Unit Test Marks',
        subtitle: `${needsMarks.name} · ${needsMarks.subject}`,
        priority: overdue ? 'High' : 'Medium',
        onPress: () => navigation.navigate('ResultEntry', { examId: needsMarks.id }),
      });
    }

    const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const recentHomework = (homework ?? []).filter((h) => new Date(h.assignedDate).getTime() >= weekAgo);
    if (recentHomework.length === 0) {
      list.push({
        key: 'post-homework',
        icon: 'cloud-upload-outline',
        color: colors.tileGreen,
        title: 'Post Homework',
        subtitle: teacher ? `${teacher.subjects[0] ?? ''}` : '',
        priority: 'Medium',
        onPress: () => navigation.navigate('HomeworkCreate'),
      });
    }

    const twoWeeksAgo = Date.now() - 14 * 24 * 60 * 60 * 1000;
    const recentMaterials = materials.filter((m) => parseDate(m.uploadedAt).getTime() >= twoWeeksAgo);
    if (recentMaterials.length === 0) {
      list.push({
        key: 'upload-material',
        icon: 'document-attach-outline',
        color: colors.tileSky,
        title: 'Upload Study Material',
        subtitle: teacher ? `${teacher.subjects[teacher.subjects.length - 1] ?? ''}` : '',
        priority: 'Low',
        onPress: () => navigation.navigate('MaterialUpload'),
      });
    }

    return list;
  }, [exams, results, homework, materials, teacher, navigation]);

  const updateCards: UpdateCard[] = useMemo(() => {
    const notifs: { ts: number; item: UpdateCard }[] = [];
    (notices ?? []).forEach((n) => {
      notifs.push({
        ts: parseDate(n.postedAt).getTime() || 0,
        item: {
          key: `notice-${n.id}`,
          icon: 'megaphone',
          color: colors.tileRed,
          title: n.title,
          subtitle: n.body,
          time: n.postedAt,
          onPress: () => navigation.navigate('Notices'),
        },
      });
    });
    events.forEach((e) => {
      notifs.push({
        ts: new Date(e.date).getTime() || 0,
        item: {
          key: `event-${e.id}`,
          icon: 'calendar',
          color: colors.tileBlue,
          title: e.title,
          subtitle: e.description || (e.location ?? 'School event'),
          time: e.date,
          onPress: () => navigation.navigate('AcademicCalendar'),
        },
      });
    });
    const now = Date.now();
    return notifs
      .sort((a, b) => Math.abs(a.ts - now) - Math.abs(b.ts - now))
      .slice(0, 5)
      .map((n) => n.item);
  }, [notices, events, navigation]);

  const overviewStats = [
    { icon: 'book' as const, color: colors.tileViolet, bg: colors.primarySoft, value: teachingPeriodsToday.length, label: "Today's Classes" },
    { icon: 'time' as const, color: colors.tileGreen, bg: colors.successBg, value: freePeriods, label: 'Free Periods' },
    { icon: 'checkbox' as const, color: colors.tileOrange, bg: colors.warningBg, value: tasks.length, label: 'Pending Tasks' },
    { icon: 'megaphone' as const, color: colors.tileRed, bg: colors.dangerBg, value: updateCards.length, label: 'School Updates' },
  ];

  const quickActions: { key: string; label: string; icon: keyof typeof Ionicons.glyphMap; color: string; onPress: () => void }[] = [
    { key: 'homework', label: 'Post Homework', icon: 'book-outline', color: colors.tileBlue, onPress: () => navigation.navigate('HomeworkCreate') },
    { key: 'marks', label: 'Enter Marks', icon: 'stats-chart-outline', color: colors.tileRed, onPress: () => navigation.navigate('ResultEntry', {}) },
    { key: 'material', label: 'Upload Material', icon: 'cloud-upload-outline', color: colors.tileGreen, onPress: () => navigation.navigate('MaterialUpload') },
    { key: 'notice', label: 'Add Notice', icon: 'megaphone-outline', color: colors.tileViolet, onPress: () => navigation.navigate('NoticeCreate') },
  ];

  const teacherRoleLine = teacher ? `${teacher.subjects.join(', ')} Teacher` : '';

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <IconButton icon="menu-outline" onPress={() => setMenuVisible(true)} size={36} />
        <View style={{ flex: 1 }} />
        <IconButton
          icon="notifications-outline"
          badge={unreadCount > 0}
          onPress={() => navigation.navigate('MainTabs', { screen: 'ActivityTab' })}
          size={36}
          style={{ marginRight: spacing.sm }}
        />
        <AnimatedPressable onPress={() => navigation.navigate('MainTabs', { screen: 'ProfileTab' })} haptic={false}>
          <Avatar uri={teacher?.photoUrl} name={teacher?.name ?? 'Teacher'} size={36} />
        </AnimatedPressable>
      </View>

      <View style={styles.greetingBlock}>
        <AppText variant="caption" color={colors.textTertiary}>
          {greetingForNow()},
        </AppText>
        <AppText variant="displayMd" numberOfLines={1}>
          {teacher?.name ?? 'Teacher'} 👋
        </AppText>
        <AppText variant="caption" color={colors.textSecondary} style={{ marginTop: 2 }}>
          {teacherRoleLine}
        </AppText>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Card>
            <AppText variant="h3">Today's Overview</AppText>
            {loading ? (
              <Skeleton height={90} borderRadius={16} style={{ marginTop: spacing.md }} />
            ) : (
              <View style={styles.overviewRow}>
                {overviewStats.map((stat) => (
                  <View key={stat.label} style={[styles.overviewTile, { backgroundColor: stat.bg }]}>
                    <View style={[styles.overviewIconWrap, { backgroundColor: stat.color }]}>
                      <Ionicons name={stat.icon} size={16} color="#fff" />
                    </View>
                    <AppText variant="h2" style={{ marginTop: spacing.sm }}>
                      {stat.value}
                    </AppText>
                    <AppText variant="tiny" color={colors.textSecondary} numberOfLines={2}>
                      {stat.label}
                    </AppText>
                  </View>
                ))}
              </View>
            )}
          </Card>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <AppText variant="h3">Pending Tasks</AppText>
            <AnimatedPressable onPress={() => navigation.navigate('MainTabs', { screen: 'ActivityTab' })} haptic={false}>
              <AppText variant="bodyMedium" color={colors.primary}>
                View all
              </AppText>
            </AnimatedPressable>
          </View>
          {loading ? (
            <SkeletonCard lines={2} />
          ) : tasks.length === 0 ? (
            <EmptyState icon="checkmark-done-circle-outline" title="All caught up" compact />
          ) : (
            <Card padded={false}>
              {tasks.map((task, i) => {
                const tone = PRIORITY_TONE[task.priority];
                return (
                  <AnimatedPressable
                    key={task.key}
                    onPress={task.onPress}
                    haptic={false}
                    style={[styles.taskRow, i > 0 && styles.taskRowBorder]}
                  >
                    <View style={[styles.taskIconWrap, { backgroundColor: task.color }]}>
                      <Ionicons name={task.icon} size={18} color="#fff" />
                    </View>
                    <View style={{ flex: 1, marginLeft: spacing.sm }}>
                      <AppText variant="bodySemibold" numberOfLines={1}>
                        {task.title}
                      </AppText>
                      <AppText variant="caption" color={colors.textSecondary} numberOfLines={1}>
                        {task.subtitle}
                      </AppText>
                    </View>
                    <View style={[styles.priorityPill, { backgroundColor: tone.bg }]}>
                      <AppText variant="tiny" color={tone.fg} style={{ fontWeight: '700' }}>
                        {task.priority}
                      </AppText>
                    </View>
                  </AnimatedPressable>
                );
              })}
            </Card>
          )}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <AppText variant="h3">School Updates</AppText>
            <AnimatedPressable onPress={() => navigation.navigate('MainTabs', { screen: 'ActivityTab' })} haptic={false}>
              <AppText variant="bodyMedium" color={colors.primary}>
                View all
              </AppText>
            </AnimatedPressable>
          </View>
          {loading ? (
            <SkeletonCard lines={2} />
          ) : updateCards.length === 0 ? (
            <EmptyState icon="megaphone-outline" title="No updates yet" compact />
          ) : (
            <UpdatesCarousel items={updateCards} />
          )}
        </View>

        <View style={[styles.section, { marginBottom: spacing.xxxl }]}>
          <AppText variant="h3" style={{ marginBottom: spacing.md }}>
            Quick Actions
          </AppText>
          <View style={styles.quickGrid}>
            {quickActions.map((action) => (
              <AnimatedPressable key={action.key} onPress={action.onPress} style={styles.quickTile} haptic={false}>
                <View style={[styles.quickIconWrap, { backgroundColor: action.color }]}>
                  <Ionicons name={action.icon} size={20} color="#fff" />
                </View>
                <AppText variant="tiny" color={colors.textSecondary} style={{ marginTop: 6, textAlign: 'center' }} numberOfLines={2}>
                  {action.label}
                </AppText>
              </AnimatedPressable>
            ))}
            <AnimatedPressable
              onPress={() => setSheetVisible(true)}
              style={styles.quickTile}
              haptic={false}
            >
              <View style={[styles.quickIconWrap, { backgroundColor: colors.textTertiary }]}>
                <Ionicons name="ellipsis-horizontal" size={20} color="#fff" />
              </View>
              <AppText variant="tiny" color={colors.textSecondary} style={{ marginTop: 6 }}>
                More
              </AppText>
            </AnimatedPressable>
          </View>
        </View>
      </ScrollView>

      <Modal visible={menuVisible} transparent animationType="fade" onRequestClose={() => setMenuVisible(false)}>
        <Pressable style={styles.menuOverlay} onPress={() => setMenuVisible(false)}>
          <Pressable style={styles.menuCard} onPress={(e) => e.stopPropagation()}>
            <AnimatedPressable
              haptic={false}
              style={styles.menuItem}
              onPress={() => {
                setMenuVisible(false);
                navigation.navigate('Search');
              }}
            >
              <Ionicons name="search-outline" size={18} color={colors.textPrimary} />
              <AppText variant="bodyMedium" style={{ marginLeft: spacing.sm }}>
                Search
              </AppText>
            </AnimatedPressable>
            <AnimatedPressable
              haptic={false}
              style={styles.menuItem}
              onPress={() => {
                setMenuVisible(false);
                Alert.alert('Log Out', 'Are you sure you want to log out?', [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'Log Out', style: 'destructive', onPress: () => signOut() },
                ]);
              }}
            >
              <Ionicons name="log-out-outline" size={18} color={colors.danger} />
              <AppText variant="bodyMedium" color={colors.danger} style={{ marginLeft: spacing.sm }}>
                Log Out
              </AppText>
            </AnimatedPressable>
          </Pressable>
        </Pressable>
      </Modal>

      <QuickActionSheet visible={sheetVisible} onClose={() => setSheetVisible(false)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xs,
  },
  greetingBlock: { paddingHorizontal: spacing.lg, marginTop: spacing.md },
  scrollContent: { paddingBottom: layout.tabBarClearance },
  section: { paddingHorizontal: spacing.lg, marginTop: spacing.xl },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  overviewRow: {
    flexDirection: 'row',
    marginTop: spacing.md,
    gap: spacing.xs,
  },
  overviewTile: {
    flex: 1,
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
    alignItems: 'flex-start',
  },
  overviewIconWrap: {
    width: 28,
    height: 28,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  taskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.md,
  },
  taskRowBorder: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.borderSoft,
  },
  taskIconWrap: {
    width: 38,
    height: 38,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  priorityPill: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
  quickGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  quickTile: { width: '20%', alignItems: 'center' },
  quickIconWrap: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuOverlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    paddingTop: 56,
    paddingRight: spacing.lg,
  },
  menuCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    paddingVertical: spacing.xs,
    minWidth: 160,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.md,
  },
});
