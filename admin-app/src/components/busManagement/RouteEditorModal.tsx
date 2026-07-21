import { useEffect, useState } from 'react';
import { ArrowUp, ArrowDown, X } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { IconButton } from '@/components/ui/IconButton';
import { ErrorBanner } from '@/components/ui/ErrorBanner';
import { RouteStopMap } from './RouteStopMap';
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

  function toggleStop(stopId: string) {
    setOrderedStopIds((ids) => (ids.includes(stopId) ? ids.filter((id) => id !== stopId) : [...ids, stopId]));
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
      width={640}
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

        {stops.length === 0 ? (
          <ErrorBanner message="No bus stops exist yet — add stops on the Bus Stops page first, then come back here to build the route." />
        ) : (
          <>
            <div>
              <div style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginBottom: 6 }}>
                Click a stop on the map to add it to the route in order (orange numbered pins = in this route). Click a
                numbered pin again to remove it.
              </div>
              <RouteStopMap stops={stops} selectedStopIds={orderedStopIds} onToggleStop={toggleStop} height={320} />
            </div>

            {orderedStopIds.length === 0 ? (
              <div style={{ fontSize: 13, color: 'var(--color-text-tertiary)' }}>
                No stops added yet — click stops on the map above in the order the bus should visit them.
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
          </>
        )}
      </div>
    </Modal>
  );
}
