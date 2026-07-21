import { useMemo, useState } from 'react';
import { BarChart3, TrendingUp, FlaskConical, AlertTriangle, ChevronDown, ChevronRight } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { StatStrip } from '@/components/ui/StatStrip';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { SkeletonRows } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { PageHeader, pageHeaderStyles } from '@/pages/PageHeader';
import { useCollection } from '@/hooks/useCollection';
import { repo } from '@/data/repositories';
import type { ExamResult, SchoolClass, Student } from '@/types';
import styles from './ResultsPage.module.css';

const gradeTone = (grade: string) => {
  if (grade.startsWith('A')) return 'success' as const;
  if (grade.startsWith('B')) return 'info' as const;
  if (grade.startsWith('C')) return 'warning' as const;
  return 'danger' as const;
};

const gradeBarColor: Record<ReturnType<typeof gradeTone>, string> = {
  success: 'var(--color-success)',
  info: 'var(--color-info)',
  warning: 'var(--color-warning)',
  danger: 'var(--color-danger)',
};

function gradeFor(pct: number): string {
  if (pct >= 90) return 'A+';
  if (pct >= 80) return 'A';
  if (pct >= 70) return 'B+';
  if (pct >= 60) return 'B';
  if (pct >= 50) return 'C';
  return 'D';
}

export function ResultsPage() {
  const { data: results, loading } = useCollection<ExamResult>((cb) => repo.results.subscribeAll(cb));
  const { data: classes } = useCollection<SchoolClass>((cb) => repo.classes.subscribeAll(cb));
  const { data: students } = useCollection<Student>((cb) => repo.students.subscribeAll(cb));
  const [classFilter, setClassFilter] = useState('');

  const filtered = useMemo(
    () => (classFilter ? results.filter((r) => r.classId === classFilter) : results),
    [results, classFilter],
  );

  const studentName = (id: string) => students.find((s) => s.id === id)?.name ?? id;

  // Kept only to feed the "Exams Recorded" stat below - the results
  // themselves are now grouped by student, not by exam.
  const grouped = useMemo(() => {
    const map = new Map<string, ExamResult[]>();
    for (const r of filtered) {
      const key = `${r.examId || r.examName}`;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(r);
    }
    return Array.from(map.values());
  }, [filtered]);

  const byStudent = useMemo(() => {
    const map = new Map<string, ExamResult[]>();
    for (const r of filtered) {
      if (!map.has(r.studentId)) map.set(r.studentId, []);
      map.get(r.studentId)!.push(r);
    }
    return Array.from(map.entries())
      .map(([studentId, rows]) => {
        const totalObtained = rows.reduce((s, r) => s + r.marksObtained, 0);
        const totalMax = rows.reduce((s, r) => s + r.maxMarks, 0);
        const pct = totalMax > 0 ? Math.round((totalObtained / totalMax) * 1000) / 10 : 0;
        return {
          studentId,
          name: studentName(studentId),
          rows: [...rows].sort((a, b) => a.subject.localeCompare(b.subject)),
          pct,
          grade: gradeFor(pct),
        };
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [filtered, students]);

  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  function toggle(studentId: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(studentId)) next.delete(studentId);
      else next.add(studentId);
      return next;
    });
  }

  const avgPct = filtered.length
    ? Math.round((filtered.reduce((s, r) => s + (r.marksObtained / (r.maxMarks || 1)) * 100, 0) / filtered.length) * 10) / 10
    : 0;
  const atRisk = filtered.filter((r) => r.marksObtained / (r.maxMarks || 1) < 0.4).length;

  const stats = [
    { icon: <BarChart3 size={18} />, label: 'Total Results', value: filtered.length, tone: 'primary' as const },
    { icon: <TrendingUp size={18} />, label: 'Average Score', value: `${avgPct}%`, tone: 'info' as const },
    { icon: <FlaskConical size={18} />, label: 'Exams Recorded', value: grouped.length, tone: 'violet' as const },
    { icon: <AlertTriangle size={18} />, label: 'Below 40%', value: atRisk, tone: atRisk > 0 ? ('danger' as const) : ('success' as const) },
  ];

  return (
    <div>
      <PageHeader
        title="Results"
        description="Read-only view of results entered by subject teachers"
        toolbar={
          <select className={pageHeaderStyles.select} value={classFilter} onChange={(e) => setClassFilter(e.target.value)}>
            <option value="">All Classes</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} - {c.section}
              </option>
            ))}
          </select>
        }
      />

      {!loading && filtered.length > 0 && <StatStrip items={stats} />}

      {loading ? (
        <Card>
          <SkeletonRows count={6} />
        </Card>
      ) : filtered.length === 0 ? (
        <Card>
          <EmptyState icon={<BarChart3 size={32} />} title="No results yet" description="Results entered by teachers will appear here in real time." />
        </Card>
      ) : (
        <Card padded={false}>
          {byStudent.map((s) => {
            const isOpen = expanded.has(s.studentId);
            const tone = gradeTone(s.grade);
            return (
              <div key={s.studentId} className={styles.studentGroup}>
                <button type="button" className={styles.studentHeader} onClick={() => toggle(s.studentId)}>
                  {isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                  <span className={styles.studentName}>{s.name}</span>
                  <span className={styles.studentMeta}>
                    {s.rows.length} subject{s.rows.length === 1 ? '' : 's'}
                  </span>
                  <ProgressBar value={s.pct} color={gradeBarColor[tone]} />
                  <span className={styles.marks}>{s.pct}%</span>
                  <Badge label={s.grade} tone={tone} />
                </button>
                {isOpen && (
                  <div className={styles.subjectList}>
                    {s.rows.map((r) => {
                      const pct = Math.round((r.marksObtained / (r.maxMarks || 1)) * 100);
                      const rTone = gradeTone(r.grade);
                      return (
                        <div key={r.id} className={styles.subjectRow}>
                          <span className={styles.subject}>{r.subject}</span>
                          <ProgressBar value={pct} color={gradeBarColor[rTone]} />
                          <span className={styles.marks}>
                            {r.marksObtained}/{r.maxMarks} ({pct}%)
                          </span>
                          <Badge label={r.grade} tone={rTone} />
                          <span className={styles.remark}>{r.teacherRemark || '—'}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </Card>
      )}
    </div>
  );
}
