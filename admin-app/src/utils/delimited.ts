// Parses text pasted from a spreadsheet (tab-delimited, the format the
// clipboard carries when you copy cells out of Google Sheets or Excel) or
// an uploaded .csv file (comma-delimited). Auto-detects which by checking
// the header line, and understands simple double-quoted fields so a comma
// or newline inside a cell doesn't break the split.
export function parseDelimitedText(text: string): string[][] {
  const normalized = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const trimmed = normalized.trim();
  if (!trimmed) return [];
  const firstLine = trimmed.split('\n')[0];
  const delimiter = firstLine.includes('\t') ? '\t' : ',';
  return splitRows(trimmed, delimiter).map((row) => row.map((cell) => cell.trim()));
}

function splitRows(text: string, delimiter: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          cell += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        cell += ch;
      }
      continue;
    }
    if (ch === '"') {
      inQuotes = true;
    } else if (ch === delimiter) {
      row.push(cell);
      cell = '';
    } else if (ch === '\n') {
      row.push(cell);
      rows.push(row);
      row = [];
      cell = '';
    } else {
      cell += ch;
    }
  }
  row.push(cell);
  rows.push(row);
  return rows;
}

// Matches a spreadsheet header cell against a column's accepted labels,
// case- and whitespace-insensitive.
export function normalizeHeader(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, ' ');
}
