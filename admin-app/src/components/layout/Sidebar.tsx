import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import type { ComponentType } from 'react';
import {
  LayoutDashboard,
  School,
  GraduationCap,
  Users,
  ShieldCheck,
  CalendarClock,
  CheckCircle2,
  NotebookPen,
  FlaskConical,
  BarChart3,
  Megaphone,
  BookOpen,
  CalendarDays,
  FileBarChart,
  Settings,
  History,
  Plus,
  LogOut,
} from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import { useAuthStore } from '@/store/useAuthStore';
import { useConfirm } from '@/components/ui/ConfirmDialog';
import styles from './AppLayout.module.css';

const sections: { label: string; links: { to: string; icon: ComponentType<{ size?: number }>; label: string }[] }[] = [
  {
    label: 'Overview',
    links: [{ to: '/', icon: LayoutDashboard, label: 'Dashboard' }],
  },
  {
    label: 'Academics',
    links: [
      { to: '/classes', icon: School, label: 'Classes' },
      { to: '/students', icon: Users, label: 'Students' },
      { to: '/teachers', icon: GraduationCap, label: 'Teachers' },
      { to: '/timetable', icon: CalendarClock, label: 'Timetable' },
      { to: '/attendance', icon: CheckCircle2, label: 'Attendance' },
      { to: '/exams', icon: FlaskConical, label: 'Exams' },
      { to: '/results', icon: BarChart3, label: 'Results' },
    ],
  },
  {
    label: 'Communication',
    links: [
      { to: '/homework', icon: NotebookPen, label: 'Homework' },
      { to: '/notices', icon: Megaphone, label: 'Notices' },
      { to: '/materials', icon: BookOpen, label: 'Study Materials' },
      { to: '/calendar', icon: CalendarDays, label: 'Academic Calendar' },
    ],
  },
  {
    label: 'Administration',
    links: [
      { to: '/admins', icon: ShieldCheck, label: 'Admins' },
      { to: '/reports', icon: FileBarChart, label: 'Reports' },
      { to: '/settings', icon: Settings, label: 'Settings' },
      { to: '/logs', icon: History, label: 'System Logs' },
    ],
  },
];

export function Sidebar() {
  const profile = useAuthStore((s) => s.profile);
  const signOut = useAuthStore((s) => s.signOut);
  const confirm = useConfirm();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  async function handleSignOut() {
    setMenuOpen(false);
    const ok = await confirm({ title: 'Sign out', message: 'Are you sure you want to sign out?', tone: 'primary', confirmLabel: 'Sign out' });
    if (ok) signOut();
  }

  return (
    <aside className={styles.sidebar}>
      <div className={styles.brand}>
        <div className={styles.brandMark}>MS</div>
        <div className={styles.brandText}>
          <span className={styles.brandTitle}>MIS School</span>
          <span className={styles.brandSubtitle}>Admin Panel</span>
        </div>
      </div>
      <nav className={styles.nav}>
        {sections.map((section) => (
          <div key={section.label}>
            <div className={styles.navSection}>{section.label}</div>
            {section.links.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.to === '/'}
                className={({ isActive }) =>
                  [styles.navLink, isActive && styles.navLinkActive].filter(Boolean).join(' ')
                }
              >
                <span className={styles.navIcon}>
                  <link.icon size={18} />
                </span>
                {link.label}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>
      <div className={styles.sidebarFooter}>
        <div className={styles.userChip}>
          <Avatar name={profile?.displayName ?? 'Admin'} size={36} />
          <div className={styles.userMeta}>
            <span className={styles.userName}>{profile?.displayName ?? 'Admin'}</span>
            <span className={styles.userRole}>Administrator</span>
          </div>
          <button className={styles.userMenuBtn} onClick={() => setMenuOpen((v) => !v)} aria-label="Account menu">
            <Plus size={14} />
          </button>
        </div>
        {menuOpen && (
          <>
            <div className={styles.menuOverlay} onClick={() => setMenuOpen(false)} />
            <div className={styles.userMenu}>
              <button
                className={styles.userMenuItem}
                onClick={() => {
                  setMenuOpen(false);
                  navigate('/settings');
                }}
              >
                <Settings size={15} /> Settings
              </button>
              <button className={[styles.userMenuItem, styles.userMenuDanger].join(' ')} onClick={handleSignOut}>
                <LogOut size={15} /> Sign out
              </button>
            </div>
          </>
        )}
      </div>
    </aside>
  );
}
