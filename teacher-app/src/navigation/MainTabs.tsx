import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MainTabParamList } from './types';
import { CustomTabBar } from './CustomTabBar';
import { DashboardScreen } from '@screens/dashboard/DashboardScreen';
import { TimetableScreen } from '@screens/timetable/TimetableScreen';
import { HomeworkListScreen } from '@screens/homework/HomeworkListScreen';
import { AttendanceScreen } from '@screens/attendance/AttendanceScreen';
import { ProfileScreen } from '@screens/profile/ProfileScreen';

const Tab = createBottomTabNavigator<MainTabParamList>();

export function MainTabs() {
  return (
    <Tab.Navigator screenOptions={{ headerShown: false }} tabBar={(props) => <CustomTabBar {...props} />}>
      <Tab.Screen name="HomeTab" component={DashboardScreen} />
      <Tab.Screen name="TimetableTab" component={TimetableScreen} />
      <Tab.Screen name="HomeworkTab" component={HomeworkListScreen} />
      <Tab.Screen name="AttendanceTab" component={AttendanceScreen} />
      <Tab.Screen name="ProfileTab" component={ProfileScreen} />
    </Tab.Navigator>
  );
}
