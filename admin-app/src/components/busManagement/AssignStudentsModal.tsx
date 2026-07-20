import { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { TextField } from '@/components/ui/FormField';
import { ErrorBanner } from '@/components/ui/ErrorBanner';
import { useToast } from '@/components/ui/Toast';
import { repo } from '@/data/repositories';
import { getErrorMessage } from '@/utils/errors';
import type { Bus, BusStop, BusRoute, Student } from '@/types';

interface AssignStudentsModalProps {
  open: boolean;
  onClose: () => void;
  bus: Bus | null;
  students: Student[];
  stops: BusStop[];
  routes: BusRoute[];
}

export function AssignStudentsModal({ open, onClose, bus, students, stops, routes }: AssignStudentsModalProps) {
  const [search, setSearch] = useState('');
  const [pending, setPending] = useState<Record<string, { assigned: boolean; stopId: string }>>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const { show } = useToast();

  const busStopOptions = useMemo(() => {
    if (!bus) return [];
    const stopById = new Map(stops.map((s) => [s.id, s]));
    const ids = new Set<string>();
    routes
      .filter((r) => r.id === bus.morningRouteId || r.id === bus.afternoonRouteId)
      .forEach((r) => r.stops.forEach((rs) => ids.add(rs.stopId)));
    return [...ids].map((id) => stopById.get(id)).filter((s): s is BusStop => !!s);
  }, [bus, stops, routes]);

  const filtered = useMemo(
    () => students.filter((s) => s.name.toLowerCase().includes(search.trim().toLowerCase())),
    [students, search],
  );

  function stateFor(student: Student): { assigned: boolean; stopId: string } {
    if (pending[student.id]) return pending[student.id];
    return { assigned: !!bus && student.assignedBusId === bus.id, stopId: student.assignedStopId ?? '' };
  }

  function setState(studentId: string, next: { assigned: boolean; stopId: string }) {
    setPending((p) => ({ ...p, [studentId]: next }));
  }

  async function onSave() {
    if (!bus) return;
    setError('');
    setSaving(true);
    try {
      const entries = Object.entries(pending);
      await Promise.all(
        entries.map(([studentId, state]) =>
          repo.students.update(studentId, {
            assignedBusId: state.assigned ? bus.id : '',
            assignedStopId: state.assigned ? state.stopId : '',
          }),
        ),
      );
      show('Student assignments saved');
      setPending({});
      onClose();
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setSaving(false);
    }
  }

  if (!bus) return null;

  return (
    <Modal
      open={open}
      title={`Assign Students — ${bus.busNumber}`}
      width={640}
      onClose={onClose}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={onSave} loading={saving}>
            Save Assignments
          </Button>
        </>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {error && <ErrorBanner message={error} />}
        {busStopOptions.length === 0 && (
          <ErrorBanner message="This bus has no route stops yet — set up its Morning/Afternoon route before assigning students to a stop." />
        )}
        <TextField
          label="Search students"
          placeholder="Type a name…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <div style={{ maxHeight: 420, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 4 }}>
          {filtered.map((student) => {
            const state = stateFor(student);
            return (
              <div
                key={student.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '8px 4px',
                  borderBottom: '1px solid var(--color-border-soft, #eee)',
                }}
              >
                <input
                  type="checkbox"
                  checked={state.assigned}
                  onChange={(e) => setState(student.id, { assigned: e.target.checked, stopId: state.stopId })}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 500 }}>{student.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--color-text-tertiary)' }}>
                    {student.className} - {student.section}
                  </div>
                </div>
                <div style={{ width: 200 }}>
                  <select
                    disabled={!state.assigned}
                    value={state.stopId}
                    onChange={(e) => setState(student.id, { assigned: state.assigned, stopId: e.target.value })}
                    style={{ width: '100%', padding: '6px 8px', borderRadius: 6 }}
                  >
                    <option value="">Select stop…</option>
                    {busStopOptions.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            );
          })}
          {filtered.length === 0 && (
            <div style={{ padding: 16, textAlign: 'center', fontSize: 13, color: 'var(--color-text-tertiary)' }}>
              <Search size={16} style={{ marginBottom: 4 }} />
              <div>No students match "{search}"</div>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
