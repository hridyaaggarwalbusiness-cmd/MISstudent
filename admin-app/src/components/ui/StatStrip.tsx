import type { ReactNode } from 'react';
import styles from './StatStrip.module.css';

export interface StatItem {
  icon: ReactNode;
  label: string;
  value: string | number;
  tone?: 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'violet' | 'neutral';
}

export function StatStrip({ items }: { items: StatItem[] }) {
  return (
    <div className={styles.strip}>
      {items.map((item, i) => (
        <div key={i} className={styles.tile}>
          <div className={[styles.iconWrap, styles[item.tone ?? 'neutral']].join(' ')}>{item.icon}</div>
          <div>
            <div className={styles.value}>{item.value}</div>
            <div className={styles.label}>{item.label}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
