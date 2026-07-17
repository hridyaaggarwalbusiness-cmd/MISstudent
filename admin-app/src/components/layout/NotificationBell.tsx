import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow, parseISO, isFuture } from 'date-fns';
import { Bell, History, CalendarDays } from 'lucide-react';
import { useCollection } from '@/hooks/useCollection';
import { repo } from '@/data/repositories';
import type { AuditLog, CalendarEvent } from '@/types';
import styles from './AppLayout.module.css';

const SEEN_KEY = 'mis-admin:notifications-seen-at';

export function NotificationBell() {
  const navigate = useNavigate();
  const { data: logs } = useCollection<AuditLog>((cb) => repo.auditLogs.subscribeRecent(cb, 10));
  const { data: events } = useCollection<CalendarEvent>((cb) => repo.calendar.subscribeAll(cb));
  const [open, setOpen] = useState(false);
  const [seenAt, setSeenAt] = useState(() => Number(localStorage.getItem(SEEN_KEY) ?? 0));

  const upcoming = useMemo(
    () =>
      events
        .filter((e) => {
          try {
            return isFuture(parseISO(e.date));
          } catch {
            return false;
          }
        })
        .slice(0, 3),
    [events],
  );

  const unreadCount = useMemo(
    () => logs.filter((l) => new Date(l.at).getTime() > seenAt).length,
    [logs, seenAt],
  );

  function toggle() {
    const next = !open;
    setOpen(next);
    if (next) {
      const now = Date.now();
      localStorage.setItem(SEEN_KEY, String(now));
      setTimeout(() => setSeenAt(now), 300);
    }
  }

  return (
    <div className={styles.bellWrap}>
      <button className={styles.bellButton} onClick={toggle} aria-label="Notifications">
        <Bell size={18} />
        {unreadCount > 0 && <span className={styles.bellDot} />}
      </button>
      {open && (
        <>
          <div className={styles.searchOverlay} onClick={() => setOpen(false)} />
          <div className={styles.bellDropdown}>
            <div className={styles.bellSection}>
              <span className={styles.bellSectionTitle}>Recent Activity</span>
              {logs.length === 0 ? (
                <div className={styles.bellEmpty}>Nothing yet</div>
              ) : (
                logs.slice(0, 5).map((l) => (
                  <button
                    key={l.id}
                    className={styles.bellRow}
                    onClick={() => {
                      setOpen(false);
                      navigate('/logs');
                    }}
                  >
                    <History size={14} className={styles.bellRowIcon} />
                    <span className={styles.bellRowBody}>
                      <span className={styles.bellRowTitle}>{l.summary}</span>
                      <span className={styles.bellRowTime}>
                        {(() => {
                          try {
                            return formatDistanceToNow(parseISO(l.at), { addSuffix: true });
                          } catch {
                            return '';
                          }
                        })()}
                      </span>
                    </span>
                  </button>
                ))
              )}
            </div>
            <div className={styles.bellSection}>
              <span className={styles.bellSectionTitle}>Upcoming Events</span>
              {upcoming.length === 0 ? (
                <div className={styles.bellEmpty}>No upcoming events</div>
              ) : (
                upcoming.map((e) => (
                  <button
                    key={e.id}
                    className={styles.bellRow}
                    onClick={() => {
                      setOpen(false);
                      navigate('/calendar');
                    }}
                  >
                    <CalendarDays size={14} className={styles.bellRowIcon} />
                    <span className={styles.bellRowBody}>
                      <span className={styles.bellRowTitle}>{e.title}</span>
                      <span className={styles.bellRowTime}>{e.date}</span>
                    </span>
                  </button>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
