import { useState } from 'react';
import { Plus, Truck, Trash2 } from 'lucide-react';
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
import { PageHeader } from '@/pages/PageHeader';
import { useCollection } from '@/hooks/useCollection';
import { useConfirm } from '@/components/ui/ConfirmDialog';
import { useToast } from '@/components/ui/Toast';
import { repo } from '@/data/repositories';
import { getErrorMessage } from '@/utils/errors';
import type { DriverProfile, Bus } from '@/types';
import styles from './TeachersPage.module.css';

interface FormState {
  name: string;
  phone: string;
  email: string;
  password: string;
}

const emptyForm: FormState = { name: '', phone: '', email: '', password: '' };

export function DriversPage() {
  const { data: drivers, loading } = useCollection<DriverProfile>((cb) => repo.drivers.subscribeAll(cb));
  const { data: buses } = useCollection<Bus>((cb) => repo.buses.subscribeAll(cb));
  const confirm = useConfirm();
  const { show } = useToast();
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [listError, setListError] = useState('');

  function openCreate() {
    setForm(emptyForm);
    setError('');
    setModalOpen(true);
  }

  function validate(f: FormState): string | null {
    if (!f.name.trim()) return 'Full name is required.';
    if (!/^\S+@\S+\.\S+$/.test(f.email.trim())) return 'Enter a valid email address.';
    if (!f.phone.trim()) return 'Phone number is required.';
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
      await repo.drivers.create({
        email: form.email.trim(),
        password: form.password,
        displayName: form.name.trim(),
        phone: form.phone.trim(),
      });
      setModalOpen(false);
      show('Driver added');
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setSaving(false);
    }
  }

  async function onDelete(id: string) {
    const assignedBus = buses.find((b) => b.driverId === id);
    if (assignedBus) {
      show(`Unassign this driver from ${assignedBus.busNumber} before removing them.`, 'error');
      return;
    }
    const ok = await confirm({ title: 'Remove driver', message: 'Remove this driver? Their account access will be revoked.', confirmLabel: 'Remove' });
    if (!ok) return;
    setListError('');
    try {
      await repo.drivers.remove(id);
      show('Driver removed');
    } catch (e) {
      setListError(getErrorMessage(e));
    }
  }

  const busForDriver = (driverId: string) => buses.find((b) => b.driverId === driverId);

  return (
    <div>
      <PageHeader
        title="Drivers"
        description="Manage driver accounts used to sign in to the Driver App"
        toolbar={
          <Button onClick={openCreate} icon={<Plus size={16} />}>
            Add Driver
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
            <SkeletonRows count={3} />
          </div>
        ) : drivers.length === 0 ? (
          <EmptyState
            icon={<Truck size={32} />}
            title="No drivers yet"
            description="Add a driver account so they can sign in to the Driver App and start trips."
            action={<Button onClick={openCreate}>Add Driver</Button>}
          />
        ) : (
          <Table
            columns={[
              {
                key: 'name',
                header: 'Driver',
                render: (d) => (
                  <div className={styles.avatarCell}>
                    <Avatar name={d.name} />
                    <div>
                      <div className={styles.name}>{d.name}</div>
                      <div className={styles.subtitle}>{d.phone}</div>
                    </div>
                  </div>
                ),
              },
              {
                key: 'bus',
                header: 'Assigned Bus',
                render: (d) => busForDriver(d.id)?.busNumber ?? '—',
              },
              {
                key: 'actions',
                header: '',
                align: 'right',
                render: (d) => (
                  <div className={tableStyles.actions}>
                    <IconButton icon={Trash2} tone="danger" onClick={() => onDelete(d.id)} aria-label="Delete driver" />
                  </div>
                ),
              },
            ]}
            rows={drivers}
            rowKey={(d) => d.id}
          />
        )}
      </Card>

      <Modal
        open={modalOpen}
        title="Add Driver"
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
          <TextField label="Phone Number" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          <TextField
            label="Email"
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
          <TextField
            label="Temporary Password"
            type="password"
            hint="At least 6 characters — used to sign in to the Driver App."
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />
        </div>
      </Modal>
    </div>
  );
}
