import { useMemo, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Table, tableStyles } from '@/components/ui/Table';
import { SkeletonRows } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { PageHeader, pageHeaderStyles } from '@/pages/PageHeader';
import { useCollection } from '@/hooks/useCollection';
import { repo } from '@/data/repositories';
import type { Homework, SchoolClass } from '@/types';

export function HomeworkPage() {
  const { data: homework, loading } = useCollection<Homework>((cb) => repo.homework.subscribeAll(cb));
  const { data: classes } = useCollection<SchoolClass>((cb) => repo.classes.subscribeAll(cb));
  const [classFilter, setClassFilter] = useState('');

  const filtered = useMemo(
    () => (classFilter ? homework.filter((h) => h.classId === classFilter) : homework),
    [homework, classFilter],
  );

  async function onDelete(id: string) {
    if (!confirm('Delete this homework assignment?')) return;
    await repo.homework.remove(id);
  }

  const isOverdue = (dueDate: string) => new Date(dueDate) < new Date();
  const classLabel = (id: string) => {
    const c = classes.find((cl) => cl.id === id);
    return c ? `${c.name} - ${c.section}` : id;
  };

  return (
    <div>
      <PageHeader
        description="Read-only view of homework posted by teachers across all classes"
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
          <EmptyState icon="📝" title="No homework found" description="Homework posted by teachers will appear here in real time." />
        ) : (
          <Table
            columns={[
              { key: 'title', header: 'Title', render: (h) => h.title },
              { key: 'subject', header: 'Subject', render: (h) => h.subject },
              { key: 'class', header: 'Class', render: (h) => classLabel(h.classId) },
              { key: 'teacher', header: 'Teacher', render: (h) => h.teacherName },
              {
                key: 'due',
                header: 'Due Date',
                render: (h) => <Badge label={h.dueDate} tone={isOverdue(h.dueDate) ? 'danger' : 'warning'} />,
              },
              {
                key: 'actions',
                header: '',
                align: 'right',
                render: (h) => (
                  <div className={tableStyles.actions}>
                    <button className={[tableStyles.iconButton, tableStyles.danger].join(' ')} onClick={() => onDelete(h.id)}>
                      🗑️
                    </button>
                  </div>
                ),
              },
            ]}
            rows={filtered}
            rowKey={(h) => h.id}
          />
        )}
      </Card>
    </div>
  );
}
