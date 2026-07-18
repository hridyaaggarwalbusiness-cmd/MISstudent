import { useState } from 'react';
import { Sparkles, Wand2, RotateCcw, Pencil, FileDown, ImageDown, Save, Send, Eraser } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { TextField, TextAreaField, SelectField } from '@/components/ui/FormField';
import { ErrorBanner } from '@/components/ui/ErrorBanner';
import { PageHeader } from '@/pages/PageHeader';
import { NoticePreview } from '@/components/notices/NoticePreview';
import { useCollection } from '@/hooks/useCollection';
import { useToast } from '@/components/ui/Toast';
import { repo } from '@/data/repositories';
import { useAuthStore } from '@/store/useAuthStore';
import { getErrorMessage } from '@/utils/errors';
import { noticeProvider, NoticeGenerationError } from '@/services/ai';
import { downloadNoticeImage, downloadNoticePdf } from '@/utils/noticeTemplate';
import type { NoticeTemplateData } from '@/utils/noticeTemplate';
import type { Notice, NoticeAudience, NoticeCategory, NoticePriority, NoticeType, SchoolClass } from '@/types';
import styles from './AiNoticeWriterPage.module.css';

const NOTICE_TYPE_OPTIONS: { value: NoticeType; label: string }[] = [
  { value: 'holiday', label: 'Holiday' },
  { value: 'examination', label: 'Examination' },
  { value: 'ptm', label: 'PTM' },
  { value: 'event', label: 'Event' },
  { value: 'circular', label: 'Circular' },
  { value: 'urgent', label: 'Urgent' },
  { value: 'general', label: 'General' },
];

const AUDIENCE_OPTIONS: { value: NoticeAudience; label: string }[] = [
  { value: 'all', label: 'All Students' },
  { value: 'classes', label: 'Selected Classes' },
  { value: 'teachers', label: 'Teachers' },
  { value: 'parents', label: 'Parents' },
];

const PRIORITY_OPTIONS: { value: NoticePriority; label: string }[] = [
  { value: 'normal', label: 'Normal' },
  { value: 'important', label: 'Important' },
  { value: 'urgent', label: 'Urgent' },
];

const NOTICE_TYPE_TO_CATEGORY: Record<NoticeType, NoticeCategory> = {
  holiday: 'holiday',
  examination: 'academic',
  ptm: 'general',
  event: 'event',
  circular: 'general',
  urgent: 'general',
  general: 'general',
};

const SUGGESTIONS = [
  'School closed tomorrow due to rain',
  'Parent Teacher Meeting',
  'Holiday Announcement',
  'Exam Schedule',
  'Fee Reminder',
  'Sports Day',
  'Independence Day',
  'Republic Day',
  'Annual Function',
  'Transport Notice',
];

const PLACEHOLDER_BODY =
  'Dear Students,\n\nYour AI-generated notice will appear here once you describe what it should say and click "Generate Notice".';

function todayIso(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function formatDisplayDate(iso: string): string {
  if (!iso) return '';
  const [y, m, d] = iso.split('-').map(Number);
  if (!y || !m || !d) return iso;
  const date = new Date(y, m - 1, d);
  const day = date.getDate();
  const suffix = day % 10 === 1 && day !== 11 ? 'st' : day % 10 === 2 && day !== 12 ? 'nd' : day % 10 === 3 && day !== 13 ? 'rd' : 'th';
  const month = date.toLocaleDateString('en-IN', { month: 'long' });
  return `${day}${suffix} ${month}, ${date.getFullYear()}`;
}

export function AiNoticeWriterPage() {
  const { data: classes } = useCollection<SchoolClass>((cb) => repo.classes.subscribeAll(cb));
  const profile = useAuthStore((s) => s.profile);
  const { show } = useToast();

  const [noticeType, setNoticeType] = useState<NoticeType>('general');
  const [audience, setAudience] = useState<NoticeAudience>('all');
  const [selectedClassIds, setSelectedClassIds] = useState<string[]>([]);
  const [noticeDate, setNoticeDate] = useState(todayIso());
  const [effectiveDate, setEffectiveDate] = useState('');
  const [priority, setPriority] = useState<NoticePriority>('normal');
  const [titleHint, setTitleHint] = useState('');
  const [instruction, setInstruction] = useState('');

  const [generatedTitle, setGeneratedTitle] = useState('');
  const [generatedBody, setGeneratedBody] = useState('');
  const [editing, setEditing] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState('');
  const [savingDraft, setSavingDraft] = useState(false);
  const [publishing, setPublishing] = useState(false);

  function classLabel(id: string) {
    const c = classes.find((cl) => cl.id === id);
    return c ? `${c.name} - ${c.section}` : id;
  }

  function toggleClass(id: string) {
    setSelectedClassIds((ids) => (ids.includes(id) ? ids.filter((i) => i !== id) : [...ids, id]));
  }

  async function handleGenerate() {
    if (!instruction.trim()) {
      setGenError('Describe what this notice needs to say first.');
      return;
    }
    setGenError('');
    setGenerating(true);
    try {
      const content = await noticeProvider.generateNotice({
        noticeType,
        audience,
        classLabels: audience === 'classes' ? selectedClassIds.map(classLabel) : [],
        priority,
        noticeDate,
        effectiveDate: effectiveDate || undefined,
        titleHint: titleHint.trim() || undefined,
        instruction: instruction.trim(),
      });
      setGeneratedTitle(content.title);
      setGeneratedBody(content.body);
      setEditing(false);
    } catch (e) {
      setGenError(e instanceof NoticeGenerationError ? e.message : getErrorMessage(e));
    } finally {
      setGenerating(false);
    }
  }

  function handleClear() {
    setNoticeType('general');
    setAudience('all');
    setSelectedClassIds([]);
    setNoticeDate(todayIso());
    setEffectiveDate('');
    setPriority('normal');
    setTitleHint('');
    setInstruction('');
    setGeneratedTitle('');
    setGeneratedBody('');
    setEditing(false);
    setGenError('');
  }

  function buildNoticeRecord(): Omit<Notice, 'id'> {
    return {
      title: generatedTitle.trim() || '(Untitled Notice)',
      body: generatedBody.trim(),
      category: NOTICE_TYPE_TO_CATEGORY[noticeType],
      postedBy: profile?.id ?? '',
      postedByName: profile?.displayName ?? 'Admin',
      postedAt: new Date().toISOString(),
      targetClassIds: audience === 'classes' ? selectedClassIds : [],
      pinned: priority === 'urgent',
      noticeType,
      audience,
      priority,
      noticeDate,
      effectiveDate: effectiveDate || undefined,
      aiGenerated: true,
    };
  }

  async function handleSaveDraft() {
    if (!generatedBody.trim()) {
      show('Generate the notice content first.', 'error');
      return;
    }
    setSavingDraft(true);
    try {
      await repo.noticeDrafts.upsert({ id: '', ...buildNoticeRecord() });
      show('Draft saved');
    } catch (e) {
      show(getErrorMessage(e), 'error');
    } finally {
      setSavingDraft(false);
    }
  }

  async function handlePublish() {
    if (!generatedBody.trim()) {
      show('Generate the notice content first.', 'error');
      return;
    }
    setPublishing(true);
    try {
      await repo.notices.upsert({ id: '', ...buildNoticeRecord() });
      show('Notice published — now live in the Student and Teacher apps');
      handleClear();
    } catch (e) {
      show(getErrorMessage(e), 'error');
    } finally {
      setPublishing(false);
    }
  }

  const previewData: NoticeTemplateData = {
    date: formatDisplayDate(noticeDate),
    body: generatedBody || PLACEHOLDER_BODY,
  };

  const hasContent = generatedBody.trim().length > 0;
  const downloadName = generatedTitle || instruction.slice(0, 40) || 'notice';

  return (
    <div>
      <PageHeader
        title="AI Notice Writer"
        description="Describe what needs to be announced — the AI writes it, the official school template stays exactly as designed"
      />

      <div className={styles.layout}>
        <div className={styles.formPanel}>
          <Card>
            <span className={styles.aiBadge}>
              <Sparkles size={12} /> AI-POWERED
            </span>
            <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className={styles.fieldRow}>
                <SelectField label="Notice Type" value={noticeType} onChange={(e) => setNoticeType(e.target.value as NoticeType)}>
                  {NOTICE_TYPE_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </SelectField>
                <SelectField label="Audience" value={audience} onChange={(e) => setAudience(e.target.value as NoticeAudience)}>
                  {AUDIENCE_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </SelectField>
              </div>

              {audience === 'classes' && (
                <div>
                  <span className={styles.sectionLabel}>Select Classes</span>
                  <div className={styles.classChips}>
                    {classes.map((c) => (
                      <div
                        key={c.id}
                        className={[styles.classChip, selectedClassIds.includes(c.id) && styles.classChipActive].filter(Boolean).join(' ')}
                        onClick={() => toggleClass(c.id)}
                      >
                        {c.name} - {c.section}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className={styles.fieldRow}>
                <TextField label="Notice Date" type="date" value={noticeDate} onChange={(e) => setNoticeDate(e.target.value)} />
                <TextField label="Effective Date" type="date" value={effectiveDate} onChange={(e) => setEffectiveDate(e.target.value)} />
              </div>

              <SelectField label="Priority" value={priority} onChange={(e) => setPriority(e.target.value as NoticePriority)}>
                {PRIORITY_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </SelectField>

              <TextField
                label="Notice Title (optional)"
                placeholder="Leave blank and the AI will write one"
                value={titleHint}
                onChange={(e) => setTitleHint(e.target.value)}
              />

              <TextAreaField
                label="AI Instruction"
                placeholder="Describe what this notice needs to say, in plain language…"
                rows={5}
                value={instruction}
                onChange={(e) => setInstruction(e.target.value)}
              />

              <div>
                <span className={styles.sectionLabel}>Quick Suggestions</span>
                <div className={styles.suggestionChips}>
                  {SUGGESTIONS.map((s) => (
                    <div key={s} className={styles.suggestionChip} onClick={() => setInstruction(s)}>
                      {s}
                    </div>
                  ))}
                </div>
              </div>

              {genError && <ErrorBanner message={genError} />}

              <div className={styles.formButtons}>
                <Button variant="outline" icon={<Eraser size={16} />} onClick={handleClear}>
                  Clear Form
                </Button>
                <Button icon={<Wand2 size={16} />} loading={generating} onClick={handleGenerate}>
                  Generate Notice
                </Button>
              </div>
            </div>
          </Card>
        </div>

        <div className={styles.previewPanel}>
          <div className={styles.previewFrame}>
            <NoticePreview data={previewData} />
          </div>

          {editing && (
            <div className={styles.editBox}>
              <TextField label="Notice Title" value={generatedTitle} onChange={(e) => setGeneratedTitle(e.target.value)} />
              <TextAreaField label="Notice Body" rows={8} value={generatedBody} onChange={(e) => setGeneratedBody(e.target.value)} />
            </div>
          )}

          <div className={styles.actionsGrid}>
            <Button variant="outline" size="sm" icon={<Pencil size={14} />} onClick={() => setEditing((v) => !v)} disabled={!hasContent}>
              {editing ? 'Done Editing' : 'Edit Content'}
            </Button>
            <Button variant="outline" size="sm" icon={<RotateCcw size={14} />} loading={generating} onClick={handleGenerate} disabled={!instruction.trim()}>
              Regenerate
            </Button>
            <Button variant="outline" size="sm" icon={<FileDown size={14} />} onClick={() => downloadNoticePdf(previewData, downloadName)} disabled={!hasContent}>
              Download PDF
            </Button>
            <Button variant="outline" size="sm" icon={<ImageDown size={14} />} onClick={() => downloadNoticeImage(previewData, downloadName)} disabled={!hasContent}>
              Download Image
            </Button>
            <Button variant="outline" size="sm" icon={<Save size={14} />} loading={savingDraft} onClick={handleSaveDraft} disabled={!hasContent}>
              Save Draft
            </Button>
          </div>

          <div className={styles.publishRow}>
            <Button icon={<Send size={16} />} loading={publishing} onClick={handlePublish} disabled={!hasContent}>
              Publish Notice
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
