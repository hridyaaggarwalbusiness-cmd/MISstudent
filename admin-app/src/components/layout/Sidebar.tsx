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
  FlaskConical,
  BarChart3,
  Megaphone,
  Sparkles,
  BookOpen,
  CalendarDays,
  Wallet,
  FileBarChart,
  Settings,
  History,
  Plus,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
  Bus,
  MapPin,
  Truck,
} from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import { useAuthStore } from '@/store/useAuthStore';
import { useUIStore } from '@/store/useUIStore';
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
      { to: '/fees', icon: Wallet, label: 'Fees' },
    ],
  },
  {
    label: 'Transport',
    links: [
      { to: '/buses', icon: Bus, label: 'Buses' },
      { to: '/bus-stops', icon: MapPin, label: 'Bus Stops' },
      { to: '/drivers', icon: Truck, label: 'Drivers' },
    ],
  },
  {
    label: 'Communication',
    links: [
      { to: '/notices', icon: Megaphone, label: 'Notices' },
      { to: '/notice-writer', icon: Sparkles, label: 'AI Notice Writer' },
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
  const collapsed = useUIStore((s) => s.sidebarCollapsed);
  const toggleSidebar = useUIStore((s) => s.toggleSidebar);
  const confirm = useConfirm();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  async function handleSignOut() {
    setMenuOpen(false);
    const ok = await confirm({ title: 'Sign out', message: 'Are you sure you want to sign out?', tone: 'primary', confirmLabel: 'Sign out' });
    if (ok) signOut();
  }

  return (
    <aside className={[styles.sidebar, collapsed && styles.sidebarCollapsed].filter(Boolean).join(' ')}>
      <div className={styles.brand}>
        <div className={styles.brandMark}>MS</div>
        {!collapsed && (
          <div className={styles.brandText}>
            <span className={styles.brandTitle}>MIS School</span>
            <span className={styles.brandSubtitle}>Admin Panel</span>
          </div>
        )}
      </div>
      <nav className={styles.nav}>
        {sections.map((section) => (
          <div key={section.label}>
            {!collapsed && <div className={styles.navSection}>{section.label}</div>}
            {section.links.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.to === '/'}
                title={collapsed ? link.label : undefined}
                className={({ isActive }) =>
                  [styles.navLink, isActive && styles.navLinkActive].filter(Boolean).join(' ')
                }
              >
                <span className={styles.navIcon}>
                  <link.icon size={18} />
                </span>
                {!collapsed && link.label}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>
      <button
        className={styles.collapseToggle}
        onClick={toggleSidebar}
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {collapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
        {!collapsed && <span>Collapse</span>}
      </button>
      <div className={styles.sidebarFooter}>
        <div
          className={styles.userChip}
          onClick={collapsed ? () => setMenuOpen((v) => !v) : undefined}
          style={collapsed ? { cursor: 'pointer', justifyContent: 'center' } : undefined}
        >
          <Avatar name={profile?.displayName ?? 'Admin'} size={36} />
          {!collapsed && (
            <div className={styles.userMeta}>
              <span className={styles.userName}>{profile?.displayName ?? 'Admin'}</span>
              <span className={styles.userRole}>Administrator</span>
            </div>
          )}
          {!collapsed && (
            <button className={styles.userMenuBtn} onClick={() => setMenuOpen((v) => !v)} aria-label="Account menu">
              <Plus size={14} />
            </button>
          )}
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
