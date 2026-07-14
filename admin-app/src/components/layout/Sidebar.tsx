import { NavLink } from 'react-router-dom';
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
} from 'lucide-react';
import styles from './AppLayout.module.css';

const sections: { label: string; links: { to: string; icon: ComponentType<{ size?: number }>; label: string }[] }[] = [
  {
    label: 'Overview',
    links: [{ to: '/', icon: LayoutDashboard, label: 'Dashboard' }],
  },
  {
    label: 'People',
    links: [
      { to: '/classes', icon: School, label: 'Classes' },
      { to: '/teachers', icon: GraduationCap, label: 'Teachers' },
      { to: '/students', icon: Users, label: 'Students' },
      { to: '/admins', icon: ShieldCheck, label: 'Admins' },
    ],
  },
  {
    label: 'Academics',
    links: [
      { to: '/timetable', icon: CalendarClock, label: 'Timetable' },
      { to: '/attendance', icon: CheckCircle2, label: 'Attendance' },
      { to: '/homework', icon: NotebookPen, label: 'Homework' },
      { to: '/exams', icon: FlaskConical, label: 'Exams' },
      { to: '/results', icon: BarChart3, label: 'Results' },
    ],
  },
  {
    label: 'Communication',
    links: [
      { to: '/notices', icon: Megaphone, label: 'Notices' },
      { to: '/materials', icon: BookOpen, label: 'Study Materials' },
      { to: '/calendar', icon: CalendarDays, label: 'Academic Calendar' },
    ],
  },
];

export function Sidebar() {
  return (
    <aside className={styles.sidebar}>
      <div className={styles.brand}>
        <div className={styles.brandMark}>MS</div>
        <div className={styles.brandText}>
          <span className={styles.brandTitle}>MIS-Student</span>
          <span className={styles.brandSubtitle}>Admin Console</span>
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
    </aside>
  );
}
