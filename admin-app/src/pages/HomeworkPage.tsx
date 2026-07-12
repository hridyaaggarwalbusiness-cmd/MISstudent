import { useMemo, useState } from 'react';
import { format, parseISO } from 'date-fns';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { StatStrip } from '@/components/ui/StatStrip';
import { tableStyles } from '@/components/ui/Table';
import { SkeletonRows } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorBanner } from '@/components/ui/ErrorBanner';
import { PageHeader, pageHeaderStyles } from '@/pages/PageHeader';
import { useCollection } from '@/hooks/useCollection';
import { repo } from '@/data/repositories';
import { getErrorMessage } from '@/utils/errors';
import { subjectIcon, subjectAccentStyle } from '@/utils/subjectVisuals';
import { daysUntil, relativeDayLabel } from '@/utils/dateLabels';
import type { Homework, SchoolClass } from '@/types';
import styles from './HomeworkPage.module.css';

function formatDate(dateStr: string) {
  try {
    return format(parseISO(dateStr), 'EEE, d MMM yyyy');
  } catch {
    return dateStr;
  }
}

export function HomeworkPage() {
  const { data: homework, loading } = useCollection<Homework>((cb) => repo.homework.subscribeAll(cb));
  const { data: classes } = useCollection<SchoolClass>((cb) => repo.classes.subscribeAll(cb));
  const [classFilter, setClassFilter] = useState('');
  const [listError, setListError] = useState('');

  const filtered = useMemo(
    () => (classFilter ? homework.filter((h) => h.classId === classFilter) : homework),
    [homework, classFilter],
  );

  async function onDelete(id: string) {
    if (!confirm('Delete this homework assignment?')) return;
    setListError('');
    try {
      await repo.homework.remove(id);
    } catch (e) {
      setListError(getErrorMessage(e));
    }
  }

  const classLabel = (id: string) => {
    const c = classes.find((cl) => cl.id === id);
    return c ? `${c.name} - ${c.section}` : id;
  };

  const sorted = useMemo(() => [...filtered].sort((a, b) => daysUntil(a.dueDate) - daysUntil(b.dueDate)), [filtered]);
  const overdue = sorted.filter((h) => daysUntil(h.dueDate) < 0);
  const dueSoon = sorted.filter((h) => daysUntil(h.dueDate) >= 0 && daysUntil(h.dueDate) <= 7);
  const upcoming = sorted.filter((h) => daysUntil(h.dueDate) > 7);

  const stats = [
    { icon: '📝', label: 'Total Assignments', value: filtered.length, tone: 'primary' as const },
    { icon: '🕐', label: 'Due This Week', value: dueSoon.length, tone: 'warning' as const },
    { icon: '⚠️', label: 'Overdue', value: overdue.length, tone: 'danger' as const },
  ];

  function renderCard(h: Homework) {
    const due = relativeDayLabel(h.dueDate);
    return (
      <div key={h.id} className={styles.hwCard} style={subjectAccentStyle(h.subject)}>
        <div className={styles.iconChip}>{subjectIcon(h.subject)}</div>
        <div className={styles.body}>
          <div className={styles.title}>{h.title}</div>
          <div className={styles.meta}>
            <span className={styles.metaItem}>📘 {h.subject}</span>
            <span className={styles.metaItem}>🏫 {classLabel(h.classId)}</span>
            <span className={styles.metaItem}>👤 {h.teacherName}</span>
          </div>
        </div>
        <div className={styles.dueChip}>
          <Badge label={due.label} tone={due.tone} />
          <div className={styles.dueDate}>{formatDate(h.dueDate)}</div>
        </div>
        <button className={[tableStyles.iconButton, tableStyles.danger].join(' ')} onClick={() => onDelete(h.id)}>
          🗑️
        </button>
      </div>
    );
  }

  function renderSection(title: string, icon: string, items: Homework[]) {
    if (items.length === 0) return null;
    return (
      <div className={styles.section}>
        <div className={styles.sectionTitle}>
          {icon} {title} <span className={styles.sectionCount}>{items.length}</span>
        </div>
        <div className={styles.cardList}>{items.map(renderCard)}</div>
      </div>
    );
  }

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

      {listError && (
        <div style={{ marginBottom: 16 }}>
          <ErrorBanner message={listError} />
        </div>
      )}

      {!loading && filtered.length > 0 && <StatStrip items={stats} />}

      {loading ? (
        <Card>
          <SkeletonRows count={6} />
        </Card>
      ) : filtered.length === 0 ? (
        <Card>
          <EmptyState icon="📝" title="No homework found" description="Homework posted by teachers will appear here in real time." />
        </Card>
      ) : (
        <>
          {renderSection('Overdue', '⚠️', overdue)}
          {renderSection('Due This Week', '🕐', dueSoon)}
          {renderSection('Upcoming', '📅', upcoming)}
        </>
      )}
    </div>
  );
}
