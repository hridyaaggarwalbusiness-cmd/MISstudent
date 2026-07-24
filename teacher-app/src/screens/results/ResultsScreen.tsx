import React, { useEffect, useState } from 'react';
import { View, FlatList, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { AppText, Card, Badge, DetailHeader, EmptyState, Skeleton } from '@components/ui';
import { colors, spacing, layout } from '@theme';
import { RootStackParamList } from '@navigation/types';
import { useAuthStore } from '@store/useAuthStore';
import { repo } from '@data/repositories';
import { Exam } from '@/types';
import { friendlyDate } from '@utils/date';

export function ResultsScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { teacher } = useAuthStore();
  const classId = teacher?.classIds?.[0];
  const [exams, setExams] = useState<Exam[] | null>(null);

  useEffect(() => {
    if (!classId) return;
    return repo.exams.subscribeForClass(classId, setExams);
  }, [classId]);

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <DetailHeader title="Results" />
      {exams === null ? (
        <View style={{ paddingHorizontal: spacing.lg }}>
          <Skeleton height={100} borderRadius={16} />
        </View>
      ) : (
        <FlatList
          data={exams ?? []}
          keyExtractor={(e) => e.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={<EmptyState icon="stats-chart-outline" title="No exams to grade" />}
          renderItem={({ item }) => (
            <Card style={{ marginBottom: spacing.sm }} onPress={() => navigation.navigate('ResultEntry', { examId: item.id })}>
              <View style={styles.row}>
                <View style={{ flex: 1 }}>
                  <Badge label={item.subject} tone="neutral" size="sm" />
                  <AppText variant="bodySemibold" style={{ marginTop: 4 }}>
                    {item.name}
                  </AppText>
                  <AppText variant="tiny" color={colors.textTertiary} style={{ marginTop: 3 }}>
                    {friendlyDate(item.date)}
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
  list: { paddingHorizontal: spacing.lg, paddingBottom: layout.tabBarClearance, flexGrow: 1 },
  row: { flexDirection: 'row', alignItems: 'center' },
});
