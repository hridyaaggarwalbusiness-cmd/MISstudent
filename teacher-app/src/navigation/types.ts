import { NavigatorScreenParams } from '@react-navigation/native';

export type MainTabParamList = {
  HomeTab: undefined;
  ClassesTab: undefined;
  ActivityTab: undefined;
  ProfileTab: undefined;
  HomeworkTab: undefined;
  AttendanceTab: undefined;
};

export type RootStackParamList = {
  MainTabs: NavigatorScreenParams<MainTabParamList>;
  HomeworkCreate: undefined;
  HomeworkDetail: { id: string };
  Results: undefined;
  ResultEntry: { examId?: string };
  Notices: undefined;
  NoticeCreate: undefined;
  StudyMaterials: undefined;
  MaterialUpload: undefined;
  AcademicCalendar: undefined;
  Search: undefined;
};

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
