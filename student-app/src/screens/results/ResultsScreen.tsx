import React, { useMemo, useState } from 'react';
import { View, ScrollView, StyleSheet, RefreshControl, Modal, Pressable, Share } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '@navigation/types';
import {
  AppText,
  Card,
  IconButton,
  ProgressRing,
  ProgressBar,
  AnimatedPressable,
  SkeletonCard,
  EmptyState,
  ErrorState,
} from '@components/ui';
import { colors, spacing, radius } from '@theme';
import { repo } from '@data/repositories';
import { useAsyncResource } from '@hooks/useAsyncResource';
import { useAuthStore } from '@store/useAuthStore';
import { gradeColor } from '@utils/grade';

const SUBJECT_BAR_COLORS = [colors.accentEmerald, colors.accentSky, colors.accentViolet, colors.danger, colors.accentAmber];

export function ResultsScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const studentId = useAuthStore((s) => s.student?.id);
  const { data, loading, refreshing, error, refresh } = useAsyncResource(
    () => (studentId ? repo.results.list(studentId) : Promise.resolve([])),
    [studentId],
  );

  const sorted = useMemo(() => (data ? [...data].reverse() : []), [data]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);

  const selected = useMemo(
    () => sorted.find((r) => r.id === selectedId) ?? sorted[0],
    [sorted, selectedId],
  );

  const improvement = useMemo(() => {
    if (!selected) return null;
    const idx = sorted.findIndex((r) => r.id === selected.id);
    const previous = sorted[idx + 1];
    if (!previous) return null;
    return Math.round((selected.percentage - previous.percentage) * 10) / 10;
  }, [sorted, selected]);

  const grade = selected ? gradeColor(selected.grade) : { bg: colors.successBg, fg: colors.successStrong };

  const onShare = () => {
    if (!selected) return;
    const lines = [
      `${selected.examName} · ${selected.term}`,
      `Score: ${selected.totalObtained}/${selected.totalMax} (${Math.round(selected.percentage)}%) · Grade ${selected.grade}`,
    ];
    if (selected.rank) {
      lines.push(`Rank ${selected.rank}${selected.outOf ? ` out of ${selected.outOf}` : ''}`);
    }
    Share.share({ message: lines.join('\n') }).catch(() => {});
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <AppText variant="displayMd">Results</AppText>
        <IconButton
          icon="share-outline"
          onPress={onShare}
          size={38}
          backgroundColor="transparent"
          style={{ borderWidth: 0 }}
        />
      </View>

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
            <SkeletonCard lines={5} />
          ) : !selected ? (
            <EmptyState icon="stats-chart-outline" title="No results published yet" />
          ) : (
            <>
              <AnimatedPressable
                onPress={() => setPickerOpen(true)}
                haptic={false}
                style={styles.examSelector}
              >
                <AppText variant="bodySemibold" numberOfLines={1} style={{ flex: 1 }}>
                  {selected.examName} · {selected.term}
                </AppText>
                <Ionicons name="chevron-down" size={18} color={colors.textSecondary} />
              </AnimatedPressable>

              <Card style={{ marginTop: spacing.md }}>
                <AppText variant="h3">Overall Performance</AppText>
                <View style={styles.performanceRow}>
                  <ProgressRing
                    value={selected.percentage}
                    size={100}
                    strokeWidth={10}
                    colorOverride={grade.fg}
                    centerContent={
                      <AppText variant="displayLg" color={grade.fg}>
                        {selected.grade}
                      </AppText>
                    }
                  />
                  <View style={{ marginLeft: spacing.lg, flex: 1 }}>
                    <AppText variant="displayLg">{Math.round(selected.percentage)}%</AppText>
                    <AppText variant="caption" color={colors.textSecondary} style={{ marginTop: 2 }}>
                      {selected.totalObtained} / {selected.totalMax}
                    </AppText>
                    {selected.rank && (
                      <>
                        <AppText variant="bodySemibold" style={{ marginTop: spacing.sm }}>
                          Rank {selected.rank}
                        </AppText>
                        {selected.outOf && (
                          <AppText variant="tiny" color={colors.textTertiary}>
                            Out of {selected.outOf} students
                          </AppText>
                        )}
                      </>
                    )}
                  </View>
                  {improvement !== null && (
                    <View style={styles.improvementCol}>
                      <View style={styles.improvementRow}>
                        <Ionicons
                          name={improvement >= 0 ? 'caret-up' : 'caret-down'}
                          size={14}
                          color={improvement >= 0 ? colors.success : colors.danger}
                        />
                        <AppText
                          variant="bodySemibold"
                          color={improvement >= 0 ? colors.success : colors.danger}
                          style={{ marginLeft: 2 }}
                        >
                          {Math.abs(improvement)}%
                        </AppText>
                      </View>
                      <AppText variant="tiny" color={colors.textTertiary} style={{ marginTop: 2 }}>
                        {improvement >= 0 ? 'Improvement' : 'Decline'}
                      </AppText>
                    </View>
                  )}
                </View>
              </Card>

              {selected.subjects.length > 0 && (
                <Card style={{ marginTop: spacing.lg }}>
                  <AppText variant="h3" style={{ marginBottom: spacing.md }}>
                    Subject Wise
                  </AppText>
                  {selected.subjects.map((s, i) => {
                    const pct = Math.round((s.marksObtained / s.maxMarks) * 1000) / 10;
                    const color = SUBJECT_BAR_COLORS[i % SUBJECT_BAR_COLORS.length];
                    return (
                      <View key={s.subject} style={i > 0 ? { marginTop: spacing.md } : undefined}>
                        <View style={styles.subjectRow}>
                          <AppText variant="bodySemibold">{s.subject}</AppText>
                          <View style={{ alignItems: 'flex-end' }}>
                            <AppText variant="bodySemibold">{pct}%</AppText>
                            <AppText variant="tiny" color={colors.textTertiary}>
                              {s.marksObtained} / {s.maxMarks}
                            </AppText>
                          </View>
                        </View>
                        <ProgressBar value={pct} height={8} fillColor={color} trackColor={colors.surfaceAlt} style={{ marginTop: 6 }} />
                      </View>
                    );
                  })}
                </Card>
              )}

              <AnimatedPressable
                onPress={() => navigation.navigate('ResultDetail', { id: selected.id })}
                style={{ marginTop: spacing.lg, marginBottom: spacing.xl, borderRadius: radius.md, overflow: 'hidden' }}
              >
                <LinearGradient
                  colors={[colors.accentIndigo, colors.accentViolet]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.detailButton}
                >
                  <AppText variant="bodySemibold" color="#fff">
                    View Detailed Marks
                  </AppText>
                </LinearGradient>
              </AnimatedPressable>
            </>
          )}
        </ScrollView>
      )}

      <Modal visible={pickerOpen} transparent animationType="fade" onRequestClose={() => setPickerOpen(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setPickerOpen(false)}>
          <Pressable style={styles.modalCard} onPress={(e) => e.stopPropagation()}>
            <AppText variant="h3" style={{ marginBottom: spacing.sm }}>
              Select Exam
            </AppText>
            <ScrollView style={{ maxHeight: 360 }} showsVerticalScrollIndicator={false}>
              {sorted.map((r) => (
                <AnimatedPressable
                  key={r.id}
                  haptic={false}
                  style={styles.examOption}
                  onPress={() => {
                    setSelectedId(r.id);
                    setPickerOpen(false);
                  }}
                >
                  <AppText variant="bodyMedium" color={r.id === selected?.id ? colors.primary : colors.textPrimary}>
                    {r.examName} · {r.term}
                  </AppText>
                  {r.id === selected?.id && <Ionicons name="checkmark" size={18} color={colors.primary} />}
                </AnimatedPressable>
              ))}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
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
  },
  content: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xl },
  examSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    backgroundColor: colors.surface,
  },
  performanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.md,
  },
  improvementCol: { alignItems: 'flex-end', marginLeft: spacing.sm },
  improvementRow: { flexDirection: 'row', alignItems: 'center' },
  subjectRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  modalOverlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'center',
    padding: spacing.lg,
  },
  modalCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
  },
  examOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm + 2,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSoft,
  },
  detailButton: {
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
