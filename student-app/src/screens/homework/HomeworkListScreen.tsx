import React, { useEffect, useMemo, useState } from 'react';
import { View, ScrollView, StyleSheet, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '@navigation/types';
import { AppText, SearchBar, SkeletonCard, EmptyState, ErrorState } from '@components/ui';
import { HomeworkCard } from '@components/homework/HomeworkCard';
import { colors, spacing, layout } from '@theme';
import { useHomeworkStore } from '@store/useHomeworkStore';
import { Homework } from '@/types';
import { differenceInCalendarDays } from 'date-fns';

export function HomeworkListScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { items, loading, fetch } = useHomeworkStore();
  const [refreshing, setRefreshing] = useState(false);
  const [query, setQuery] = useState('');
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    fetch().catch((e) => setError(e));
  }, [fetch]);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await fetch(true);
      setError(null);
    } catch (e) {
      setError(e as Error);
    } finally {
      setRefreshing(false);
    }
  };

  const searched = useMemo(() => {
    if (!query.trim()) return items;
    const q = query.trim().toLowerCase();
    return items.filter((h) => h.title.toLowerCase().includes(q) || h.subject.toLowerCase().includes(q));
  }, [items, query]);

  const sections = useMemo(() => {
    const sorted = [...searched].sort((a, b) => a.dueDate.localeCompare(b.dueDate));
    const overdue: Homework[] = [];
    const dueSoon: Homework[] = [];
    const upcoming: Homework[] = [];
    for (const hw of sorted) {
      const diff = differenceInCalendarDays(new Date(hw.dueDate), new Date());
      if (diff < 0) overdue.push(hw);
      else if (diff <= 7) dueSoon.push(hw);
      else upcoming.push(hw);
    }
    return [
      { key: 'overdue', title: 'Overdue', icon: '⚠️', items: overdue },
      { key: 'dueSoon', title: 'Due This Week', icon: '🕐', items: dueSoon },
      { key: 'upcoming', title: 'Upcoming', icon: '📅', items: upcoming },
    ].filter((s) => s.items.length > 0);
  }, [searched]);

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.safe}>
      <View style={styles.header}>
        <AppText variant="displayMd">Homework</AppText>
        <View style={{ marginTop: spacing.md }}>
          <SearchBar value={query} onChangeText={setQuery} placeholder="Search homework or subject" />
        </View>
      </View>

      {error && items.length === 0 ? (
        <ErrorState onRetry={() => fetch(true).catch((e) => setError(e))} />
      ) : loading && items.length === 0 ? (
        <View style={styles.list}>
          <SkeletonCard lines={2} />
          <View style={{ height: spacing.sm }} />
          <SkeletonCard lines={2} />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} colors={[colors.primary]} />
          }
        >
          {searched.length === 0 ? (
            <EmptyState
              icon="book-outline"
              title="No homework found"
              message={query ? 'Try a different search term.' : 'Nothing here yet — check back soon.'}
            />
          ) : (
            sections.map((section) => (
              <View key={section.key} style={styles.section}>
                <View style={styles.sectionHeader}>
                  <AppText variant="overline" color={colors.textTertiary}>
                    {section.icon} {section.title.toUpperCase()}
                  </AppText>
                  <View style={styles.sectionCount}>
                    <AppText variant="tiny" color={colors.textSecondary} style={{ fontWeight: '700' }}>
                      {section.items.length}
                    </AppText>
                  </View>
                </View>
                {section.items.map((hw) => (
                  <HomeworkCard key={hw.id} homework={hw} onPress={() => navigation.navigate('HomeworkDetail', { id: hw.id })} />
                ))}
              </View>
            ))
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: { paddingHorizontal: spacing.lg, paddingTop: spacing.sm },
  list: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: layout.tabBarClearance,
    flexGrow: 1,
  },
  section: {
    marginBottom: spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
    paddingHorizontal: 2,
  },
  sectionCount: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 1,
  },
});
