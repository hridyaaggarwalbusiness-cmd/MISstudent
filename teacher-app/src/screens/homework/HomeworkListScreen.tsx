import React, { useEffect, useState } from 'react';
import { View, FlatList, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { AppText, Card, Badge, IconButton, EmptyState, SkeletonCard } from '@components/ui';
import { colors, spacing, layout } from '@theme';
import { RootStackParamList } from '@navigation/types';
import { useAuthStore } from '@store/useAuthStore';
import { repo } from '@data/repositories';
import { Homework } from '@/types';
import { friendlyDate } from '@utils/date';

export function HomeworkListScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { teacher } = useAuthStore();
  const classId = teacher?.classIds?.[0];
  const [items, setItems] = useState<Homework[] | null>(null);

  useEffect(() => {
    if (!classId) return;
    return repo.homework.subscribeForClass(classId, setItems);
  }, [classId]);

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <AppText variant="displayMd">Homework</AppText>
        <IconButton icon="add" onPress={() => navigation.navigate('HomeworkCreate')} backgroundColor={colors.primary} color={colors.textInverse} />
      </View>

      {items === null ? (
        <View style={{ paddingHorizontal: spacing.lg }}>
          <SkeletonCard lines={2} />
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(h) => h.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <EmptyState
              icon="book-outline"
              title="No homework posted"
              message="Tap the + button to assign your first homework."
            />
          }
          renderItem={({ item }) => (
            <Card style={{ marginBottom: spacing.sm }} onPress={() => navigation.navigate('HomeworkDetail', { id: item.id })}>
              <View style={styles.row}>
                <View style={{ flex: 1 }}>
                  <Badge label={item.subject} tone="neutral" size="sm" />
                  <AppText variant="bodySemibold" style={{ marginTop: 4 }}>
                    {item.title}
                  </AppText>
                  <AppText variant="tiny" color={colors.textTertiary} style={{ marginTop: 3 }}>
                    Assigned {friendlyDate(item.assignedDate)}
                  </AppText>
                </View>
                <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    marginBottom: spacing.md,
  },
  list: { paddingHorizontal: spacing.lg, paddingBottom: layout.tabBarClearance, flexGrow: 1 },
  row: { flexDirection: 'row', alignItems: 'center' },
});
