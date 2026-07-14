import { useMemo, useRef, useState } from 'react';
import type { ComponentType } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Plus, Megaphone, ClipboardList, GraduationCap, PartyPopper, Palmtree, Pin, Trash2 } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { IconButton } from '@/components/ui/IconButton';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { TextField, TextAreaField, SelectField } from '@/components/ui/FormField';
import { SkeletonRows } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorBanner } from '@/components/ui/ErrorBanner';
import { PageHeader } from '@/pages/PageHeader';
import { useCollection } from '@/hooks/useCollection';
import { repo, MAX_ATTACHMENT_BYTES } from '@/data/repositories';
import { useAuthStore } from '@/store/useAuthStore';
import { getErrorMessage } from '@/utils/errors';
import type { Notice, NoticeCategory, SchoolClass, Attachment } from '@/types';
import styles from './NoticesPage.module.css';

const categoryTone: Record<NoticeCategory, 'neutral' | 'success' | 'violet' | 'danger' | 'info' | 'warning'> = {
  general: 'info',
  academic: 'violet',
  event: 'success',
  holiday: 'warning',
};

const categoryIcon: Record<NoticeCategory, ComponentType<{ size?: number }>> = {
  general: ClipboardList,
  academic: GraduationCap,
  event: PartyPopper,
  holiday: Palmtree,
};

function relativeTime(iso: string): string {
  try {
    return formatDistanceToNow(new Date(iso), { addSuffix: true });
  } catch {
    return '';
  }
}

function sizeLabel(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const emptyForm = { title: '', body: '', category: 'general' as NoticeCategory, targetClassIds: [] as string[], pinned: false };

export function NoticesPage() {
  const { data: notices, loading } = useCollection<Notice>((cb) => repo.notices.subscribeAll(cb));
  const { data: classes } = useCollection<SchoolClass>((cb) => repo.classes.subscribeAll(cb));
  const sortedNotices = useMemo(
    () => [...notices].sort((a, b) => Number(b.pinned) - Number(a.pinned)),
    [notices],
  );
  const profile = useAuthStore((s) => s.profile);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [listError, setListError] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  function openCreate() {
    setForm(emptyForm);
    setFile(null);
    setFileError('');
    setError('');
    setModalOpen(true);
  }

  function onPickFile(picked: File | null) {
    if (picked && picked.size > MAX_ATTACHMENT_BYTES) {
      setFile(null);
      setFileError(`File is too large. Storage isn't enabled on this project, so attachments are limited to ${Math.round(MAX_ATTACHMENT_BYTES / 1024)} KB.`);
      return;
    }
    setFileError('');
    setFile(picked);
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
      let attachments: Attachment[] | undefined;
      if (file) {
        const url = await repo.storage.upload(file);
        attachments = [
          {
            id: `${Date.now()}`,
            name: file.name,
            type: file.type.includes('pdf') ? 'pdf' : file.type.includes('image') ? 'image' : file.type.includes('video') ? 'video' : 'doc',
            url,
            sizeLabel: sizeLabel(file.size),
          },
        ];
      }
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
        ...(attachments ? { attachments } : {}),
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
          <Button onClick={openCreate} icon={<Plus size={16} />}>
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
          <EmptyState icon={<Megaphone size={32} />} title="No notices yet" description="Post your first announcement." action={<Button onClick={openCreate}>New Notice</Button>} />
        </Card>
      ) : (
        <div className={styles.list}>
          {sortedNotices.map((n) => {
            const CategoryIcon = categoryIcon[n.category];
            return (
            <Card key={n.id} className={[styles.noticeCard, n.pinned && styles.noticeCardPinned].filter(Boolean).join(' ')}>
              <div className={styles.noticeHeader}>
                <div className={styles.noticeHeaderLeft}>
                  <div className={styles.categoryIconChip}>
                    <CategoryIcon size={18} />
                  </div>
                  <div>
                    <div className={styles.noticeTitle}>
                      {n.pinned && (
                        <span className={styles.pinBadge}>
                          <Pin size={11} style={{ verticalAlign: -1, marginRight: 2 }} />
                          Pinned
                        </span>
                      )}
                      {n.title}
                    </div>
                    <div className={styles.noticeMeta}>
                      <span>{n.postedByName}</span>
                      <span>·</span>
                      <span>{relativeTime(n.postedAt)}</span>
                      <span>·</span>
                      <span>{n.targetClassIds.length ? n.targetClassIds.map(classLabel).join(', ') : 'All classes'}</span>
                    </div>
                  </div>
                </div>
                <div className={styles.actions}>
                  <Badge label={n.category} tone={categoryTone[n.category]} />
                  <IconButton icon={Trash2} tone="danger" onClick={() => onDelete(n.id)} aria-label="Delete notice" />
                </div>
              </div>
              <div className={styles.noticeBody}>{n.body}</div>
            </Card>
            );
          })}
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
            <option value="academic">Academic</option>
            <option value="event">Event</option>
            <option value="holiday">Holiday</option>
          </SelectField>
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-secondary)' }}>
              Attachment (optional)
            </label>
            <div style={{ marginTop: 8 }}>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={(e) => onPickFile(e.target.files?.[0] ?? null)}
              />
            </div>
            <span style={{ display: 'block', marginTop: 6, fontSize: 12, color: 'var(--color-text-tertiary)' }}>
              Max {Math.round(MAX_ATTACHMENT_BYTES / 1024)} KB — attachments are stored inline in Firestore since Cloud Storage isn't enabled on this project.
            </span>
            {fileError && (
              <span style={{ display: 'block', marginTop: 6, fontSize: 12, color: 'var(--color-danger-strong)' }}>
                {fileError}
              </span>
            )}
          </div>
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
