import { useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { format, parseISO } from 'date-fns';
import { NotebookPen, Clock3, AlertTriangle, CalendarDays, BookOpen, School, User, Trash2 } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { IconButton } from '@/components/ui/IconButton';
import { Badge } from '@/components/ui/Badge';
import { StatStrip } from '@/components/ui/StatStrip';
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
    { icon: <NotebookPen size={18} />, label: 'Total Assignments', value: filtered.length, tone: 'primary' as const },
    { icon: <Clock3 size={18} />, label: 'Due This Week', value: dueSoon.length, tone: 'warning' as const },
    { icon: <AlertTriangle size={18} />, label: 'Overdue', value: overdue.length, tone: 'danger' as const },
  ];

  function renderCard(h: Homework) {
    const due = relativeDayLabel(h.dueDate);
    const SubjectIcon = subjectIcon(h.subject);
    return (
      <div key={h.id} className={styles.hwCard} style={subjectAccentStyle(h.subject)}>
        <div className={styles.iconChip}>
          <SubjectIcon size={18} />
        </div>
        <div className={styles.body}>
          <div className={styles.title}>{h.title}</div>
          <div className={styles.meta}>
            <span className={styles.metaItem}>
              <BookOpen size={13} style={{ verticalAlign: -2, marginRight: 3 }} />
              {h.subject}
            </span>
            <span className={styles.metaItem}>
              <School size={13} style={{ verticalAlign: -2, marginRight: 3 }} />
              {classLabel(h.classId)}
            </span>
            <span className={styles.metaItem}>
              <User size={13} style={{ verticalAlign: -2, marginRight: 3 }} />
              {h.teacherName}
            </span>
          </div>
        </div>
        <div className={styles.dueChip}>
          <Badge label={due.label} tone={due.tone} />
          <div className={styles.dueDate}>{formatDate(h.dueDate)}</div>
        </div>
        <IconButton icon={Trash2} tone="danger" onClick={() => onDelete(h.id)} aria-label="Delete homework" />
      </div>
    );
  }

  function renderSection(title: string, icon: ReactNode, items: Homework[]) {
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
          <EmptyState icon={<NotebookPen size={32} />} title="No homework found" description="Homework posted by teachers will appear here in real time." />
        </Card>
      ) : (
        <>
          {renderSection('Overdue', <AlertTriangle size={16} />, overdue)}
          {renderSection('Due This Week', <Clock3 size={16} />, dueSoon)}
          {renderSection('Upcoming', <CalendarDays size={16} />, upcoming)}
        </>
      )}
    </div>
  );
}
