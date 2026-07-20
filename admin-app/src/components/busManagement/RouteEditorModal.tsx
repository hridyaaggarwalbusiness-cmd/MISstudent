import { useEffect, useState } from 'react';
import { ArrowUp, ArrowDown, X, Plus } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { IconButton } from '@/components/ui/IconButton';
import { SelectField } from '@/components/ui/FormField';
import { ErrorBanner } from '@/components/ui/ErrorBanner';
import { useToast } from '@/components/ui/Toast';
import { repo, cryptoId } from '@/data/repositories';
import { getErrorMessage } from '@/utils/errors';
import type { Bus, BusStop, BusRoute, RouteType } from '@/types';

interface RouteEditorModalProps {
  open: boolean;
  onClose: () => void;
  bus: Bus | null;
  type: RouteType;
  stops: BusStop[];
  existingRoute: BusRoute | null;
}

export function RouteEditorModal({ open, onClose, bus, type, stops, existingRoute }: RouteEditorModalProps) {
  const [orderedStopIds, setOrderedStopIds] = useState<string[]>([]);
  const [addStopId, setAddStopId] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const { show } = useToast();

  useEffect(() => {
    if (open) {
      setOrderedStopIds([...(existingRoute?.stops ?? [])].sort((a, b) => a.order - b.order).map((s) => s.stopId));
      setError('');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, existingRoute]);

  if (!bus) return null;

  const stopById = new Map(stops.map((s) => [s.id, s]));
  const availableStops = stops.filter((s) => !orderedStopIds.includes(s.id));

  function addStop() {
    if (!addStopId) return;
    setOrderedStopIds((ids) => [...ids, addStopId]);
    setAddStopId('');
  }

  function removeStop(stopId: string) {
    setOrderedStopIds((ids) => ids.filter((id) => id !== stopId));
  }

  function move(index: number, dir: -1 | 1) {
    setOrderedStopIds((ids) => {
      const next = [...ids];
      const target = index + dir;
      if (target < 0 || target >= next.length) return next;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  async function onSave() {
    if (!bus) return;
    if (orderedStopIds.length === 0) {
      setError('Add at least one stop to this route.');
      return;
    }
    setError('');
    setSaving(true);
    try {
      const routeId = existingRoute?.id || cryptoId();
      await repo.routes.upsert({
        id: routeId,
        name: `${bus.busNumber} — ${type === 'morning' ? 'Morning' : 'Afternoon'} Route`,
        busId: bus.id,
        type,
        stops: orderedStopIds.map((stopId, order) => ({ stopId, order })),
      });
      await repo.buses.update(bus.id, type === 'morning' ? { morningRouteId: routeId } : { afternoonRouteId: routeId });
      show('Route saved');
      onClose();
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open={open}
      title={`${bus.busNumber} — ${type === 'morning' ? 'Morning' : 'Afternoon'} Route`}
      width={560}
      onClose={onClose}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={onSave} loading={saving}>
            Save Route
          </Button>
        </>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {error && <ErrorBanner message={error} />}
        <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
          <div style={{ flex: 1 }}>
            <SelectField label="Add a stop" value={addStopId} onChange={(e) => setAddStopId(e.target.value)}>
              <option value="">Select a stop…</option>
              {availableStops.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </SelectField>
          </div>
          <Button variant="outline" onClick={addStop} icon={<Plus size={16} />} disabled={!addStopId}>
            Add
          </Button>
        </div>

        {orderedStopIds.length === 0 ? (
          <div style={{ fontSize: 13, color: 'var(--color-text-tertiary)' }}>
            No stops added yet — pick stops above in the order the bus should visit them.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {orderedStopIds.map((stopId, i) => (
              <div
                key={stopId}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '8px 10px',
                  borderRadius: 8,
                  background: 'var(--color-surface-alt, #f5f5f7)',
                }}
              >
                <span style={{ fontSize: 12, fontWeight: 600, width: 20, color: 'var(--color-text-tertiary)' }}>{i + 1}</span>
                <span style={{ flex: 1, fontSize: 14 }}>{stopById.get(stopId)?.name ?? stopId}</span>
                <IconButton icon={ArrowUp} onClick={() => move(i, -1)} aria-label="Move up" />
                <IconButton icon={ArrowDown} onClick={() => move(i, 1)} aria-label="Move down" />
                <IconButton icon={X} tone="danger" onClick={() => removeStop(stopId)} aria-label="Remove stop" />
              </div>
            ))}
          </div>
        )}
      </div>
    </Modal>
  );
}
