import React, { useEffect, useMemo, useState } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AppText, Card, Avatar, IconButton, SectionHeader, Skeleton, SkeletonCard, EmptyState } from '@components/ui';
import { ActionTileGrid, ActionTile } from '@components/dashboard/ActionTileGrid';
import { TeacherBentoStats } from '@components/dashboard/TeacherBentoStats';
import { PeriodCard } from '@components/dashboard/PeriodCard';
import { colors, spacing, layout } from '@theme';
import { RootStackParamList } from '@navigation/types';
import { useAuthStore } from '@store/useAuthStore';
import { repo } from '@data/repositories';
import { greetingForNow, todayDayCode } from '@utils/date';
import { Homework, Notice, TimetablePeriod } from '@/types';
import { Ionicons } from '@expo/vector-icons';

export function DashboardScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { teacher, signOut } = useAuthStore();
  const classId = teacher?.classIds?.[0];

  const [periods, setPeriods] = useState<TimetablePeriod[] | null>(null);
  const [homework, setHomework] = useState<Homework[] | null>(null);
  const [notices, setNotices] = useState<Notice[] | null>(null);

  useEffect(() => {
    if (!classId) return;
    const unsubTt = repo.timetable.subscribeForClass(classId, setPeriods);
    const unsubHw = repo.homework.subscribeForClass(classId, setHomework);
    const unsubNotices = repo.notices.subscribeAll(setNotices);
    return () => {
      unsubTt();
      unsubHw();
      unsubNotices();
    };
  }, [classId]);

  const today = todayDayCode();
  const todaysPeriods = useMemo(
    () => (periods ?? []).filter((p) => p.day === today && !p.isBreak),
    [periods, today],
  );

  const nextPeriod = useMemo(() => {
    const nowMinutes = new Date().getHours() * 60 + new Date().getMinutes();
    const toMinutes = (t: string) => {
      const [h, m] = t.split(':').map(Number);
      return h * 60 + m;
    };
    return todaysPeriods.find((p) => toMinutes(p.endTime) > nowMinutes) ?? todaysPeriods[0];
  }, [todaysPeriods]);

  const recentHomework = useMemo(() => (homework ?? []).slice(0, 3), [homework]);

  const noticesThisWeek = useMemo(() => {
    if (!notices) return 0;
    const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    return notices.filter((n) => new Date(n.postedAt).getTime() >= weekAgo && n.postedBy === teacher?.id).length;
  }, [notices, teacher?.id]);

  const loading = periods === null || homework === null;

  const actionTiles: ActionTile[] = [
    {
      key: 'homework',
      label: 'Post Homework',
      icon: 'book-outline',
      color: colors.tileBlue,
      textColor: colors.textInverse,
      onPress: () => navigation.navigate('HomeworkCreate'),
    },
    {
      key: 'attendance',
      label: 'Attendance',
      icon: 'checkmark-done-outline',
      color: colors.tileGreen,
      textColor: colors.textInverse,
      onPress: () => navigation.navigate('MainTabs', { screen: 'AttendanceTab' }),
    },
    {
      key: 'results',
      label: 'Enter Marks',
      icon: 'stats-chart-outline',
      color: colors.tileViolet,
      textColor: colors.textInverse,
      onPress: () => navigation.navigate('ResultEntry', {}),
    },
    {
      key: 'notice',
      label: 'Post Notice',
      icon: 'megaphone-outline',
      color: colors.tileOrange,
      textColor: colors.textInverse,
      onPress: () => navigation.navigate('NoticeCreate'),
    },
    {
      key: 'materials',
      label: 'Upload Material',
      icon: 'cloud-upload-outline',
      color: colors.tileTeal,
      textColor: colors.textInverse,
      onPress: () => navigation.navigate('MaterialUpload'),
    },
    {
      key: 'calendar',
      label: 'Calendar',
      icon: 'calendar-outline',
      color: colors.tileYellow,
      textColor: colors.textInverse,
      onPress: () => navigation.navigate('AcademicCalendar'),
    },
  ];

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <View style={styles.identity}>
          <Avatar uri={teacher?.photoUrl} name={teacher?.name ?? 'Teacher'} size={44} ringColor={colors.primary} />
          <View style={{ marginLeft: spacing.sm, flexShrink: 1 }}>
            <AppText variant="caption" color={colors.textTertiary}>
              {greetingForNow()}
            </AppText>
            <AppText variant="h1" numberOfLines={1}>
              {teacher?.name?.split(' ')[0] ?? 'Teacher'}
            </AppText>
          </View>
        </View>
        <IconButton icon="log-out-outline" onPress={() => signOut()} />
      </View>
      <View style={styles.metaRow}>
        <View style={styles.subjectPill}>
          <AppText variant="caption" color={colors.textSecondary} numberOfLines={1}>
            {teacher?.subjects?.join(', ') ?? ''}
          </AppText>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={{ paddingHorizontal: spacing.lg }}>
          {loading ? <Skeleton height={220} borderRadius={18} /> : <ActionTileGrid tiles={actionTiles} />}
        </View>

        <View style={styles.section}>
          {loading ? (
            <Skeleton height={130} borderRadius={18} />
          ) : (
            <TeacherBentoStats
              classesToday={todaysPeriods.length}
              nextClassLabel={nextPeriod ? `${nextPeriod.subject} ${nextPeriod.startTime}` : '—'}
              homeworkPosted={homework?.length ?? 0}
              noticesThisWeek={noticesThisWeek}
              onClassesPress={() => navigation.navigate('MainTabs', { screen: 'TimetableTab' })}
              onHomeworkPress={() => navigation.navigate('MainTabs', { screen: 'HomeworkTab' })}
              onNoticesPress={() => navigation.navigate('Notices')}
            />
          )}
        </View>

        <View style={styles.section}>
          <SectionHeader title="Today's Classes" onActionPress={() => navigation.navigate('MainTabs', { screen: 'TimetableTab' })} />
          {loading ? (
            <SkeletonCard lines={2} />
          ) : todaysPeriods.length === 0 ? (
            <EmptyState icon="calendar-clear-outline" title="No classes today" compact />
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {todaysPeriods.map((p) => (
                <PeriodCard key={p.id} period={p} compact subtitle={p.room || undefined} />
              ))}
            </ScrollView>
          )}
        </View>

        <View style={[styles.section, { marginBottom: spacing.xxxl }]}>
          <SectionHeader
            title="Recent Homework"
            onActionPress={() => navigation.navigate('MainTabs', { screen: 'HomeworkTab' })}
          />
          {loading ? (
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xs,
  },
  identity: { flexDirection: 'row', alignItems: 'center', flexShrink: 1 },
  metaRow: { paddingHorizontal: spacing.lg, marginTop: spacing.sm },
  subjectPill: {
    alignSelf: 'flex-start',
    backgroundColor: colors.surfaceAlt,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  scrollContent: { paddingBottom: layout.tabBarClearance },
  section: { paddingHorizontal: spacing.lg, marginTop: spacing.xl },
});
