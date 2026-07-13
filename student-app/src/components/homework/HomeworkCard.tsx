import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Card, AppText } from '@components/ui';
import { colors, spacing, radius } from '@theme';
import { Homework } from '@/types';
import { friendlyDateShort } from '@utils/date';
import { subjectMeta, subjectTextColor } from '@data/subjectMeta';

interface HomeworkCardProps {
  homework: Homework;
  onPress: () => void;
}

export function HomeworkCard({ homework, onPress }: HomeworkCardProps) {
  const meta = subjectMeta(homework.subject);
  const textColor = subjectTextColor(homework.subject);

  return (
    <Card onPress={onPress} elevation="xs" style={styles.card}>
      <View style={styles.row}>
        <LinearGradient colors={meta.gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.iconWrap}>
          <Ionicons name={meta.icon} size={22} color="#fff" />
        </LinearGradient>
        <View style={{ flex: 1, marginLeft: spacing.sm }}>
          <AppText variant="caption" color={textColor} style={{ fontWeight: '700' }}>
            {homework.subject}
          </AppText>
          <AppText variant="bodySemibold" style={styles.title}>
            {homework.title}
          </AppText>
          {!!homework.instructions && (
            <AppText variant="caption" color={colors.textSecondary} style={styles.preview}>
              {homework.instructions}
            </AppText>
          )}
          <AppText variant="tiny" color={colors.textTertiary} style={styles.meta}>
            By {homework.teacher} · {friendlyDateShort(homework.assignedDate)}
          </AppText>
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    marginTop: 4,
    fontSize: 15.5,
    lineHeight: 21,
  },
  preview: {
    marginTop: 3,
    lineHeight: 18,
  },
  meta: {
    marginTop: spacing.sm,
  },
});
