import { useMemo, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { tableStyles } from '@/components/ui/Table';
import { StatStrip } from '@/components/ui/StatStrip';
import { TextField, SelectField } from '@/components/ui/FormField';
import { SkeletonRows } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorBanner } from '@/components/ui/ErrorBanner';
import { PageHeader } from '@/pages/PageHeader';
import { useCollection } from '@/hooks/useCollection';
import { repo } from '@/data/repositories';
import { getErrorMessage } from '@/utils/errors';
import { subjectAccentStyle } from '@/utils/subjectVisuals';
import type { Exam, SchoolClass, ExamStatus } from '@/types';
import styles from './ExamsPage.module.css';

const emptyForm: Omit<Exam, 'id'> = {
  classId: '',
  name: '',
  subject: '',
  date: '',
  startTime: '',
  endTime: '',
  room: '',
  syllabus: '',
  status: 'upcoming',
};

const statusTone: Record<ExamStatus, 'info' | 'warning' | 'success'> = {
  upcoming: 'info',
  ongoing: 'warning',
  completed: 'success',
};

const MONTH_ABBR = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

export function ExamsPage() {
  const { data: exams, loading } = useCollection<Exam>((cb) => repo.exams.subscribeAll(cb));
  const { data: classes } = useCollection<SchoolClass>((cb) => repo.classes.subscribeAll(cb));
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<Omit<Exam, 'id'> & { id?: string }>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [listError, setListError] = useState('');

  function openCreate() {
    setForm(emptyForm);
    setError('');
    setModalOpen(true);
  }

  function openEdit(exam: Exam) {
    setForm(exam);
    setError('');
    setModalOpen(true);
  }

  async function onSave() {
    if (!form.name.trim() || !form.subject.trim() || !form.classId || !form.date) {
      setError('Exam name, subject, class and date are required.');
      return;
    }
    setError('');
    setSaving(true);
    try {
      await repo.exams.upsert({ ...form, id: form.id ?? '' } as Exam);
      setModalOpen(false);
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setSaving(false);
    }
  }

  async function onDelete(id: string) {
    if (!confirm('Delete this exam?')) return;
    setListError('');
    try {
      await repo.exams.remove(id);
    } catch (e) {
      setListError(getErrorMessage(e));
    }
  }

  function classLabel(id: string) {
    const c = classes.find((cl) => cl.id === id);
    return c ? `${c.name} - ${c.section}` : id;
  }

  const sorted = useMemo(() => [...exams].sort((a, b) => a.date.localeCompare(b.date)), [exams]);
  const ongoing = sorted.filter((e) => e.status === 'ongoing');
  const upcoming = sorted.filter((e) => e.status === 'upcoming');
  const completed = [...sorted.filter((e) => e.status === 'completed')].reverse();

  const stats = [
    { icon: '🧪', label: 'Total Exams', value: exams.length, tone: 'primary' as const },
    { icon: '🟡', label: 'Ongoing', value: ongoing.length, tone: 'warning' as const },
    { icon: '📅', label: 'Upcoming', value: upcoming.length, tone: 'info' as const },
    { icon: '✔️', label: 'Completed', value: completed.length, tone: 'success' as const },
  ];

  function renderCard(e: Exam) {
    const d = new Date(e.date);
    const day = Number.isNaN(d.getTime()) ? '--' : d.getDate();
    const month = Number.isNaN(d.getTime()) ? '' : MONTH_ABBR[d.getMonth()];
    return (
      <div key={e.id} className={styles.examCard} style={subjectAccentStyle(e.subject)}>
        <div className={styles.dateChip}>
          <div className={styles.dateDay}>{day}</div>
          <div className={styles.dateMonth}>{month}</div>
        </div>
        <div className={styles.body}>
          <div className={styles.title}>{e.name}</div>
          <div className={styles.meta}>
            <span className={styles.metaItem}>📘 {e.subject}</span>
            <span className={styles.metaItem}>🏫 {classLabel(e.classId)}</span>
            <span className={styles.metaItem}>
              🕐 {e.startTime}–{e.endTime}
            </span>
            {e.room && <span className={styles.metaItem}>📍 {e.room}</span>}
          </div>
        </div>
        <div className={styles.right}>
          <Badge label={e.status} tone={statusTone[e.status]} />
          <button className={tableStyles.iconButton} onClick={() => openEdit(e)}>
            ✏️
          </button>
          <button className={[tableStyles.iconButton, tableStyles.danger].join(' ')} onClick={() => onDelete(e.id)}>
            🗑️
          </button>
        </div>
      </div>
    );
  }

  function renderSection(title: string, icon: string, items: Exam[]) {
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
        description="Schedule exams and track their status"
        toolbar={
          <Button onClick={openCreate} icon="+">
            Add Exam
          </Button>
        }
      />

      {listError && (
        <div style={{ marginBottom: 16 }}>
          <ErrorBanner message={listError} />
        </div>
      )}

      {!loading && exams.length > 0 && <StatStrip items={stats} />}

      {loading ? (
        <Card>
          <SkeletonRows count={5} />
        </Card>
      ) : exams.length === 0 ? (
        <Card>
          <EmptyState icon="🧪" title="No exams scheduled" description="Schedule exams so teachers can enter results." action={<Button onClick={openCreate}>Add Exam</Button>} />
        </Card>
      ) : (
        <>
          {renderSection('Ongoing', '🟡', ongoing)}
          {renderSection('Upcoming', '📅', upcoming)}
          {renderSection('Completed', '✔️', completed)}
        </>
      )}

      <Modal
        open={modalOpen}
        title={form.id ? 'Edit Exam' : 'Add Exam'}
        onClose={() => setModalOpen(false)}
        footer={
          <>
            <Button variant="ghost" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={onSave} loading={saving}>
              Save
            </Button>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {error && <ErrorBanner message={error} />}
          <TextField label="Exam Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <TextField label="Subject" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} />
          <SelectField label="Class" value={form.classId} onChange={(e) => setForm({ ...form, classId: e.target.value })}>
            <option value="">Select class</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} - {c.section}
              </option>
            ))}
          </SelectField>
          <TextField label="Date" type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <TextField label="Start Time" type="time" value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} />
            <TextField label="End Time" type="time" value={form.endTime} onChange={(e) => setForm({ ...form, endTime: e.target.value })} />
          </div>
          <TextField label="Room" value={form.room} onChange={(e) => setForm({ ...form, room: e.target.value })} />
          <TextField
            label="Syllabus"
            hint="Optional"
            value={form.syllabus}
            onChange={(e) => setForm({ ...form, syllabus: e.target.value })}
          />
          <SelectField
            label="Status"
            value={form.status}
            onChange={(e) => setForm({ ...form, status: e.target.value as ExamStatus })}
          >
            <option value="upcoming">Upcoming</option>
            <option value="ongoing">Ongoing</option>
            <option value="completed">Completed</option>
          </SelectField>
        </div>
      </Modal>
    </div>
  );
}
