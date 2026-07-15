import React from 'react';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RootStackParamList } from './types';
import { MainTabs } from './MainTabs';
import { HomeworkCreateScreen } from '@screens/homework/HomeworkCreateScreen';
import { HomeworkDetailScreen } from '@screens/homework/HomeworkDetailScreen';
import { ResultsScreen } from '@screens/results/ResultsScreen';
import { ResultEntryScreen } from '@screens/results/ResultEntryScreen';
import { NoticesScreen } from '@screens/notices/NoticesScreen';
import { NoticeCreateScreen } from '@screens/notices/NoticeCreateScreen';
import { StudyMaterialsScreen } from '@screens/materials/StudyMaterialsScreen';
import { MaterialUploadScreen } from '@screens/materials/MaterialUploadScreen';
import { AcademicCalendarScreen } from '@screens/calendar/AcademicCalendarScreen';
import { SearchScreen } from '@screens/search/SearchScreen';
import { AttendanceReportScreen } from '@screens/attendance/AttendanceReportScreen';
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
        <Stack.Screen name="HomeworkCreate" component={HomeworkCreateScreen} />
        <Stack.Screen name="HomeworkDetail" component={HomeworkDetailScreen} />
        <Stack.Screen name="Results" component={ResultsScreen} />
        <Stack.Screen name="ResultEntry" component={ResultEntryScreen} />
        <Stack.Screen name="Notices" component={NoticesScreen} />
        <Stack.Screen name="NoticeCreate" component={NoticeCreateScreen} />
        <Stack.Screen name="StudyMaterials" component={StudyMaterialsScreen} />
        <Stack.Screen name="MaterialUpload" component={MaterialUploadScreen} />
        <Stack.Screen name="AcademicCalendar" component={AcademicCalendarScreen} />
        <Stack.Screen name="Search" component={SearchScreen} options={{ animation: 'fade' }} />
        <Stack.Screen name="AttendanceReport" component={AttendanceReportScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
