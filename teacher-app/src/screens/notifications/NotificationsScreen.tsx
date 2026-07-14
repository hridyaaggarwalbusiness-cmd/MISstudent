import React, { useEffect } from 'react';
import { FlatList, View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '@navigation/types';
import { AppText, AnimatedPressable, DetailHeader, EmptyState } from '@components/ui';
import { NotificationItem } from '@components/notifications/NotificationItem';
import { colors, spacing } from '@theme';
import { useNotificationsStore } from '@store/useNotificationsStore';

export function NotificationsScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { items, loaded, unreadCount, init, markRead, markAllRead } = useNotificationsStore();

  useEffect(() => {
    init();
  }, [init]);

  const onPressItem = (id: string, navTarget: { screen: 'notices' | 'exam' | 'calendar' }) => {
    markRead(id);
    if (navTarget.screen === 'notices') navigation.navigate('Notices');
    else if (navTarget.screen === 'exam') navigation.navigate('ResultEntry', {});
    else navigation.navigate('AcademicCalendar');
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
      {!loaded && items.length === 0 ? (
        <View style={{ paddingHorizontal: spacing.lg }}>
          <EmptyState icon="notifications-outline" title="Loading…" compact />
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(n) => n.id}
          renderItem={({ item }) => (
            <NotificationItem notification={{ ...item, onPress: () => onPressItem(item.id, item.navTarget) }} />
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
