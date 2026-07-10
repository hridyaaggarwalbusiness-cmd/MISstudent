import React, { useMemo, useState } from 'react';
import { View, FlatList, StyleSheet, RefreshControl, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  SearchBar,
  Chip,
  DetailHeader,
  SkeletonCard,
  EmptyState,
  ErrorState,
} from '@components/ui';
import { MaterialCard } from '@components/materials/MaterialCard';
import { colors, spacing } from '@theme';
import { repo } from '@data/repositories';
import { useAsyncResource } from '@hooks/useAsyncResource';
import { materialTypeLabels } from '@data/mock/materials';
import { MaterialType, StudyMaterial } from '@/types';

type FilterKey = 'all' | MaterialType;

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'note', label: materialTypeLabels.note },
  { key: 'presentation', label: materialTypeLabels.presentation },
  { key: 'worksheet', label: materialTypeLabels.worksheet },
  { key: 'question_bank', label: materialTypeLabels.question_bank },
  { key: 'video', label: materialTypeLabels.video },
];

export function StudyMaterialsScreen() {
  const { data, loading, refreshing, error, refresh } = useAsyncResource(() => repo.materials.list(), []);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<FilterKey>('all');

  const filtered = useMemo(() => {
    let list = data ?? [];
    if (filter !== 'all') list = list.filter((m) => m.type === filter);
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      list = list.filter(
        (m) => m.title.toLowerCase().includes(q) || m.subject.toLowerCase().includes(q),
      );
    }
    return list;
  }, [data, filter, query]);

  const onOpen = (material: StudyMaterial) => {
    Alert.alert(material.title, 'This resource will open once connected to your school’s file storage.');
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <DetailHeader title="Study Materials" />
      <View style={styles.header}>
        <SearchBar value={query} onChangeText={setQuery} placeholder="Search materials or subject" />
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
      </View>

      {error && !data ? (
        <ErrorState onRetry={refresh} />
      ) : loading && !data ? (
        <View style={styles.list}>
          <SkeletonCard lines={2} />
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(m) => m.id}
          renderItem={({ item }) => <MaterialCard material={item} onPress={() => onOpen(item)} />}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.primary} colors={[colors.primary]} />
          }
          ListEmptyComponent={
            <EmptyState
              icon="library-outline"
              title="No materials found"
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
  header: { paddingHorizontal: spacing.lg },
  list: { paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.xxxl, flexGrow: 1 },
});
