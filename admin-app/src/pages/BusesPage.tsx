import { useState } from 'react';
import { Plus, Bus as BusIcon, Pencil, Trash2, Users } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { IconButton } from '@/components/ui/IconButton';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Table, tableStyles } from '@/components/ui/Table';
import { TextField, SelectField } from '@/components/ui/FormField';
import { SkeletonRows } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorBanner } from '@/components/ui/ErrorBanner';
import { RouteEditorModal } from '@/components/busManagement/RouteEditorModal';
import { AssignStudentsModal } from '@/components/busManagement/AssignStudentsModal';
import { PageHeader } from '@/pages/PageHeader';
import { useCollection } from '@/hooks/useCollection';
import { useConfirm } from '@/components/ui/ConfirmDialog';
import { useToast } from '@/components/ui/Toast';
import { repo } from '@/data/repositories';
import { getErrorMessage } from '@/utils/errors';
import type { Bus, BusStatus, BusStop, BusRoute, DriverProfile, Student, RouteType } from '@/types';
import type { BadgeTone } from '@/components/ui/Badge';

interface FormState {
  id: string;
  busNumber: string;
  vehicleRegistrationNumber: string;
  driverId: string;
}

const emptyForm: FormState = { id: '', busNumber: '', vehicleRegistrationNumber: '', driverId: '' };

const STATUS_META: Record<BusStatus, { label: string; tone: BadgeTone }> = {
  offline: { label: 'Offline', tone: 'neutral' },
  online: { label: 'Online', tone: 'info' },
  trip_started: { label: 'Trip Started', tone: 'success' },
  trip_completed: { label: 'Trip Completed', tone: 'warning' },
};

export function BusesPage() {
  const { data: buses, loading } = useCollection<Bus>((cb) => repo.buses.subscribeAll(cb));
  const { data: drivers } = useCollection<DriverProfile>((cb) => repo.drivers.subscribeAll(cb));
  const { data: stops } = useCollection<BusStop>((cb) => repo.busStops.subscribeAll(cb));
  const { data: routes } = useCollection<BusRoute>((cb) => repo.routes.subscribeAll(cb));
  const { data: students } = useCollection<Student>((cb) => repo.students.subscribeAll(cb));

  const confirm = useConfirm();
  const { show } = useToast();

  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [listError, setListError] = useState('');

  const [routeEditor, setRouteEditor] = useState<{ bus: Bus; type: RouteType } | null>(null);
  const [assignBus, setAssignBus] = useState<Bus | null>(null);

  function openCreate() {
    setForm(emptyForm);
    setError('');
    setModalOpen(true);
  }

  function openEdit(bus: Bus) {
    setForm({ id: bus.id, busNumber: bus.busNumber, vehicleRegistrationNumber: bus.vehicleRegistrationNumber, driverId: bus.driverId ?? '' });
    setError('');
    setModalOpen(true);
  }

  async function onSave() {
    if (!form.busNumber.trim() || !form.vehicleRegistrationNumber.trim()) {
      setError('Bus number and vehicle registration number are required.');
      return;
    }
    setError('');
    setSaving(true);
    try {
      const isNew = !form.id;
      const id = form.id || form.busNumber.trim().toLowerCase().replace(/\s+/g, '-');
      const existing = buses.find((b) => b.id === id);
      const driver = drivers.find((d) => d.id === form.driverId);

      await repo.buses.upsert(
        {
          id,
          busNumber: form.busNumber.trim(),
          vehicleRegistrationNumber: form.vehicleRegistrationNumber.trim(),
          driverId: form.driverId || null,
          driverName: driver?.name ?? '',
          driverPhone: driver?.phone ?? '',
          morningRouteId: existing?.morningRouteId ?? null,
          afternoonRouteId: existing?.afternoonRouteId ?? null,
          status: existing?.status ?? 'offline',
          currentTripId: existing?.currentTripId ?? null,
        },
        isNew,
      );

      // Keep DriverProfile.assignedBusId in sync so DriversPage shows the
      // right bus and a driver can't be silently double-booked.
      const previousDriverId = existing?.driverId;
      if (previousDriverId && previousDriverId !== form.driverId) {
        await repo.drivers.update(previousDriverId, { assignedBusId: null });
      }
      if (form.driverId && form.driverId !== previousDriverId) {
        await repo.drivers.update(form.driverId, { assignedBusId: id });
      }

      setModalOpen(false);
      show(isNew ? 'Bus added' : 'Bus updated');
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setSaving(false);
    }
  }

  async function onDelete(id: string) {
    const ok = await confirm({ title: 'Delete bus', message: 'Delete this bus? Its routes and student assignments will be orphaned.', confirmLabel: 'Delete' });
    if (!ok) return;
    setListError('');
    try {
      await repo.buses.remove(id);
      show('Bus deleted');
    } catch (e) {
      setListError(getErrorMessage(e));
    }
  }

  const routeName = (routeId: string | null) => {
    if (!routeId) return '—';
    return routes.find((r) => r.id === routeId)?.name ?? '—';
  };

  const availableDrivers = drivers.filter((d) => !d.assignedBusId || d.assignedBusId === form.id || buses.every((b) => b.driverId !== d.id));

  return (
    <div>
      <PageHeader
        title="Buses"
        description="Manage the school's bus fleet, drivers, routes and student assignments"
        toolbar={
          <Button onClick={openCreate} icon={<Plus size={16} />}>
            Add Bus
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
            <SkeletonRows count={4} />
          </div>
        ) : buses.length === 0 ? (
          <EmptyState
            icon={<BusIcon size={32} />}
            title="No buses yet"
            description="Add your first bus, then assign a driver, set up its routes and assign students."
            action={<Button onClick={openCreate}>Add Bus</Button>}
          />
        ) : (
          <Table
            columns={[
              {
                key: 'bus',
                header: 'Bus',
                render: (b) => (
                  <div>
                    <div style={{ fontWeight: 600 }}>{b.busNumber}</div>
                    <div style={{ fontSize: 12, color: 'var(--color-text-tertiary)' }}>{b.vehicleRegistrationNumber}</div>
                  </div>
                ),
              },
              {
                key: 'driver',
                header: 'Driver',
                render: (b) => (
                  <div>
                    <div>{b.driverName || '—'}</div>
                    {b.driverPhone && <div style={{ fontSize: 12, color: 'var(--color-text-tertiary)' }}>{b.driverPhone}</div>}
                  </div>
                ),
              },
              {
                key: 'routes',
                header: 'Routes',
                render: (b) => (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <button className={tableStyles.linkButton} onClick={() => setRouteEditor({ bus: b, type: 'morning' })}>
                      Morning: {routeName(b.morningRouteId)}
                    </button>
                    <button className={tableStyles.linkButton} onClick={() => setRouteEditor({ bus: b, type: 'afternoon' })}>
                      Afternoon: {routeName(b.afternoonRouteId)}
                    </button>
                  </div>
                ),
              },
              {
                key: 'status',
                header: 'Status',
                render: (b) => <Badge label={STATUS_META[b.status].label} tone={STATUS_META[b.status].tone} />,
              },
              {
                key: 'actions',
                header: '',
                align: 'right',
                render: (b) => (
                  <div className={tableStyles.actions}>
                    <IconButton icon={Users} onClick={() => setAssignBus(b)} aria-label="Assign students" />
                    <IconButton icon={Pencil} onClick={() => openEdit(b)} aria-label="Edit bus" />
                    <IconButton icon={Trash2} tone="danger" onClick={() => onDelete(b.id)} aria-label="Delete bus" />
                  </div>
                ),
              },
            ]}
            rows={buses}
            rowKey={(b) => b.id}
          />
        )}
      </Card>

      <Modal
        open={modalOpen}
        title={form.id ? 'Edit Bus' : 'Add Bus'}
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
            label="Bus Number"
            placeholder="e.g. Bus 7"
            value={form.busNumber}
            onChange={(e) => setForm({ ...form, busNumber: e.target.value })}
          />
          <TextField
            label="Vehicle Registration Number"
            placeholder="e.g. DL 1AB 1234"
            value={form.vehicleRegistrationNumber}
            onChange={(e) => setForm({ ...form, vehicleRegistrationNumber: e.target.value })}
          />
          <SelectField label="Driver" value={form.driverId} onChange={(e) => setForm({ ...form, driverId: e.target.value })}>
            <option value="">Unassigned</option>
            {availableDrivers.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </SelectField>
        </div>
      </Modal>

      <RouteEditorModal
        open={!!routeEditor}
        onClose={() => setRouteEditor(null)}
        bus={routeEditor?.bus ?? null}
        type={routeEditor?.type ?? 'morning'}
        stops={stops}
        existingRoute={
          routeEditor
            ? routes.find((r) => r.id === (routeEditor.type === 'morning' ? routeEditor.bus.morningRouteId : routeEditor.bus.afternoonRouteId)) ?? null
            : null
        }
      />

      <AssignStudentsModal
        open={!!assignBus}
        onClose={() => setAssignBus(null)}
        bus={assignBus}
        students={students}
        stops={stops}
        routes={routes}
      />
    </div>
  );
}
