import React, { useEffect } from 'react';
import { View, FlatList, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '@navigation/types';
import { AppText, AnimatedPressable, DetailHeader, SkeletonCard, EmptyState } from '@components/ui';
import { NotificationItem } from '@components/notifications/NotificationItem';
import { colors, spacing } from '@theme';
import { useNotificationsStore } from '@store/useNotificationsStore';
import { AppNotification } from '@/types';

export function NotificationsScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { items, loading, unreadCount, fetch, markRead, markAllRead } = useNotificationsStore();

  useEffect(() => {
    fetch();
  }, [fetch]);

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
        navigation.navigate('Results');
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
      {loading && items.length === 0 ? (
        <View style={{ paddingHorizontal: spacing.lg }}>
          <SkeletonCard lines={2} />
        </View>
      ) : (
        <FlatList
          data={items}
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
  list: { paddingHorizontal: spacing.lg, paddingTop: spacing.sm, paddingBottom: spacing.xxxl, flexGrow: 1 },
});
