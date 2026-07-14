import { useState } from 'react';
import { Upload, Plus, ShieldCheck, Trash2 } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Avatar } from '@/components/ui/Avatar';
import { IconButton } from '@/components/ui/IconButton';
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
import { useAuthStore } from '@/store/useAuthStore';
import { getErrorMessage } from '@/utils/errors';
import { generateTempPassword } from '@/utils/password';
import type { AppUser } from '@/types';
import styles from './TeachersPage.module.css';

interface FormState {
  name: string;
  email: string;
  password: string;
}

const emptyForm: FormState = { name: '', email: '', password: '' };

interface ImportRow {
  name: string;
  email: string;
  password: string;
}

export function AdminsPage() {
  const { data: admins, loading } = useCollection<AppUser>((cb) => repo.admins.subscribeAll(cb));
  const myId = useAuthStore((s) => s.profile?.id);
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

  function validate(f: FormState): string | null {
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
      await repo.admins.create({
        email: form.email.trim(),
        password: form.password,
        displayName: form.name.trim(),
      });
      setModalOpen(false);
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setSaving(false);
    }
  }

  async function onDelete(id: string) {
    if (id === myId) {
      alert("You can't remove your own admin account while signed in as it.");
      return;
    }
    if (admins.length <= 1) {
      alert('This is the only admin account — add another admin before removing this one.');
      return;
    }
    if (!confirm('Remove this admin? Their account access will be revoked.')) return;
    setListError('');
    try {
      await repo.admins.remove(id);
    } catch (e) {
      setListError(getErrorMessage(e));
    }
  }

  const importColumns: BulkImportColumn[] = [
    { key: 'name', label: 'Name', required: true },
    { key: 'email', label: 'Email', required: true },
    { key: 'password', label: 'Password', aliases: ['temporary password'] },
  ];

  function mapImportRow(cells: Record<string, string>): { value: ImportRow } | { error: string } {
    const name = (cells.name ?? '').trim();
    const email = (cells.email ?? '').trim();
    if (!name) return { error: 'Missing name' };
    if (!/^\S+@\S+\.\S+$/.test(email)) return { error: 'Invalid or missing email' };
    return { value: { name, email, password: (cells.password ?? '').trim() || generateTempPassword() } };
  }

  async function importAdminRow(row: ImportRow): Promise<string> {
    await repo.admins.create({ email: row.email, password: row.password, displayName: row.name });
    return `password: ${row.password}`;
  }

  const spreadsheetColumns = [
    { key: 'name', label: 'Name', required: true, width: '220px' },
    { key: 'email', label: 'Email', readOnly: true, width: '260px' },
  ];

  const spreadsheetRows = admins.map((a) => ({ name: a.displayName, email: a.email }));
  const spreadsheetRowStatuses = admins.map((_, i) => cellStatus[i]);

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
    const admin = admins[rowIndex];
    if (!admin || key !== 'name') return;
    if (!value.trim()) {
      flashStatus(rowIndex, { tone: 'error', message: 'Name is required' });
      return;
    }
    flashStatus(rowIndex, { tone: 'busy' });
    try {
      await repo.admins.update(admin.id, { displayName: value.trim() });
      flashStatus(rowIndex, { tone: 'success' });
    } catch (e) {
      flashStatus(rowIndex, { tone: 'error', message: getErrorMessage(e) });
    }
  }

  return (
    <div>
      <PageHeader
        description="Manage who has full administrative access to the school console"
        toolbar={
          <>
            <ViewToggle value={view} onChange={setView} />
            <Button variant="outline" onClick={() => setImportOpen(true)} icon={<Upload size={16} />}>
              Bulk Import
            </Button>
            <Button onClick={openCreate} icon={<Plus size={16} />}>
              Add Admin
            </Button>
          </>
        }
      />

      {listError && (
        <div style={{ marginBottom: 16 }}>
          <ErrorBanner message={listError} />
        </div>
      )}

      {!loading && admins.length > 0 && view === 'spreadsheet' ? (
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
            <SkeletonRows count={3} />
          </div>
        ) : admins.length === 0 ? (
          <EmptyState
            icon={<ShieldCheck size={32} />}
            title="No admins found"
            description="Add another administrator to share management of the school console."
            action={<Button onClick={openCreate}>Add Admin</Button>}
          />
        ) : (
          <Table
            columns={[
              {
                key: 'name',
                header: 'Admin',
                render: (a) => (
                  <div className={styles.avatarCell}>
                    <Avatar name={a.displayName} />
                    <div>
                      <div className={styles.name}>
                        {a.displayName}
                        {a.id === myId ? ' (you)' : ''}
                      </div>
                      <div className={styles.subtitle}>{a.email}</div>
                    </div>
                  </div>
                ),
              },
              {
                key: 'actions',
                header: '',
                align: 'right',
                render: (a) => (
                  <div className={tableStyles.actions}>
                    <IconButton icon={Trash2} tone="danger" onClick={() => onDelete(a.id)} aria-label="Delete admin" />
                  </div>
                ),
              },
            ]}
            rows={admins}
            rowKey={(a) => a.id}
          />
        )}
      </Card>
      )}

      <Modal
        open={modalOpen}
        title="Add Admin"
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
            hint="At least 6 characters. They can change this after first login."
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />
        </div>
      </Modal>

      <BulkImportModal<ImportRow>
        open={importOpen}
        onClose={() => setImportOpen(false)}
        title="Bulk Import Admins"
        columns={importColumns}
        mapRow={mapImportRow}
        importRow={importAdminRow}
      />
    </div>
  );
}
