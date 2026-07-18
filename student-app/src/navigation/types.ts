import { NavigatorScreenParams } from '@react-navigation/native';
import { GeneratedPaper } from '@/types';

export type MainTabParamList = {
  HomeTab: undefined;
  TimetableTab: undefined;
  HomeworkTab: undefined;
  NoticesTab: undefined;
  ProfileTab: undefined;
  ResultsTab: undefined;
};

export type RootStackParamList = {
  MainTabs: NavigatorScreenParams<MainTabParamList>;
  HomeworkDetail: { id: string };
  Attendance: undefined;
  ResultDetail: { id: string };
  StudyMaterials: undefined;
  NoticeDetail: { id: string };
  AcademicCalendar: undefined;
  Notifications: undefined;
  Search: undefined;
  FeeReceipts: undefined;
  PracticeTestGenerator: undefined;
  PracticeTestResult: { paper: GeneratedPaper };
};

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
