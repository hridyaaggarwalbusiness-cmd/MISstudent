import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Upload, Plus, GraduationCap, Trash2 } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Avatar } from '@/components/ui/Avatar';
import { IconButton } from '@/components/ui/IconButton';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Table, tableStyles } from '@/components/ui/Table';
import { TextField, SelectField } from '@/components/ui/FormField';
import { SkeletonRows } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorBanner } from '@/components/ui/ErrorBanner';
import { BulkImportModal, type BulkImportColumn } from '@/components/import/BulkImportModal';
import { SpreadsheetGrid, type SpreadsheetRowStatus } from '@/components/ui/SpreadsheetGrid';
import { ViewToggle } from '@/components/ui/ViewToggle';
import { PageHeader, pageHeaderStyles } from '@/pages/PageHeader';
import { useCollection } from '@/hooks/useCollection';
import { useQuickActionIntent } from '@/hooks/useQuickActionIntent';
import { useConfirm } from '@/components/ui/ConfirmDialog';
import { useToast } from '@/components/ui/Toast';
import { repo } from '@/data/repositories';
import { getErrorMessage } from '@/utils/errors';
import { generateTempPassword } from '@/utils/password';
import { resolveSingleClassLabel } from '@/utils/classLabels';
import type { Student, SchoolClass } from '@/types';
import styles from './TeachersPage.module.css';

interface FormState {
  name: string;
  email: string;
  password: string;
  classId: string;
  rollNumber: string;
  admissionNumber: string;
  dateOfBirth: string;
  gender: string;
  bloodGroup: string;
  phone: string;
  address: string;
  fatherName: string;
  motherName: string;
  guardianPhone: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  emergencyContactRelation: string;
}

const emptyForm: FormState = {
  name: '',
  email: '',
  password: '',
  classId: '',
  rollNumber: '',
  admissionNumber: '',
  dateOfBirth: '',
  gender: '',
  bloodGroup: '',
  phone: '',
  address: '',
  fatherName: '',
  motherName: '',
  guardianPhone: '',
  emergencyContactName: '',
  emergencyContactPhone: '',
  emergencyContactRelation: '',
};

interface ImportRow {
  name: string;
  email: string;
  password: string;
  classId: string;
  className: string;
  section: string;
  rollNumber: string;
  admissionNumber: string;
  phone: string;
  guardianPhone: string;
}

export function StudentsPage() {
  const [searchParams] = useSearchParams();
  const { data: students, loading } = useCollection<Student>((cb) => repo.students.subscribeAll(cb));
  const { data: classes } = useCollection<SchoolClass>((cb) => repo.classes.subscribeAll(cb));
  const [modalOpen, setModalOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [listError, setListError] = useState('');
  const [classFilter, setClassFilter] = useState('');
  const [search, setSearch] = useState(() => searchParams.get('q') ?? '');
  const [view, setView] = useState<'list' | 'spreadsheet'>('list');
  const [cellStatus, setCellStatus] = useState<Record<number, SpreadsheetRowStatus>>({});
  const confirm = useConfirm();
  const { show } = useToast();

  const filtered = useMemo(
    () =>
      students.filter((s) => {
        if (classFilter && s.classId !== classFilter) return false;
        if (search && !s.name.toLowerCase().includes(search.toLowerCase()) && !s.rollNumber.includes(search))
          return false;
        return true;
      }),
    [students, classFilter, search],
  );

  function openCreate() {
    setForm(emptyForm);
    setError('');
    setModalOpen(true);
  }

  useQuickActionIntent(!loading, openCreate);

  function validate(f: FormState): string | null {
    if (!f.name.trim()) return 'Full name is required.';
    if (!/^\S+@\S+\.\S+$/.test(f.email.trim())) return 'Enter a valid email address.';
    if (f.password.length < 6) return 'Password must be at least 6 characters.';
    if (!f.classId) return 'Select a class.';
    if (!f.rollNumber.trim()) return 'Roll number is required.';
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
      const cls = classes.find((c) => c.id === form.classId);
      await repo.students.create({
        email: form.email.trim(),
        password: form.password,
        displayName: form.name.trim(),
        profile: {
          name: form.name.trim(),
          classId: form.classId,
          className: cls?.name ?? '',
          section: cls?.section ?? '',
          rollNumber: form.rollNumber.trim(),
          admissionNumber: form.admissionNumber.trim(),
          dateOfBirth: form.dateOfBirth,
          bloodGroup: form.bloodGroup,
          gender: form.gender,
          email: form.email.trim(),
          phone: form.phone.trim(),
          address: form.address.trim(),
          fatherName: form.fatherName.trim(),
          motherName: form.motherName.trim(),
          guardianPhone: form.guardianPhone.trim(),
          emergencyContactName: form.emergencyContactName.trim(),
          emergencyContactPhone: form.emergencyContactPhone.trim(),
          emergencyContactRelation: form.emergencyContactRelation.trim(),
        },
      });
      setModalOpen(false);
      show('Student added');
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setSaving(false);
    }
  }

  async function onDelete(id: string) {
    const ok = await confirm({
      title: 'Remove student',
      message: 'Remove this student? Their account access will be revoked.',
      confirmLabel: 'Remove',
    });
    if (!ok) return;
    setListError('');
    try {
      await repo.students.remove(id);
      show('Student removed');
    } catch (e) {
      setListError(getErrorMessage(e));
    }
  }

  const importColumns: BulkImportColumn[] = [
    { key: 'name', label: 'Name', required: true },
    { key: 'email', label: 'Email', required: true },
    { key: 'class', label: 'Class', required: true, aliases: ['classes'] },
    { key: 'rollNumber', label: 'Roll Number', aliases: ['roll no', 'roll'], required: true },
    { key: 'password', label: 'Password', aliases: ['temporary password'] },
    { key: 'admissionNumber', label: 'Admission Number', aliases: ['admission no'] },
    { key: 'phone', label: 'Phone' },
    { key: 'guardianPhone', label: 'Guardian Phone' },
  ];

  function mapImportRow(cells: Record<string, string>): { value: ImportRow } | { error: string } {
    const name = (cells.name ?? '').trim();
    const email = (cells.email ?? '').trim();
    const classLabel = (cells.class ?? '').trim();
    const rollNumber = (cells.rollNumber ?? '').trim();

    if (!name) return { error: 'Missing name' };
    if (!/^\S+@\S+\.\S+$/.test(email)) return { error: 'Invalid or missing email' };
    if (!rollNumber) return { error: 'Missing roll number' };
    const resolved = resolveSingleClassLabel(classLabel, classes);
    if ('error' in resolved) return { error: resolved.error };
    const cls = resolved.cls;

    return {
      value: {
        name,
        email,
        password: (cells.password ?? '').trim() || generateTempPassword(),
        classId: cls.id,
        className: cls.name,
        section: cls.section,
        rollNumber,
        admissionNumber: (cells.admissionNumber ?? '').trim(),
        phone: (cells.phone ?? '').trim(),
        guardianPhone: (cells.guardianPhone ?? '').trim(),
      },
    };
  }

  async function importStudentRow(row: ImportRow): Promise<string> {
    await repo.students.create({
      email: row.email,
      password: row.password,
      displayName: row.name,
      profile: {
        name: row.name,
        classId: row.classId,
        className: row.className,
        section: row.section,
        rollNumber: row.rollNumber,
        admissionNumber: row.admissionNumber,
        dateOfBirth: '',
        bloodGroup: '',
        gender: '',
        email: row.email,
        phone: row.phone,
        address: '',
        fatherName: '',
        motherName: '',
        guardianPhone: row.guardianPhone,
        emergencyContactName: '',
        emergencyContactPhone: '',
        emergencyContactRelation: '',
      },
    });
    return `password: ${row.password}`;
  }

  const spreadsheetColumns = [
    { key: 'name', label: 'Name', required: true, width: '170px' },
    { key: 'email', label: 'Email', readOnly: true, width: '190px' },
    { key: 'class', label: 'Class', width: '130px' },
    { key: 'rollNumber', label: 'Roll No.', width: '100px' },
    { key: 'admissionNumber', label: 'Admission No.', width: '130px' },
    { key: 'phone', label: 'Phone', width: '120px' },
    { key: 'guardianPhone', label: 'Guardian Phone', width: '140px' },
  ];

  const spreadsheetRows = filtered.map((s) => ({
    name: s.name,
    email: s.email,
    class: `${s.className} - ${s.section}`,
    rollNumber: s.rollNumber,
    admissionNumber: s.admissionNumber,
    phone: s.phone,
    guardianPhone: s.guardianPhone,
  }));

  const spreadsheetRowStatuses = filtered.map((_, i) => cellStatus[i]);

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
    const student = filtered[rowIndex];
    if (!student) return;

    if (key === 'class') {
      const resolved = resolveSingleClassLabel(value, classes);
      if ('error' in resolved) {
        flashStatus(rowIndex, { tone: 'error', message: resolved.error });
        return;
      }
      flashStatus(rowIndex, { tone: 'busy' });
      try {
        await repo.students.update(student.id, {
          classId: resolved.cls.id,
          className: resolved.cls.name,
          section: resolved.cls.section,
        });
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
    if (key === 'rollNumber' && !value.trim()) {
      flashStatus(rowIndex, { tone: 'error', message: 'Roll number is required' });
      return;
    }

    flashStatus(rowIndex, { tone: 'busy' });
    try {
      await repo.students.update(student.id, { [key]: value });
      flashStatus(rowIndex, { tone: 'success' });
    } catch (e) {
      flashStatus(rowIndex, { tone: 'error', message: getErrorMessage(e) });
    }
  }

  return (
    <div>
      <PageHeader
        title="Students"
        description="Manage student records, class assignments and guardians"
        toolbar={
          <>
            <input
              className={pageHeaderStyles.search}
              placeholder="Search name or roll no..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <select
              className={pageHeaderStyles.select}
              value={classFilter}
              onChange={(e) => setClassFilter(e.target.value)}
            >
              <option value="">All Classes</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} - {c.section}
                </option>
              ))}
            </select>
            <ViewToggle value={view} onChange={setView} />
            <Button variant="outline" onClick={() => setImportOpen(true)} icon={<Upload size={16} />}>
              Bulk Import
            </Button>
            <Button onClick={openCreate} icon={<Plus size={16} />}>
              Add Student
            </Button>
          </>
        }
      />

      {listError && (
        <div style={{ marginBottom: 16 }}>
          <ErrorBanner message={listError} />
        </div>
      )}

      {!loading && filtered.length > 0 && view === 'spreadsheet' ? (
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
            <SkeletonRows count={6} />
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={<GraduationCap size={32} />}
            title="No students found"
            description="Add students or adjust your filters."
            action={<Button onClick={openCreate}>Add Student</Button>}
          />
        ) : (
          <Table
            columns={[
              {
                key: 'name',
                header: 'Student',
                render: (s) => (
                  <div className={styles.avatarCell}>
                    <Avatar name={s.name} />
                    <div>
                      <div className={styles.name}>{s.name}</div>
                      <div className={styles.subtitle}>{s.email}</div>
                    </div>
                  </div>
                ),
              },
              {
                key: 'class',
                header: 'Class',
                render: (s) => <Badge label={`${s.className} - ${s.section}`} tone="primary" />,
              },
              { key: 'roll', header: 'Roll No.', render: (s) => s.rollNumber },
              { key: 'guardian', header: 'Guardian Phone', render: (s) => s.guardianPhone },
              {
                key: 'actions',
                header: '',
                align: 'right',
                render: (s) => (
                  <div className={tableStyles.actions}>
                    <IconButton icon={Trash2} tone="danger" onClick={() => onDelete(s.id)} aria-label="Delete student" />
                  </div>
                ),
              },
            ]}
            rows={filtered}
            rowKey={(s) => s.id}
          />
        )}
      </Card>
      )}

      <Modal open={modalOpen} title="Add Student" onClose={() => setModalOpen(false)} width={640} footer={
        <>
          <Button variant="ghost" onClick={() => setModalOpen(false)}>
            Cancel
          </Button>
          <Button onClick={onCreate} loading={saving}>
            Create Account
          </Button>
        </>
      }>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          {error && (
            <div style={{ gridColumn: '1 / -1' }}>
              <ErrorBanner message={error} />
            </div>
          )}
          <TextField label="Full Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <SelectField label="Class" value={form.classId} onChange={(e) => setForm({ ...form, classId: e.target.value })}>
            <option value="">Select class</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} - {c.section}
              </option>
            ))}
          </SelectField>
          <TextField label="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <TextField
            label="Temporary Password"
            type="password"
            hint="At least 6 characters"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />
          <TextField label="Roll Number" value={form.rollNumber} onChange={(e) => setForm({ ...form, rollNumber: e.target.value })} />
          <TextField
            label="Admission Number"
            value={form.admissionNumber}
            onChange={(e) => setForm({ ...form, admissionNumber: e.target.value })}
          />
          <TextField
            label="Date of Birth"
            type="date"
            value={form.dateOfBirth}
            onChange={(e) => setForm({ ...form, dateOfBirth: e.target.value })}
          />
          <SelectField label="Gender" value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })}>
            <option value="">Select</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Other">Other</option>
          </SelectField>
          <TextField label="Blood Group" value={form.bloodGroup} onChange={(e) => setForm({ ...form, bloodGroup: e.target.value })} />
          <TextField label="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          <TextField label="Father's Name" value={form.fatherName} onChange={(e) => setForm({ ...form, fatherName: e.target.value })} />
          <TextField label="Mother's Name" value={form.motherName} onChange={(e) => setForm({ ...form, motherName: e.target.value })} />
          <TextField
            label="Guardian Phone"
            value={form.guardianPhone}
            onChange={(e) => setForm({ ...form, guardianPhone: e.target.value })}
          />
          <TextField
            label="Emergency Contact Name"
            value={form.emergencyContactName}
            onChange={(e) => setForm({ ...form, emergencyContactName: e.target.value })}
          />
          <TextField
            label="Emergency Contact Phone"
            value={form.emergencyContactPhone}
            onChange={(e) => setForm({ ...form, emergencyContactPhone: e.target.value })}
          />
          <TextField
            label="Emergency Contact Relation"
            value={form.emergencyContactRelation}
            onChange={(e) => setForm({ ...form, emergencyContactRelation: e.target.value })}
          />
          <div style={{ gridColumn: '1 / -1' }}>
            <TextField label="Address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
          </div>
        </div>
      </Modal>

      <BulkImportModal<ImportRow>
        open={importOpen}
        onClose={() => setImportOpen(false)}
        title="Bulk Import Students"
        columns={importColumns}
        mapRow={mapImportRow}
        importRow={importStudentRow}
      />
    </div>
  );
}
