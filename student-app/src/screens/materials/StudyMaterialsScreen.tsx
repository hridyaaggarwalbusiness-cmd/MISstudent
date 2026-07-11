import React, { useMemo, useState } from 'react';
import { View, FlatList, StyleSheet, RefreshControl, Alert, Modal, Image, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  SearchBar,
  Chip,
  DetailHeader,
  SkeletonCard,
  EmptyState,
  ErrorState,
  EdgeFade,
} from '@components/ui';
import { MaterialCard } from '@components/materials/MaterialCard';
import { colors, spacing } from '@theme';
import { repo } from '@data/repositories';
import { useAsyncResource } from '@hooks/useAsyncResource';
import { materialTypeLabels } from '@data/materialTypeLabels';
import { useAuthStore } from '@store/useAuthStore';
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
  const classId = useAuthStore((s) => s.student?.classId);
  const { data, loading, refreshing, error, refresh } = useAsyncResource(
    () => (classId ? repo.materials.list(classId) : Promise.resolve([])),
    [classId],
  );
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<FilterKey>('all');
  const [previewImage, setPreviewImage] = useState<StudyMaterial | null>(null);

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
    if (material.attachment.type === 'image' && material.attachment.url) {
      setPreviewImage(material);
      return;
    }
    Alert.alert(material.title, 'Preview isn’t available for this file type in this build yet.');
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <DetailHeader title="Study Materials" />
      <View style={styles.header}>
        <SearchBar value={query} onChangeText={setQuery} placeholder="Search materials or subject" />
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

      <Modal visible={!!previewImage} transparent animationType="fade" onRequestClose={() => setPreviewImage(null)}>
        <Pressable style={styles.previewBackdrop} onPress={() => setPreviewImage(null)}>
          {previewImage && (
            <Image source={{ uri: previewImage.attachment.url }} style={styles.previewImage} resizeMode="contain" />
          )}
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: { paddingHorizontal: spacing.lg },
  list: { paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.xxxl, flexGrow: 1 },
  previewBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewImage: {
    width: '100%',
    height: '80%',
  },
});
