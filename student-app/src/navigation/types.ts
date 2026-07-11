import { NavigatorScreenParams } from '@react-navigation/native';

export type MainTabParamList = {
  HomeTab: undefined;
  TimetableTab: undefined;
  HomeworkTab: undefined;
  NoticesTab: undefined;
  ProfileTab: undefined;
};

export type RootStackParamList = {
  MainTabs: NavigatorScreenParams<MainTabParamList>;
  HomeworkDetail: { id: string };
  Attendance: undefined;
  Results: undefined;
  ResultDetail: { id: string };
  StudyMaterials: undefined;
  NoticeDetail: { id: string };
  AcademicCalendar: undefined;
  Notifications: undefined;
  Search: undefined;
};

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
