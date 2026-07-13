import React, { useEffect, useMemo, useState } from 'react';
import { View, FlatList, StyleSheet, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '@navigation/types';
import { AppText, SearchBar, Chip, IconButton, SkeletonCard, EmptyState, ErrorState, EdgeFade } from '@components/ui';
import { HomeworkCard } from '@components/homework/HomeworkCard';
import { colors, spacing, layout } from '@theme';
import { useHomeworkStore } from '@store/useHomeworkStore';
import { Homework } from '@/types';

export function HomeworkListScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { items, loading, fetch } = useHomeworkStore();
  const [refreshing, setRefreshing] = useState(false);
  const [searchVisible, setSearchVisible] = useState(false);
  const [query, setQuery] = useState('');
  const [subject, setSubject] = useState<string | 'all'>('all');
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

  const subjects = useMemo(() => {
    const unique = [...new Set(items.map((h) => h.subject))];
    return unique.sort((a, b) => a.localeCompare(b));
  }, [items]);

  const searched = useMemo(() => {
    let base = [...items].sort((a, b) => b.assignedDate.localeCompare(a.assignedDate));
    if (subject !== 'all') base = base.filter((h) => h.subject === subject);
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      base = base.filter((h) => h.title.toLowerCase().includes(q) || h.subject.toLowerCase().includes(q));
    }
    return base;
  }, [items, subject, query]);

  const renderItem = ({ item }: { item: Homework }) => (
    <HomeworkCard homework={item} onPress={() => navigation.navigate('HomeworkDetail', { id: item.id })} />
  );

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.safe}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <AppText variant="displayMd">Homework</AppText>
          <View style={styles.titleActions}>
            <IconButton
              icon={searchVisible ? 'close-outline' : 'search-outline'}
              onPress={() => {
                setSearchVisible((v) => !v);
                if (searchVisible) setQuery('');
              }}
              size={38}
              backgroundColor="transparent"
              style={{ borderWidth: 0 }}
            />
            <IconButton
              icon="filter-outline"
              onPress={() => {}}
              size={38}
              backgroundColor="transparent"
              style={{ borderWidth: 0, marginLeft: spacing.xs }}
            />
          </View>
        </View>
        {searchVisible && (
          <View style={{ marginTop: spacing.md }}>
            <SearchBar value={query} onChangeText={setQuery} placeholder="Search homework or subject" />
          </View>
        )}
        <View style={{ position: 'relative' }}>
          <FlatList
            data={['all', ...subjects]}
            horizontal
            keyExtractor={(s) => s}
            showsHorizontalScrollIndicator={false}
            style={{ marginTop: spacing.sm }}
            contentContainerStyle={{ paddingRight: spacing.lg }}
            renderItem={({ item }) => (
              <Chip
                label={item === 'all' ? 'All Subjects' : item}
                active={subject === item}
                onPress={() => setSubject(item as string | 'all')}
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
          <View style={{ height: spacing.sm }} />
          <SkeletonCard lines={2} />
        </View>
      ) : (
        <FlatList
          data={searched}
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
  titleActions: { flexDirection: 'row', alignItems: 'center' },
  list: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: layout.tabBarClearance,
    flexGrow: 1,
  },
});
