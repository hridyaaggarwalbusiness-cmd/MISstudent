import { List, Grid3x3 } from 'lucide-react';
import styles from './ViewToggle.module.css';

interface ViewToggleProps {
  value: 'list' | 'spreadsheet';
  onChange: (value: 'list' | 'spreadsheet') => void;
}

export function ViewToggle({ value, onChange }: ViewToggleProps) {
  return (
    <div className={styles.toggle} role="tablist" aria-label="View mode">
      <button
        type="button"
        role="tab"
        aria-selected={value === 'list'}
        className={[styles.option, value === 'list' && styles.optionActive].filter(Boolean).join(' ')}
        onClick={() => onChange('list')}
      >
        <List size={14} style={{ verticalAlign: -2, marginRight: 5 }} />
        List
      </button>
      <button
        type="button"
        role="tab"
        aria-selected={value === 'spreadsheet'}
        className={[styles.option, value === 'spreadsheet' && styles.optionActive].filter(Boolean).join(' ')}
        onClick={() => onChange('spreadsheet')}
      >
        <Grid3x3 size={14} style={{ verticalAlign: -2, marginRight: 5 }} />
        Spreadsheet
      </button>
    </div>
  );
}
