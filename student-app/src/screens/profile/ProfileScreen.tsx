import React, { useEffect, useState } from 'react';
import { View, ScrollView, StyleSheet, Alert, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { AppText, Card, Button, Avatar, IconButton, SegmentedControl, SkeletonCard } from '@components/ui';
import { InfoRow } from '@components/profile/InfoRow';
import { colors, spacing, layout, radius } from '@theme';
import { useStudentStore } from '@store/useStudentStore';
import { useAuthStore } from '@store/useAuthStore';
import { friendlyDate } from '@utils/date';

const TABS = ['Overview', 'Contact', 'Guardian'];

export function ProfileScreen() {
  const { student, fetch, updateContact, saving } = useStudentStore();
  const signOut = useAuthStore((s) => s.signOut);
  const [tab, setTab] = useState(0);

  const [editingContact, setEditingContact] = useState(false);
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');

  const [editingGuardian, setEditingGuardian] = useState(false);
  const [ecName, setEcName] = useState('');
  const [ecPhone, setEcPhone] = useState('');
  const [ecRelation, setEcRelation] = useState('');

  useEffect(() => {
    fetch();
  }, [fetch]);

  useEffect(() => {
    if (!student) return;
    setPhone(student.phone);
    setAddress(student.address);
    setEcName(student.emergencyContactName);
    setEcPhone(student.emergencyContactPhone);
    setEcRelation(student.emergencyContactRelation);
  }, [student]);

  if (!student) {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
        <View style={{ padding: spacing.lg }}>
          <SkeletonCard lines={4} />
        </View>
      </SafeAreaView>
    );
  }

  const saveContact = async () => {
    try {
      await updateContact({ phone: phone.trim(), address: address.trim() });
      setEditingContact(false);
    } catch (e) {
      Alert.alert('Could not save', e instanceof Error ? e.message : 'Please try again.');
    }
  };

  const cancelContact = () => {
    setPhone(student.phone);
    setAddress(student.address);
    setEditingContact(false);
  };

  const saveGuardian = async () => {
    try {
      await updateContact({
        emergencyContactName: ecName.trim(),
        emergencyContactPhone: ecPhone.trim(),
        emergencyContactRelation: ecRelation.trim(),
      });
      setEditingGuardian(false);
    } catch (e) {
      Alert.alert('Could not save', e instanceof Error ? e.message : 'Please try again.');
    }
  };

  const cancelGuardian = () => {
    setEcName(student.emergencyContactName);
    setEcPhone(student.emergencyContactPhone);
    setEcRelation(student.emergencyContactRelation);
    setEditingGuardian(false);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Avatar uri={student.photoUrl} name={student.name} size={76} />
          <AppText variant="h1" style={{ marginTop: spacing.sm }}>
            {student.name}
          </AppText>
          <AppText variant="body" color={colors.textSecondary} style={{ marginTop: 2 }}>
            {student.className} · Section {student.section}
          </AppText>
          <View style={styles.badgeRow}>
            <View style={styles.headerBadge}>
              <AppText variant="caption" color={colors.textSecondary}>
                Roll No. {student.rollNumber}
              </AppText>
            </View>
            {student.house && (
              <View style={styles.headerBadge}>
                <AppText variant="caption" color={colors.textSecondary}>
                  {student.house}
                </AppText>
              </View>
            )}
          </View>
        </View>

        <View style={styles.tabsWrap}>
          <SegmentedControl options={TABS} selectedIndex={tab} onChange={setTab} />
        </View>

        {tab === 0 && (
          <>
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
          </>
        )}

        {tab === 1 && (
          <View style={styles.section}>
            <View style={styles.sectionLabelRow}>
              <SectionLabel icon="call-outline" title="Contact Details" />
              {!editingContact && (
                <IconButton icon="pencil-outline" size={30} onPress={() => setEditingContact(true)} />
              )}
            </View>
            <Card>
              <InfoRow icon="mail-outline" label="Email" value={student.email} />
              {editingContact ? (
                <>
                  <EditableRow icon="call-outline" label="Phone" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
                  <EditableRow icon="location-outline" label="Address" value={address} onChangeText={setAddress} isLast />
                </>
              ) : (
                <>
                  <InfoRow icon="call-outline" label="Phone" value={student.phone} />
                  <InfoRow icon="location-outline" label="Address" value={student.address} isLast />
                </>
              )}
            </Card>
            {editingContact && (
              <View style={styles.editActions}>
                <Button label="Cancel" variant="outline" size="sm" onPress={cancelContact} style={{ flex: 1, marginRight: spacing.sm }} />
                <Button label="Save changes" size="sm" loading={saving} onPress={saveContact} style={{ flex: 1 }} />
              </View>
            )}
          </View>
        )}

        {tab === 2 && (
          <View style={styles.section}>
            <SectionLabel icon="people-outline" title="Guardians" />
            <Card>
              <InfoRow icon="man-outline" label="Father's Name" value={student.fatherName} />
              <InfoRow icon="woman-outline" label="Mother's Name" value={student.motherName} />
              <InfoRow icon="call-outline" label="Guardian Phone" value={student.guardianPhone} isLast />
            </Card>

            <View style={[styles.sectionLabelRow, { marginTop: spacing.lg }]}>
              <SectionLabel icon="alert-circle-outline" title="Emergency Contact" />
              {!editingGuardian && (
                <IconButton icon="pencil-outline" size={30} onPress={() => setEditingGuardian(true)} />
              )}
            </View>
            <Card>
              {editingGuardian ? (
                <>
                  <EditableRow icon="person-outline" label="Name" value={ecName} onChangeText={setEcName} />
                  <EditableRow icon="call-outline" label="Phone" value={ecPhone} onChangeText={setEcPhone} keyboardType="phone-pad" />
                  <EditableRow icon="git-network-outline" label="Relation" value={ecRelation} onChangeText={setEcRelation} isLast />
                </>
              ) : (
                <>
                  <InfoRow icon="person-outline" label="Name" value={student.emergencyContactName} />
                  <InfoRow icon="call-outline" label="Phone" value={student.emergencyContactPhone} />
                  <InfoRow icon="git-network-outline" label="Relation" value={student.emergencyContactRelation} isLast />
                </>
              )}
            </Card>
            {editingGuardian && (
              <View style={styles.editActions}>
                <Button label="Cancel" variant="outline" size="sm" onPress={cancelGuardian} style={{ flex: 1, marginRight: spacing.sm }} />
                <Button label="Save changes" size="sm" loading={saving} onPress={saveGuardian} style={{ flex: 1 }} />
              </View>
            )}
          </View>
        )}

        <Button
          label="Log Out"
          variant="outline"
          icon="log-out-outline"
          fullWidth
          style={{ marginTop: spacing.xl, marginHorizontal: spacing.lg }}
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
    <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
      <Ionicons name={icon} size={16} color={colors.textSecondary} />
      <AppText variant="h3" style={{ marginLeft: 6 }}>
        {title}
      </AppText>
    </View>
  );
}

function EditableRow({
  icon,
  label,
  value,
  onChangeText,
  keyboardType,
  isLast,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  onChangeText: (t: string) => void;
  keyboardType?: 'default' | 'phone-pad';
  isLast?: boolean;
}) {
  return (
    <View style={[styles.editRow, !isLast && styles.editRowBorder]}>
      <View style={styles.iconWrap}>
        <Ionicons name={icon} size={15} color={colors.textSecondary} />
      </View>
      <View style={{ marginLeft: spacing.sm, flex: 1 }}>
        <AppText variant="tiny" color={colors.textTertiary}>
          {label}
        </AppText>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          keyboardType={keyboardType}
          placeholderTextColor={colors.textTertiary}
          style={styles.editInput}
        />
      </View>
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
  tabsWrap: { paddingHorizontal: spacing.lg, marginTop: spacing.lg },
  section: { paddingHorizontal: spacing.lg, marginTop: spacing.lg },
  sectionLabelRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.sm },
  editActions: { flexDirection: 'row', marginTop: spacing.sm },
  editRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.xs },
  editRowBorder: { borderBottomWidth: 1, borderBottomColor: colors.borderSoft },
  iconWrap: {
    width: 30,
    height: 30,
    borderRadius: radius.xs,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editInput: {
    marginTop: 1,
    paddingVertical: 4,
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
    color: colors.textPrimary,
    borderBottomWidth: 1,
    borderBottomColor: colors.primary,
  },
});
