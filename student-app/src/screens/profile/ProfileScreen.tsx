import React, { useEffect } from 'react';
import { View, ScrollView, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { AppText, Card, Button, Avatar, SkeletonCard } from '@components/ui';
import { InfoRow } from '@components/profile/InfoRow';
import { colors, spacing, radius, gradients, layout } from '@theme';
import { useStudentStore } from '@store/useStudentStore';
import { useAuthStore } from '@store/useAuthStore';
import { friendlyDate } from '@utils/date';

export function ProfileScreen() {
  const { student, fetch } = useStudentStore();
  const signOut = useAuthStore((s) => s.signOut);

  useEffect(() => {
    fetch();
  }, [fetch]);

  if (!student) {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
        <View style={{ padding: spacing.lg }}>
          <SkeletonCard lines={4} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <LinearGradient colors={gradients.primary} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.header}>
          <Avatar uri={student.photoUrl} name={student.name} size={88} ringColor="rgba(255,255,255,0.6)" />
          <AppText variant="h1" color={colors.textInverse} style={{ marginTop: spacing.sm }}>
            {student.name}
          </AppText>
          <AppText variant="body" color="rgba(255,255,255,0.85)" style={{ marginTop: 2 }}>
            {student.className} · Section {student.section}
          </AppText>
          <View style={styles.badgeRow}>
            <View style={styles.headerBadge}>
              <AppText variant="caption" color={colors.textInverse}>
                Roll No. {student.rollNumber}
              </AppText>
            </View>
            {student.house && (
              <View style={styles.headerBadge}>
                <AppText variant="caption" color={colors.textInverse}>
                  {student.house}
                </AppText>
              </View>
            )}
          </View>
        </LinearGradient>

        <View style={styles.section}>
          <SectionLabel icon="school-outline" title="Academic Information" />
          <Card>
            <InfoRow icon="book-outline" label="Class" value={student.className} />
            <InfoRow icon="grid-outline" label="Section" value={student.section} />
            <InfoRow icon="finger-print-outline" label="Roll Number" value={student.rollNumber} />
            <InfoRow icon="card-outline" label="Admission Number" value={student.admissionNumber} />
            {student.busRoute && <InfoRow icon="bus-outline" label="Bus Route" value={student.busRoute} isLast />}
          </Card>
        </View>

        <View style={styles.section}>
          <SectionLabel icon="person-outline" title="Personal Information" />
          <Card>
            <InfoRow icon="calendar-outline" label="Date of Birth" value={friendlyDate(student.dateOfBirth)} />
            <InfoRow icon="male-female-outline" label="Gender" value={student.gender} />
            <InfoRow icon="water-outline" label="Blood Group" value={student.bloodGroup} isLast />
          </Card>
        </View>

        <View style={styles.section}>
          <SectionLabel icon="call-outline" title="Contact Details" />
          <Card>
            <InfoRow icon="mail-outline" label="Email" value={student.email} />
            <InfoRow icon="call-outline" label="Phone" value={student.phone} />
            <InfoRow icon="location-outline" label="Address" value={student.address} isLast />
          </Card>
        </View>

        <View style={styles.section}>
          <SectionLabel icon="alert-circle-outline" title="Guardian & Emergency" />
          <Card>
            <InfoRow icon="man-outline" label="Father's Name" value={student.fatherName} />
            <InfoRow icon="woman-outline" label="Mother's Name" value={student.motherName} />
            <InfoRow icon="call-outline" label="Guardian Phone" value={student.guardianPhone} />
            <InfoRow
              icon="medkit-outline"
              label={`Emergency Contact (${student.emergencyContactRelation})`}
              value={`${student.emergencyContactName} · ${student.emergencyContactPhone}`}
              isLast
            />
          </Card>
        </View>

        <Button
          label="Log Out"
          variant="outline"
          icon="log-out-outline"
          fullWidth
          style={{ marginTop: spacing.md }}
          onPress={() => Alert.alert('Log Out', 'Are you sure you want to log out?', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Log Out', style: 'destructive', onPress: () => signOut() },
          ])}
        />
        <AppText variant="tiny" color={colors.textTertiary} align="center" style={{ marginTop: spacing.lg }}>
          MIS-student · Version 1.0.0
        </AppText>
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
    paddingTop: spacing.xl,
    paddingBottom: spacing.xl,
    borderBottomLeftRadius: radius.xl,
    borderBottomRightRadius: radius.xl,
  },
  badgeRow: { flexDirection: 'row', marginTop: spacing.sm },
  headerBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: spacing.sm,
    paddingVertical: 5,
    borderRadius: radius.pill,
    marginHorizontal: 4,
  },
  section: { paddingHorizontal: spacing.lg, marginTop: spacing.lg },
  sectionLabelRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm },
});
