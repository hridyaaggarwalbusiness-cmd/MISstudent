import { useMemo, useState } from 'react';
import { formatDistanceToNow, format, parseISO } from 'date-fns';
import {
  UserPlus,
  UserMinus,
  GraduationCap,
  ShieldCheck,
  CheckCircle2,
  Megaphone,
  FlaskConical,
  NotebookPen,
  School,
  History,
  Receipt,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { SkeletonRows } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { PageHeader } from '@/pages/PageHeader';
import { useCollection } from '@/hooks/useCollection';
import { repo } from '@/data/repositories';
import type { AuditAction, AuditLog } from '@/types';
import styles from './SystemLogsPage.module.css';

const ICONS: Record<AuditAction, typeof UserPlus> = {
  student_created: UserPlus,
  student_removed: UserMinus,
  teacher_created: GraduationCap,
  teacher_removed: UserMinus,
  admin_created: ShieldCheck,
  admin_removed: UserMinus,
  attendance_marked: CheckCircle2,
  notice_posted: Megaphone,
  exam_scheduled: FlaskConical,
  homework_posted: NotebookPen,
  class_created: School,
  fee_payment_recorded: Receipt,
};

const CATEGORY: Record<AuditAction, string> = {
  student_created: 'People',
  student_removed: 'People',
  teacher_created: 'People',
  teacher_removed: 'People',
  admin_created: 'People',
  admin_removed: 'People',
  attendance_marked: 'Attendance',
  notice_posted: 'Communication',
  exam_scheduled: 'Academics',
  homework_posted: 'Academics',
  class_created: 'Academics',
  fee_payment_recorded: 'Fees',
};

const CATEGORY_TONE: Record<string, 'primary' | 'info' | 'success' | 'violet' | 'warning'> = {
  People: 'primary',
  Attendance: 'success',
  Fees: 'warning',
  Communication: 'violet',
  Academics: 'info',
};

const FILTERS = ['All', 'People', 'Attendance', 'Communication', 'Academics', 'Fees'] as const;

export function SystemLogsPage() {
  const { data: logs, loading } = useCollection<AuditLog>((cb) => repo.auditLogs.subscribeRecent(cb, 100));
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>('All');

  const filtered = useMemo(
    () => (filter === 'All' ? logs : logs.filter((l) => CATEGORY[l.action] === filter)),
    [logs, filter],
  );

  return (
    <div>
      <PageHeader
        title="System Logs"
        description="Audit trail of key actions across the admin console"
        toolbar={
          <div className={styles.filters}>
            {FILTERS.map((f) => (
              <button
                key={f}
                className={[styles.filterChip, filter === f && styles.filterChipActive].filter(Boolean).join(' ')}
                onClick={() => setFilter(f)}
              >
                {f}
              </button>
            ))}
          </div>
        }
      />

      <Card>
        {loading ? (
          <SkeletonRows count={8} />
        ) : filtered.length === 0 ? (
          <EmptyState icon={<History size={32} />} title="No activity yet" description="Actions taken in the admin console will be recorded here." />
        ) : (
          <div className={styles.list}>
            {filtered.map((log) => {
              const Icon = ICONS[log.action] ?? History;
              const category = CATEGORY[log.action] ?? 'Other';
              let when = log.at;
              try {
                when = `${formatDistanceToNow(parseISO(log.at), { addSuffix: true })} · ${format(parseISO(log.at), 'd MMM, h:mm a')}`;
              } catch {
                /* leave raw */
              }
              return (
                <div className={styles.row} key={log.id}>
                  <span className={styles.iconWrap}>
                    <Icon size={16} />
                  </span>
                  <div className={styles.rowBody}>
                    <span className={styles.summary}>{log.summary}</span>
                    <span className={styles.meta}>
                      by {log.actorName} · {when}
                    </span>
                  </div>
                  <Badge label={category} tone={CATEGORY_TONE[category] ?? 'neutral'} />
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}
