import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Table } from '@/components/ui/Table';
import { TextField, SelectField } from '@/components/ui/FormField';
import { SkeletonRows } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorBanner } from '@/components/ui/ErrorBanner';
import { PageHeader } from '@/pages/PageHeader';
import { useCollection } from '@/hooks/useCollection';
import { repo } from '@/data/repositories';
import { getErrorMessage } from '@/utils/errors';
import type { SchoolClass, Teacher } from '@/types';
import { tableStyles } from '@/components/ui/Table';

const emptyForm: SchoolClass = { id: '', name: '', section: '', classTeacherId: '', studentCount: 0 };

export function ClassesPage() {
  const { data: classes, loading } = useCollection<SchoolClass>((cb) => repo.classes.subscribeAll(cb));
  const { data: teachers } = useCollection<Teacher>((cb) => repo.teachers.subscribeAll(cb));
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<SchoolClass>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [listError, setListError] = useState('');

  function openCreate() {
    setForm(emptyForm);
    setError('');
    setModalOpen(true);
  }

  function openEdit(cls: SchoolClass) {
    setForm(cls);
    setError('');
    setModalOpen(true);
  }

  async function onSave() {
    if (!form.name.trim() || !form.section.trim()) {
      setError('Class name and section are required.');
      return;
    }
    setError('');
    setSaving(true);
    try {
      const id = form.id || `${form.name.toLowerCase().replace(/\s+/g, '')}-${form.section.toLowerCase()}`;
      await repo.classes.upsert({ ...form, id });
      setModalOpen(false);
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setSaving(false);
    }
  }

  async function onDelete(id: string) {
    if (!confirm('Delete this class? This cannot be undone.')) return;
    setListError('');
    try {
      await repo.classes.remove(id);
    } catch (e) {
      setListError(getErrorMessage(e));
    }
  }

  const teacherName = (id: string) => teachers.find((t) => t.id === id)?.name ?? '—';

  return (
    <div>
      <PageHeader
        description="Manage grade sections and assign class teachers"
        toolbar={
          <Button onClick={openCreate} icon="+">
            Add Class
          </Button>
        }
      />

      {listError && (
        <div style={{ marginBottom: 16 }}>
          <ErrorBanner message={listError} />
        </div>
      )}

      <Card padded={false}>
        {loading ? (
          <div style={{ padding: 20 }}>
            <SkeletonRows count={5} />
          </div>
        ) : classes.length === 0 ? (
          <EmptyState
            icon="🏫"
            title="No classes yet"
            description="Create your first class to start organizing students and teachers."
            action={<Button onClick={openCreate}>Add Class</Button>}
          />
        ) : (
          <Table
            columns={[
              { key: 'name', header: 'Class', render: (c) => `${c.name} - ${c.section}` },
              { key: 'teacher', header: 'Class Teacher', render: (c) => teacherName(c.classTeacherId) },
              {
                key: 'count',
                header: 'Students',
                render: (c) => <Badge label={String(c.studentCount)} tone="info" />,
              },
              {
                key: 'actions',
                header: '',
                align: 'right',
                render: (c) => (
                  <div className={tableStyles.actions}>
                    <button className={tableStyles.iconButton} onClick={() => openEdit(c)}>
                      ✏️
                    </button>
                    <button
                      className={[tableStyles.iconButton, tableStyles.danger].join(' ')}
                      onClick={() => onDelete(c.id)}
                    >
                      🗑️
                    </button>
                  </div>
                ),
              },
            ]}
            rows={classes}
            rowKey={(c) => c.id}
          />
        )}
      </Card>

      <Modal
        open={modalOpen}
        title={form.id ? 'Edit Class' : 'Add Class'}
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
          <TextField
            label="Grade / Class Name"
            placeholder="e.g. Grade 9"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
          <TextField
            label="Section"
            placeholder="e.g. B"
            value={form.section}
            onChange={(e) => setForm({ ...form, section: e.target.value })}
          />
          <SelectField
            label="Class Teacher"
            value={form.classTeacherId}
            onChange={(e) => setForm({ ...form, classTeacherId: e.target.value })}
          >
            <option value="">Unassigned</option>
            {teachers.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </SelectField>
          <TextField
            label="Student Count"
            type="number"
            value={form.studentCount}
            onChange={(e) => setForm({ ...form, studentCount: Number(e.target.value) })}
          />
        </div>
      </Modal>
    </div>
  );
}
