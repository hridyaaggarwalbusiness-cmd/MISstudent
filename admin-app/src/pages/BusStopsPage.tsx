import { useState } from 'react';
import { Plus, MapPin, Pencil, Trash2 } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { IconButton } from '@/components/ui/IconButton';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Table, tableStyles } from '@/components/ui/Table';
import { TextField } from '@/components/ui/FormField';
import { SkeletonRows } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorBanner } from '@/components/ui/ErrorBanner';
import { GoogleMapPicker } from '@/components/maps/GoogleMapPicker';
import { PageHeader } from '@/pages/PageHeader';
import { useCollection } from '@/hooks/useCollection';
import { useConfirm } from '@/components/ui/ConfirmDialog';
import { useToast } from '@/components/ui/Toast';
import { repo } from '@/data/repositories';
import { getErrorMessage } from '@/utils/errors';
import type { BusStop } from '@/types';

interface FormState {
  id: string;
  name: string;
  lat: number | null;
  lng: number | null;
}

const emptyForm: FormState = { id: '', name: '', lat: null, lng: null };

export function BusStopsPage() {
  const { data: stops, loading } = useCollection<BusStop>((cb) => repo.busStops.subscribeAll(cb));
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

  function openEdit(stop: BusStop) {
    setForm({ id: stop.id, name: stop.name, lat: stop.lat, lng: stop.lng });
    setError('');
    setModalOpen(true);
  }

  async function onSave() {
    if (!form.name.trim()) {
      setError('Stop name is required.');
      return;
    }
    if (form.lat == null || form.lng == null) {
      setError('Click on the map to set the stop location.');
      return;
    }
    setError('');
    setSaving(true);
    try {
      await repo.busStops.upsert({ id: form.id, name: form.name.trim(), lat: form.lat, lng: form.lng });
      setModalOpen(false);
      show(form.id ? 'Stop updated' : 'Stop added');
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setSaving(false);
    }
  }

  async function onDelete(id: string) {
    const ok = await confirm({ title: 'Delete stop', message: 'Delete this bus stop? Any route using it will need to be updated.', confirmLabel: 'Delete' });
    if (!ok) return;
    setListError('');
    try {
      await repo.busStops.remove(id);
      show('Stop deleted');
    } catch (e) {
      setListError(getErrorMessage(e));
    }
  }

  return (
    <div>
      <PageHeader
        title="Bus Stops"
        description="Master list of stop locations, reused across every route"
        toolbar={
          <Button onClick={openCreate} icon={<Plus size={16} />}>
            Add Stop
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
        ) : stops.length === 0 ? (
          <EmptyState
            icon={<MapPin size={32} />}
            title="No bus stops yet"
            description="Add stops by clicking their location on the map, then arrange them into routes."
            action={<Button onClick={openCreate}>Add Stop</Button>}
          />
        ) : (
          <Table
            columns={[
              { key: 'name', header: 'Stop Name', render: (s) => s.name },
              { key: 'lat', header: 'Latitude', render: (s) => s.lat.toFixed(5) },
              { key: 'lng', header: 'Longitude', render: (s) => s.lng.toFixed(5) },
              {
                key: 'actions',
                header: '',
                align: 'right',
                render: (s) => (
                  <div className={tableStyles.actions}>
                    <IconButton icon={Pencil} onClick={() => openEdit(s)} aria-label="Edit stop" />
                    <IconButton icon={Trash2} tone="danger" onClick={() => onDelete(s.id)} aria-label="Delete stop" />
                  </div>
                ),
              },
            ]}
            rows={stops}
            rowKey={(s) => s.id}
          />
        )}
      </Card>

      <Modal
        open={modalOpen}
        title={form.id ? 'Edit Bus Stop' : 'Add Bus Stop'}
        width={560}
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
            label="Stop Name"
            placeholder="e.g. Green Park Junction"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
          <div>
            <div style={{ fontSize: 13, marginBottom: 6, color: 'var(--color-text-secondary)' }}>
              Click on the map to set this stop's exact location
              {form.lat != null && form.lng != null ? ` (${form.lat.toFixed(5)}, ${form.lng.toFixed(5)})` : ''}
            </div>
            <GoogleMapPicker
              height={320}
              center={form.lat != null && form.lng != null ? { lat: form.lat, lng: form.lng } : undefined}
              selected={form.lat != null && form.lng != null ? { lat: form.lat, lng: form.lng } : null}
              markers={stops.filter((s) => s.id !== form.id).map((s) => ({ id: s.id, lat: s.lat, lng: s.lng, label: s.name }))}
              onPick={(p) => setForm((f) => ({ ...f, lat: p.lat, lng: p.lng }))}
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}
