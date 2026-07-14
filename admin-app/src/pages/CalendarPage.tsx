import { useMemo, useState } from 'react';
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  isWithinInterval,
  parseISO,
  startOfDay,
  startOfMonth,
  startOfWeek,
  subMonths,
} from 'date-fns';
import { Plus, CalendarDays } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { TextField, TextAreaField, SelectField } from '@/components/ui/FormField';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorBanner } from '@/components/ui/ErrorBanner';
import { PageHeader } from '@/pages/PageHeader';
import { useCollection } from '@/hooks/useCollection';
import { repo } from '@/data/repositories';
import { getErrorMessage } from '@/utils/errors';
import { TONE_COLORS } from '@/utils/toneColors';
import type { BadgeTone } from '@/components/ui/Badge';
import type { CalendarEvent, CalendarEventType } from '@/types';
import styles from './CalendarPage.module.css';

const typeTone: Record<CalendarEventType, BadgeTone> = {
  holiday: 'success',
  exam: 'danger',
  function: 'violet',
  sports: 'info',
  meeting: 'neutral',
  competition: 'warning',
  other: 'neutral',
};

const eventTypes: CalendarEventType[] = ['holiday', 'exam', 'function', 'sports', 'meeting', 'competition', 'other'];

const emptyForm: Omit<CalendarEvent, 'id'> = {
  title: '',
  date: '',
  endDate: '',
  type: 'other',
  description: '',
  location: '',
};

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_ABBR = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function safeParse(dateStr: string): Date | null {
  try {
    const d = parseISO(dateStr);
    return Number.isNaN(d.getTime()) ? null : d;
  } catch {
    return null;
  }
}

function eventsOnDay(events: CalendarEvent[], day: Date): CalendarEvent[] {
  return events.filter((e) => {
    const start = safeParse(e.date);
    if (!start) return false;
    const end = (e.endDate && safeParse(e.endDate)) || start;
    return isWithinInterval(startOfDay(day), { start: startOfDay(start), end: startOfDay(end) });
  });
}

export function CalendarPage() {
  const { data: events, loading } = useCollection<CalendarEvent>((cb) => repo.calendar.subscribeAll(cb));
  const [monthCursor, setMonthCursor] = useState(() => startOfMonth(new Date()));
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<Omit<CalendarEvent, 'id'> & { id?: string }>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [listError, setListError] = useState('');

  function openCreate(date?: Date) {
    setForm({ ...emptyForm, date: date ? format(date, 'yyyy-MM-dd') : '' });
    setError('');
    setModalOpen(true);
  }

  function openEdit(ev: CalendarEvent) {
    setForm(ev);
    setError('');
    setModalOpen(true);
  }

  async function onSave() {
    if (!form.title.trim() || !form.date) {
      setError('Title and date are required.');
      return;
    }
    setError('');
    setSaving(true);
    try {
      await repo.calendar.upsert({ ...form, id: form.id ?? '' } as CalendarEvent);
      setModalOpen(false);
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setSaving(false);
    }
  }

  async function onDelete(id: string) {
    if (!confirm('Delete this event?')) return;
    setListError('');
    try {
      await repo.calendar.remove(id);
      setModalOpen(false);
    } catch (e) {
      setListError(getErrorMessage(e));
    }
  }

  const gridDays = useMemo(() => {
    const start = startOfWeek(startOfMonth(monthCursor));
    const end = endOfWeek(endOfMonth(monthCursor));
    return eachDayOfInterval({ start, end });
  }, [monthCursor]);

  const upcoming = useMemo(() => {
    const today = startOfDay(new Date());
    return [...events]
      .filter((e) => {
        const start = safeParse(e.date);
        const end = (e.endDate && safeParse(e.endDate)) || start;
        return end && end >= today;
      })
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [events]);

  return (
    <div>
      <PageHeader
        description="Manage holidays, exams and school events"
        toolbar={
          <Button onClick={() => openCreate()} icon={<Plus size={16} />}>
            Add Event
          </Button>
        }
      />

      {listError && (
        <div style={{ marginBottom: 16 }}>
          <ErrorBanner message={listError} />
        </div>
      )}

      {loading ? (
        <Card>
          <div style={{ padding: 20, color: 'var(--color-text-tertiary)' }}>Loading calendar…</div>
        </Card>
      ) : (
        <div className={styles.layout}>
          <Card>
            <div className={styles.monthBar}>
              <span className={styles.monthLabel}>{format(monthCursor, 'MMMM yyyy')}</span>
              <div className={styles.monthNav}>
                <button className={styles.todayBtn} onClick={() => setMonthCursor(startOfMonth(new Date()))}>
                  Today
                </button>
                <button className={styles.navBtn} onClick={() => setMonthCursor((m) => subMonths(m, 1))} aria-label="Previous month">
                  ‹
                </button>
                <button className={styles.navBtn} onClick={() => setMonthCursor((m) => addMonths(m, 1))} aria-label="Next month">
                  ›
                </button>
              </div>
            </div>

            <div className={styles.legend}>
              {eventTypes.map((t) => (
                <span key={t} className={styles.legendItem}>
                  <span className={styles.legendDot} style={{ background: TONE_COLORS[typeTone[t]].solid }} />
                  {t}
                </span>
              ))}
            </div>

            <div className={styles.weekHeader}>
              {WEEKDAYS.map((d) => (
                <div key={d} className={styles.weekHeaderCell}>
                  {d}
                </div>
              ))}
            </div>
            <div className={styles.monthGrid}>
              {gridDays.map((day) => {
                const dayEvents = eventsOnDay(events, day);
                const inMonth = isSameMonth(day, monthCursor);
                const today = isSameDay(day, new Date());
                const shown = dayEvents.slice(0, 3);
                const overflow = dayEvents.length - shown.length;
                return (
                  <div
                    key={day.toISOString()}
                    className={[styles.dayCell, !inMonth && styles.dayCellOutside, today && styles.dayCellToday]
                      .filter(Boolean)
                      .join(' ')}
                    onClick={() => (dayEvents.length === 1 ? openEdit(dayEvents[0]) : openCreate(day))}
                  >
                    <span className={styles.dayNumber}>
                      {today ? <span className={styles.dayNumberBadge}>{day.getDate()}</span> : day.getDate()}
                    </span>
                    {shown.map((e) => (
                      <span
                        key={e.id}
                        className={styles.eventChip}
                        style={{ background: TONE_COLORS[typeTone[e.type]].bg, color: TONE_COLORS[typeTone[e.type]].color }}
                        onClick={(evt) => {
                          evt.stopPropagation();
                          openEdit(e);
                        }}
                      >
                        {e.title}
                      </span>
                    ))}
                    {overflow > 0 && <span className={styles.eventMore}>+{overflow} more</span>}
                  </div>
                );
              })}
            </div>
          </Card>

          <div>
            <div className={styles.agendaTitle}>Upcoming Events</div>
            {upcoming.length === 0 ? (
              <Card>
                <EmptyState icon={<CalendarDays size={32} />} title="No upcoming events" description="Add holidays and events to the academic calendar." action={<Button onClick={() => openCreate()}>Add Event</Button>} />
              </Card>
            ) : (
              <div className={styles.agendaList}>
                {upcoming.map((e) => {
                  const d = safeParse(e.date);
                  const tone = typeTone[e.type];
                  return (
                    <div key={e.id} className={styles.agendaCard} onClick={() => openEdit(e)}>
                      <div className={styles.agendaDateChip} style={{ background: TONE_COLORS[tone].bg, color: TONE_COLORS[tone].color }}>
                        <span className={styles.agendaDay}>{d ? d.getDate() : '--'}</span>
                        <span className={styles.agendaMonth}>{d ? MONTH_ABBR[d.getMonth()] : ''}</span>
                      </div>
                      <div className={styles.agendaBody}>
                        <div className={styles.agendaEventTitle}>{e.title}</div>
                        <div className={styles.agendaMeta}>
                          {e.type}
                          {e.location ? ` · ${e.location}` : ''}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      <Modal
        open={modalOpen}
        title={form.id ? 'Edit Event' : 'Add Event'}
        onClose={() => setModalOpen(false)}
        footer={
          <>
            {form.id && (
              <Button variant="danger" onClick={() => onDelete(form.id!)}>
                Delete
              </Button>
            )}
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
          <TextField label="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <TextField label="Date" type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
            <TextField
              label="End Date"
              type="date"
              hint="Optional, for multi-day events"
              value={form.endDate}
              onChange={(e) => setForm({ ...form, endDate: e.target.value })}
            />
          </div>
          <SelectField label="Type" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as CalendarEventType })}>
            <option value="holiday">Holiday</option>
            <option value="exam">Exam</option>
            <option value="function">Function</option>
            <option value="sports">Sports</option>
            <option value="meeting">Meeting</option>
            <option value="competition">Competition</option>
            <option value="other">Other</option>
          </SelectField>
          <TextField label="Location" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
          <TextAreaField
            label="Description"
            hint="Optional"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
        </div>
      </Modal>
    </div>
  );
}
