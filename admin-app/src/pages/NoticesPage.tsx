import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { TextField, TextAreaField, SelectField } from '@/components/ui/FormField';
import { SkeletonRows } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorBanner } from '@/components/ui/ErrorBanner';
import { PageHeader } from '@/pages/PageHeader';
import { useCollection } from '@/hooks/useCollection';
import { repo } from '@/data/repositories';
import { useAuthStore } from '@/store/useAuthStore';
import { getErrorMessage } from '@/utils/errors';
import type { Notice, NoticeCategory, SchoolClass } from '@/types';
import { tableStyles } from '@/components/ui/Table';
import styles from './NoticesPage.module.css';

const categoryTone: Record<NoticeCategory, 'neutral' | 'success' | 'violet' | 'danger' | 'info' | 'warning'> = {
  general: 'neutral',
  holiday: 'success',
  event: 'violet',
  exam: 'danger',
  circular: 'info',
  competition: 'warning',
};

const emptyForm = { title: '', body: '', category: 'general' as NoticeCategory, targetClassIds: [] as string[], pinned: false };

export function NoticesPage() {
  const { data: notices, loading } = useCollection<Notice>((cb) => repo.notices.subscribeAll(cb));
  const { data: classes } = useCollection<SchoolClass>((cb) => repo.classes.subscribeAll(cb));
  const profile = useAuthStore((s) => s.profile);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [listError, setListError] = useState('');

  function openCreate() {
    setForm(emptyForm);
    setError('');
    setModalOpen(true);
  }

  function toggleClass(id: string) {
    setForm((f) => ({
      ...f,
      targetClassIds: f.targetClassIds.includes(id)
        ? f.targetClassIds.filter((c) => c !== id)
        : [...f.targetClassIds, id],
    }));
  }

  async function onSave() {
    if (!form.title.trim() || !form.body.trim()) {
      setError('Title and message are required.');
      return;
    }
    setError('');
    setSaving(true);
    try {
      await repo.notices.upsert({
        id: '',
        title: form.title,
        body: form.body,
        category: form.category,
        postedBy: profile?.id ?? '',
        postedByName: profile?.displayName ?? 'Admin',
        postedAt: new Date().toISOString(),
        targetClassIds: form.targetClassIds,
        pinned: form.pinned,
      });
      setModalOpen(false);
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setSaving(false);
    }
  }

  async function onDelete(id: string) {
    if (!confirm('Delete this notice?')) return;
    setListError('');
    try {
      await repo.notices.remove(id);
    } catch (e) {
      setListError(getErrorMessage(e));
    }
  }

  function classLabel(id: string) {
    const c = classes.find((cl) => cl.id === id);
    return c ? `${c.name} - ${c.section}` : id;
  }

  return (
    <div>
      <PageHeader
        description="Post announcements visible to teachers and students in real time"
        toolbar={
          <Button onClick={openCreate} icon="+">
            New Notice
          </Button>
        }
      />

      {listError && (
        <div style={{ marginBottom: 16 }}>
          <ErrorBanner message={listError} />
        </div>
      )}

      {loading ? (
        <Card>
          <SkeletonRows count={5} />
        </Card>
      ) : notices.length === 0 ? (
        <Card>
          <EmptyState icon="📢" title="No notices yet" description="Post your first announcement." action={<Button onClick={openCreate}>New Notice</Button>} />
        </Card>
      ) : (
        <div className={styles.list}>
          {notices.map((n) => (
            <Card key={n.id} className={styles.noticeCard}>
              <div className={styles.noticeHeader}>
                <div>
                  <div className={styles.noticeTitle}>
                    {n.pinned && '📌 '}
                    {n.title}
                  </div>
                  <div className={styles.noticeMeta}>
                    <span>{n.postedByName}</span>
                    <span>·</span>
                    <span>{n.targetClassIds.length ? n.targetClassIds.map(classLabel).join(', ') : 'All classes'}</span>
                  </div>
                </div>
                <div className={styles.actions}>
                  <Badge label={n.category} tone={categoryTone[n.category]} />
                  <button className={[tableStyles.iconButton, tableStyles.danger].join(' ')} onClick={() => onDelete(n.id)}>
                    🗑️
                  </button>
                </div>
              </div>
              <div className={styles.noticeBody}>{n.body}</div>
            </Card>
          ))}
        </div>
      )}

      <Modal
        open={modalOpen}
        title="New Notice"
        onClose={() => setModalOpen(false)}
        footer={
          <>
            <Button variant="ghost" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={onSave} loading={saving}>
              Post Notice
            </Button>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {error && <ErrorBanner message={error} />}
          <TextField label="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          <TextAreaField label="Message" value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} />
          <SelectField
            label="Category"
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value as NoticeCategory })}
          >
            <option value="general">General</option>
            <option value="holiday">Holiday</option>
            <option value="event">Event</option>
            <option value="exam">Exam</option>
            <option value="circular">Circular</option>
            <option value="competition">Competition</option>
          </SelectField>
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-secondary)' }}>
              Target Classes (leave empty for all)
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
              {classes.map((c) => (
                <div
                  key={c.id}
                  onClick={() => toggleClass(c.id)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: 999,
                    border: '1.5px solid var(--color-border)',
                    fontSize: 13,
                    cursor: 'pointer',
                    background: form.targetClassIds.includes(c.id) ? 'var(--color-primary-soft)' : 'transparent',
                    color: form.targetClassIds.includes(c.id) ? 'var(--color-primary)' : 'var(--color-text-primary)',
                    fontWeight: form.targetClassIds.includes(c.id) ? 600 : 400,
                  }}
                >
                  {c.name} - {c.section}
                </div>
              ))}
            </div>
          </div>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, fontWeight: 600 }}>
            <input type="checkbox" checked={form.pinned} onChange={(e) => setForm({ ...form, pinned: e.target.checked })} />
            Pin this notice to top
          </label>
        </div>
      </Modal>
    </div>
  );
}
