import React, { useEffect } from 'react';
import { FlatList, View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '@navigation/types';
import { AppText, AnimatedPressable, EmptyState } from '@components/ui';
import { NotificationItem } from '@components/notifications/NotificationItem';
import { colors, spacing, layout } from '@theme';
import { useNotificationsStore } from '@store/useNotificationsStore';

export function ActivityScreen() {
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
      <View style={styles.header}>
        <AppText variant="displayMd">Activity</AppText>
        {unreadCount > 0 && (
          <AnimatedPressable onPress={markAllRead} haptic={false}>
            <AppText variant="bodyMedium" color={colors.primary}>
              Mark all
            </AppText>
          </AnimatedPressable>
        )}
      </View>
      {!loaded && items.length === 0 ? (
        <View style={{ paddingHorizontal: spacing.lg }}>
          <EmptyState icon="pulse-outline" title="Loading…" compact />
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
            <EmptyState icon="pulse-outline" title="No activity yet" message="Notices, upcoming exams and events will show up here." />
          }
        />
      )}
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
    paddingBottom: spacing.md,
  },
  list: { paddingHorizontal: spacing.lg, paddingBottom: layout.tabBarClearance, flexGrow: 1 },
});
