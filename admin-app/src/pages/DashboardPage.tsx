import { useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  eachDayOfInterval,
  format,
  isFuture,
  isToday,
  isWeekend,
  parseISO,
  subDays,
} from 'date-fns';
import {
  Users,
  GraduationCap,
  CheckCircle2,
  ClipboardList,
  Megaphone,
  CalendarDays,
  AlertTriangle,
  FlaskConical,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { StatStrip } from '@/components/ui/StatStrip';
import { SkeletonRows } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { AttendanceTrendChart } from '@/components/dashboard/AttendanceTrendChart';
import { useCollection } from '@/hooks/useCollection';
import { useAuthStore } from '@/store/useAuthStore';
import { repo } from '@/data/repositories';
import type {
  Teacher,
  Student,
  Notice,
  CalendarEvent,
  AttendanceRecord,
  Exam,
} from '@/types';
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

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

function createdWithinDays(iso: string | undefined, days: number): boolean {
  if (!iso) return false;
  const then = new Date(iso).getTime();
  return Date.now() - then <= days * 24 * 60 * 60 * 1000;
}

export function DashboardPage() {
  const navigate = useNavigate();
  const profile = useAuthStore((s) => s.profile);
  const tasksRef = useRef<HTMLDivElement>(null);

  const { data: teachers } = useCollection<Teacher>((cb) => repo.teachers.subscribeAll(cb));
  const { data: students } = useCollection<Student>((cb) => repo.students.subscribeAll(cb));
  const { data: notices, loading: noticesLoading } = useCollection<Notice>((cb) => repo.notices.subscribeAll(cb));
  const { data: events, loading: eventsLoading } = useCollection<CalendarEvent>((cb) => repo.calendar.subscribeAll(cb));
  const { data: attendance } = useCollection<AttendanceRecord>((cb) => repo.attendance.subscribeAll(cb));
  const { data: exams } = useCollection<Exam>((cb) => repo.exams.subscribeAll(cb));

  const holidayDates = useMemo(() => {
    const set = new Set<string>();
    events
      .filter((e) => e.type === 'holiday')
      .forEach((e) => {
        eachDayOfInterval({ start: new Date(e.date), end: new Date(e.endDate || e.date) }).forEach((d) =>
          set.add(format(d, 'yyyy-MM-dd')),
        );
      });
    return set;
  }, [events]);

  const isSchoolDay = (d: Date) => !isWeekend(d) && !holidayDates.has(format(d, 'yyyy-MM-dd'));

  function pctFor(day: Date): number | null {
    if (students.length === 0) return null;
    const iso = format(day, 'yyyy-MM-dd');
    let present = 0;
    students.forEach((s) => {
      const rec = attendance.find((r) => r.studentId === s.id && r.date === iso);
      const status = rec?.status ?? 'present';
      if (status === 'present' || status === 'late') present++;
    });
    return Math.round((present / students.length) * 1000) / 10;
  }

  const todayIsSchoolDay = isSchoolDay(new Date());
  const todayPct = todayIsSchoolDay ? pctFor(new Date()) : null;
  const previousSchoolDayPct = useMemo(() => {
    let cursor = subDays(new Date(), 1);
    for (let i = 0; i < 14; i++) {
      if (isSchoolDay(cursor)) return pctFor(cursor);
      cursor = subDays(cursor, 1);
    }
    return null;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [students, attendance, holidayDates]);

  const attendanceDelta =
    todayPct !== null && previousSchoolDayPct !== null ? Math.round((todayPct - previousSchoolDayPct) * 10) / 10 : null;

  const newStudentsThisWeek = students.filter((s) => createdWithinDays(s.createdAt, 7)).length;
  const newTeachersThisWeek = teachers.filter((t) => createdWithinDays(t.createdAt, 7)).length;

  const atRiskStudents = useMemo(() => {
    if (students.length === 0) return 0;
    const last30 = eachDayOfInterval({ start: subDays(new Date(), 30), end: new Date() }).filter(isSchoolDay);
    if (last30.length === 0) return 0;
    return students.filter((s) => {
      const present = last30.filter((d) => {
        const rec = attendance.find((r) => r.studentId === s.id && r.date === format(d, 'yyyy-MM-dd'));
        const status = rec?.status ?? 'present';
        return status === 'present' || status === 'late';
      }).length;
      return (present / last30.length) * 100 < 75;
    }).length;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [students, attendance, holidayDates]);

  const upcomingExamsCount = useMemo(
    () =>
      exams.filter((e) => {
        try {
          const days = (parseISO(e.date).getTime() - Date.now()) / (24 * 60 * 60 * 1000);
          return days >= 0 && days <= 7;
        } catch {
          return false;
        }
      }).length,
    [exams],
  );

  const pendingTasksCount = atRiskStudents + upcomingExamsCount;

  const upcomingEvents = useMemo(
    () =>
      events
        .filter((e) => {
          try {
            return isFuture(parseISO(e.date)) || isToday(parseISO(e.date));
          } catch {
            return false;
          }
        })
        .slice(0, 4),
    [events],
  );

  const recentNotices = useMemo(() => notices.slice(0, 5), [notices]);

  const stats = [
    {
      icon: <Users size={20} />,
      label: 'Total Students',
      value: students.length,
      tone: 'primary' as const,
      delta: newStudentsThisWeek > 0 ? { value: `${newStudentsThisWeek} this week`, direction: 'up' as const } : undefined,
      onClick: () => navigate('/students'),
    },
    {
      icon: <GraduationCap size={20} />,
      label: 'Total Teachers',
      value: teachers.length,
      tone: 'warning' as const,
      delta: newTeachersThisWeek > 0 ? { value: `${newTeachersThisWeek} this week`, direction: 'up' as const } : undefined,
      onClick: () => navigate('/teachers'),
    },
    {
      icon: <CheckCircle2 size={20} />,
      label: 'Attendance Today',
      value: todayPct !== null ? `${todayPct}%` : 'No school',
      tone: 'success' as const,
      delta:
        attendanceDelta !== null
          ? { value: `${Math.abs(attendanceDelta)}% vs last day`, direction: attendanceDelta >= 0 ? ('up' as const) : ('down' as const) }
          : undefined,
      onClick: () => navigate('/attendance'),
    },
    {
      icon: <ClipboardList size={20} />,
      label: 'Pending Tasks',
      value: pendingTasksCount,
      tone: 'danger' as const,
      onClick: () => tasksRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }),
    },
  ];

  const tasks = [
    atRiskStudents > 0 && {
      key: 'attendance',
      icon: <AlertTriangle size={16} />,
      label: `${atRiskStudents} student${atRiskStudents === 1 ? '' : 's'} below 75% attendance`,
      badge: 'Attendance',
      onClick: () => navigate('/reports'),
    },
    upcomingExamsCount > 0 && {
      key: 'exams',
      icon: <FlaskConical size={16} />,
      label: `${upcomingExamsCount} exam${upcomingExamsCount === 1 ? '' : 's'} scheduled in the next 7 days`,
      badge: 'Exams',
      onClick: () => navigate('/exams'),
    },
  ].filter(Boolean) as { key: string; icon: React.ReactNode; label: string; badge: string; onClick: () => void }[];

  const loading = noticesLoading || eventsLoading;

  return (
    <div>
      <div className={styles.greeting}>
        <h1 className={styles.greetingTitle}>
          {greeting()}, {profile?.displayName?.split(' ')[0] ?? 'Admin'}! 👋
        </h1>
        <p className={styles.greetingSubtitle}>Here's what's happening in your school today.</p>
      </div>

      <StatStrip items={stats} />

      <div className={styles.sectionsGrid}>
        <div className={styles.stack}>
          <Card>
            <AttendanceTrendChart students={students} records={attendance} holidays={holidayDates} />
          </Card>

          <Card>
            <div className={styles.sectionHeader}>
              <span className={styles.sectionTitle}>Recent Notices</span>
              <span className={styles.viewAll} onClick={() => navigate('/notices')}>
                View all
              </span>
            </div>
            {noticesLoading ? (
              <SkeletonRows count={4} />
            ) : recentNotices.length === 0 ? (
              <EmptyState icon={<Megaphone size={32} />} title="No notices yet" description="Announcements posted by admins will appear here." compact />
            ) : (
              recentNotices.map((n) => (
                <div className={styles.listItem} key={n.id} onClick={() => navigate('/notices')} role="button">
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

        <div className={styles.stack}>
          <Card>
            <div className={styles.sectionHeader}>
              <span className={styles.sectionTitle}>Upcoming Events</span>
            </div>
            {eventsLoading ? (
              <SkeletonRows count={5} />
            ) : upcomingEvents.length === 0 ? (
              <EmptyState icon={<CalendarDays size={32} />} title="No upcoming events" description="Academic calendar events will appear here." compact />
            ) : (
              upcomingEvents.map((ev) => (
                <div className={styles.listItem} key={ev.id} onClick={() => navigate('/calendar')} role="button">
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

          <Card>
            <div className={styles.sectionHeader} ref={tasksRef}>
              <span className={styles.sectionTitle}>Today's Tasks</span>
              <span className={styles.viewAll} onClick={() => navigate('/reports')}>
                View all tasks
              </span>
            </div>
            {loading ? (
              <SkeletonRows count={3} />
            ) : tasks.length === 0 ? (
              <EmptyState icon={<ClipboardList size={28} />} title="All caught up" description="No pending tasks right now." compact />
            ) : (
              tasks.map((t) => (
                <div className={styles.listItem} key={t.key} onClick={t.onClick} role="button">
                  <div className={styles.taskLeft}>
                    <span className={styles.taskIcon}>{t.icon}</span>
                    <span className={styles.listItemTitle}>{t.label}</span>
                  </div>
                  <Badge label={t.badge} tone="warning" />
                </div>
              ))
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
