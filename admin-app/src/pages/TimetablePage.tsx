import { Fragment, useEffect, useMemo, useRef, useState } from 'react';
import { CalendarClock, Coffee, User, MapPin, Settings2, Plus, ArrowUp, ArrowDown, X, GripVertical } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { IconButton } from '@/components/ui/IconButton';
import { Modal } from '@/components/ui/Modal';
import { TextField, SelectField } from '@/components/ui/FormField';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorBanner } from '@/components/ui/ErrorBanner';
import { PageHeader, pageHeaderStyles } from '@/pages/PageHeader';
import { useCollection } from '@/hooks/useCollection';
import { repo } from '@/data/repositories';
import { getErrorMessage } from '@/utils/errors';
import { subjectAccentStyle } from '@/utils/subjectVisuals';
import type { SchoolClass, Teacher, TimetablePeriod, DayOfWeek, PeriodSlot, PeriodSchedule } from '@/types';
import styles from './TimetablePage.module.css';

const days: DayOfWeek[] = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const WEEKDAY_ABBR = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const todayAbbr = WEEKDAY_ABBR[new Date().getDay()];

// Preserves compatibility with any timetable cells already saved under the
// old fixed-8-period model, the very first time this school opens the
// (previously nonexistent) period schedule.
function defaultSchedule(): PeriodSchedule {
  return {
    slots: Array.from({ length: 8 }, (_, i) => ({
      id: `p${i + 1}`,
      type: 'period' as const,
      label: `P${i + 1}`,
      periodNumber: i + 1,
      startTime: '',
      endTime: '',
      order: i,
    })),
  };
}

const emptyForm = {
  subject: '',
  teacherId: '',
  room: '',
};

export function TimetablePage() {
  const { data: classes } = useCollection<SchoolClass>((cb) => repo.classes.subscribeAll(cb));
  const { data: teachers } = useCollection<Teacher>((cb) => repo.teachers.subscribeAll(cb));
  const [classId, setClassId] = useState('');
  const [periods, setPeriods] = useState<TimetablePeriod[]>([]);
  const [schedule, setSchedule] = useState<PeriodSchedule | null>(null);
  const seededRef = useRef(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [activeCell, setActiveCell] = useState<{ day: DayOfWeek; slot: PeriodSlot } | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [timeModalSlot, setTimeModalSlot] = useState<PeriodSlot | null>(null);
  const [timeForm, setTimeForm] = useState({ label: '', startTime: '', endTime: '' });
  const [savingTime, setSavingTime] = useState(false);
  const [timeError, setTimeError] = useState('');

  const [manageOpen, setManageOpen] = useState(false);

  // Drag-fill: holding the grip on a filled period cell and dragging across
  // other period cells copies that period's subject/teacher/room onto every
  // cell the pointer passes over, released on mouseup - the same "autofill"
  // gesture as dragging a spreadsheet cell handle.
  const [dragSource, setDragSource] = useState<{ subject: string; teacherId: string; teacher: string; room: string } | null>(null);
  const [dragTargets, setDragTargets] = useState<Set<string>>(new Set());
  const draggingRef = useRef(false);

  function startDrag(e: React.MouseEvent, period: TimetablePeriod) {
    e.preventDefault();
    e.stopPropagation();
    draggingRef.current = true;
    setDragSource({ subject: period.subject, teacherId: period.teacherId, teacher: period.teacher, room: period.room });
    setDragTargets(new Set());
  }

  function enterCellWhileDragging(day: DayOfWeek, slot: PeriodSlot) {
    if (!draggingRef.current || slot.type !== 'period') return;
    const key = `${day}|${slot.periodNumber}`;
    setDragTargets((prev) => (prev.has(key) ? prev : new Set(prev).add(key)));
  }

  useEffect(() => {
    if (!dragSource) return;
    async function commitDrag() {
      draggingRef.current = false;
      const source = dragSource;
      const targets = Array.from(dragTargets);
      setDragSource(null);
      setDragTargets(new Set());
      if (!source || !classId || targets.length === 0) return;
      await Promise.all(
        targets.map(async (key) => {
          const [day, numStr] = key.split('|');
          const periodNumber = Number(numStr);
          const slot = sortedSlots.find((s) => s.type === 'period' && s.periodNumber === periodNumber);
          if (!slot) return;
          const existing = cellFor(day as DayOfWeek, periodNumber);
          const id = existing?.id ?? `${classId}_${day}_${periodNumber}`;
          await repo.timetable.upsert({
            id,
            classId,
            day: day as DayOfWeek,
            periodNumber,
            startTime: slot.startTime,
            endTime: slot.endTime,
            subject: source.subject,
            teacher: source.teacher,
            teacherId: source.teacherId,
            room: source.room,
            isBreak: false,
          });
        }),
      );
    }
    window.addEventListener('mouseup', commitDrag);
    return () => window.removeEventListener('mouseup', commitDrag);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dragSource, dragTargets, classId]);

  useEffect(() => {
    if (classes.length && !classId) setClassId(classes[0].id);
  }, [classes, classId]);

  useEffect(() => {
    if (!classId) return;
    const unsub = repo.timetable.subscribeForClass(classId, setPeriods);
    return unsub;
  }, [classId]);

  useEffect(() => repo.periodSchedule.subscribe(setSchedule), []);

  // First-ever load with no schedule doc yet: seed the default 8-period
  // structure once, so existing timetable cells keep showing up correctly.
  useEffect(() => {
    if (schedule && schedule.slots.length === 0 && !seededRef.current) {
      seededRef.current = true;
      repo.periodSchedule.update(defaultSchedule());
    }
  }, [schedule]);

  const sortedSlots = useMemo(
    () => [...(schedule?.slots ?? [])].sort((a, b) => a.order - b.order),
    [schedule],
  );

  function cellFor(day: DayOfWeek, periodNumber: number) {
    return periods.find((p) => p.day === day && p.periodNumber === periodNumber);
  }

  function openCell(day: DayOfWeek, slot: PeriodSlot) {
    if (slot.type === 'break') {
      openTimeEditor(slot);
      return;
    }
    const existing = cellFor(day, slot.periodNumber!);
    setActiveCell({ day, slot });
    setForm(
      existing
        ? { subject: existing.subject, teacherId: existing.teacherId, room: existing.room }
        : emptyForm,
    );
    setError('');
    setModalOpen(true);
  }

  async function onSave() {
    if (!activeCell || !classId || !schedule) return;
    const { day, slot } = activeCell;
    if (!form.subject.trim()) {
      setError('Subject is required.');
      return;
    }
    setError('');
    setSaving(true);
    try {
      const teacher = teachers.find((t) => t.id === form.teacherId);
      const existing = cellFor(day, slot.periodNumber!);
      const id = existing?.id ?? `${classId}_${day}_${slot.periodNumber}`;
      await repo.timetable.upsert({
        id,
        classId,
        day,
        periodNumber: slot.periodNumber!,
        startTime: slot.startTime,
        endTime: slot.endTime,
        subject: form.subject,
        teacher: teacher?.name ?? '',
        teacherId: form.teacherId,
        room: form.room,
        isBreak: false,
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
      const existing = cellFor(activeCell.day, activeCell.slot.periodNumber!);
      if (existing) await repo.timetable.remove(existing.id);
      setModalOpen(false);
    } catch (e) {
      setError(getErrorMessage(e));
    }
  }

  function openTimeEditor(slot: PeriodSlot) {
    setTimeModalSlot(slot);
    setTimeForm({ label: slot.label, startTime: slot.startTime, endTime: slot.endTime });
    setTimeError('');
  }

  async function onSaveTime() {
    if (!timeModalSlot || !schedule) return;
    if (!timeForm.startTime || !timeForm.endTime) {
      setTimeError('Start and end time are required.');
      return;
    }
    setTimeError('');
    setSavingTime(true);
    try {
      const updatedSlot: PeriodSlot = {
        ...timeModalSlot,
        label: timeModalSlot.type === 'break' ? timeForm.label.trim() || 'Recess' : timeModalSlot.label,
        startTime: timeForm.startTime,
        endTime: timeForm.endTime,
      };
      const nextSlots = schedule.slots.map((s) => (s.id === updatedSlot.id ? updatedSlot : s));
      await repo.periodSchedule.update({ slots: nextSlots });
      if (updatedSlot.type === 'period' && updatedSlot.periodNumber != null) {
        await repo.periodSchedule.propagateTime(updatedSlot.periodNumber, updatedSlot.startTime, updatedSlot.endTime);
      }
      setTimeModalSlot(null);
    } catch (e) {
      setTimeError(getErrorMessage(e));
    } finally {
      setSavingTime(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="Timetable"
        description="Build the weekly timetable for each class"
        toolbar={
          <>
            <select className={pageHeaderStyles.select} value={classId} onChange={(e) => setClassId(e.target.value)}>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} - {c.section}
                </option>
              ))}
            </select>
            <Button variant="outline" onClick={() => setManageOpen(true)} icon={<Settings2 size={16} />}>
              Manage Periods
            </Button>
          </>
        }
      />

      <Card>
        {classes.length === 0 ? (
          <EmptyState icon={<CalendarClock size={32} />} title="No classes yet" description="Create a class first to build its timetable." />
        ) : (
          <div className={styles.grid}>
            <div />
            {days.map((d) => (
              <div key={d} className={[styles.dayHeader, d === todayAbbr && styles.dayHeaderToday].filter(Boolean).join(' ')}>
                {d}
              </div>
            ))}
            {sortedSlots.map((slot) => (
              <Fragment key={slot.id}>
                <button className={styles.periodLabelButton} onClick={() => openTimeEditor(slot)} title="Click to set the time for this row (applies to every day)">
                  <span>{slot.label}</span>
                  {(slot.startTime || slot.endTime) && (
                    <span className={styles.periodLabelTime}>
                      {slot.startTime || '--:--'}-{slot.endTime || '--:--'}
                    </span>
                  )}
                </button>
                {days.map((day) => {
                  if (slot.type === 'break') {
                    return (
                      <div
                        key={`${day}-${slot.id}`}
                        className={[styles.cell, styles.cellBreak, day === todayAbbr && styles.cellToday].filter(Boolean).join(' ')}
                        onClick={() => openTimeEditor(slot)}
                      >
                        <span className={styles.cellSubject}>
                          <Coffee size={13} style={{ verticalAlign: -2, marginRight: 3 }} />
                          {slot.label}
                        </span>
                        {(slot.startTime || slot.endTime) && (
                          <span className={styles.cellMeta}>
                            {slot.startTime}-{slot.endTime}
                          </span>
                        )}
                      </div>
                    );
                  }
                  const period = cellFor(day, slot.periodNumber!);
                  const isDragTarget = dragTargets.has(`${day}|${slot.periodNumber}`);
                  return (
                    <div
                      key={`${day}-${slot.id}`}
                      className={[
                        styles.cell,
                        period && styles.cellFilled,
                        day === todayAbbr && styles.cellToday,
                        isDragTarget && styles.cellDragTarget,
                      ]
                        .filter(Boolean)
                        .join(' ')}
                      style={period ? subjectAccentStyle(period.subject) : undefined}
                      onClick={() => openCell(day, slot)}
                      onMouseEnter={() => enterCellWhileDragging(day, slot)}
                    >
                      {period ? (
                        <>
                          <span
                            className={styles.dragHandle}
                            title="Drag to copy this period onto other slots"
                            onMouseDown={(e) => startDrag(e, period)}
                          >
                            <GripVertical size={12} />
                          </span>
                          <span className={styles.cellSubject}>{period.subject}</span>
                          <span className={styles.cellMeta}>
                            {slot.startTime}-{slot.endTime}
                          </span>
                          <span className={styles.cellMeta}>
                            <User size={12} style={{ verticalAlign: -2, marginRight: 3 }} />
                            {period.teacher}
                          </span>
                          {period.room && (
                            <span className={styles.cellMeta}>
                              <MapPin size={12} style={{ verticalAlign: -2, marginRight: 3 }} />
                              {period.room}
                            </span>
                          )}
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
        title={activeCell ? `${activeCell.day} · ${activeCell.slot.label}` : 'Period'}
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
          {activeCell && (activeCell.slot.startTime || activeCell.slot.endTime) && (
            <div style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>
              Time: {activeCell.slot.startTime || '--:--'}-{activeCell.slot.endTime || '--:--'} (set via "Manage Periods" — applies every day)
            </div>
          )}
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
        </div>
      </Modal>

      <Modal
        open={!!timeModalSlot}
        title={timeModalSlot ? `Set time — ${timeModalSlot.label}` : 'Set time'}
        onClose={() => setTimeModalSlot(null)}
        footer={
          <>
            <Button variant="ghost" onClick={() => setTimeModalSlot(null)}>
              Cancel
            </Button>
            <Button onClick={onSaveTime} loading={savingTime}>
              Save
            </Button>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {timeError && <ErrorBanner message={timeError} />}
          <div style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>
            This time applies to {timeModalSlot?.label} on every day of the week
            {timeModalSlot?.type === 'period' ? ', across every class.' : '.'}
          </div>
          {timeModalSlot?.type === 'break' && (
            <TextField
              label="Label"
              placeholder="e.g. Recess, Lunch Break"
              value={timeForm.label}
              onChange={(e) => setTimeForm({ ...timeForm, label: e.target.value })}
            />
          )}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <TextField
              label="Start Time"
              type="time"
              value={timeForm.startTime}
              onChange={(e) => setTimeForm({ ...timeForm, startTime: e.target.value })}
            />
            <TextField
              label="End Time"
              type="time"
              value={timeForm.endTime}
              onChange={(e) => setTimeForm({ ...timeForm, endTime: e.target.value })}
            />
          </div>
        </div>
      </Modal>

      <ManagePeriodsModal open={manageOpen} onClose={() => setManageOpen(false)} schedule={schedule} />
    </div>
  );
}

function nextPeriodNumber(slots: PeriodSlot[]): number {
  const used = slots.filter((s) => s.type === 'period').map((s) => s.periodNumber ?? 0);
  return used.length ? Math.max(...used) + 1 : 1;
}

function ManagePeriodsModal({
  open,
  onClose,
  schedule,
}: {
  open: boolean;
  onClose: () => void;
  schedule: PeriodSchedule | null;
}) {
  const [slots, setSlots] = useState<PeriodSlot[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      setSlots([...(schedule?.slots ?? [])].sort((a, b) => a.order - b.order));
      setError('');
    }
  }, [open, schedule]);

  function addPeriod() {
    setSlots((s) => {
      const num = nextPeriodNumber(s);
      return [...s, { id: `p${num}-${Date.now()}`, type: 'period', label: `P${num}`, periodNumber: num, startTime: '', endTime: '', order: s.length }];
    });
  }

  function addBreak() {
    setSlots((s) => [
      ...s,
      { id: `break-${Date.now()}`, type: 'break', label: 'Recess', startTime: '', endTime: '', order: s.length },
    ]);
  }

  function remove(id: string) {
    setSlots((s) => s.filter((slot) => slot.id !== id));
  }

  function move(index: number, dir: -1 | 1) {
    setSlots((s) => {
      const next = [...s];
      const target = index + dir;
      if (target < 0 || target >= next.length) return next;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  async function onSave() {
    setError('');
    setSaving(true);
    try {
      const reordered = slots.map((s, order) => ({ ...s, order }));
      await repo.periodSchedule.update({ slots: reordered });
      onClose();
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open={open}
      title="Manage Periods"
      width={520}
      onClose={onClose}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
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
        <div style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>
          This is the row order every class's timetable follows. Recess/break rows don't take up a period number —
          add one wherever it belongs (e.g. between P3 and P4) and the periods after it keep counting normally.
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Button variant="outline" onClick={addPeriod} icon={<Plus size={16} />}>
            Add Period
          </Button>
          <Button variant="outline" onClick={addBreak} icon={<Coffee size={16} />}>
            Add Break
          </Button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 360, overflowY: 'auto' }}>
          {slots.map((slot, i) => (
            <div
              key={slot.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '8px 10px',
                borderRadius: 8,
                background: 'var(--color-surface-alt, #f5f5f7)',
              }}
            >
              <span style={{ fontSize: 12, fontWeight: 600, width: 20, color: 'var(--color-text-tertiary)' }}>{i + 1}</span>
              <span style={{ flex: 1, fontSize: 14, fontWeight: slot.type === 'break' ? 400 : 600 }}>
                {slot.type === 'break' ? `${slot.label} (break)` : slot.label}
              </span>
              <IconButton icon={ArrowUp} onClick={() => move(i, -1)} aria-label="Move up" />
              <IconButton icon={ArrowDown} onClick={() => move(i, 1)} aria-label="Move down" />
              <IconButton icon={X} tone="danger" onClick={() => remove(slot.id)} aria-label="Remove row" />
            </div>
          ))}
        </div>
      </div>
    </Modal>
  );
}
