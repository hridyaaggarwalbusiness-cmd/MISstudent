import { useMemo, useState } from 'react';
import { BarChart3, TrendingUp, FlaskConical, AlertTriangle } from 'lucide-react';
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

  const grouped = useMemo(() => {
    const map = new Map<string, ExamResult[]>();
    for (const r of filtered) {
      const key = `${r.examId || r.examName}`;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(r);
    }
    return Array.from(map.entries())
      .map(([key, rows]) => ({ key, rows, examName: rows[0].examName, date: rows[0].date }))
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [filtered]);

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
        grouped.map((group) => (
          <div key={group.key} className={styles.examGroup}>
            <div className={styles.examHeader}>
              <span className={styles.examName}>{group.examName}</span>
              <span className={styles.examMeta}>
                {group.rows.length} result{group.rows.length === 1 ? '' : 's'} · {group.date}
              </span>
            </div>
            <Card padded={false}>
              {group.rows.map((r) => {
                const pct = Math.round((r.marksObtained / (r.maxMarks || 1)) * 100);
                const tone = gradeTone(r.grade);
                return (
                  <div key={r.id} className={styles.resultRow}>
                    <span className={styles.studentName}>{studentName(r.studentId)}</span>
                    <span className={styles.subject}>{r.subject}</span>
                    <ProgressBar value={pct} color={gradeBarColor[tone]} />
                    <span className={styles.marks}>
                      {r.marksObtained}/{r.maxMarks} ({pct}%)
                    </span>
                    <Badge label={r.grade} tone={tone} />
                    <span className={styles.remark}>{r.teacherRemark || '—'}</span>
                  </div>
                );
              })}
            </Card>
          </div>
        ))
      )}
    </div>
  );
}
