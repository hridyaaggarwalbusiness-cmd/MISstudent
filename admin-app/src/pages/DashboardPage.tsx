import { useMemo } from 'react';
import { format, isFuture, parseISO } from 'date-fns';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { SkeletonRows } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { useCollection } from '@/hooks/useCollection';
import { repo } from '@/data/repositories';
import type { SchoolClass, Teacher, Student, Homework, Notice, CalendarEvent } from '@/types';
import styles from './DashboardPage.module.css';

const eventToneMap: Record<string, 'info' | 'warning' | 'danger' | 'violet' | 'success' | 'neutral'> = {
  holiday: 'success',
  exam: 'danger',
  function: 'violet',
  sports: 'info',
  meeting: 'neutral',
  competition: 'warning',
  other: 'neutral',
};

export function DashboardPage() {
  const { data: classes } = useCollection<SchoolClass>((cb) => repo.classes.subscribeAll(cb));
  const { data: teachers } = useCollection<Teacher>((cb) => repo.teachers.subscribeAll(cb));
  const { data: students } = useCollection<Student>((cb) => repo.students.subscribeAll(cb));
  const { data: homework, loading: homeworkLoading } = useCollection<Homework>((cb) =>
    repo.homework.subscribeAll(cb),
  );
  const { data: notices, loading: noticesLoading } = useCollection<Notice>((cb) =>
    repo.notices.subscribeAll(cb),
  );
  const { data: events, loading: eventsLoading } = useCollection<CalendarEvent>((cb) =>
    repo.calendar.subscribeAll(cb),
  );

  const upcomingEvents = useMemo(
    () =>
      events
        .filter((e) => {
          try {
            return isFuture(parseISO(e.date));
          } catch {
            return false;
          }
        })
        .slice(0, 6),
    [events],
  );

  const recentHomework = useMemo(() => homework.slice(0, 6), [homework]);
  const recentNotices = useMemo(() => notices.slice(0, 5), [notices]);

  const stats = [
    { icon: '🏫', label: 'Classes', value: classes.length, bg: 'var(--color-primary-soft)' },
    { icon: '🧑‍🏫', label: 'Teachers', value: teachers.length, bg: 'var(--color-info-bg)' },
    { icon: '🎓', label: 'Students', value: students.length, bg: 'var(--color-success-bg)' },
    { icon: '📝', label: 'Homework Posted', value: homework.length, bg: 'var(--color-warning-bg)' },
  ];

  return (
    <div>
      <div className={styles.grid}>
        {stats.map((s) => (
          <Card key={s.label} className={styles.statCard}>
            <div className={styles.statIcon} style={{ background: s.bg }}>
              {s.icon}
            </div>
            <div className={styles.statMeta}>
              <span className={styles.statValue}>{s.value}</span>
              <span className={styles.statLabel}>{s.label}</span>
            </div>
          </Card>
        ))}
      </div>

      <div className={styles.sectionsGrid}>
        <div className={styles.stack}>
          <Card>
            <div className={styles.sectionHeader}>
              <span className={styles.sectionTitle}>Recent Homework</span>
              <Badge label={`${homework.length} total`} tone="primary" />
            </div>
            {homeworkLoading ? (
              <SkeletonRows count={4} />
            ) : recentHomework.length === 0 ? (
              <EmptyState icon="📝" title="No homework yet" description="Homework posted by teachers will appear here." />
            ) : (
              recentHomework.map((hw) => (
                <div className={styles.listItem} key={hw.id}>
                  <div>
                    <div className={styles.listItemTitle}>{hw.title}</div>
                    <div className={styles.listItemMeta}>
                      {hw.subject} · {hw.classId} · by {hw.teacherName}
                    </div>
                  </div>
                  <Badge label={`Due ${hw.dueDate}`} tone="warning" />
                </div>
              ))
            )}
          </Card>

          <Card>
            <div className={styles.sectionHeader}>
              <span className={styles.sectionTitle}>Recent Notices</span>
              <Badge label={`${notices.length} total`} tone="info" />
            </div>
            {noticesLoading ? (
              <SkeletonRows count={4} />
            ) : recentNotices.length === 0 ? (
              <EmptyState icon="📢" title="No notices yet" description="Announcements posted by admins will appear here." />
            ) : (
              recentNotices.map((n) => (
                <div className={styles.listItem} key={n.id}>
                  <div>
                    <div className={styles.listItemTitle}>{n.title}</div>
                    <div className={styles.listItemMeta}>{n.postedByName}</div>
                  </div>
                  <Badge label={n.category} tone="violet" />
                </div>
              ))
            )}
          </Card>
        </div>

        <Card>
          <div className={styles.sectionHeader}>
            <span className={styles.sectionTitle}>Upcoming Events</span>
          </div>
          {eventsLoading ? (
            <SkeletonRows count={5} />
          ) : upcomingEvents.length === 0 ? (
            <EmptyState icon="📅" title="No upcoming events" description="Academic calendar events will appear here." />
          ) : (
            upcomingEvents.map((ev) => (
              <div className={styles.listItem} key={ev.id}>
                <div>
                  <div className={styles.listItemTitle}>{ev.title}</div>
                  <div className={styles.listItemMeta}>
                    {(() => {
                      try {
                        return format(parseISO(ev.date), 'EEE, d MMM yyyy');
                      } catch {
                        return ev.date;
                      }
                    })()}
                  </div>
                </div>
                <Badge label={ev.type} tone={eventToneMap[ev.type] ?? 'neutral'} />
              </div>
            ))
          )}
        </Card>
      </div>
    </div>
  );
}
