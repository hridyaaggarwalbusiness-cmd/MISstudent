import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MainTabParamList } from './types';
import { CustomTabBar } from './CustomTabBar';
import { HomeScreen } from '@screens/home/HomeScreen';
import { TimetableScreen } from '@screens/timetable/TimetableScreen';
import { HomeworkListScreen } from '@screens/homework/HomeworkListScreen';
import { NoticesScreen } from '@screens/notices/NoticesScreen';
import { ProfileScreen } from '@screens/profile/ProfileScreen';
import { ResultsScreen } from '@screens/results/ResultsScreen';

const Tab = createBottomTabNavigator<MainTabParamList>();

export function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{ headerShown: false }}
      tabBar={(props) => <CustomTabBar {...props} />}
    >
      <Tab.Screen name="HomeTab" component={HomeScreen} />
      <Tab.Screen name="TimetableTab" component={TimetableScreen} />
      <Tab.Screen name="HomeworkTab" component={HomeworkListScreen} />
      <Tab.Screen name="NoticesTab" component={NoticesScreen} />
      <Tab.Screen name="ProfileTab" component={ProfileScreen} />
      <Tab.Screen name="ResultsTab" component={ResultsScreen} />
    </Tab.Navigator>
  );
}
