import { useEffect, useMemo, useState } from 'react';
import { addMonths, eachDayOfInterval, endOfMonth, format, isAfter, isWeekend, startOfMonth, subMonths } from 'date-fns';
import { ChevronLeft, ChevronRight, CheckCircle2, XCircle, Clock3, AlertTriangle, ClipboardCheck } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { TextField } from '@/components/ui/FormField';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { StatStrip } from '@/components/ui/StatStrip';
import { SkeletonRows } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { IconButton } from '@/components/ui/IconButton';
import { PageHeader, pageHeaderStyles } from '@/pages/PageHeader';
import { useCollection } from '@/hooks/useCollection';
import { useAuthStore } from '@/store/useAuthStore';
import { repo } from '@/data/repositories';
import { getErrorMessage } from '@/utils/errors';
import type { AttendanceRecord, AttendanceStatus, CalendarEvent, SchoolClass, Student } from '@/types';
import styles from './AttendancePage.module.css';

const AT_RISK_THRESHOLD = 75;
const STATUS_OPTIONS: { key: AttendanceStatus; label: string }[] = [
  { key: 'present', label: 'P' },
  { key: 'late', label: 'L' },
  { key: 'absent', label: 'A' },
  { key: 'leave', label: 'Lv' },
];

// A school day nobody explicitly marked is assumed present (the same rule
// teacher-app applies when a row is left unchanged on save), so the
// denominator here is actual school days in the month, not just days that
// happen to have a record.
function schoolDaysInMonth(monthDate: Date, holidayDates: Set<string>): string[] {
  const start = startOfMonth(monthDate);
  const end = endOfMonth(monthDate);
  const today = new Date();
  return eachDayOfInterval({ start, end })
    .filter((d) => !isWeekend(d) && !isAfter(d, today))
    .map((d) => format(d, 'yyyy-MM-dd'))
    .filter((iso) => !holidayDates.has(iso));
}

export function AttendancePage() {
  const adminId = useAuthStore((s) => s.profile?.id);
  const { data: classes } = useCollection<SchoolClass>((cb) => repo.classes.subscribeAll(cb));
  const [classId, setClassId] = useState('');
  const [monthDate, setMonthDate] = useState(new Date());
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

  const schoolDays = useMemo(() => schoolDaysInMonth(monthDate, holidayDates), [monthDate, holidayDates]);

  const monthKey = format(monthDate, 'yyyy-MM');
  const monthRecords = useMemo(
    () => (records ?? []).filter((r) => r.date.startsWith(monthKey)),
    [records, monthKey],
  );

  const perStudent = useMemo(() => {
    return students
      .map((s) => {
        let present = 0;
        let absent = 0;
        let late = 0;
        let leave = 0;
        schoolDays.forEach((day) => {
          const record = monthRecords.find((r) => r.studentId === s.id && r.date === day);
          const status = record?.status ?? 'present';
          if (status === 'present') present++;
          else if (status === 'absent') absent++;
          else if (status === 'late') late++;
          else if (status === 'leave') leave++;
        });
        const total = schoolDays.length;
        const pct = total > 0 ? Math.round(((present + late) / total) * 1000) / 10 : 0;
        return { student: s, present, absent, late, leave, marked: total, pct };
      })
      .sort((a, b) => a.pct - b.pct);
  }, [students, schoolDays, monthRecords]);

  function openMarkModal() {
    const existing = (records ?? []).filter((r) => r.date === markDate);
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

  const loading = classId !== '' && records === null;

  return (
    <div>
      <PageHeader
        description="Attendance by class and month — admins can mark any class's attendance directly, alongside what class teachers record"
        toolbar={
          <>
            <select className={pageHeaderStyles.select} value={classId} onChange={(e) => setClassId(e.target.value)}>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} - {c.section}
                </option>
              ))}
            </select>
            <div className={styles.monthNav}>
              <IconButton icon={ChevronLeft} onClick={() => setMonthDate((d) => subMonths(d, 1))} aria-label="Previous month" />
              <span className={styles.monthLabel}>{format(monthDate, 'MMMM yyyy')}</span>
              <IconButton icon={ChevronRight} onClick={() => setMonthDate((d) => addMonths(d, 1))} aria-label="Next month" />
            </div>
            <Button icon={<ClipboardCheck size={16} />} onClick={openMarkModal} disabled={!classId || students.length === 0}>
              Mark Attendance
            </Button>
          </>
        }
      />

      {!classes.length ? (
        <Card>
          <EmptyState icon={<CheckCircle2 size={32} />} title="No classes yet" description="Create a class first to see its attendance." />
        </Card>
      ) : loading ? (
        <Card>
          <SkeletonRows count={6} />
        </Card>
      ) : (
        <>
          <StatStrip items={stats} />

          {students.length === 0 ? (
            <Card>
              <EmptyState icon={<CheckCircle2 size={32} />} title="No students in this class" />
            </Card>
          ) : schoolDays.length === 0 ? (
            <Card>
              <EmptyState icon={<CheckCircle2 size={32} />} title="No school days this month" description="Nothing to report for this month yet." />
            </Card>
          ) : (
            <Card padded={false}>
              {perStudent.map((p) => (
                <div key={p.student.id} className={styles.studentRow}>
                  <span className={styles.studentName}>{p.student.name}</span>
                  <span className={styles.rollNo}>Roll {p.student.rollNumber}</span>
                  <ProgressBar
                    value={p.pct}
                    color={p.pct < AT_RISK_THRESHOLD ? 'var(--color-danger)' : 'var(--color-success)'}
                  />
                  <span className={styles.pct}>{p.marked > 0 ? `${p.pct}%` : '—'}</span>
                  <span className={styles.breakdown}>
                    {p.present}P · {p.absent}A · {p.late}L · {p.leave}Lv
                  </span>
                </div>
              ))}
            </Card>
          )}
        </>
      )}

      <Modal
        open={markOpen}
        title={`Mark Attendance${classId ? ` · ${classes.find((c) => c.id === classId)?.name ?? ''}` : ''}`}
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
              const existing = (records ?? []).filter((r) => r.date === nextDate);
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
