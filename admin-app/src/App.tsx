import { useEffect } from 'react';
import type { ReactElement } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from '@/store/useAuthStore';
import { AppLayout } from '@/components/layout/AppLayout';
import { ToastProvider } from '@/components/ui/Toast';
import { ConfirmProvider } from '@/components/ui/ConfirmDialog';
import { LoginPage } from '@/pages/LoginPage';
import { DashboardPage } from '@/pages/DashboardPage';
import { ClassesPage } from '@/pages/ClassesPage';
import { TeachersPage } from '@/pages/TeachersPage';
import { StudentsPage } from '@/pages/StudentsPage';
import { AdminsPage } from '@/pages/AdminsPage';
import { TimetablePage } from '@/pages/TimetablePage';
import { AttendancePage } from '@/pages/AttendancePage';
import { ExamsPage } from '@/pages/ExamsPage';
import { ResultsPage } from '@/pages/ResultsPage';
import { NoticesPage } from '@/pages/NoticesPage';
import { MaterialsPage } from '@/pages/MaterialsPage';
import { CalendarPage } from '@/pages/CalendarPage';
import { FeesPage } from '@/pages/FeesPage';
import { StudentFeeDetailPage } from '@/pages/StudentFeeDetailPage';
import { ReportsPage } from '@/pages/ReportsPage';
import { SettingsPage } from '@/pages/SettingsPage';
import { SystemLogsPage } from '@/pages/SystemLogsPage';
import styles from './App.module.css';

const routeTitles: { path: string; title: string; element: ReactElement }[] = [
  { path: '/', title: 'Dashboard', element: <DashboardPage /> },
  { path: '/classes', title: 'Classes', element: <ClassesPage /> },
  { path: '/teachers', title: 'Teachers', element: <TeachersPage /> },
  { path: '/students', title: 'Students', element: <StudentsPage /> },
  { path: '/admins', title: 'Admins', element: <AdminsPage /> },
  { path: '/timetable', title: 'Timetable', element: <TimetablePage /> },
  { path: '/attendance', title: 'Attendance', element: <AttendancePage /> },
  { path: '/exams', title: 'Exams', element: <ExamsPage /> },
  { path: '/results', title: 'Results', element: <ResultsPage /> },
  { path: '/notices', title: 'Notices', element: <NoticesPage /> },
  { path: '/materials', title: 'Study Materials', element: <MaterialsPage /> },
  { path: '/calendar', title: 'Academic Calendar', element: <CalendarPage /> },
  { path: '/fees', title: 'Fees', element: <FeesPage /> },
  { path: '/fees/:studentId', title: 'Student Fee Details', element: <StudentFeeDetailPage /> },
  { path: '/reports', title: 'Reports', element: <ReportsPage /> },
  { path: '/settings', title: 'Settings', element: <SettingsPage /> },
  { path: '/logs', title: 'System Logs', element: <SystemLogsPage /> },
];

function App() {
  const { user, profile, initializing, init } = useAuthStore();

  useEffect(() => {
    init();
  }, [init]);

  if (initializing) {
    return (
      <div className={styles.loadingScreen}>
        <div className={styles.loadingMark}>MS</div>
      </div>
    );
  }

  if (!user || !profile) {
    return <LoginPage />;
  }

  return (
    <ToastProvider>
      <ConfirmProvider>
        <BrowserRouter>
          <Routes>
            {routeTitles.map(({ path, title, element }) => (
              <Route key={path} path={path} element={<AppLayout title={title}>{element}</AppLayout>} />
            ))}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </ConfirmProvider>
    </ToastProvider>
  );
}

export default App;
