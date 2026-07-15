import React, { useState } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MainTabParamList } from './types';
import { CustomTabBar } from './CustomTabBar';
import { DashboardScreen } from '@screens/dashboard/DashboardScreen';
import { ClassesScreen } from '@screens/classes/ClassesScreen';
import { ActivityScreen } from '@screens/activity/ActivityScreen';
import { ProfileScreen } from '@screens/profile/ProfileScreen';
import { HomeworkListScreen } from '@screens/homework/HomeworkListScreen';
import { AttendanceScreen } from '@screens/attendance/AttendanceScreen';
import { QuickActionSheet } from '@components/dashboard/QuickActionSheet';

const Tab = createBottomTabNavigator<MainTabParamList>();

export function MainTabs() {
  const [sheetVisible, setSheetVisible] = useState(false);

  return (
    <>
      <Tab.Navigator
        screenOptions={{ headerShown: false }}
        tabBar={(props) => <CustomTabBar {...props} onCreatePress={() => setSheetVisible(true)} />}
      >
        <Tab.Screen name="HomeTab" component={DashboardScreen} />
        <Tab.Screen name="ClassesTab" component={ClassesScreen} />
        <Tab.Screen name="ActivityTab" component={ActivityScreen} />
        <Tab.Screen name="ProfileTab" component={ProfileScreen} />
        <Tab.Screen name="HomeworkTab" component={HomeworkListScreen} />
        <Tab.Screen name="AttendanceTab" component={AttendanceScreen} />
      </Tab.Navigator>
      <QuickActionSheet visible={sheetVisible} onClose={() => setSheetVisible(false)} />
    </>
  );
}
