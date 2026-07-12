import { NavLink } from 'react-router-dom';
import styles from './AppLayout.module.css';

const sections: { label: string; links: { to: string; icon: string; label: string }[] }[] = [
  {
    label: 'Overview',
    links: [{ to: '/', icon: '🏠', label: 'Dashboard' }],
  },
  {
    label: 'People',
    links: [
      { to: '/classes', icon: '🏫', label: 'Classes' },
      { to: '/teachers', icon: '🧑‍🏫', label: 'Teachers' },
      { to: '/students', icon: '🎓', label: 'Students' },
      { to: '/admins', icon: '🛡️', label: 'Admins' },
    ],
  },
  {
    label: 'Academics',
    links: [
      { to: '/timetable', icon: '🗓️', label: 'Timetable' },
      { to: '/homework', icon: '📝', label: 'Homework' },
      { to: '/exams', icon: '🧪', label: 'Exams' },
      { to: '/results', icon: '📊', label: 'Results' },
    ],
  },
  {
    label: 'Communication',
    links: [
      { to: '/notices', icon: '📢', label: 'Notices' },
      { to: '/materials', icon: '📚', label: 'Study Materials' },
      { to: '/calendar', icon: '📅', label: 'Academic Calendar' },
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
                <span className={styles.navIcon}>{link.icon}</span>
                {link.label}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>
    </aside>
  );
}
