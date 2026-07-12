import React from 'react';
import { View, ScrollView, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import {
  AppText,
  Card,
  Badge,
  DetailHeader,
  AttachmentRow,
  ErrorState,
  Skeleton,
} from '@components/ui';
import { colors, spacing, radius } from '@theme';
import { RootStackParamList } from '@navigation/types';
import { useHomeworkStore } from '@store/useHomeworkStore';
import { friendlyDate, dueInLabel } from '@utils/date';

export function HomeworkDetailScreen() {
  const route = useRoute<RouteProp<RootStackParamList, 'HomeworkDetail'>>();
  const { items, loading } = useHomeworkStore();
  const homework = items.find((h) => h.id === route.params.id);

  if (!homework) {
    return (
      <SafeAreaView style={styles.safe}>
        <DetailHeader title="Homework" />
        {loading ? (
          <View style={{ padding: spacing.lg }}>
            <Skeleton height={120} borderRadius={16} />
          </View>
        ) : (
          <ErrorState title="Homework not found" message="This assignment may have been removed." />
        )}
      </SafeAreaView>
    );
  }

  const due = dueInLabel(homework.dueDate);

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <DetailHeader title="Homework" />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.topRow}>
          <Badge label={homework.subject} tone="neutral" />
          <AppText variant="caption" color={due.overdue ? colors.danger : colors.textSecondary} style={{ fontWeight: '700' }}>
            {due.label}
          </AppText>
        </View>
        <AppText variant="displayMd" style={{ marginTop: spacing.sm }}>
          {homework.title}
        </AppText>

        <View style={styles.metaGrid}>
          <MetaItem icon="person-outline" label="Teacher" value={homework.teacher} />
          <MetaItem icon="calendar-outline" label="Assigned" value={friendlyDate(homework.assignedDate)} />
          <MetaItem
            icon="time-outline"
            label="Due date"
            value={friendlyDate(homework.dueDate)}
            valueColor={due.overdue ? colors.danger : undefined}
          />
        </View>

        <Card style={{ marginTop: spacing.lg }}>
          <AppText variant="h3">Instructions</AppText>
          <AppText variant="body" color={colors.textSecondary} style={{ marginTop: spacing.xs, lineHeight: 22 }}>
            {homework.instructions}
          </AppText>
        </Card>

        {homework.attachments.length > 0 && (
          <View style={{ marginTop: spacing.lg }}>
            <AppText variant="h3" style={{ marginBottom: spacing.sm }}>
              Attachments
            </AppText>
            {homework.attachments.map((a) => (
              <AttachmentRow
                key={a.id}
                attachment={a}
                onPress={() => Alert.alert(a.name, 'Preview isn’t available for this file type in this build yet.')}
              />
            ))}
          </View>
        )}

        {homework.remarks && (
          <Card style={{ marginTop: spacing.lg }}>
            <View style={styles.remarksHeader}>
              <AppText variant="h3">Teacher Remarks</AppText>
              {homework.remarks.grade && <Badge label={`Grade ${homework.remarks.grade}`} tone="success" />}
            </View>
            {homework.remarks.marks !== undefined && (
              <AppText variant="displayMd" style={{ marginTop: spacing.sm, fontSize: 22 }}>
                {homework.remarks.marks}
                <AppText variant="body" color={colors.textSecondary}>
                  {' '}
                  / {homework.remarks.maxMarks}
                </AppText>
              </AppText>
            )}
            <AppText variant="body" color={colors.textSecondary} style={{ marginTop: spacing.sm, lineHeight: 22 }}>
              {homework.remarks.comment}
            </AppText>
            <AppText variant="tiny" color={colors.textTertiary} style={{ marginTop: spacing.sm }}>
              Graded on {friendlyDate(homework.remarks.gradedAt)}
            </AppText>
          </Card>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function MetaItem({
  icon,
  label,
  value,
  valueColor,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  valueColor?: string;
}) {
  return (
    <View style={styles.metaItem}>
      <View style={styles.metaIconWrap}>
        <Ionicons name={icon} size={15} color={colors.textSecondary} />
      </View>
      <View style={{ marginLeft: 8 }}>
        <AppText variant="tiny" color={colors.textTertiary}>
          {label}
        </AppText>
        <AppText variant="bodyMedium" color={valueColor ?? colors.textPrimary}>
          {value}
        </AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxxl },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  metaGrid: {
    marginTop: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    padding: spacing.md,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  metaIconWrap: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  remarksHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
});
