import { useRef, useState } from 'react';
import styles from './SpreadsheetGrid.module.css';

export interface SpreadsheetColumn {
  key: string;
  label: string;
  width?: string;
  required?: boolean;
  readOnly?: boolean;
}

export interface SpreadsheetRowStatus {
  tone: 'pending' | 'busy' | 'success' | 'error';
  message?: string;
}

interface SpreadsheetGridProps {
  columns: SpreadsheetColumn[];
  rows: Record<string, string>[];
  rowStatuses?: (SpreadsheetRowStatus | undefined)[];
  onCellCommit?: (rowIndex: number, key: string, value: string) => void;
  onPasteBlock?: (rowIndex: number, colIndex: number, block: string[][]) => void;
  onDeleteRow?: (rowIndex: number) => void;
  readOnly?: boolean;
}

// A real spreadsheet-style grid: individually addressable, editable cells
// with keyboard navigation and paste support for blocks of tab/newline
// delimited data copied straight out of Google Sheets or Excel - instead of
// dumping pasted data into an opaque textarea.
export function SpreadsheetGrid({
  columns,
  rows,
  rowStatuses,
  onCellCommit,
  onPasteBlock,
  onDeleteRow,
  readOnly,
}: SpreadsheetGridProps) {
  const dirty = useRef<Map<string, string>>(new Map());
  const inputRefs = useRef<Map<string, HTMLInputElement>>(new Map());
  const [, forceRender] = useState(0);

  function cellId(r: number, c: number) {
    return `${r}:${c}`;
  }

  function focusCell(r: number, c: number) {
    inputRefs.current.get(cellId(r, c))?.focus();
  }

  function valueAt(r: number, c: number) {
    const dirtyKey = `${r}:${columns[c].key}`;
    if (dirty.current.has(dirtyKey)) return dirty.current.get(dirtyKey)!;
    return rows[r]?.[columns[c].key] ?? '';
  }

  function setDirty(r: number, c: number, value: string) {
    dirty.current.set(`${r}:${columns[c].key}`, value);
    forceRender((n) => n + 1);
  }

  function commit(r: number, c: number) {
    const col = columns[c];
    const dirtyKey = `${r}:${col.key}`;
    if (!dirty.current.has(dirtyKey)) return;
    const value = dirty.current.get(dirtyKey)!;
    dirty.current.delete(dirtyKey);
    if (value !== (rows[r]?.[col.key] ?? '')) {
      onCellCommit?.(r, col.key, value);
    }
    forceRender((n) => n + 1);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>, r: number, c: number) {
    if (e.key === 'Enter') {
      e.preventDefault();
      commit(r, c);
      focusCell(r + 1, c);
    } else if (e.key === 'Escape') {
      dirty.current.delete(`${r}:${columns[c].key}`);
      forceRender((n) => n + 1);
      (e.target as HTMLInputElement).blur();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      commit(r, c);
      focusCell(r - 1, c);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      commit(r, c);
      focusCell(r + 1, c);
    }
  }

  function handlePaste(e: React.ClipboardEvent<HTMLInputElement>, r: number, c: number) {
    const text = e.clipboardData.getData('text/plain');
    if (!onPasteBlock || !(text.includes('\t') || text.includes('\n'))) return;
    e.preventDefault();
    const lines = text.replace(/\r/g, '').split('\n');
    while (lines.length > 1 && lines[lines.length - 1] === '') lines.pop();
    const block = lines.map((line) => line.split('\t'));
    onPasteBlock(r, c, block);
  }

  return (
    <div className={styles.wrapper}>
      <table className={styles.grid}>
        <thead>
          <tr>
            <th className={styles.rowNumCol} />
            {columns.map((col) => (
              <th key={col.key} style={{ width: col.width }}>
                {col.label}
                {col.required && <span className={styles.required}>*</span>}
              </th>
            ))}
            {rowStatuses && <th className={styles.statusCol}>Status</th>}
            {onDeleteRow && <th className={styles.deleteCol} />}
          </tr>
        </thead>
        <tbody>
          {rows.map((_, r) => {
            const status = rowStatuses?.[r];
            return (
              <tr key={r} className={status ? styles[`row_${status.tone}`] : undefined}>
                <td className={styles.rowNumCol}>{r + 1}</td>
                {columns.map((col, c) => (
                  <td key={col.key} className={styles.cell}>
                    <input
                      ref={(el) => {
                        if (el) inputRefs.current.set(cellId(r, c), el);
                        else inputRefs.current.delete(cellId(r, c));
                      }}
                      className={styles.cellInput}
                      value={valueAt(r, c)}
                      readOnly={readOnly || col.readOnly}
                      onChange={(e) => setDirty(r, c, e.target.value)}
                      onBlur={() => commit(r, c)}
                      onKeyDown={(e) => handleKeyDown(e, r, c)}
                      onPaste={(e) => handlePaste(e, r, c)}
                    />
                  </td>
                ))}
                {rowStatuses && (
                  <td className={styles.statusCell}>
                    {status?.tone === 'busy' && <span className={styles.statusBusy}>Saving…</span>}
                    {status?.tone === 'success' && (
                      <span className={styles.statusSuccess}>{status.message ?? '✔ Saved'}</span>
                    )}
                    {status?.tone === 'error' && <span className={styles.statusError}>{status.message ?? 'Failed'}</span>}
                    {status?.tone === 'pending' && <span className={styles.statusPending}>{status.message ?? 'Ready'}</span>}
                  </td>
                )}
                {onDeleteRow && (
                  <td className={styles.deleteCol}>
                    <button
                      type="button"
                      className={styles.deleteBtn}
                      tabIndex={-1}
                      onClick={() => onDeleteRow(r)}
                      aria-label="Delete row"
                    >
                      ✕
                    </button>
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
