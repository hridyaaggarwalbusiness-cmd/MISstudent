import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Table, tableStyles } from '@/components/ui/Table';
import { TextField } from '@/components/ui/FormField';
import { SkeletonRows } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { PageHeader } from '@/pages/PageHeader';
import { useCollection } from '@/hooks/useCollection';
import { repo } from '@/data/repositories';
import type { Teacher, SchoolClass } from '@/types';
import styles from './TeachersPage.module.css';

interface FormState {
  name: string;
  email: string;
  password: string;
  phone: string;
  subjects: string;
  classIds: string[];
}

const emptyForm: FormState = { name: '', email: '', password: '', phone: '', subjects: '', classIds: [] };

function initials(name: string) {
  return name
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export function TeachersPage() {
  const { data: teachers, loading } = useCollection<Teacher>((cb) => repo.teachers.subscribeAll(cb));
  const { data: classes } = useCollection<SchoolClass>((cb) => repo.classes.subscribeAll(cb));
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);

  function openCreate() {
    setForm(emptyForm);
    setModalOpen(true);
  }

  function toggleClass(id: string) {
    setForm((f) => ({
      ...f,
      classIds: f.classIds.includes(id) ? f.classIds.filter((c) => c !== id) : [...f.classIds, id],
    }));
  }

  async function onCreate() {
    setSaving(true);
    try {
      await repo.teachers.create({
        email: form.email,
        password: form.password,
        displayName: form.name,
        profile: {
          name: form.name,
          email: form.email,
          phone: form.phone,
          subjects: form.subjects.split(',').map((s) => s.trim()).filter(Boolean),
          classIds: form.classIds,
          isClassTeacherOf: null,
        },
      });
      setModalOpen(false);
    } finally {
      setSaving(false);
    }
  }

  async function onDelete(id: string) {
    if (!confirm('Remove this teacher? Their account access will be revoked.')) return;
    await repo.teachers.remove(id);
  }

  return (
    <div>
      <PageHeader
        description="Manage teaching staff and their class assignments"
        toolbar={
          <Button onClick={openCreate} icon="+">
            Add Teacher
          </Button>
        }
      />

      <Card padded={false}>
        {loading ? (
          <div style={{ padding: 20 }}>
            <SkeletonRows count={5} />
          </div>
        ) : teachers.length === 0 ? (
          <EmptyState
            icon="🧑‍🏫"
            title="No teachers yet"
            description="Add teaching staff so they can manage homework, timetables and results."
            action={<Button onClick={openCreate}>Add Teacher</Button>}
          />
        ) : (
          <Table
            columns={[
              {
                key: 'name',
                header: 'Teacher',
                render: (t) => (
                  <div className={styles.avatarCell}>
                    <div className={styles.avatar}>{initials(t.name)}</div>
                    <div>
                      <div className={styles.name}>{t.name}</div>
                      <div className={styles.subtitle}>{t.email}</div>
                    </div>
                  </div>
                ),
              },
              { key: 'phone', header: 'Phone', render: (t) => t.phone },
              { key: 'subjects', header: 'Subjects', render: (t) => t.subjects.join(', ') || '—' },
              { key: 'classes', header: 'Classes', render: (t) => t.classIds.join(', ') || '—' },
              {
                key: 'actions',
                header: '',
                align: 'right',
                render: (t) => (
                  <div className={tableStyles.actions}>
                    <button
                      className={[tableStyles.iconButton, tableStyles.danger].join(' ')}
                      onClick={() => onDelete(t.id)}
                    >
                      🗑️
                    </button>
                  </div>
                ),
              },
            ]}
            rows={teachers}
            rowKey={(t) => t.id}
          />
        )}
      </Card>

      <Modal
        open={modalOpen}
        title="Add Teacher"
        onClose={() => setModalOpen(false)}
        footer={
          <>
            <Button variant="ghost" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={onCreate} loading={saving}>
              Create Account
            </Button>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <TextField label="Full Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <TextField
            label="Email"
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
          <TextField
            label="Temporary Password"
            type="password"
            hint="Teacher can change this after first login"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />
          <TextField label="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          <TextField
            label="Subjects"
            hint="Comma separated, e.g. Math, Physics"
            value={form.subjects}
            onChange={(e) => setForm({ ...form, subjects: e.target.value })}
          />
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-secondary)' }}>
              Assigned Classes
            </label>
            <div className={styles.checkboxGrid} style={{ marginTop: 8 }}>
              {classes.map((c) => (
                <div
                  key={c.id}
                  className={[styles.checkboxItem, form.classIds.includes(c.id) && styles.checkboxItemActive]
                    .filter(Boolean)
                    .join(' ')}
                  onClick={() => toggleClass(c.id)}
                >
                  {c.name} - {c.section}
                </div>
              ))}
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
