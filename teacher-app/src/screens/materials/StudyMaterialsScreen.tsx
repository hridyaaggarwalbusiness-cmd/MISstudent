import React, { useEffect, useState } from 'react';
import { View, FlatList, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { AppText, Card, Badge, IconButton, DetailHeader, EmptyState, Skeleton } from '@components/ui';
import { colors, spacing, layout } from '@theme';
import { useAuthStore } from '@store/useAuthStore';
import { repo } from '@data/repositories';
import { StudyMaterial } from '@/types';
import { friendlyDateShort } from '@utils/date';

export function StudyMaterialsScreen() {
  const navigation = useNavigation();
  const { teacher } = useAuthStore();
  const classId = teacher?.classIds?.[0];
  const [materials, setMaterials] = useState<StudyMaterial[] | null>(null);

  useEffect(() => {
    if (!classId) return;
    return repo.materials.subscribeForClass(classId, setMaterials);
  }, [classId]);

  const confirmDelete = (material: StudyMaterial) => {
    Alert.alert('Delete material', `Remove "${material.title}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => repo.materials.remove(material.id) },
    ]);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <DetailHeader
        title="Study Materials"
        rightAction={
          <IconButton
            icon="add"
            onPress={() => navigation.navigate('MaterialUpload' as never)}
            backgroundColor={colors.primary}
            color={colors.textInverse}
          />
        }
      />
      {materials === null ? (
        <View style={{ paddingHorizontal: spacing.lg }}>
          <Skeleton height={100} borderRadius={16} />
        </View>
      ) : (
        <FlatList
          data={materials}
          keyExtractor={(m) => m.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={<EmptyState icon="library-outline" title="No materials uploaded" />}
          renderItem={({ item }) => (
            <Card style={{ marginBottom: spacing.sm }}>
              <View style={styles.row}>
                <View style={{ flex: 1 }}>
                  <Badge label={item.subject} tone="neutral" size="sm" />
                  <AppText variant="bodySemibold" style={{ marginTop: 4 }}>
                    {item.title}
                  </AppText>
                  <AppText variant="tiny" color={colors.textTertiary} style={{ marginTop: 3 }}>
                    {friendlyDateShort(item.uploadedAt)}
                  </AppText>
                </View>
                <Ionicons name="trash-outline" size={18} color={colors.textTertiary} onPress={() => confirmDelete(item)} />
              </View>
            </Card>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  list: { paddingHorizontal: spacing.lg, paddingBottom: layout.tabBarClearance, flexGrow: 1 },
  row: { flexDirection: 'row', alignItems: 'center' },
});
