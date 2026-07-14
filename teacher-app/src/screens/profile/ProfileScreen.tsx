import React, { useEffect, useState } from 'react';
import { View, ScrollView, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { AppText, Card, Button, Avatar } from '@components/ui';
import { InfoRow } from '@components/profile/InfoRow';
import { colors, spacing, layout } from '@theme';
import { useAuthStore } from '@store/useAuthStore';
import { repo } from '@data/repositories';

export function ProfileScreen() {
  const { teacher, signOut } = useAuthStore();
  const [classNames, setClassNames] = useState<string[]>([]);
  const [studentCount, setStudentCount] = useState<number | null>(null);

  useEffect(() => {
    if (!teacher) return;
    let cancelled = false;
    Promise.all(teacher.classIds.map((id) => repo.classes.get(id))).then((classes) => {
      if (cancelled) return;
      setClassNames(
        classes
          .filter((c): c is NonNullable<typeof c> => !!c)
          .map((c) => `${c.name} · Section ${c.section}`),
      );
    });
    Promise.all(teacher.classIds.map((id) => repo.classes.listStudents(id))).then((lists) => {
      if (cancelled) return;
      setStudentCount(lists.reduce((sum, l) => sum + l.length, 0));
    });
    return () => {
      cancelled = true;
    };
  }, [teacher]);

  if (!teacher) return null;

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Avatar uri={teacher.photoUrl} name={teacher.name} size={76} />
          <AppText variant="h1" style={{ marginTop: spacing.sm }}>
            {teacher.name}
          </AppText>
          <AppText variant="body" color={colors.textSecondary} style={{ marginTop: 2 }}>
            {teacher.subjects.join(', ')}
          </AppText>
          {teacher.isClassTeacherOf && (
            <View style={styles.badgeRow}>
              <View style={styles.headerBadge}>
                <AppText variant="caption" color={colors.textSecondary}>
                  Class Teacher
                </AppText>
              </View>
            </View>
          )}
          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <AppText variant="h2">{teacher.classIds.length}</AppText>
              <AppText variant="tiny" color={colors.textTertiary}>
                {teacher.classIds.length === 1 ? 'Class' : 'Classes'}
              </AppText>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statBox}>
              <AppText variant="h2">{studentCount ?? '—'}</AppText>
              <AppText variant="tiny" color={colors.textTertiary}>
                Students
              </AppText>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statBox}>
              <AppText variant="h2">{teacher.subjects.length}</AppText>
              <AppText variant="tiny" color={colors.textTertiary}>
                {teacher.subjects.length === 1 ? 'Subject' : 'Subjects'}
              </AppText>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <SectionLabel icon="call-outline" title="Contact Details" />
          <Card>
            <InfoRow icon="mail-outline" label="Email" value={teacher.email} />
            <InfoRow icon="call-outline" label="Phone" value={teacher.phone} isLast />
          </Card>
        </View>

        <View style={styles.section}>
          <SectionLabel icon="school-outline" title="Teaching Assignment" />
          <Card>
            <InfoRow icon="book-outline" label="Subjects" value={teacher.subjects.join(', ')} />
            <InfoRow
              icon="people-outline"
              label="Classes"
              value={classNames.length > 0 ? classNames.join(', ') : teacher.classIds.join(', ')}
              isLast
            />
          </Card>
        </View>

        <Button
          label="Log Out"
          variant="outline"
          icon="log-out-outline"
          fullWidth
          style={{ marginTop: spacing.xl, marginHorizontal: spacing.lg }}
          onPress={() =>
            Alert.alert('Log Out', 'Are you sure you want to log out?', [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Log Out', style: 'destructive', onPress: () => signOut() },
            ])
          }
        />
      </ScrollView>
    </SafeAreaView>
  );
}

function SectionLabel({ icon, title }: { icon: keyof typeof Ionicons.glyphMap; title: string }) {
  return (
    <View style={styles.sectionLabelRow}>
      <Ionicons name={icon} size={16} color={colors.textSecondary} />
      <AppText variant="h3" style={{ marginLeft: 6 }}>
        {title}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { paddingBottom: layout.tabBarClearance },
  header: {
    alignItems: 'center',
    paddingTop: spacing.lg,
    paddingBottom: spacing.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  badgeRow: { flexDirection: 'row', marginTop: spacing.sm },
  headerBadge: {
    backgroundColor: colors.surfaceAlt,
    paddingHorizontal: spacing.sm,
    paddingVertical: 5,
    borderRadius: 999,
    marginHorizontal: 4,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  statBox: { flex: 1, alignItems: 'center' },
  statDivider: { width: StyleSheet.hairlineWidth, height: 28, backgroundColor: colors.border },
  section: { paddingHorizontal: spacing.lg, marginTop: spacing.lg },
  sectionLabelRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm },
});
