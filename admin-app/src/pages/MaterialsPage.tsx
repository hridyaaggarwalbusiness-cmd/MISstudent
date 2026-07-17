import { useRef, useState } from 'react';
import type { ComponentType } from 'react';
import { Upload, Library, BookOpen, School, User, Download, Trash2, FileText, Monitor, NotebookPen, HelpCircle, Video, Folder } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { IconButton } from '@/components/ui/IconButton';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { tableStyles } from '@/components/ui/Table';
import { TextField, SelectField } from '@/components/ui/FormField';
import { SkeletonRows } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorBanner } from '@/components/ui/ErrorBanner';
import { PageHeader, pageHeaderStyles } from '@/pages/PageHeader';
import { useCollection } from '@/hooks/useCollection';
import { useConfirm } from '@/components/ui/ConfirmDialog';
import { useToast } from '@/components/ui/Toast';
import { repo, MAX_ATTACHMENT_BYTES } from '@/data/repositories';
import { useAuthStore } from '@/store/useAuthStore';
import { getErrorMessage } from '@/utils/errors';
import { TONE_COLORS } from '@/utils/toneColors';
import type { BadgeTone } from '@/components/ui/Badge';
import type { StudyMaterial, MaterialType, SchoolClass } from '@/types';
import styles from './MaterialsPage.module.css';

const typeTone: Record<MaterialType, BadgeTone> = {
  note: 'primary',
  presentation: 'violet',
  worksheet: 'info',
  question_bank: 'warning',
  video: 'success',
  other: 'neutral',
};

const typeIcon: Record<MaterialType, ComponentType<{ size?: number }>> = {
  note: FileText,
  presentation: Monitor,
  worksheet: NotebookPen,
  question_bank: HelpCircle,
  video: Video,
  other: Folder,
};

function sizeLabel(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function MaterialsPage() {
  const { data: materials, loading } = useCollection<StudyMaterial>((cb) => repo.materials.subscribeAll(cb));
  const { data: classes } = useCollection<SchoolClass>((cb) => repo.classes.subscribeAll(cb));
  const profile = useAuthStore((s) => s.profile);
  const [modalOpen, setModalOpen] = useState(false);
  const [classFilter, setClassFilter] = useState('');
  const [uploading, setUploading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState('');
  const [form, setForm] = useState({ title: '', description: '', subject: '', type: 'note' as MaterialType, classId: '' });
  const [error, setError] = useState('');
  const [listError, setListError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const confirm = useConfirm();
  const { show } = useToast();

  function openCreate() {
    setForm({ title: '', description: '', subject: '', type: 'note', classId: '' });
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

  async function onUpload() {
    if (!file || !form.classId) {
      setError('Select a class and a file to upload.');
      return;
    }
    setError('');
    setUploading(true);
    try {
      const path = `studyMaterials/${Date.now()}_${file.name}`;
      const url = await repo.storage.upload(file);
      await repo.materials.create({
        classId: form.classId,
        title: form.title || file.name,
        description: form.description,
        subject: form.subject,
        type: form.type,
        uploadedBy: profile?.id ?? '',
        uploadedByName: profile?.displayName ?? 'Admin',
        attachment: {
          id: path,
          name: file.name,
          type: file.type.includes('pdf') ? 'pdf' : file.type.includes('image') ? 'image' : file.type.includes('video') ? 'video' : 'doc',
          url,
          sizeLabel: sizeLabel(file.size),
        },
        sizeLabel: sizeLabel(file.size),
      });
      setModalOpen(false);
      show('Material uploaded');
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setUploading(false);
    }
  }

  async function onDelete(id: string) {
    const ok = await confirm({ title: 'Delete material', message: 'Delete this study material? This cannot be undone.', confirmLabel: 'Delete' });
    if (!ok) return;
    setListError('');
    try {
      await repo.materials.remove(id);
      show('Material deleted');
    } catch (e) {
      setListError(getErrorMessage(e));
    }
  }

  const filtered = classFilter ? materials.filter((m) => m.classId === classFilter) : materials;
  const classLabel = (id: string) => {
    const c = classes.find((cl) => cl.id === id);
    return c ? `${c.name} - ${c.section}` : id;
  };

  return (
    <div>
      <PageHeader
        title="Study Materials"
        description="Upload notes, worksheets and presentations for students"
        toolbar={
          <>
            <select className={pageHeaderStyles.select} value={classFilter} onChange={(e) => setClassFilter(e.target.value)}>
              <option value="">All Classes</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} - {c.section}
                </option>
              ))}
            </select>
            <Button onClick={openCreate} icon={<Upload size={16} />}>
              Upload
            </Button>
          </>
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
      ) : filtered.length === 0 ? (
        <Card>
          <EmptyState icon={<Library size={32} />} title="No materials yet" description="Upload the first study material for a class." action={<Button onClick={openCreate}>Upload</Button>} />
        </Card>
      ) : (
        <div className={styles.grid}>
          {filtered.map((m) => {
            const TypeIcon = typeIcon[m.type];
            return (
            <div key={m.id} className={styles.card}>
              <div className={styles.topRow}>
                <div className={styles.iconChip} style={{ background: TONE_COLORS[typeTone[m.type]].bg }}>
                  <TypeIcon size={18} />
                </div>
                <Badge label={m.type.replace('_', ' ')} tone={typeTone[m.type]} />
              </div>
              <div className={styles.title}>{m.title}</div>
              <div className={styles.meta}>
                <span>
                  <BookOpen size={13} style={{ verticalAlign: -2, marginRight: 3 }} />
                  {m.subject || '—'}
                </span>
                <span>
                  <School size={13} style={{ verticalAlign: -2, marginRight: 3 }} />
                  {classLabel(m.classId)}
                </span>
                <span>
                  <User size={13} style={{ verticalAlign: -2, marginRight: 3 }} />
                  {m.uploadedByName}
                </span>
              </div>
              <div className={styles.footer}>
                <span className={styles.size}>{m.sizeLabel ?? '—'}</span>
                <div className={styles.actions}>
                  <a className={tableStyles.iconButton} href={m.attachment.url} target="_blank" rel="noreferrer">
                    <Download size={14} />
                  </a>
                  <IconButton icon={Trash2} tone="danger" onClick={() => onDelete(m.id)} aria-label="Delete material" />
                </div>
              </div>
            </div>
            );
          })}
        </div>
      )}

      <Modal
        open={modalOpen}
        title="Upload Study Material"
        onClose={() => setModalOpen(false)}
        footer={
          <>
            <Button variant="ghost" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={onUpload} loading={uploading} disabled={!file || !form.classId}>
              Upload
            </Button>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {error && <ErrorBanner message={error} />}
          <TextField label="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          <TextField label="Subject" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} />
          <SelectField label="Class" value={form.classId} onChange={(e) => setForm({ ...form, classId: e.target.value })}>
            <option value="">Select class</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} - {c.section}
              </option>
            ))}
          </SelectField>
          <SelectField label="Type" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as MaterialType })}>
            <option value="note">Note</option>
            <option value="presentation">Presentation</option>
            <option value="worksheet">Worksheet</option>
            <option value="question_bank">Question Bank</option>
            <option value="video">Video</option>
            <option value="other">Other</option>
          </SelectField>
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-secondary)' }}>File</label>
            <div style={{ marginTop: 8 }}>
              <input
                ref={fileInputRef}
                type="file"
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
        </div>
      </Modal>
    </div>
  );
}
