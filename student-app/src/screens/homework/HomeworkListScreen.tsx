import React, { useEffect, useMemo, useState } from 'react';
import { View, FlatList, ScrollView, StyleSheet, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '@navigation/types';
import { AppText, SearchBar, Chip, IconButton, SkeletonCard, EmptyState, ErrorState, EdgeFade } from '@components/ui';
import { HomeworkCard } from '@components/homework/HomeworkCard';
import { HomeworkBoard } from '@components/homework/HomeworkBoard';
import { colors, spacing, layout } from '@theme';
import { useHomeworkStore } from '@store/useHomeworkStore';
import { Homework, HomeworkStatus } from '@/types';

type FilterKey = 'all' | HomeworkStatus;
type ViewMode = 'list' | 'board';

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'pending', label: 'Pending' },
  { key: 'overdue', label: 'Overdue' },
  { key: 'submitted', label: 'Submitted' },
  { key: 'graded', label: 'Graded' },
];

function statusRank(status: HomeworkStatus): number {
  const order: HomeworkStatus[] = ['overdue', 'pending', 'submitted', 'graded'];
  return order.indexOf(status);
}

export function HomeworkListScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { items, loading, fetch } = useHomeworkStore();
  const [refreshing, setRefreshing] = useState(false);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<FilterKey>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('list');
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

  const filtered = useMemo(() => {
    const list = filter === 'all' ? searched : searched.filter((h) => h.status === filter);
    return [...list].sort((a, b) => statusRank(a.status) - statusRank(b.status));
  }, [searched, filter]);

  const renderItem = ({ item }: { item: Homework }) => (
    <HomeworkCard homework={item} onPress={() => navigation.navigate('HomeworkDetail', { id: item.id })} />
  );

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.safe}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <AppText variant="displayMd">Homework</AppText>
          <View style={styles.modeToggle}>
            <IconButton
              icon="list-outline"
              size={32}
              onPress={() => setViewMode('list')}
              backgroundColor={viewMode === 'list' ? colors.primary : colors.surfaceAlt}
              color={viewMode === 'list' ? colors.textInverse : colors.textSecondary}
            />
            <IconButton
              icon="albums-outline"
              size={32}
              style={{ marginLeft: 6 }}
              onPress={() => setViewMode('board')}
              backgroundColor={viewMode === 'board' ? colors.primary : colors.surfaceAlt}
              color={viewMode === 'board' ? colors.textInverse : colors.textSecondary}
            />
          </View>
        </View>
        <View style={{ marginTop: spacing.md }}>
          <SearchBar value={query} onChangeText={setQuery} placeholder="Search homework or subject" />
        </View>
        {viewMode === 'list' && (
          <View style={{ position: 'relative' }}>
            <FlatList
              data={FILTERS}
              horizontal
              keyExtractor={(f) => f.key}
              showsHorizontalScrollIndicator={false}
              style={{ marginTop: spacing.sm }}
              contentContainerStyle={{ paddingRight: spacing.lg }}
              renderItem={({ item }) => (
                <Chip
                  label={item.label}
                  active={filter === item.key}
                  onPress={() => setFilter(item.key)}
                  style={{ marginRight: spacing.xs }}
                />
              )}
            />
            <EdgeFade />
          </View>
        )}
      </View>

      {error && items.length === 0 ? (
        <ErrorState onRetry={() => fetch(true).catch((e) => setError(e))} />
      ) : loading && items.length === 0 ? (
        <View style={styles.list}>
          <SkeletonCard lines={2} />
          <View style={{ height: spacing.sm }} />
          <SkeletonCard lines={2} />
        </View>
      ) : viewMode === 'board' ? (
        <ScrollView
          contentContainerStyle={styles.boardContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} colors={[colors.primary]} />
          }
        >
          {searched.length === 0 ? (
            <EmptyState icon="book-outline" title="No homework found" message="Try a different search term." />
          ) : (
            <HomeworkBoard items={searched} onPressItem={(id) => navigation.navigate('HomeworkDetail', { id })} />
          )}
        </ScrollView>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(h) => h.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} colors={[colors.primary]} />
          }
          ListEmptyComponent={
            <EmptyState
              icon="book-outline"
              title="No homework found"
              message={query ? 'Try a different search term.' : 'Nothing here yet — check back soon.'}
            />
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: { paddingHorizontal: spacing.lg, paddingTop: spacing.sm },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  modeToggle: { flexDirection: 'row' },
  list: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: layout.tabBarClearance,
    flexGrow: 1,
  },
  boardContent: {
    paddingLeft: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: layout.tabBarClearance,
    flexGrow: 1,
  },
});
