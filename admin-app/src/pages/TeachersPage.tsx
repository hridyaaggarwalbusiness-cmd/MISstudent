import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Table, tableStyles } from '@/components/ui/Table';
import { TextField } from '@/components/ui/FormField';
import { SkeletonRows } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorBanner } from '@/components/ui/ErrorBanner';
import { BulkImportModal, type BulkImportColumn } from '@/components/import/BulkImportModal';
import { SpreadsheetGrid, type SpreadsheetRowStatus } from '@/components/ui/SpreadsheetGrid';
import { ViewToggle } from '@/components/ui/ViewToggle';
import { PageHeader } from '@/pages/PageHeader';
import { useCollection } from '@/hooks/useCollection';
import { repo } from '@/data/repositories';
import { getErrorMessage } from '@/utils/errors';
import { generateTempPassword } from '@/utils/password';
import { classLabelById, resolveClassLabels } from '@/utils/classLabels';
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

interface ImportRow {
  name: string;
  email: string;
  password: string;
  phone: string;
  subjects: string[];
  classIds: string[];
}

export function TeachersPage() {
  const { data: teachers, loading } = useCollection<Teacher>((cb) => repo.teachers.subscribeAll(cb));
  const { data: classes } = useCollection<SchoolClass>((cb) => repo.classes.subscribeAll(cb));
  const [modalOpen, setModalOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [listError, setListError] = useState('');
  const [view, setView] = useState<'list' | 'spreadsheet'>('list');
  const [cellStatus, setCellStatus] = useState<Record<number, SpreadsheetRowStatus>>({});

  function openCreate() {
    setForm(emptyForm);
    setError('');
    setModalOpen(true);
  }

  function toggleClass(id: string) {
    setForm((f) => ({
      ...f,
      classIds: f.classIds.includes(id) ? f.classIds.filter((c) => c !== id) : [...f.classIds, id],
    }));
  }

  function validate(f: Pick<FormState, 'name' | 'email' | 'password'>): string | null {
    if (!f.name.trim()) return 'Full name is required.';
    if (!/^\S+@\S+\.\S+$/.test(f.email.trim())) return 'Enter a valid email address.';
    if (f.password.length < 6) return 'Password must be at least 6 characters.';
    return null;
  }

  async function onCreate() {
    const validationError = validate(form);
    if (validationError) {
      setError(validationError);
      return;
    }
    setError('');
    setSaving(true);
    try {
      await repo.teachers.create({
        email: form.email.trim(),
        password: form.password,
        displayName: form.name.trim(),
        profile: {
          name: form.name.trim(),
          email: form.email.trim(),
          phone: form.phone.trim(),
          subjects: form.subjects.split(',').map((s) => s.trim()).filter(Boolean),
          classIds: form.classIds,
          isClassTeacherOf: null,
        },
      });
      setModalOpen(false);
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setSaving(false);
    }
  }

  async function onDelete(id: string) {
    if (!confirm('Remove this teacher? Their account access will be revoked.')) return;
    setListError('');
    try {
      await repo.teachers.remove(id);
    } catch (e) {
      setListError(getErrorMessage(e));
    }
  }

  function classLabel(id: string) {
    return classLabelById(id, classes);
  }

  const spreadsheetColumns = [
    { key: 'name', label: 'Name', required: true, width: '180px' },
    { key: 'email', label: 'Email', readOnly: true, width: '200px' },
    { key: 'phone', label: 'Phone', width: '130px' },
    { key: 'subjects', label: 'Subjects', width: '180px' },
    { key: 'classes', label: 'Classes', width: '220px' },
  ];

  const spreadsheetRows = teachers.map((t) => ({
    name: t.name,
    email: t.email,
    phone: t.phone,
    subjects: t.subjects.join(', '),
    classes: t.classIds.map(classLabel).join(', '),
  }));

  const spreadsheetRowStatuses = teachers.map((_, i) => cellStatus[i]);

  function flashStatus(rowIndex: number, status: SpreadsheetRowStatus, holdMs = 1800) {
    setCellStatus((prev) => ({ ...prev, [rowIndex]: status }));
    if (status.tone === 'success') {
      setTimeout(() => {
        setCellStatus((prev) => {
          if (prev[rowIndex] !== status) return prev;
          const next = { ...prev };
          delete next[rowIndex];
          return next;
        });
      }, holdMs);
    }
  }

  async function onSpreadsheetCellCommit(rowIndex: number, key: string, value: string) {
    const teacher = teachers[rowIndex];
    if (!teacher) return;

    if (key === 'subjects') {
      flashStatus(rowIndex, { tone: 'busy' });
      try {
        await repo.teachers.update(teacher.id, {
          subjects: value.split(/[;,]/).map((s) => s.trim()).filter(Boolean),
        });
        flashStatus(rowIndex, { tone: 'success' });
      } catch (e) {
        flashStatus(rowIndex, { tone: 'error', message: getErrorMessage(e) });
      }
      return;
    }

    if (key === 'classes') {
      const resolved = resolveClassLabels(value, classes);
      if ('error' in resolved) {
        flashStatus(rowIndex, { tone: 'error', message: resolved.error });
        return;
      }
      flashStatus(rowIndex, { tone: 'busy' });
      try {
        await repo.teachers.update(teacher.id, { classIds: resolved.ids });
        flashStatus(rowIndex, { tone: 'success' });
      } catch (e) {
        flashStatus(rowIndex, { tone: 'error', message: getErrorMessage(e) });
      }
      return;
    }

    if (key === 'name' && !value.trim()) {
      flashStatus(rowIndex, { tone: 'error', message: 'Name is required' });
      return;
    }

    flashStatus(rowIndex, { tone: 'busy' });
    try {
      await repo.teachers.update(teacher.id, { [key]: value });
      flashStatus(rowIndex, { tone: 'success' });
    } catch (e) {
      flashStatus(rowIndex, { tone: 'error', message: getErrorMessage(e) });
    }
  }

  const importColumns: BulkImportColumn[] = [
    { key: 'name', label: 'Name', required: true },
    { key: 'email', label: 'Email', required: true },
    { key: 'password', label: 'Password', aliases: ['temporary password'] },
    { key: 'phone', label: 'Phone' },
    { key: 'subjects', label: 'Subjects', aliases: ['subject'] },
    { key: 'classes', label: 'Classes', aliases: ['class'] },
  ];

  function mapImportRow(cells: Record<string, string>): { value: ImportRow } | { error: string } {
    const name = (cells.name ?? '').trim();
    const email = (cells.email ?? '').trim();
    if (!name) return { error: 'Missing name' };
    if (!/^\S+@\S+\.\S+$/.test(email)) return { error: 'Invalid or missing email' };

    const resolved = resolveClassLabels(cells.classes ?? '', classes);
    if ('error' in resolved) return { error: resolved.error };
    const classIds = resolved.ids;

    return {
      value: {
        name,
        email,
        password: (cells.password ?? '').trim() || generateTempPassword(),
        phone: (cells.phone ?? '').trim(),
        subjects: (cells.subjects ?? '')
          .split(/[;,]/)
          .map((s) => s.trim())
          .filter(Boolean),
        classIds,
      },
    };
  }

  async function importTeacherRow(row: ImportRow): Promise<string> {
    await repo.teachers.create({
      email: row.email,
      password: row.password,
      displayName: row.name,
      profile: {
        name: row.name,
        email: row.email,
        phone: row.phone,
        subjects: row.subjects,
        classIds: row.classIds,
        isClassTeacherOf: null,
      },
    });
    return `password: ${row.password}`;
  }

  return (
    <div>
      <PageHeader
        description="Manage teaching staff and their class assignments"
        toolbar={
          <>
            <ViewToggle value={view} onChange={setView} />
            <Button variant="outline" onClick={() => setImportOpen(true)} icon="📋">
              Bulk Import
            </Button>
            <Button onClick={openCreate} icon="+">
              Add Teacher
            </Button>
          </>
        }
      />

      {listError && (
        <div style={{ marginBottom: 16 }}>
          <ErrorBanner message={listError} />
        </div>
      )}

      {!loading && teachers.length > 0 && view === 'spreadsheet' ? (
        <div style={{ marginBottom: 16 }}>
          <div className={styles.subtitle} style={{ marginBottom: 8 }}>
            Edit any cell to update it live. Email is fixed to the sign-in account and can't be changed here.
          </div>
          <SpreadsheetGrid
            columns={spreadsheetColumns}
            rows={spreadsheetRows}
            rowStatuses={spreadsheetRowStatuses}
            onCellCommit={onSpreadsheetCellCommit}
          />
        </div>
      ) : (
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
              { key: 'classes', header: 'Classes', render: (t) => t.classIds.map(classLabel).join(', ') || '—' },
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
      )}

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
          {error && <ErrorBanner message={error} />}
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
            hint="At least 6 characters. Teacher can change this after first login."
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

      <BulkImportModal<ImportRow>
        open={importOpen}
        onClose={() => setImportOpen(false)}
        title="Bulk Import Teachers"
        columns={importColumns}
        mapRow={mapImportRow}
        importRow={importTeacherRow}
      />
    </div>
  );
}
