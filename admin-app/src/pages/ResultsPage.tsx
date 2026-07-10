import { useMemo, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Table } from '@/components/ui/Table';
import { SkeletonRows } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { PageHeader, pageHeaderStyles } from '@/pages/PageHeader';
import { useCollection } from '@/hooks/useCollection';
import { repo } from '@/data/repositories';
import type { ExamResult, SchoolClass, Student } from '@/types';

const gradeTone = (grade: string) => {
  if (grade.startsWith('A')) return 'success' as const;
  if (grade.startsWith('B')) return 'info' as const;
  if (grade.startsWith('C')) return 'warning' as const;
  return 'danger' as const;
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

  return (
    <div>
      <PageHeader
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

      <Card padded={false}>
        {loading ? (
          <div style={{ padding: 20 }}>
            <SkeletonRows count={6} />
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState icon="📊" title="No results yet" description="Results entered by teachers will appear here in real time." />
        ) : (
          <Table
            columns={[
              { key: 'student', header: 'Student', render: (r) => studentName(r.studentId) },
              { key: 'exam', header: 'Exam', render: (r) => r.examName },
              { key: 'subject', header: 'Subject', render: (r) => r.subject },
              { key: 'marks', header: 'Marks', render: (r) => `${r.marksObtained} / ${r.maxMarks}` },
              { key: 'grade', header: 'Grade', render: (r) => <Badge label={r.grade} tone={gradeTone(r.grade)} /> },
              { key: 'remark', header: 'Remark', render: (r) => r.teacherRemark || '—' },
            ]}
            rows={filtered}
            rowKey={(r) => r.id}
          />
        )}
      </Card>
    </div>
  );
}
