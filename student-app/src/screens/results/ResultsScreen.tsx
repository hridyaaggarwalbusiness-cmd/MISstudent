import React, { useMemo } from 'react';
import { View, ScrollView, StyleSheet, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '@navigation/types';
import {
  AppText,
  Card,
  LineChart,
  DetailHeader,
  SkeletonCard,
  EmptyState,
  ErrorState,
} from '@components/ui';
import { ResultCard } from '@components/results/ResultCard';
import { colors, spacing, layout } from '@theme';
import { repo } from '@data/repositories';
import { useAsyncResource } from '@hooks/useAsyncResource';
import { useAuthStore } from '@store/useAuthStore';

export function ResultsScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const studentId = useAuthStore((s) => s.student?.id);
  const { data, loading, refreshing, error, refresh } = useAsyncResource(
    () => (studentId ? repo.results.list(studentId) : Promise.resolve([])),
    [studentId],
  );

  const trendData = useMemo(() => {
    if (!data) return [];
    return data.map((r) => ({ label: r.term.replace('Term ', 'T'), value: r.percentage }));
  }, [data]);

  const sorted = useMemo(() => (data ? [...data].reverse() : []), [data]);

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <DetailHeader title="Results" />
      {error && !data ? (
        <ErrorState onRetry={refresh} />
      ) : (
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.primary} colors={[colors.primary]} />
          }
        >
          {loading && !data ? (
            <SkeletonCard lines={3} />
          ) : (
            <>
              <Card>
                <AppText variant="h3">Performance Trend</AppText>
                <AppText variant="caption" color={colors.textSecondary} style={{ marginTop: 2, marginBottom: spacing.sm }}>
                  Overall percentage across exams
                </AppText>
                {trendData.length > 1 ? (
                  <LineChart data={trendData} height={170} />
                ) : (
                  <EmptyState icon="trending-up-outline" title="Not enough data yet" compact />
                )}
              </Card>

              <View style={styles.sectionTitle}>
                <AppText variant="h3">All Results</AppText>
              </View>

              {sorted.length === 0 ? (
                <EmptyState icon="stats-chart-outline" title="No results published yet" />
              ) : (
                sorted.map((result) => (
                  <ResultCard
                    key={result.id}
                    result={result}
                    onPress={() => navigation.navigate('ResultDetail', { id: result.id })}
                  />
                ))
              )}
            </>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: spacing.lg, paddingBottom: layout.tabBarClearance },
  sectionTitle: { marginTop: spacing.lg, marginBottom: spacing.sm },
});
