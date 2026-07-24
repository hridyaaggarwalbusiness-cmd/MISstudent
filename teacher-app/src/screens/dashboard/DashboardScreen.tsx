import React, { useEffect, useMemo, useState } from 'react';
import { View, ScrollView, StyleSheet, Modal, Pressable, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { addDays } from 'date-fns';
import { AppText, Avatar, IconButton, AnimatedPressable, Skeleton, SkeletonCard, EmptyState } from '@components/ui';
import { colors, spacing, layout, radius } from '@theme';
import { RootStackParamList } from '@navigation/types';
import { useAuthStore } from '@store/useAuthStore';
import { useNotificationsStore } from '@store/useNotificationsStore';
import { useTeacherSchedule, slotsForDay } from '@hooks/useTeacherSchedule';
import { repo } from '@data/repositories';
import { greetingForNow, dayCodeFor, parseDate, relativeTime } from '@utils/date';
import { Homework, Notice, ExamResult, StudyMaterial } from '@/types';

interface ActivityItem {
  key: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  title: string;
  time: string;
  onPress: () => void;
}

interface QuickAction {
  key: string;
  label: string;
  subtitle: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  onPress: () => void;
}

export function DashboardScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { teacher, signOut } = useAuthStore();
  const classId = teacher?.classIds?.[0];
  const { unreadCount, init: initNotifications } = useNotificationsStore();
  const [menuVisible, setMenuVisible] = useState(false);

  useEffect(() => {
    initNotifications();
  }, [initNotifications]);

  const { slotsByDay, loading: scheduleLoading } = useTeacherSchedule();
  const [homework, setHomework] = useState<Homework[] | null>(null);
  const [notices, setNotices] = useState<Notice[] | null>(null);
  const [results, setResults] = useState<ExamResult[]>([]);
  const [materials, setMaterials] = useState<StudyMaterial[]>([]);

  useEffect(() => {
    if (!classId) return;
    const unsubHw = repo.homework.subscribeForClass(classId, setHomework);
    const unsubNotices = repo.notices.subscribeAll(setNotices);
    const unsubResults = repo.results.subscribeForClass(classId, setResults);
    const unsubMaterials = repo.materials.subscribeForClass(classId, setMaterials);
    return () => {
      unsubHw();
      unsubNotices();
      unsubResults();
      unsubMaterials();
    };
  }, [classId]);

  // After school hours, the day's own schedule is already over — show
  // tomorrow's instead so the card stays useful for planning ahead.
  const isEvening = new Date().getHours() >= 17;
  const scheduleLabel = isEvening ? 'Tomorrow' : 'Today';
  const scheduleDayCode = useMemo(() => dayCodeFor(isEvening ? addDays(new Date(), 1) : new Date()), [isEvening]);
  const scheduleSlots = useMemo(() => slotsForDay(slotsByDay, scheduleDayCode), [slotsByDay, scheduleDayCode]);
  const scheduleTeaching = useMemo(() => scheduleSlots.filter((s) => s.taught), [scheduleSlots]);
  const scheduleFree = Math.max(0, scheduleSlots.length - scheduleTeaching.length);

  const loading = scheduleLoading || homework === null;

  const recentActivity: ActivityItem[] = useMemo(() => {
    const items: { ts: number; item: ActivityItem }[] = [];

    (homework ?? [])
      .filter((h) => h.teacherId === teacher?.id)
      .forEach((h) => {
        items.push({
          ts: parseDate(h.assignedDate).getTime() || 0,
          item: {
            key: `hw-${h.id}`,
            icon: 'book',
            color: colors.tileViolet,
            title: `Homework posted for ${h.subject}`,
            time: h.assignedDate,
            onPress: () => navigation.navigate('HomeworkDetail', { id: h.id }),
          },
        });
      });

    materials
      .filter((m) => m.uploadedBy === teacher?.id)
      .forEach((m) => {
        items.push({
          ts: parseDate(m.uploadedAt).getTime() || 0,
          item: {
            key: `mat-${m.id}`,
            icon: 'document-attach',
            color: colors.tileGreen,
            title: `${m.subject} notes uploaded`,
            time: m.uploadedAt,
            onPress: () => navigation.navigate('StudyMaterials'),
          },
        });
      });

    const byExam = new Map<string, ExamResult[]>();
    results
      .filter((r) => r.gradedBy === teacher?.id)
      .forEach((r) => {
        const list = byExam.get(r.examId) ?? [];
        list.push(r);
        byExam.set(r.examId, list);
      });
    byExam.forEach((rows) => {
      const latest = rows.reduce((a, b) => (parseDate(a.gradedAt).getTime() > parseDate(b.gradedAt).getTime() ? a : b));
      items.push({
        ts: parseDate(latest.gradedAt).getTime() || 0,
        item: {
          key: `res-${latest.examId}`,
          icon: 'stats-chart',
          color: colors.tileOrange,
          title: `Marks entered · ${latest.subject}`,
          time: latest.gradedAt,
          onPress: () => navigation.navigate('Results'),
        },
      });
    });

    (notices ?? [])
      .filter((n) => n.postedBy === teacher?.id)
      .forEach((n) => {
        items.push({
          ts: parseDate(n.postedAt).getTime() || 0,
          item: {
            key: `notice-${n.id}`,
            icon: 'megaphone',
            color: colors.tileRed,
            title: `Notice posted: ${n.title}`,
            time: n.postedAt,
            onPress: () => navigation.navigate('Notices'),
          },
        });
      });

    return items
      .sort((a, b) => b.ts - a.ts)
      .slice(0, 5)
      .map((i) => i.item);
  }, [homework, materials, results, notices, teacher, navigation]);

  const quickActions: QuickAction[] = [
    {
      key: 'homework',
      label: 'Post Homework',
      subtitle: 'Assign homework to your classes',
      icon: 'book-outline',
      color: colors.tileBlue,
      onPress: () => navigation.navigate('HomeworkCreate'),
    },
    {
      key: 'timetable',
      label: 'My Classes',
      subtitle: 'View your classes and timetable',
      icon: 'time-outline',
      color: colors.tileSky,
      onPress: () => navigation.navigate('MainTabs', { screen: 'ClassesTab' }),
    },
    {
      key: 'attendance',
      label: 'Attendance',
      subtitle: "Mark today's attendance",
      icon: 'checkmark-done-outline',
      color: colors.tileTeal,
      onPress: () => navigation.navigate('MainTabs', { screen: 'AttendanceTab' }),
    },
    {
      key: 'marks',
      label: 'Enter Marks',
      subtitle: 'Add and manage student marks',
      icon: 'stats-chart-outline',
      color: colors.tileRed,
      onPress: () => navigation.navigate('ResultEntry', {}),
    },
    {
      key: 'material',
      label: 'Upload Material',
      subtitle: 'Share notes, PDFs and resources',
      icon: 'cloud-upload-outline',
      color: colors.tileGreen,
      onPress: () => navigation.navigate('MaterialUpload'),
    },
    {
      key: 'notice',
      label: 'Add Notice',
      subtitle: 'Post a notice to your classes',
      icon: 'megaphone-outline',
      color: colors.tileViolet,
      onPress: () => navigation.navigate('NoticeCreate'),
    },
    {
      key: 'calendar',
      label: 'Calendar',
      subtitle: 'View the academic calendar',
      icon: 'calendar-outline',
      color: colors.tileYellow,
      onPress: () => navigation.navigate('AcademicCalendar'),
    },
    {
      key: 'search',
      label: 'Search',
      subtitle: 'Find anything across the app',
      icon: 'search-outline',
      color: colors.textTertiary,
      onPress: () => navigation.navigate('Search'),
    },
  ];

  const teacherRoleLine = teacher?.isClassTeacherOf ? 'Class Teacher' : 'Teacher';

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
          {loading ? (
            <Skeleton height={140} borderRadius={20} />
          ) : (
            <View style={styles.heroCard}>
              <View style={styles.heroTop}>
                <View style={styles.heroIconWrap}>
                  <Ionicons name="calendar" size={20} color={colors.textInverse} />
                </View>
                <View style={{ flex: 1, marginLeft: spacing.sm }}>
                  <AppText variant="bodySemibold" color={colors.textInverse}>
                    {scheduleLabel}
                  </AppText>
                  <AppText variant="caption" color="rgba(255,255,255,0.75)" style={{ marginTop: 2 }}>
                    {scheduleTeaching.length} Classes • {scheduleFree} Free Periods
                  </AppText>
                </View>
              </View>
              <AnimatedPressable
                onPress={() => navigation.navigate('MainTabs', { screen: 'ClassesTab' })}
                haptic={false}
                style={styles.heroLinkRow}
              >
                <AppText variant="bodyMedium" color={colors.textInverse}>
                  View Timetable
                </AppText>
                <Ionicons name="arrow-forward" size={16} color={colors.textInverse} style={{ marginLeft: 4 }} />
              </AnimatedPressable>
              <View style={styles.heroIllustration} pointerEvents="none">
                <Ionicons name="calendar" size={64} color="rgba(255,255,255,0.14)" />
                <Ionicons name="time" size={34} color="rgba(255,255,255,0.22)" style={styles.heroIllustrationClock} />
              </View>
            </View>
          )}
        </View>

        <View style={[styles.section, { marginBottom: spacing.xxxl }]}>
          <AppText variant="h3" style={{ marginBottom: spacing.md }}>
            Quick Actions
          </AppText>
          <View style={styles.quickGrid}>
            {quickActions.map((action) => (
              <View key={action.key} style={styles.quickCard}>
                <AnimatedPressable
                  onPress={action.onPress}
                  haptic={false}
                  style={[styles.quickCardInner, { backgroundColor: `${action.color}14` }]}
                >
                  <View style={[styles.quickIconWrap, { backgroundColor: action.color }]}>
                    <Ionicons name={action.icon} size={18} color="#fff" />
                  </View>
                  <AppText variant="bodySemibold" style={{ marginTop: spacing.sm }} numberOfLines={2}>
                    {action.label}
                  </AppText>
                  <AppText variant="tiny" color={colors.textSecondary} style={{ marginTop: 2 }} numberOfLines={2}>
                    {action.subtitle}
                  </AppText>
                  <Ionicons name="arrow-forward" size={14} color={colors.textTertiary} style={styles.quickArrow} />
                </AnimatedPressable>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <AppText variant="h3">Recent Activity</AppText>
            <AnimatedPressable onPress={() => navigation.navigate('MainTabs', { screen: 'ActivityTab' })} haptic={false}>
              <AppText variant="bodyMedium" color={colors.primary}>
                View all
              </AppText>
            </AnimatedPressable>
          </View>
          {loading ? (
            <SkeletonCard lines={2} />
          ) : recentActivity.length === 0 ? (
            <EmptyState icon="pulse-outline" title="No activity yet" compact />
          ) : (
            <View style={styles.activityCard}>
              {recentActivity.map((item, i) => (
                <AnimatedPressable
                  key={item.key}
                  onPress={item.onPress}
                  haptic={false}
                  style={[styles.activityRow, i > 0 && styles.activityRowBorder]}
                >
                  <View style={[styles.activityIconWrap, { backgroundColor: item.color }]}>
                    <Ionicons name={item.icon} size={16} color="#fff" />
                  </View>
                  <AppText variant="bodyMedium" style={{ flex: 1, marginLeft: spacing.sm }} numberOfLines={1}>
                    {item.title}
                  </AppText>
                  <AppText variant="tiny" color={colors.textTertiary}>
                    {relativeTime(item.time)}
                  </AppText>
                </AnimatedPressable>
              ))}
            </View>
          )}
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
  heroCard: {
    backgroundColor: '#211C4D',
    borderRadius: radius.lg,
    padding: spacing.lg,
    overflow: 'hidden',
  },
  heroTop: { flexDirection: 'row', alignItems: 'center' },
  heroIconWrap: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: 'rgba(255,255,255,0.16)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroLinkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.md,
  },
  heroIllustration: {
    position: 'absolute',
    right: spacing.md,
    top: spacing.md,
    alignItems: 'flex-end',
  },
  heroIllustrationClock: { marginTop: -10 },
  quickGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  quickCard: { width: '33.333%', padding: 4 },
  quickCardInner: {
    borderRadius: radius.md,
    padding: spacing.sm,
    minHeight: 128,
  },
  quickIconWrap: {
    width: 36,
    height: 36,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickArrow: {
    position: 'absolute',
    right: spacing.sm,
    bottom: spacing.sm,
  },
  activityCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.borderSoft,
  },
  activityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.md,
  },
  activityRowBorder: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.borderSoft,
  },
  activityIconWrap: {
    width: 34,
    height: 34,
    borderRadius: radius.sm,
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
