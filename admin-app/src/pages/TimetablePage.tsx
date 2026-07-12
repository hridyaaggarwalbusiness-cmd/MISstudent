import { Fragment, useEffect, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { TextField, SelectField } from '@/components/ui/FormField';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorBanner } from '@/components/ui/ErrorBanner';
import { PageHeader, pageHeaderStyles } from '@/pages/PageHeader';
import { useCollection } from '@/hooks/useCollection';
import { repo } from '@/data/repositories';
import { getErrorMessage } from '@/utils/errors';
import type { SchoolClass, Teacher, TimetablePeriod, DayOfWeek } from '@/types';
import styles from './TimetablePage.module.css';

const days: DayOfWeek[] = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const periodNumbers = [1, 2, 3, 4, 5, 6, 7, 8];

const emptyForm = {
  subject: '',
  teacherId: '',
  startTime: '',
  endTime: '',
  room: '',
  isBreak: false,
};

export function TimetablePage() {
  const { data: classes } = useCollection<SchoolClass>((cb) => repo.classes.subscribeAll(cb));
  const { data: teachers } = useCollection<Teacher>((cb) => repo.teachers.subscribeAll(cb));
  const [classId, setClassId] = useState('');
  const [periods, setPeriods] = useState<TimetablePeriod[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [activeCell, setActiveCell] = useState<{ day: DayOfWeek; periodNumber: number } | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (classes.length && !classId) setClassId(classes[0].id);
  }, [classes, classId]);

  useEffect(() => {
    if (!classId) return;
    const unsub = repo.timetable.subscribeForClass(classId, setPeriods);
    return unsub;
  }, [classId]);

  function cellFor(day: DayOfWeek, periodNumber: number) {
    return periods.find((p) => p.day === day && p.periodNumber === periodNumber);
  }

  function openCell(day: DayOfWeek, periodNumber: number) {
    const existing = cellFor(day, periodNumber);
    setActiveCell({ day, periodNumber });
    setForm(
      existing
        ? {
            subject: existing.subject,
            teacherId: existing.teacherId,
            startTime: existing.startTime,
            endTime: existing.endTime,
            room: existing.room,
            isBreak: existing.isBreak ?? false,
          }
        : emptyForm,
    );
    setError('');
    setModalOpen(true);
  }

  async function onSave() {
    if (!activeCell || !classId) return;
    if (!form.isBreak && !form.subject.trim()) {
      setError('Subject is required (or mark this as a break).');
      return;
    }
    if (!form.startTime || !form.endTime) {
      setError('Start and end time are required.');
      return;
    }
    setError('');
    setSaving(true);
    try {
      const teacher = teachers.find((t) => t.id === form.teacherId);
      const id = `${classId}_${activeCell.day}_${activeCell.periodNumber}`;
      await repo.timetable.upsert({
        id,
        classId,
        day: activeCell.day,
        periodNumber: activeCell.periodNumber,
        startTime: form.startTime,
        endTime: form.endTime,
        subject: form.subject,
        teacher: teacher?.name ?? '',
        teacherId: form.teacherId,
        room: form.room,
        isBreak: form.isBreak,
      });
      setModalOpen(false);
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setSaving(false);
    }
  }

  async function onRemove() {
    if (!activeCell || !classId) return;
    setError('');
    try {
      const id = `${classId}_${activeCell.day}_${activeCell.periodNumber}`;
      await repo.timetable.remove(id);
      setModalOpen(false);
    } catch (e) {
      setError(getErrorMessage(e));
    }
  }

  return (
    <div>
      <PageHeader
        description="Build the weekly timetable for each class"
        toolbar={
          <select className={pageHeaderStyles.select} value={classId} onChange={(e) => setClassId(e.target.value)}>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} - {c.section}
              </option>
            ))}
          </select>
        }
      />

      <Card>
        {classes.length === 0 ? (
          <EmptyState icon="🗓️" title="No classes yet" description="Create a class first to build its timetable." />
        ) : (
          <div className={styles.grid}>
            <div />
            {days.map((d) => (
              <div key={d} className={styles.dayHeader}>
                {d}
              </div>
            ))}
            {periodNumbers.map((pNum) => (
              <Fragment key={pNum}>
                <div className={styles.periodLabel}>P{pNum}</div>
                {days.map((day) => {
                  const period = cellFor(day, pNum);
                  return (
                    <div
                      key={`${day}-${pNum}`}
                      className={[styles.cell, period && styles.cellFilled].filter(Boolean).join(' ')}
                      onClick={() => openCell(day, pNum)}
                    >
                      {period ? (
                        <>
                          <span className={styles.cellSubject}>{period.isBreak ? 'Break' : period.subject}</span>
                          <span className={styles.cellMeta}>
                            {period.startTime}-{period.endTime}
                          </span>
                          {!period.isBreak && <span className={styles.cellMeta}>{period.teacher}</span>}
                        </>
                      ) : (
                        <span className={styles.cellEmpty}>+</span>
                      )}
                    </div>
                  );
                })}
              </Fragment>
            ))}
          </div>
        )}
      </Card>

      <Modal
        open={modalOpen}
        title={activeCell ? `${activeCell.day} · Period ${activeCell.periodNumber}` : 'Period'}
        onClose={() => setModalOpen(false)}
        footer={
          <>
            <Button variant="danger" onClick={onRemove}>
              Clear
            </Button>
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
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, fontWeight: 600 }}>
            <input
              type="checkbox"
              checked={form.isBreak}
              onChange={(e) => setForm({ ...form, isBreak: e.target.checked })}
            />
            This is a break / recess period
          </label>
          {!form.isBreak && (
            <>
              <TextField
                label="Subject"
                value={form.subject}
                onChange={(e) => setForm({ ...form, subject: e.target.value })}
              />
              <SelectField
                label="Teacher"
                value={form.teacherId}
                onChange={(e) => setForm({ ...form, teacherId: e.target.value })}
              >
                <option value="">Select teacher</option>
                {teachers.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </SelectField>
              <TextField label="Room" value={form.room} onChange={(e) => setForm({ ...form, room: e.target.value })} />
            </>
          )}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <TextField
              label="Start Time"
              type="time"
              value={form.startTime}
              onChange={(e) => setForm({ ...form, startTime: e.target.value })}
            />
            <TextField
              label="End Time"
              type="time"
              value={form.endTime}
              onChange={(e) => setForm({ ...form, endTime: e.target.value })}
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}
