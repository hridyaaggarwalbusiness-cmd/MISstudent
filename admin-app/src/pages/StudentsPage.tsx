import { useMemo, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Table, tableStyles } from '@/components/ui/Table';
import { TextField, SelectField } from '@/components/ui/FormField';
import { SkeletonRows } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { PageHeader, pageHeaderStyles } from '@/pages/PageHeader';
import { useCollection } from '@/hooks/useCollection';
import { repo } from '@/data/repositories';
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

function initials(name: string) {
  return name.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase();
}

export function StudentsPage() {
  const { data: students, loading } = useCollection<Student>((cb) => repo.students.subscribeAll(cb));
  const { data: classes } = useCollection<SchoolClass>((cb) => repo.classes.subscribeAll(cb));
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [classFilter, setClassFilter] = useState('');
  const [search, setSearch] = useState('');

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
    setModalOpen(true);
  }

  async function onCreate() {
    setSaving(true);
    try {
      const cls = classes.find((c) => c.id === form.classId);
      await repo.students.create({
        email: form.email,
        password: form.password,
        displayName: form.name,
        profile: {
          name: form.name,
          classId: form.classId,
          className: cls?.name ?? '',
          section: cls?.section ?? '',
          rollNumber: form.rollNumber,
          admissionNumber: form.admissionNumber,
          dateOfBirth: form.dateOfBirth,
          bloodGroup: form.bloodGroup,
          gender: form.gender,
          email: form.email,
          phone: form.phone,
          address: form.address,
          fatherName: form.fatherName,
          motherName: form.motherName,
          guardianPhone: form.guardianPhone,
          emergencyContactName: form.emergencyContactName,
          emergencyContactPhone: form.emergencyContactPhone,
          emergencyContactRelation: form.emergencyContactRelation,
        },
      });
      setModalOpen(false);
    } finally {
      setSaving(false);
    }
  }

  async function onDelete(id: string) {
    if (!confirm('Remove this student? Their account access will be revoked.')) return;
    await repo.students.remove(id);
  }

  return (
    <div>
      <PageHeader
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
            <Button onClick={openCreate} icon="+">
              Add Student
            </Button>
          </>
        }
      />

      <Card padded={false}>
        {loading ? (
          <div style={{ padding: 20 }}>
            <SkeletonRows count={6} />
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon="🎓"
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
                    <div className={styles.avatar}>{initials(s.name)}</div>
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
                    <button
                      className={[tableStyles.iconButton, tableStyles.danger].join(' ')}
                      onClick={() => onDelete(s.id)}
                    >
                      🗑️
                    </button>
                  </div>
                ),
              },
            ]}
            rows={filtered}
            rowKey={(s) => s.id}
          />
        )}
      </Card>

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
    </div>
  );
}
