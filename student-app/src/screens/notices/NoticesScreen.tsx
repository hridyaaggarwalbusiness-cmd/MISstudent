import React, { useEffect, useMemo, useState } from 'react';
import { View, FlatList, ScrollView, StyleSheet, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '@navigation/types';
import { AppText, Card, SearchBar, Chip, IconButton, SkeletonCard, EmptyState, ErrorState, EdgeFade } from '@components/ui';
import { NoticeListItem, NoticeGroupRow } from '@components/notices/NoticeListItem';
import { colors, spacing, layout } from '@theme';
import { useNoticesStore } from '@store/useNoticesStore';
import { NoticeCategory } from '@/types';
import { NOTICE_FILTERS } from '@data/noticeCategoryMeta';

type FilterKey = 'all' | NoticeCategory;

export function NoticesScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { items, loading, fetch } = useNoticesStore();
  const [refreshing, setRefreshing] = useState(false);
  const [searchVisible, setSearchVisible] = useState(false);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<FilterKey>('all');
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

  const matched = useMemo(() => {
    let list = items;
    if (filter !== 'all') list = list.filter((n) => n.category === filter);
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      list = list.filter((n) => n.title.toLowerCase().includes(q) || n.body.toLowerCase().includes(q));
    }
    return list;
  }, [items, filter, query]);

  const pinned = useMemo(() => matched.filter((n) => n.pinned), [matched]);
  const feed = useMemo(
    () => [...matched.filter((n) => !n.pinned)].sort((a, b) => b.postedAt.localeCompare(a.postedAt)),
    [matched],
  );

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.safe}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <AppText variant="displayMd">Notices</AppText>
          <View style={styles.titleActions}>
            <IconButton
              icon={searchVisible ? 'close-outline' : 'search-outline'}
              onPress={() => {
                setSearchVisible((v) => !v);
                if (searchVisible) setQuery('');
              }}
              size={38}
            />
            <IconButton icon="filter-outline" onPress={() => {}} size={38} style={{ marginLeft: spacing.xs }} />
          </View>
        </View>
        {searchVisible && (
          <View style={{ marginTop: spacing.md }}>
            <SearchBar value={query} onChangeText={setQuery} placeholder="Search notices" />
          </View>
        )}
        <View style={{ position: 'relative' }}>
          <FlatList
            data={NOTICE_FILTERS}
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
      </View>

      {error && items.length === 0 ? (
        <ErrorState onRetry={() => fetch(true).catch((e) => setError(e))} />
      ) : loading && items.length === 0 ? (
        <View style={styles.list}>
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
          {pinned.length > 0 && (
            <View style={{ marginBottom: spacing.lg }}>
              <AppText variant="overline" color={colors.textTertiary} style={{ marginBottom: spacing.sm }}>
                PINNED
              </AppText>
              <View style={{ position: 'relative' }}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {pinned.map((n) => (
                    <View key={n.id} style={{ width: 270, marginRight: spacing.sm }}>
                      <NoticeListItem notice={n} onPress={() => navigation.navigate('NoticeDetail', { id: n.id })} />
                    </View>
                  ))}
                </ScrollView>
                <EdgeFade />
              </View>
            </View>
          )}

          {feed.length > 0 ? (
            <Card padded={false} elevation="xs">
              {feed.map((n, i) => (
                <NoticeGroupRow
                  key={n.id}
                  notice={n}
                  isLast={i === feed.length - 1}
                  onPress={() => navigation.navigate('NoticeDetail', { id: n.id })}
                />
              ))}
            </Card>
          ) : pinned.length === 0 ? (
            <EmptyState
              icon="megaphone-outline"
              title="No notices found"
              message={query ? 'Try a different search term.' : 'Nothing here yet — check back soon.'}
            />
          ) : null}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: { paddingHorizontal: spacing.lg, paddingTop: spacing.sm },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  titleActions: { flexDirection: 'row', alignItems: 'center' },
  list: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: layout.tabBarClearance,
    flexGrow: 1,
  },
});
