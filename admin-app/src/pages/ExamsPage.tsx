import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Table, tableStyles } from '@/components/ui/Table';
import { TextField, SelectField } from '@/components/ui/FormField';
import { SkeletonRows } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { PageHeader } from '@/pages/PageHeader';
import { useCollection } from '@/hooks/useCollection';
import { repo } from '@/data/repositories';
import type { Exam, SchoolClass, ExamStatus } from '@/types';

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

export function ExamsPage() {
  const { data: exams, loading } = useCollection<Exam>((cb) => repo.exams.subscribeAll(cb));
  const { data: classes } = useCollection<SchoolClass>((cb) => repo.classes.subscribeAll(cb));
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<Omit<Exam, 'id'> & { id?: string }>(emptyForm);
  const [saving, setSaving] = useState(false);

  function openCreate() {
    setForm(emptyForm);
    setModalOpen(true);
  }

  function openEdit(exam: Exam) {
    setForm(exam);
    setModalOpen(true);
  }

  async function onSave() {
    setSaving(true);
    try {
      await repo.exams.upsert({ ...form, id: form.id ?? '' } as Exam);
      setModalOpen(false);
    } finally {
      setSaving(false);
    }
  }

  async function onDelete(id: string) {
    if (!confirm('Delete this exam?')) return;
    await repo.exams.remove(id);
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

      <Card padded={false}>
        {loading ? (
          <div style={{ padding: 20 }}>
            <SkeletonRows count={5} />
          </div>
        ) : exams.length === 0 ? (
          <EmptyState icon="🧪" title="No exams scheduled" description="Schedule exams so teachers can enter results." action={<Button onClick={openCreate}>Add Exam</Button>} />
        ) : (
          <Table
            columns={[
              { key: 'name', header: 'Exam', render: (e) => e.name },
              { key: 'subject', header: 'Subject', render: (e) => e.subject },
              { key: 'class', header: 'Class', render: (e) => e.classId },
              { key: 'date', header: 'Date', render: (e) => `${e.date} · ${e.startTime}-${e.endTime}` },
              { key: 'status', header: 'Status', render: (e) => <Badge label={e.status} tone={statusTone[e.status]} /> },
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
            rows={exams}
            rowKey={(e) => e.id}
          />
        )}
      </Card>

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
