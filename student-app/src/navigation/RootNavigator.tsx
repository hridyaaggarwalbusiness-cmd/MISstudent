import React from 'react';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RootStackParamList } from './types';
import { MainTabs } from './MainTabs';
import { HomeworkDetailScreen } from '@screens/homework/HomeworkDetailScreen';
import { AttendanceScreen } from '@screens/attendance/AttendanceScreen';
import { ResultDetailScreen } from '@screens/results/ResultDetailScreen';
import { StudyMaterialsScreen } from '@screens/materials/StudyMaterialsScreen';
import { NoticeDetailScreen } from '@screens/notices/NoticeDetailScreen';
import { AcademicCalendarScreen } from '@screens/calendar/AcademicCalendarScreen';
import { NotificationsScreen } from '@screens/notifications/NotificationsScreen';
import { SearchScreen } from '@screens/search/SearchScreen';
import { colors } from '@theme';

const Stack = createNativeStackNavigator<RootStackParamList>();

const navTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: colors.background,
    primary: colors.primary,
    card: colors.surface,
    border: colors.border,
    text: colors.textPrimary,
  },
};

export function RootNavigator() {
  return (
    <NavigationContainer theme={navTheme}>
      <Stack.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
        <Stack.Screen name="MainTabs" component={MainTabs} />
        <Stack.Screen name="HomeworkDetail" component={HomeworkDetailScreen} />
        <Stack.Screen name="Attendance" component={AttendanceScreen} />
        <Stack.Screen name="ResultDetail" component={ResultDetailScreen} />
        <Stack.Screen name="StudyMaterials" component={StudyMaterialsScreen} />
        <Stack.Screen name="NoticeDetail" component={NoticeDetailScreen} />
        <Stack.Screen name="AcademicCalendar" component={AcademicCalendarScreen} />
        <Stack.Screen name="Notifications" component={NotificationsScreen} />
        <Stack.Screen name="Search" component={SearchScreen} options={{ animation: 'fade' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
