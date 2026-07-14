import { useEffect, useMemo, useState } from 'react';
import { addMonths, format, subMonths } from 'date-fns';
import { ChevronLeft, ChevronRight, CheckCircle2, XCircle, Clock3, AlertTriangle } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { StatStrip } from '@/components/ui/StatStrip';
import { SkeletonRows } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { IconButton } from '@/components/ui/IconButton';
import { PageHeader, pageHeaderStyles } from '@/pages/PageHeader';
import { useCollection } from '@/hooks/useCollection';
import { repo } from '@/data/repositories';
import type { AttendanceRecord, SchoolClass, Student } from '@/types';
import styles from './AttendancePage.module.css';

const AT_RISK_THRESHOLD = 75;

export function AttendancePage() {
  const { data: classes } = useCollection<SchoolClass>((cb) => repo.classes.subscribeAll(cb));
  const [classId, setClassId] = useState('');
  const [monthDate, setMonthDate] = useState(new Date());
  const [records, setRecords] = useState<AttendanceRecord[] | null>(null);
  const [students, setStudents] = useState<Student[]>([]);

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

  const monthKey = format(monthDate, 'yyyy-MM');
  const monthRecords = useMemo(
    () => (records ?? []).filter((r) => r.date.startsWith(monthKey)),
    [records, monthKey],
  );

  const perStudent = useMemo(() => {
    return students
      .map((s) => {
        const rows = monthRecords.filter((r) => r.studentId === s.id);
        const present = rows.filter((r) => r.status === 'present').length;
        const absent = rows.filter((r) => r.status === 'absent').length;
        const late = rows.filter((r) => r.status === 'late').length;
        const leave = rows.filter((r) => r.status === 'leave').length;
        const marked = present + absent + late + leave;
        const pct = marked > 0 ? Math.round(((present + late) / marked) * 1000) / 10 : 0;
        return { student: s, present, absent, late, leave, marked, pct };
      })
      .sort((a, b) => a.pct - b.pct);
  }, [students, monthRecords]);

  const totalMarked = monthRecords.length;
  const totalPresent = monthRecords.filter((r) => r.status === 'present' || r.status === 'late').length;
  const overallPct = totalMarked > 0 ? Math.round((totalPresent / totalMarked) * 1000) / 10 : 0;
  const absentCount = monthRecords.filter((r) => r.status === 'absent').length;
  const atRiskCount = perStudent.filter((p) => p.marked > 0 && p.pct < AT_RISK_THRESHOLD).length;

  const stats = [
    { icon: <CheckCircle2 size={18} />, label: 'Overall Attendance', value: `${overallPct}%`, tone: 'primary' as const },
    { icon: <XCircle size={18} />, label: 'Absences This Month', value: absentCount, tone: 'danger' as const },
    { icon: <Clock3 size={18} />, label: 'Records Logged', value: totalMarked, tone: 'info' as const },
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
        description="Read-only view of attendance marked by teachers, by class and month"
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

          {perStudent.every((p) => p.marked === 0) ? (
            <Card>
              <EmptyState
                icon={<CheckCircle2 size={32} />}
                title="No attendance marked yet"
                description="Attendance marked by the class teacher for this month will appear here."
              />
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
    </div>
  );
}
