import React from 'react';
import { View, Modal, Pressable, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '@navigation/types';
import { AppText, AnimatedPressable } from '@components/ui';
import { colors, spacing, radius } from '@theme';

interface ActionItem {
  key: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
}

const ACTIONS: ActionItem[] = [
  { key: 'homework', label: 'Post Homework', icon: 'book-outline', color: colors.tileBlue },
  { key: 'marks', label: 'Enter Marks', icon: 'stats-chart-outline', color: colors.tileRed },
  { key: 'material', label: 'Upload Material', icon: 'cloud-upload-outline', color: colors.tileGreen },
  { key: 'notice', label: 'Post Notice', icon: 'megaphone-outline', color: colors.tileViolet },
  { key: 'attendance', label: 'Attendance', icon: 'checkmark-done-outline', color: colors.tileTeal },
  { key: 'calendar', label: 'Calendar', icon: 'calendar-outline', color: colors.tileYellow },
  { key: 'timetable', label: 'Timetable', icon: 'time-outline', color: colors.tileSky },
  { key: 'search', label: 'Search', icon: 'search-outline', color: colors.textTertiary },
];

export function QuickActionSheet({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  function onPress(key: string) {
    onClose();
    switch (key) {
      case 'homework':
        navigation.navigate('HomeworkCreate');
        break;
      case 'marks':
        navigation.navigate('ResultEntry', {});
        break;
      case 'material':
        navigation.navigate('MaterialUpload');
        break;
      case 'notice':
        navigation.navigate('NoticeCreate');
        break;
      case 'attendance':
        navigation.navigate('MainTabs', { screen: 'AttendanceTab' });
        break;
      case 'calendar':
        navigation.navigate('AcademicCalendar');
        break;
      case 'timetable':
        navigation.navigate('MainTabs', { screen: 'TimetableTab' });
        break;
      case 'search':
        navigation.navigate('Search');
        break;
    }
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <View style={styles.grabber} />
          <AppText variant="h3" style={{ marginBottom: spacing.md }}>
            Quick Actions
          </AppText>
          <View style={styles.grid}>
            {ACTIONS.map((action) => (
              <AnimatedPressable key={action.key} onPress={() => onPress(action.key)} style={styles.tile} haptic={false}>
                <View style={[styles.iconWrap, { backgroundColor: action.color }]}>
                  <Ionicons name={action.icon} size={20} color="#fff" />
                </View>
                <AppText variant="tiny" color={colors.textSecondary} style={{ marginTop: 6, textAlign: 'center' }}>
                  {action.label}
                </AppText>
              </AnimatedPressable>
            ))}
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: colors.overlay, justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingTop: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
  grabber: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.borderSoft,
    alignSelf: 'center',
    marginBottom: spacing.md,
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  tile: { width: '25%', alignItems: 'center', marginBottom: spacing.md },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
