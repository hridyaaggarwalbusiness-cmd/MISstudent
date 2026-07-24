import React, { useEffect, useMemo, useState } from 'react';
import { View, FlatList, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '@navigation/types';
import { AppText, AnimatedPressable, DetailHeader, SegmentedControl, SkeletonCard, EmptyState } from '@components/ui';
import { NotificationItem } from '@components/notifications/NotificationItem';
import { colors, spacing } from '@theme';
import { useNotificationsStore } from '@store/useNotificationsStore';
import { AppNotification } from '@/types';

const TABS: { label: string; type: AppNotification['type'] | 'all' }[] = [
  { label: 'All', type: 'all' },
  { label: 'Homework', type: 'homework' },
  { label: 'Notices', type: 'notice' },
  { label: 'Timetable', type: 'timetable' },
];

export function NotificationsScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { items, loading, unreadCount, fetch, markRead, markAllRead } = useNotificationsStore();
  const [tab, setTab] = useState(0);

  useEffect(() => {
    fetch();
  }, [fetch]);

  const filtered = useMemo(() => {
    const type = TABS[tab].type;
    return type === 'all' ? items : items.filter((n) => n.type === type);
  }, [items, tab]);

  const onPressNotification = (n: AppNotification) => {
    if (!n.isRead) markRead(n.id);
    switch (n.type) {
      case 'homework':
        if (n.refId) navigation.navigate('HomeworkDetail', { id: n.refId });
        break;
      case 'notice':
        if (n.refId) navigation.navigate('NoticeDetail', { id: n.refId });
        break;
      case 'result':
        navigation.navigate('MainTabs', { screen: 'ResultsTab' });
        break;
      case 'attendance':
        navigation.navigate('Attendance');
        break;
      case 'material':
        navigation.navigate('StudyMaterials');
        break;
      case 'exam':
        navigation.navigate('AcademicCalendar');
        break;
      case 'bus':
        navigation.navigate('LiveBusTracking');
        break;
      case 'timetable':
        navigation.navigate('MainTabs', { screen: 'TimetableTab' });
        break;
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <DetailHeader
        title="Notifications"
        rightAction={
          unreadCount > 0 ? (
            <AnimatedPressable onPress={markAllRead} haptic={false}>
              <AppText variant="bodyMedium" color={colors.primary}>
                Mark all
              </AppText>
            </AnimatedPressable>
          ) : undefined
        }
      />
      <View style={styles.tabsWrap}>
        <SegmentedControl options={TABS.map((t) => t.label)} selectedIndex={tab} onChange={setTab} />
      </View>
      {loading && items.length === 0 ? (
        <View style={{ paddingHorizontal: spacing.lg }}>
          <SkeletonCard lines={2} />
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(n) => n.id}
          renderItem={({ item }) => (
            <NotificationItem notification={item} onPress={() => onPressNotification(item)} />
          )}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <EmptyState icon="notifications-outline" title="No notifications" message="You're all caught up." />
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  tabsWrap: { paddingHorizontal: spacing.lg, marginBottom: spacing.sm },
  list: { paddingHorizontal: spacing.lg, paddingTop: spacing.sm, paddingBottom: spacing.xxxl, flexGrow: 1 },
});
