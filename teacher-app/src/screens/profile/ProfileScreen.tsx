import React from 'react';
import { View, ScrollView, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { AppText, Card, Button, Avatar } from '@components/ui';
import { InfoRow } from '@components/profile/InfoRow';
import { colors, spacing, radius, gradients, layout } from '@theme';
import { useAuthStore } from '@store/useAuthStore';

export function ProfileScreen() {
  const { teacher, signOut } = useAuthStore();

  if (!teacher) return null;

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <LinearGradient colors={gradients.primary} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.header}>
          <Avatar uri={teacher.photoUrl} name={teacher.name} size={88} ringColor="rgba(255,255,255,0.6)" />
          <AppText variant="h1" color={colors.textInverse} style={{ marginTop: spacing.sm }}>
            {teacher.name}
          </AppText>
          <AppText variant="body" color="rgba(255,255,255,0.85)" style={{ marginTop: 2 }}>
            {teacher.subjects.join(', ')}
          </AppText>
        </LinearGradient>

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
            <InfoRow icon="people-outline" label="Classes" value={teacher.classIds.join(', ')} isLast />
          </Card>
        </View>

        <Button
          label="Log Out"
          variant="outline"
          icon="log-out-outline"
          fullWidth
          style={{ marginTop: spacing.md }}
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
    paddingTop: spacing.xl,
    paddingBottom: spacing.xl,
    borderBottomLeftRadius: radius.xl,
    borderBottomRightRadius: radius.xl,
  },
  section: { paddingHorizontal: spacing.lg, marginTop: spacing.lg },
  sectionLabelRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm },
});
