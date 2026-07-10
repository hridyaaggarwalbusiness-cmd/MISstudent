import { useState } from 'react';
import { format, parseISO } from 'date-fns';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Table, tableStyles } from '@/components/ui/Table';
import { TextField, TextAreaField, SelectField } from '@/components/ui/FormField';
import { SkeletonRows } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { PageHeader } from '@/pages/PageHeader';
import { useCollection } from '@/hooks/useCollection';
import { repo } from '@/data/repositories';
import type { CalendarEvent, CalendarEventType } from '@/types';

const typeTone: Record<CalendarEventType, 'success' | 'danger' | 'violet' | 'info' | 'neutral' | 'warning'> = {
  holiday: 'success',
  exam: 'danger',
  function: 'violet',
  sports: 'info',
  meeting: 'neutral',
  competition: 'warning',
  other: 'neutral',
};

const emptyForm: Omit<CalendarEvent, 'id'> = {
  title: '',
  date: '',
  endDate: '',
  type: 'other',
  description: '',
  location: '',
};

export function CalendarPage() {
  const { data: events, loading } = useCollection<CalendarEvent>((cb) => repo.calendar.subscribeAll(cb));
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<Omit<CalendarEvent, 'id'> & { id?: string }>(emptyForm);
  const [saving, setSaving] = useState(false);

  function openCreate() {
    setForm(emptyForm);
    setModalOpen(true);
  }

  function openEdit(ev: CalendarEvent) {
    setForm(ev);
    setModalOpen(true);
  }

  async function onSave() {
    setSaving(true);
    try {
      await repo.calendar.upsert({ ...form, id: form.id ?? '' } as CalendarEvent);
      setModalOpen(false);
    } finally {
      setSaving(false);
    }
  }

  async function onDelete(id: string) {
    if (!confirm('Delete this event?')) return;
    await repo.calendar.remove(id);
  }

  return (
    <div>
      <PageHeader
        description="Manage holidays, exams and school events"
        toolbar={
          <Button onClick={openCreate} icon="+">
            Add Event
          </Button>
        }
      />

      <Card padded={false}>
        {loading ? (
          <div style={{ padding: 20 }}>
            <SkeletonRows count={5} />
          </div>
        ) : events.length === 0 ? (
          <EmptyState icon="📅" title="No events yet" description="Add holidays and events to the academic calendar." action={<Button onClick={openCreate}>Add Event</Button>} />
        ) : (
          <Table
            columns={[
              { key: 'title', header: 'Event', render: (e) => e.title },
              {
                key: 'date',
                header: 'Date',
                render: (e) => {
                  try {
                    return format(parseISO(e.date), 'd MMM yyyy');
                  } catch {
                    return e.date;
                  }
                },
              },
              { key: 'type', header: 'Type', render: (e) => <Badge label={e.type} tone={typeTone[e.type]} /> },
              { key: 'location', header: 'Location', render: (e) => e.location || '—' },
              {
                key: 'actions',
                header: '',
                align: 'right',
                render: (e) => (
                  <div className={tableStyles.actions}>
                    <button className={tableStyles.iconButton} onClick={() => openEdit(e)}>
                      ✏️
                    </button>
                    <button className={[tableStyles.iconButton, tableStyles.danger].join(' ')} onClick={() => onDelete(e.id)}>
                      🗑️
                    </button>
                  </div>
                ),
              },
            ]}
            rows={events}
            rowKey={(e) => e.id}
          />
        )}
      </Card>

      <Modal
        open={modalOpen}
        title={form.id ? 'Edit Event' : 'Add Event'}
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
