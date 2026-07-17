import { useEffect, useMemo, useState } from 'react';
import {
  addDays,
  addMonths,
  addWeeks,
  addYears,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isAfter,
  isWeekend,
  startOfMonth,
  startOfWeek,
  subDays,
  subMonths,
  subWeeks,
  subYears,
} from 'date-fns';
import { ChevronLeft, ChevronRight, CheckCircle2, XCircle, Clock3, AlertTriangle, ClipboardCheck } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { TextField } from '@/components/ui/FormField';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { StatStrip } from '@/components/ui/StatStrip';
import { SkeletonRows } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { IconButton } from '@/components/ui/IconButton';
import { PageHeader, pageHeaderStyles } from '@/pages/PageHeader';
import { useCollection } from '@/hooks/useCollection';
import { useQuickActionIntent } from '@/hooks/useQuickActionIntent';
import { useToast } from '@/components/ui/Toast';
import { useAuthStore } from '@/store/useAuthStore';
import { repo } from '@/data/repositories';
import { getErrorMessage } from '@/utils/errors';
import type { AttendanceRecord, AttendanceStatus, CalendarEvent, SchoolClass, Student } from '@/types';
import styles from './AttendancePage.module.css';

type ViewMode = 'day' | 'week' | 'month' | 'year';

const AT_RISK_THRESHOLD = 75;
const STATUS_OPTIONS: { key: AttendanceStatus; label: string }[] = [
  { key: 'present', label: 'P' },
  { key: 'late', label: 'L' },
  { key: 'absent', label: 'A' },
  { key: 'leave', label: 'Lv' },
];
const STATUS_META: Record<'present' | 'absent' | 'late' | 'leave', { label: string; fullLabel: string; color: string; tone: 'success' | 'danger' | 'warning' | 'info' }> = {
  present: { label: 'P', fullLabel: 'Present', color: 'var(--color-success)', tone: 'success' },
  late: { label: 'L', fullLabel: 'Late', color: 'var(--color-warning)', tone: 'warning' },
  absent: { label: 'A', fullLabel: 'Absent', color: 'var(--color-danger)', tone: 'danger' },
  leave: { label: 'Lv', fullLabel: 'On Leave', color: 'var(--color-info)', tone: 'info' },
};

// A school day nobody explicitly marked is assumed present (the same rule
// teacher-app applies when a row is left unchanged on save), so the
// denominator is actual school days, not just days that happen to have a
// record.
function schoolDaysInRange(start: Date, end: Date, holidayDates: Set<string>): string[] {
  const today = new Date();
  return eachDayOfInterval({ start, end })
    .filter((d) => !isWeekend(d) && !isAfter(d, today))
    .map((d) => format(d, 'yyyy-MM-dd'))
    .filter((iso) => !holidayDates.has(iso));
}

function schoolDaysInMonth(monthDate: Date, holidayDates: Set<string>): string[] {
  return schoolDaysInRange(startOfMonth(monthDate), endOfMonth(monthDate), holidayDates);
}

function statusFor(studentId: string, iso: string, records: AttendanceRecord[]): keyof typeof STATUS_META {
  const rec = records.find((r) => r.studentId === studentId && r.date === iso);
  return (rec?.status as keyof typeof STATUS_META) ?? 'present';
}

function rangeStats(studentId: string, days: string[], records: AttendanceRecord[]) {
  let present = 0;
  let absent = 0;
  let late = 0;
  let leave = 0;
  days.forEach((day) => {
    const status = statusFor(studentId, day, records);
    if (status === 'present') present++;
    else if (status === 'absent') absent++;
    else if (status === 'late') late++;
    else if (status === 'leave') leave++;
  });
  const total = days.length;
  const pct = total > 0 ? Math.round(((present + late) / total) * 1000) / 10 : 0;
  return { present, absent, late, leave, total, pct };
}

export function AttendancePage() {
  const adminId = useAuthStore((s) => s.profile?.id);
  const { show } = useToast();
  const { data: classes } = useCollection<SchoolClass>((cb) => repo.classes.subscribeAll(cb));
  const [classId, setClassId] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('month');
  const [dayDate, setDayDate] = useState(new Date());
  const [weekDate, setWeekDate] = useState(new Date());
  const [monthDate, setMonthDate] = useState(new Date());
  const [yearDate, setYearDate] = useState(new Date());
  const [records, setRecords] = useState<AttendanceRecord[] | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const { data: events } = useCollection<CalendarEvent>((cb) => repo.calendar.subscribeAll(cb));
  const [markOpen, setMarkOpen] = useState(false);
  const [markDate, setMarkDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [markStatuses, setMarkStatuses] = useState<Record<string, AttendanceStatus>>({});
  const [marking, setMarking] = useState(false);
  const [markError, setMarkError] = useState('');

  useEffect(() => {
    if (classes.length > 0 && !classId) setClassId(classes[0].id);
  }, [classes, classId]);

  useEffect(() => {
    if (!classId) return;
    setRecords(null);
    return repo.attendance.subscribeForClassMonth(classId, setRecords);
  }, [classId]);

  useEffect(() => {
    if (!classId) return;
    setStudents([]);
    return repo.students.subscribeForClass(classId, setStudents);
  }, [classId]);

  // Keep the Mark Attendance button's default date in sync with whatever
  // single day the admin is currently looking at in Day view.
  useEffect(() => {
    if (viewMode === 'day') setMarkDate(format(dayDate, 'yyyy-MM-dd'));
  }, [viewMode, dayDate]);

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

  const allRecords = records ?? [];

  // ---- Month view (unchanged from before) ----
  const schoolDays = useMemo(() => schoolDaysInMonth(monthDate, holidayDates), [monthDate, holidayDates]);
  const monthKey = format(monthDate, 'yyyy-MM');
  const monthRecords = useMemo(() => allRecords.filter((r) => r.date.startsWith(monthKey)), [allRecords, monthKey]);
  const perStudent = useMemo(() => {
    return students
      .map((s) => ({ student: s, ...rangeStats(s.id, schoolDays, monthRecords), marked: schoolDays.length }))
      .sort((a, b) => a.pct - b.pct);
  }, [students, schoolDays, monthRecords]);

  // ---- Day view ----
  const dayIso = format(dayDate, 'yyyy-MM-dd');
  const dayIsSchoolDay = !isWeekend(dayDate) && !holidayDates.has(dayIso) && !isAfter(dayDate, new Date());
  const dayRoster = useMemo(
    () => students.map((s) => ({ student: s, status: statusFor(s.id, dayIso, allRecords) })).sort((a, b) => a.student.name.localeCompare(b.student.name)),
    [students, dayIso, allRecords],
  );
  const dayCounts = useMemo(() => {
    const counts = { present: 0, absent: 0, late: 0, leave: 0 };
    dayRoster.forEach((r) => counts[r.status]++);
    return counts;
  }, [dayRoster]);

  // ---- Week view ----
  const weekStart = startOfWeek(weekDate, { weekStartsOn: 1 });
  const weekDays = useMemo(
    () => schoolDaysInRange(weekStart, endOfWeek(weekDate, { weekStartsOn: 1 }), holidayDates).slice(0, 6),
    [weekStart, weekDate, holidayDates],
  );
  const weekRows = useMemo(
    () =>
      students
        .map((s) => ({ student: s, days: weekDays.map((d) => statusFor(s.id, d, allRecords)), ...rangeStats(s.id, weekDays, allRecords) }))
        .sort((a, b) => a.student.name.localeCompare(b.student.name)),
    [students, weekDays, allRecords],
  );

  // ---- Year view ----
  const yearNum = yearDate.getFullYear();
  const yearMonths = useMemo(() => Array.from({ length: 12 }, (_, i) => new Date(yearNum, i, 1)), [yearNum]);
  const yearRows = useMemo(
    () =>
      students
        .map((s) => {
          const monthlyPct = yearMonths.map((m) => {
            if (isAfter(startOfMonth(m), new Date())) return null;
            const days = schoolDaysInMonth(m, holidayDates);
            if (days.length === 0) return null;
            return rangeStats(s.id, days, allRecords).pct;
          });
          const known = monthlyPct.filter((p): p is number => p !== null);
          const yearAvg = known.length > 0 ? Math.round((known.reduce((a, b) => a + b, 0) / known.length) * 10) / 10 : 0;
          return { student: s, monthlyPct, yearAvg };
        })
        .sort((a, b) => a.student.name.localeCompare(b.student.name)),
    [students, yearMonths, holidayDates, allRecords],
  );

  useQuickActionIntent(!!classId && students.length > 0, openMarkModal);

  function openMarkModal() {
    const existing = allRecords.filter((r) => r.date === markDate);
    const map: Record<string, AttendanceStatus> = {};
    existing.forEach((r) => {
      map[r.studentId] = r.status;
    });
    setMarkStatuses(map);
    setMarkError('');
    setMarkOpen(true);
  }

  function markAllPresent() {
    const map: Record<string, AttendanceStatus> = {};
    students.forEach((s) => {
      map[s.id] = 'present';
    });
    setMarkStatuses(map);
  }

  async function saveMarked() {
    if (!classId || !adminId) return;
    setMarking(true);
    setMarkError('');
    try {
      const rows = students.map((s) => ({ studentId: s.id, status: markStatuses[s.id] ?? 'present' }));
      await repo.attendance.markBulk(classId, markDate, rows, adminId);
      setMarkOpen(false);
      show('Attendance saved');
    } catch (e) {
      setMarkError(getErrorMessage(e));
    } finally {
      setMarking(false);
    }
  }

  const overallPct = useMemo(() => {
    if (perStudent.length === 0) return 0;
    const avg = perStudent.reduce((sum, p) => sum + p.pct, 0) / perStudent.length;
    return Math.round(avg * 10) / 10;
  }, [perStudent]);
  const absentCount = perStudent.reduce((sum, p) => sum + p.absent, 0);
  const atRiskCount = perStudent.filter((p) => p.marked > 0 && p.pct < AT_RISK_THRESHOLD).length;

  const stats = [
    { icon: <CheckCircle2 size={18} />, label: 'Overall Attendance', value: `${overallPct}%`, tone: 'primary' as const },
    { icon: <XCircle size={18} />, label: 'Absences This Month', value: absentCount, tone: 'danger' as const },
    { icon: <Clock3 size={18} />, label: 'School Days', value: schoolDays.length, tone: 'info' as const },
    {
      icon: <AlertTriangle size={18} />,
      label: `Below ${AT_RISK_THRESHOLD}%`,
      value: atRiskCount,
      tone: atRiskCount > 0 ? ('danger' as const) : ('success' as const),
    },
  ];

  const dayStats = [
    { icon: <CheckCircle2 size={18} />, label: 'Present', value: dayCounts.present, tone: 'success' as const },
    { icon: <XCircle size={18} />, label: 'Absent', value: dayCounts.absent, tone: 'danger' as const },
    { icon: <Clock3 size={18} />, label: 'Late', value: dayCounts.late, tone: 'warning' as const },
    { icon: <AlertTriangle size={18} />, label: 'On Leave', value: dayCounts.leave, tone: 'info' as const },
  ];

  const loading = classId !== '' && records === null;
  const className = classes.find((c) => c.id === classId)?.name ?? '';

  return (
    <div>
      <PageHeader
        title="Attendance"
        description="Attendance by class — view any day, week, month or year, and mark any class directly"
        toolbar={
          <>
            <select className={pageHeaderStyles.select} value={classId} onChange={(e) => setClassId(e.target.value)}>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} - {c.section}
                </option>
              ))}
            </select>
            <Button icon={<ClipboardCheck size={16} />} onClick={openMarkModal} disabled={!classId || students.length === 0}>
              Mark Attendance
            </Button>
          </>
        }
      />

      <div className={styles.viewTabs} role="tablist" aria-label="Attendance view">
        {(['day', 'week', 'month', 'year'] as ViewMode[]).map((v) => (
          <button
            key={v}
            role="tab"
            aria-selected={viewMode === v}
            className={[styles.viewTab, viewMode === v && styles.viewTabActive].filter(Boolean).join(' ')}
            onClick={() => setViewMode(v)}
          >
            {v[0].toUpperCase() + v.slice(1)}
          </button>
        ))}
        <div className={styles.viewNav}>
          {viewMode === 'day' && (
            <>
              <IconButton icon={ChevronLeft} onClick={() => setDayDate((d) => subDays(d, 1))} aria-label="Previous day" />
              <span className={styles.monthLabel}>{format(dayDate, 'EEE, d MMM yyyy')}</span>
              <IconButton icon={ChevronRight} onClick={() => setDayDate((d) => addDays(d, 1))} aria-label="Next day" />
            </>
          )}
          {viewMode === 'week' && (
            <>
              <IconButton icon={ChevronLeft} onClick={() => setWeekDate((d) => subWeeks(d, 1))} aria-label="Previous week" />
              <span className={styles.monthLabel}>
                {format(weekStart, 'd MMM')} – {format(addDays(weekStart, 5), 'd MMM yyyy')}
              </span>
              <IconButton icon={ChevronRight} onClick={() => setWeekDate((d) => addWeeks(d, 1))} aria-label="Next week" />
            </>
          )}
          {viewMode === 'month' && (
            <>
              <IconButton icon={ChevronLeft} onClick={() => setMonthDate((d) => subMonths(d, 1))} aria-label="Previous month" />
              <span className={styles.monthLabel}>{format(monthDate, 'MMMM yyyy')}</span>
              <IconButton icon={ChevronRight} onClick={() => setMonthDate((d) => addMonths(d, 1))} aria-label="Next month" />
            </>
          )}
          {viewMode === 'year' && (
            <>
              <IconButton icon={ChevronLeft} onClick={() => setYearDate((d) => subYears(d, 1))} aria-label="Previous year" />
              <span className={styles.monthLabel}>{yearNum}</span>
              <IconButton icon={ChevronRight} onClick={() => setYearDate((d) => addYears(d, 1))} aria-label="Next year" />
            </>
          )}
        </div>
      </div>

      {!classes.length ? (
        <Card>
          <EmptyState icon={<CheckCircle2 size={32} />} title="No classes yet" description="Create a class first to see its attendance." />
        </Card>
      ) : loading ? (
        <Card>
          <SkeletonRows count={6} />
        </Card>
      ) : students.length === 0 ? (
        <Card>
          <EmptyState icon={<CheckCircle2 size={32} />} title="No students in this class" />
        </Card>
      ) : viewMode === 'day' ? (
        <>
          <StatStrip items={dayStats} />
          {!dayIsSchoolDay ? (
            <Card>
              <EmptyState
                icon={<CheckCircle2 size={32} />}
                title={isAfter(dayDate, new Date()) ? "That's in the future" : 'No school this day'}
                description={isAfter(dayDate, new Date()) ? 'Pick a date that has already happened.' : 'Weekend or holiday — nothing to show.'}
              />
            </Card>
          ) : (
            <Card padded={false}>
              {dayRoster.map((r) => (
                <div key={r.student.id} className={styles.studentRow}>
                  <span className={styles.studentName}>{r.student.name}</span>
                  <span className={styles.rollNo}>Roll {r.student.rollNumber}</span>
                  <div className={styles.dayStatusWrap}>
                    <Badge label={STATUS_META[r.status].fullLabel} tone={STATUS_META[r.status].tone} />
                  </div>
                </div>
              ))}
            </Card>
          )}
        </>
      ) : viewMode === 'week' ? (
        weekDays.length === 0 ? (
          <Card>
            <EmptyState icon={<CheckCircle2 size={32} />} title="No school days this week" />
          </Card>
        ) : (
          <Card padded={false}>
            <div className={styles.weekGrid} style={{ gridTemplateColumns: `170px 70px repeat(${weekDays.length}, 1fr) 70px` }}>
              <div className={[styles.weekHeaderCell, styles.weekHeaderName].join(' ')}>Student</div>
              <div className={styles.weekHeaderCell}>Roll</div>
              {weekDays.map((d) => (
                <div key={d} className={styles.weekHeaderCell}>
                  {format(new Date(d), 'EEE d')}
                </div>
              ))}
              <div className={styles.weekHeaderCell}>Week %</div>
              {weekRows.map((row) => (
                <div key={row.student.id} className={styles.weekRowFragment}>
                  <div className={[styles.weekCell, styles.weekHeaderName].join(' ')}>{row.student.name}</div>
                  <div className={styles.weekCell}>{row.student.rollNumber}</div>
                  {row.days.map((status, i) => (
                    <div key={weekDays[i]} className={styles.weekCell}>
                      <span className={styles.statusChip} style={{ color: STATUS_META[status].color, borderColor: STATUS_META[status].color }}>
                        {STATUS_META[status].label}
                      </span>
                    </div>
                  ))}
                  <div className={[styles.weekCell, styles.weekPct].join(' ')}>{row.pct}%</div>
                </div>
              ))}
            </div>
          </Card>
        )
      ) : viewMode === 'month' ? (
        schoolDays.length === 0 ? (
          <>
            <StatStrip items={stats} />
            <Card>
              <EmptyState icon={<CheckCircle2 size={32} />} title="No school days this month" description="Nothing to report for this month yet." />
            </Card>
          </>
        ) : (
          <>
            <StatStrip items={stats} />
            <Card padded={false}>
              {perStudent.map((p) => (
                <div key={p.student.id} className={styles.studentRow}>
                  <span className={styles.studentName}>{p.student.name}</span>
                  <span className={styles.rollNo}>Roll {p.student.rollNumber}</span>
                  <ProgressBar value={p.pct} color={p.pct < AT_RISK_THRESHOLD ? 'var(--color-danger)' : 'var(--color-success)'} />
                  <span className={styles.pct}>{p.marked > 0 ? `${p.pct}%` : '—'}</span>
                  <span className={styles.breakdown}>
                    {p.present}P · {p.absent}A · {p.late}L · {p.leave}Lv
                  </span>
                </div>
              ))}
            </Card>
          </>
        )
      ) : (
        <Card padded={false}>
          <div className={styles.yearGrid}>
            <div className={[styles.yearHeaderCell, styles.weekHeaderName].join(' ')}>Student</div>
            {yearMonths.map((m) => (
              <div key={m.getMonth()} className={styles.yearHeaderCell}>
                {format(m, 'MMM')}
              </div>
            ))}
            <div className={styles.yearHeaderCell}>Year Avg</div>
            {yearRows.map((row) => (
              <div key={row.student.id} className={styles.yearRowFragment}>
                <div className={[styles.yearCell, styles.weekHeaderName].join(' ')}>{row.student.name}</div>
                {row.monthlyPct.map((pct, i) => (
                  <div key={i} className={styles.yearCell}>
                    {pct === null ? (
                      <span className={styles.yearDash}>—</span>
                    ) : (
                      <span className={pct < AT_RISK_THRESHOLD ? styles.yearPctLow : styles.yearPctOk}>{pct}%</span>
                    )}
                  </div>
                ))}
                <div className={[styles.yearCell, styles.weekPct].join(' ')}>{row.yearAvg}%</div>
              </div>
            ))}
          </div>
        </Card>
      )}

      <Modal
        open={markOpen}
        title={`Mark Attendance${className ? ` · ${className}` : ''}`}
        onClose={() => setMarkOpen(false)}
        width={560}
        footer={
          <>
            <Button variant="ghost" onClick={() => setMarkOpen(false)}>
              Cancel
            </Button>
            <Button onClick={saveMarked} loading={marking}>
              Save Attendance
            </Button>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {markError && <div style={{ color: 'var(--color-danger)', fontSize: 'var(--text-sm)' }}>{markError}</div>}
          <TextField
            label="Date"
            type="date"
            value={markDate}
            max={format(new Date(), 'yyyy-MM-dd')}
            onChange={(e) => {
              const nextDate = e.target.value;
              setMarkDate(nextDate);
              const existing = allRecords.filter((r) => r.date === nextDate);
              const map: Record<string, AttendanceStatus> = {};
              existing.forEach((r) => {
                map[r.studentId] = r.status;
              });
              setMarkStatuses(map);
            }}
          />
          <Button variant="outline" size="sm" onClick={markAllPresent}>
            Mark All Present
          </Button>
          <div className={styles.markList}>
            {students.map((s) => {
              const current = markStatuses[s.id] ?? 'present';
              return (
                <div key={s.id} className={styles.markRow}>
                  <div className={styles.markName}>
                    <span className={styles.studentName}>{s.name}</span>
                    <span className={styles.rollNo}>Roll {s.rollNumber}</span>
                  </div>
                  <div className={styles.markChips}>
                    {STATUS_OPTIONS.map((opt) => (
                      <button
                        key={opt.key}
                        type="button"
                        className={[styles.markChip, current === opt.key && styles.markChipActive].filter(Boolean).join(' ')}
                        onClick={() => setMarkStatuses((prev) => ({ ...prev, [s.id]: opt.key }))}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </Modal>
    </div>
  );
}
