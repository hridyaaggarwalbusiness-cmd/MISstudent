import { useMemo, useRef, useState } from 'react';
import { Check, X } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { ErrorBanner } from '@/components/ui/ErrorBanner';
import { SpreadsheetGrid, type SpreadsheetRowStatus } from '@/components/ui/SpreadsheetGrid';
import { parseDelimitedText, normalizeHeader } from '@/utils/delimited';
import { getErrorMessage } from '@/utils/errors';
import styles from './BulkImportModal.module.css';

export interface BulkImportColumn {
  key: string;
  label: string;
  aliases?: string[];
  required?: boolean;
}

interface ImportOutcome {
  tone: 'success' | 'error';
  message: string;
}

interface BulkImportModalProps<T> {
  open: boolean;
  onClose: () => void;
  title: string;
  columns: BulkImportColumn[];
  // Turns a row's matched cells into a value ready for importRow, or an error to show instead.
  mapRow: (cells: Record<string, string>) => { value: T } | { error: string };
  // Performs the actual create call. May return a short note (e.g. the
  // generated temp password) to display next to the success status.
  importRow: (value: T) => Promise<string | void>;
}

const BLANK_ROWS = 12;

function emptyRow(columns: BulkImportColumn[]): Record<string, string> {
  return Object.fromEntries(columns.map((c) => [c.key, '']));
}

function isBlankRow(row: Record<string, string>): boolean {
  return Object.values(row).every((v) => v.trim() === '');
}

export function BulkImportModal<T>({ open, onClose, title, columns, mapRow, importRow }: BulkImportModalProps<T>) {
  const [rows, setRows] = useState<Record<string, string>[]>(() =>
    Array.from({ length: BLANK_ROWS }, () => emptyRow(columns)),
  );
  const [outcomes, setOutcomes] = useState<Record<number, ImportOutcome>>({});
  const [importing, setImporting] = useState(false);
  const [banner, setBanner] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  function reset() {
    setRows(Array.from({ length: BLANK_ROWS }, () => emptyRow(columns)));
    setOutcomes({});
    setImporting(false);
    setBanner('');
  }

  function close() {
    reset();
    onClose();
  }

  function applyBlock(startRow: number, startCol: number, block: string[][]) {
    setRows((prev) => {
      const next = [...prev];
      let dataBlock = block;

      // If the pasted block's first line looks like our own header row
      // (matches column labels/aliases at the pasted position), drop it -
      // pasting a full sheet including its header just works.
      if (block.length > 0) {
        const firstLine = block[0].map(normalizeHeader);
        let matches = 0;
        firstLine.forEach((h, i) => {
          const col = columns[startCol + i];
          if (col && (normalizeHeader(col.label) === h || (col.aliases ?? []).some((a) => normalizeHeader(a) === h))) {
            matches++;
          }
        });
        if (matches > 0 && matches >= Math.ceil(firstLine.length / 2)) {
          dataBlock = block.slice(1);
        }
      }

      dataBlock.forEach((line, ri) => {
        const rowIdx = startRow + ri;
        while (next.length <= rowIdx) next.push(emptyRow(columns));
        const updated = { ...next[rowIdx] };
        line.forEach((val, ci) => {
          const col = columns[startCol + ci];
          if (col) updated[col.key] = val;
        });
        next[rowIdx] = updated;
      });
      return next;
    });
    setOutcomes({});
  }

  function onCellCommit(rowIndex: number, key: string, value: string) {
    setRows((prev) => prev.map((row, idx) => (idx === rowIndex ? { ...row, [key]: value } : row)));
    setOutcomes((prev) => {
      if (!(rowIndex in prev)) return prev;
      const next = { ...prev };
      delete next[rowIndex];
      return next;
    });
  }

  function onDeleteRow(rowIndex: number) {
    setRows((prev) => prev.filter((_, idx) => idx !== rowIndex));
    setOutcomes((prev) => {
      const next: Record<number, ImportOutcome> = {};
      Object.entries(prev).forEach(([k, v]) => {
        const idx = Number(k);
        if (idx < rowIndex) next[idx] = v;
        else if (idx > rowIndex) next[idx - 1] = v;
      });
      return next;
    });
  }

  function addRow() {
    setRows((prev) => [...prev, emptyRow(columns)]);
  }

  function onFilePicked(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const grid = parseDelimitedText(String(reader.result ?? ''));
      if (grid.length > 0) applyBlock(0, 0, grid);
    };
    reader.readAsText(file);
    e.target.value = '';
  }

  // Live validation for every non-blank row, recomputed as cells change.
  const mapped = useMemo(
    () =>
      rows.map((row) => {
        if (isBlankRow(row)) return null;
        return mapRow(row);
      }),
    [rows, mapRow],
  );

  const rowStatuses: (SpreadsheetRowStatus | undefined)[] = rows.map((_, i) => {
    const outcome = outcomes[i];
    if (outcome) return { tone: outcome.tone, message: outcome.message };
    const result = mapped[i];
    if (!result) return undefined;
    if ('error' in result) return { tone: 'error', message: result.error };
    return { tone: 'pending', message: 'Ready' };
  });

  const readyCount = rows.filter((_, i) => {
    const result = mapped[i];
    return result && 'value' in result && outcomes[i]?.tone !== 'success';
  }).length;
  const successCount = Object.values(outcomes).filter((o) => o.tone === 'success').length;
  const errorCount = Object.values(outcomes).filter((o) => o.tone === 'error').length;
  const anyAttempted = Object.keys(outcomes).length > 0;

  async function runImport() {
    setImporting(true);
    setBanner('');
    for (let i = 0; i < rows.length; i++) {
      const result = mapped[i];
      if (!result || !('value' in result) || outcomes[i]?.tone === 'success') continue;
      try {
        const note = await importRow(result.value);
        setOutcomes((prev) => ({ ...prev, [i]: { tone: 'success', message: note ?? 'Done' } }));
      } catch (e) {
        setOutcomes((prev) => ({ ...prev, [i]: { tone: 'error', message: getErrorMessage(e) } }));
      }
    }
    setImporting(false);
  }

  const footer = (
    <>
      <Button variant="ghost" onClick={close} disabled={importing}>
        {anyAttempted ? 'Close' : 'Cancel'}
      </Button>
      <Button onClick={runImport} loading={importing} disabled={readyCount === 0}>
        Import {readyCount} row{readyCount === 1 ? '' : 's'}
      </Button>
    </>
  );

  return (
    <Modal open={open} title={title} onClose={close} width={920} footer={footer}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div className={styles.hint}>
          Click any cell to type, or paste rows copied directly from Google Sheets or Excel anywhere in the grid
          (including the header row - it's detected and skipped automatically). Columns marked{' '}
          <span className={styles.required}>*</span> are required.
        </div>
        {banner && <ErrorBanner message={banner} />}
        {anyAttempted && (
          <div className={styles.summary}>
            <span>
              <Check size={14} style={{ verticalAlign: -2, marginRight: 3 }} />
              {successCount} imported
            </span>
            {errorCount > 0 && (
              <span>
                <X size={14} style={{ verticalAlign: -2, marginRight: 3 }} />
                {errorCount} failed
              </span>
            )}
          </div>
        )}
        <SpreadsheetGrid
          columns={columns}
          rows={rows}
          rowStatuses={rowStatuses}
          onCellCommit={onCellCommit}
          onPasteBlock={applyBlock}
          onDeleteRow={onDeleteRow}
          readOnly={importing}
        />
        <div className={styles.fileRow}>
          <Button variant="outline" size="sm" onClick={addRow} disabled={importing}>
            + Add row
          </Button>
          <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} disabled={importing}>
            Upload .csv instead
          </Button>
          <input ref={fileInputRef} type="file" accept=".csv,text/csv" hidden onChange={onFilePicked} />
        </div>
      </div>
    </Modal>
  );
}
