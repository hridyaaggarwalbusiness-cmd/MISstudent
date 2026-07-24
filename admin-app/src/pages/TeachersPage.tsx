import { useState } from 'react';
import { Upload, Plus, GraduationCap, Trash2 } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Avatar } from '@/components/ui/Avatar';
import { IconButton } from '@/components/ui/IconButton';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Table, tableStyles } from '@/components/ui/Table';
import { TextField, SelectField } from '@/components/ui/FormField';
import { SkeletonRows } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorBanner } from '@/components/ui/ErrorBanner';
import { BulkImportModal, type BulkImportColumn } from '@/components/import/BulkImportModal';
import { SpreadsheetGrid, type SpreadsheetRowStatus } from '@/components/ui/SpreadsheetGrid';
import { ViewToggle } from '@/components/ui/ViewToggle';
import { PageHeader } from '@/pages/PageHeader';
import { useCollection } from '@/hooks/useCollection';
import { useQuickActionIntent } from '@/hooks/useQuickActionIntent';
import { useConfirm } from '@/components/ui/ConfirmDialog';
import { useToast } from '@/components/ui/Toast';
import { repo } from '@/data/repositories';
import { getErrorMessage } from '@/utils/errors';
import { generateTempPassword } from '@/utils/password';
import { classLabelById, resolveSingleClassLabel } from '@/utils/classLabels';
import type { Teacher, SchoolClass } from '@/types';
import styles from './TeachersPage.module.css';

interface FormState {
  name: string;
  email: string;
  password: string;
  phone: string;
  isClassTeacherOf: string;
}

const emptyForm: FormState = { name: '', email: '', password: '', phone: '', isClassTeacherOf: '' };

interface ImportRow {
  name: string;
  email: string;
  password: string;
  phone: string;
  isClassTeacherOf: string | null;
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
  const confirm = useConfirm();
  const { show } = useToast();

  function openCreate() {
    setForm(emptyForm);
    setError('');
    setModalOpen(true);
  }

  useQuickActionIntent(!loading, openCreate);

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
      const isClassTeacherOf = form.isClassTeacherOf || null;
      const teacherId = await repo.teachers.create({
        email: form.email.trim(),
        password: form.password,
        displayName: form.name.trim(),
        profile: {
          name: form.name.trim(),
          email: form.email.trim(),
          phone: form.phone.trim(),
          isClassTeacherOf,
        },
      });
      if (isClassTeacherOf) await repo.classes.setClassTeacher(teacherId, isClassTeacherOf);
      setModalOpen(false);
      show('Teacher added');
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setSaving(false);
    }
  }

  async function onDelete(id: string) {
    const ok = await confirm({
      title: 'Remove teacher',
      message: 'Remove this teacher? Their account access will be revoked.',
      confirmLabel: 'Remove',
    });
    if (!ok) return;
    setListError('');
    try {
      await repo.teachers.remove(id);
      show('Teacher removed');
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
    { key: 'classTeacherOf', label: 'Class Teacher Of', width: '180px' },
  ];

  const spreadsheetRows = teachers.map((t) => ({
    name: t.name,
    email: t.email,
    phone: t.phone,
    classTeacherOf: t.isClassTeacherOf ? classLabel(t.isClassTeacherOf) : '',
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

    if (key === 'classTeacherOf') {
      if (!value.trim()) {
        flashStatus(rowIndex, { tone: 'busy' });
        try {
          await repo.classes.setClassTeacher(teacher.id, null);
          flashStatus(rowIndex, { tone: 'success' });
        } catch (e) {
          flashStatus(rowIndex, { tone: 'error', message: getErrorMessage(e) });
        }
        return;
      }
      const resolved = resolveSingleClassLabel(value, classes);
      if ('error' in resolved) {
        flashStatus(rowIndex, { tone: 'error', message: resolved.error });
        return;
      }
      flashStatus(rowIndex, { tone: 'busy' });
      try {
        await repo.classes.setClassTeacher(teacher.id, resolved.cls.id);
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
    { key: 'classTeacherOf', label: 'Class Teacher Of', aliases: ['class teacher', 'class incharge'] },
  ];

  function mapImportRow(cells: Record<string, string>): { value: ImportRow } | { error: string } {
    const name = (cells.name ?? '').trim();
    const email = (cells.email ?? '').trim();
    if (!name) return { error: 'Missing name' };
    if (!/^\S+@\S+\.\S+$/.test(email)) return { error: 'Invalid or missing email' };

    const classTeacherOfText = (cells.classTeacherOf ?? '').trim();
    let isClassTeacherOf: string | null = null;
    if (classTeacherOfText) {
      const resolved = resolveSingleClassLabel(classTeacherOfText, classes);
      if ('error' in resolved) return { error: resolved.error };
      isClassTeacherOf = resolved.cls.id;
    }

    return {
      value: {
        name,
        email,
        password: (cells.password ?? '').trim() || generateTempPassword(),
        phone: (cells.phone ?? '').trim(),
        isClassTeacherOf,
      },
    };
  }

  async function importTeacherRow(row: ImportRow): Promise<string> {
    const teacherId = await repo.teachers.create({
      email: row.email,
      password: row.password,
      displayName: row.name,
      profile: {
        name: row.name,
        email: row.email,
        phone: row.phone,
        isClassTeacherOf: row.isClassTeacherOf,
      },
    });
    if (row.isClassTeacherOf) await repo.classes.setClassTeacher(teacherId, row.isClassTeacherOf);
    return `password: ${row.password}`;
  }

  return (
    <div>
      <PageHeader
        title="Teachers"
        description="Manage teaching staff and their class assignments"
        toolbar={
          <>
            <ViewToggle value={view} onChange={setView} />
            <Button variant="outline" onClick={() => setImportOpen(true)} icon={<Upload size={16} />}>
              Bulk Import
            </Button>
            <Button onClick={openCreate} icon={<Plus size={16} />}>
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
            icon={<GraduationCap size={32} />}
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
                    <Avatar name={t.name} />
                    <div>
                      <div className={styles.name}>{t.name}</div>
                      <div className={styles.subtitle}>{t.email}</div>
                    </div>
                  </div>
                ),
              },
              { key: 'phone', header: 'Phone', render: (t) => t.phone },
              { key: 'classTeacherOf', header: 'Class Teacher Of', render: (t) => (t.isClassTeacherOf ? classLabel(t.isClassTeacherOf) : '—') },
              {
                key: 'actions',
                header: '',
                align: 'right',
                render: (t) => (
                  <div className={tableStyles.actions}>
                    <IconButton icon={Trash2} tone="danger" onClick={() => onDelete(t.id)} aria-label="Delete teacher" />
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
          <SelectField
            label="Class Teacher Of (optional)"
            hint="Only if this teacher is in charge of a homeroom class - any teacher can teach any class regardless."
            value={form.isClassTeacherOf}
            onChange={(e) => setForm({ ...form, isClassTeacherOf: e.target.value })}
          >
            <option value="">None</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} - {c.section}
              </option>
            ))}
          </SelectField>
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
