import { useRef, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Table, tableStyles } from '@/components/ui/Table';
import { TextField, SelectField } from '@/components/ui/FormField';
import { SkeletonRows } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { PageHeader, pageHeaderStyles } from '@/pages/PageHeader';
import { useCollection } from '@/hooks/useCollection';
import { repo } from '@/data/repositories';
import { useAuthStore } from '@/store/useAuthStore';
import type { StudyMaterial, MaterialType, SchoolClass } from '@/types';

const typeTone: Record<MaterialType, 'primary' | 'violet' | 'info' | 'warning' | 'success' | 'neutral'> = {
  note: 'primary',
  presentation: 'violet',
  worksheet: 'info',
  question_bank: 'warning',
  video: 'success',
  other: 'neutral',
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
  const [form, setForm] = useState({ title: '', description: '', subject: '', type: 'note' as MaterialType, classId: '' });
  const fileInputRef = useRef<HTMLInputElement>(null);

  function openCreate() {
    setForm({ title: '', description: '', subject: '', type: 'note', classId: '' });
    setFile(null);
    setModalOpen(true);
  }

  async function onUpload() {
    if (!file || !form.classId) return;
    setUploading(true);
    try {
      const path = `studyMaterials/${Date.now()}_${file.name}`;
      const url = await repo.storage.upload(path, file);
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
    } finally {
      setUploading(false);
    }
  }

  async function onDelete(id: string) {
    if (!confirm('Delete this study material?')) return;
    await repo.materials.remove(id);
  }

  const filtered = classFilter ? materials.filter((m) => m.classId === classFilter) : materials;

  return (
    <div>
      <PageHeader
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
            <Button onClick={openCreate} icon="⬆️">
              Upload
            </Button>
          </>
        }
      />

      <Card padded={false}>
        {loading ? (
          <div style={{ padding: 20 }}>
            <SkeletonRows count={5} />
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState icon="📚" title="No materials yet" description="Upload the first study material for a class." action={<Button onClick={openCreate}>Upload</Button>} />
        ) : (
          <Table
            columns={[
              { key: 'title', header: 'Title', render: (m) => m.title },
              { key: 'subject', header: 'Subject', render: (m) => m.subject },
              { key: 'class', header: 'Class', render: (m) => m.classId },
              { key: 'type', header: 'Type', render: (m) => <Badge label={m.type.replace('_', ' ')} tone={typeTone[m.type]} /> },
              { key: 'size', header: 'Size', render: (m) => m.sizeLabel ?? '—' },
              {
                key: 'actions',
                header: '',
                align: 'right',
                render: (m) => (
                  <div className={tableStyles.actions}>
                    <a className={tableStyles.iconButton} href={m.attachment.url} target="_blank" rel="noreferrer">
                      ⬇️
                    </a>
                    <button className={[tableStyles.iconButton, tableStyles.danger].join(' ')} onClick={() => onDelete(m.id)}>
                      🗑️
                    </button>
                  </div>
                ),
              },
            ]}
            rows={filtered}
            rowKey={(m) => m.id}
          />
        )}
      </Card>

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
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              />
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
