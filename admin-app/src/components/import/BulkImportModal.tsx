import { useRef, useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Table } from '@/components/ui/Table';
import { ErrorBanner } from '@/components/ui/ErrorBanner';
import { parseDelimitedText, normalizeHeader } from '@/utils/delimited';
import { getErrorMessage } from '@/utils/errors';
import styles from './BulkImportModal.module.css';

export interface BulkImportColumn {
  key: string;
  label: string;
  aliases?: string[];
  required?: boolean;
}

interface RowState<T> {
  index: number;
  cells: Record<string, string>;
  value?: T;
  parseError?: string;
  status: 'pending' | 'importing' | 'success' | 'error';
  resultMessage?: string;
}

interface BulkImportModalProps<T> {
  open: boolean;
  onClose: () => void;
  title: string;
  columns: BulkImportColumn[];
  // Turns a row's matched cells into a value ready for importRow, or an error to show instead.
  mapRow: (cells: Record<string, string>) => { value: T } | { error: string };
  // Short label describing the row in the preview table, e.g. "Ananya Sharma <ananya@...>".
  previewLabel: (value: T) => string;
  // Performs the actual create call. May return a short note (e.g. the
  // generated temp password) to display next to the success status.
  importRow: (value: T) => Promise<string | void>;
}

type Stage = 'input' | 'preview';

export function BulkImportModal<T>({
  open,
  onClose,
  title,
  columns,
  mapRow,
  previewLabel,
  importRow,
}: BulkImportModalProps<T>) {
  const [stage, setStage] = useState<Stage>('input');
  const [rawText, setRawText] = useState('');
  const [parseErr, setParseErr] = useState('');
  const [rows, setRows] = useState<RowState<T>[]>([]);
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function reset() {
    setStage('input');
    setRawText('');
    setParseErr('');
    setRows([]);
    setImporting(false);
  }

  function close() {
    reset();
    onClose();
  }

  function onFilePicked(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setRawText(String(reader.result ?? ''));
    reader.readAsText(file);
    e.target.value = '';
  }

  function parse() {
    setParseErr('');
    const grid = parseDelimitedText(rawText);
    if (grid.length < 2) {
      setParseErr('Paste a header row plus at least one data row.');
      return;
    }
    const [headerRow, ...dataRows] = grid;
    const headerIndex = headerRow.map(normalizeHeader);

    const colByIndex: (BulkImportColumn | null)[] = headerIndex.map((h) => {
      return (
        columns.find(
          (c) => normalizeHeader(c.label) === h || (c.aliases ?? []).some((a) => normalizeHeader(a) === h),
        ) ?? null
      );
    });

    const missingRequired = columns.filter((c) => c.required && !colByIndex.some((m) => m?.key === c.key));
    if (missingRequired.length > 0) {
      setParseErr(
        `Missing required column${missingRequired.length > 1 ? 's' : ''}: ${missingRequired
          .map((c) => c.label)
          .join(', ')}. Check the expected header row above.`,
      );
      return;
    }

    const built: RowState<T>[] = [];
    dataRows.forEach((rawRow, i) => {
      if (rawRow.every((cell) => cell.trim() === '')) return;
      const cells: Record<string, string> = {};
      colByIndex.forEach((col, ci) => {
        if (col) cells[col.key] = rawRow[ci] ?? '';
      });
      const result = mapRow(cells);
      if ('error' in result) {
        built.push({ index: i + 2, cells, parseError: result.error, status: 'error' });
      } else {
        built.push({ index: i + 2, cells, value: result.value, status: 'pending' });
      }
    });

    setRows(built);
    setStage('preview');
  }

  async function runImport() {
    setImporting(true);
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      if (!row.value || row.status === 'success') continue;
      setRows((prev) => prev.map((r, idx) => (idx === i ? { ...r, status: 'importing' } : r)));
      try {
        const note = await importRow(row.value);
        setRows((prev) =>
          prev.map((r, idx) => (idx === i ? { ...r, status: 'success', resultMessage: note ?? undefined } : r)),
        );
      } catch (e) {
        setRows((prev) =>
          prev.map((r, idx) => (idx === i ? { ...r, status: 'error', resultMessage: getErrorMessage(e) } : r)),
        );
      }
    }
    setImporting(false);
  }

  const validCount = rows.filter((r) => r.value).length;
  const successCount = rows.filter((r) => r.status === 'success').length;
  const errorCount = rows.filter((r) => r.status === 'error').length;
  const anyDone = rows.some((r) => r.status === 'success' || (r.status === 'error' && r.resultMessage));

  const headerLine = columns.map((c) => (c.required ? `${c.label}*` : c.label)).join('\t');
  const allSettled = rows.length > 0 && successCount + errorCount === rows.length;

  const footer =
    stage === 'input' ? (
      <>
        <Button variant="ghost" onClick={close}>
          Cancel
        </Button>
        <Button onClick={parse} disabled={!rawText.trim()}>
          Preview
        </Button>
      </>
    ) : (
      <>
        <Button variant="ghost" onClick={() => setStage('input')} disabled={importing}>
          Back
        </Button>
        {allSettled ? (
          <Button onClick={close}>Done</Button>
        ) : (
          <Button onClick={runImport} loading={importing} disabled={validCount === 0}>
            Import {validCount} row{validCount === 1 ? '' : 's'}
          </Button>
        )}
      </>
    );

  return (
    <Modal open={open} title={title} onClose={close} width={760} footer={footer}>
      {stage === 'input' ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div className={styles.hint}>
            Paste rows copied directly from Google Sheets or Excel (first row must be the column headers), or upload
            a .csv file. Columns marked <span className={styles.required}>*</span> are required — order doesn't
            matter, extra columns are ignored.
          </div>
          <div className={styles.headerRow}>{headerLine}</div>
          {parseErr && <ErrorBanner message={parseErr} />}
          <textarea
            className={styles.textarea}
            placeholder="Paste spreadsheet data here (including the header row)..."
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
          />
          <div className={styles.fileRow}>
            <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
              Upload .csv instead
            </Button>
            <input ref={fileInputRef} type="file" accept=".csv,text/csv" hidden onChange={onFilePicked} />
          </div>
        </div>
      ) : (
        <div>
          {anyDone && (
            <div className={styles.summary}>
              <span>✔ {successCount} imported</span>
              {errorCount > 0 && <span>✕ {errorCount} failed</span>}
            </div>
          )}
          <div className={styles.previewScroll}>
            <Table
              columns={[
                { key: 'row', header: '#', width: '40px', render: (r: RowState<T>) => r.index },
                {
                  key: 'preview',
                  header: 'Row',
                  render: (r: RowState<T>) => (r.value ? previewLabel(r.value) : Object.values(r.cells).join(' · ')),
                },
                {
                  key: 'status',
                  header: 'Status',
                  render: (r: RowState<T>) => {
                    if (r.status === 'pending') return <span className={styles.statusPending}>Ready</span>;
                    if (r.status === 'importing') return <span className={styles.statusImporting}>Importing…</span>;
                    if (r.status === 'success')
                      return (
                        <span className={styles.statusValid}>✔ Done{r.resultMessage ? ` · ${r.resultMessage}` : ''}</span>
                      );
                    return <span className={styles.statusError}>{r.parseError ?? r.resultMessage ?? 'Failed'}</span>;
                  },
                },
              ]}
              rows={rows}
              rowKey={(r) => String(r.index)}
            />
          </div>
        </div>
      )}
    </Modal>
  );
}
