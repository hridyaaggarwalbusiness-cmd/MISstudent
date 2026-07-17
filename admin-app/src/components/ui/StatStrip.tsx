import type { ReactNode } from 'react';
import { ArrowUp, ArrowDown } from 'lucide-react';
import styles from './StatStrip.module.css';

export interface StatItem {
  icon: ReactNode;
  label: string;
  value: string | number;
  tone?: 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'violet' | 'neutral';
  delta?: { value: string; direction: 'up' | 'down' };
  onClick?: () => void;
}

export function StatStrip({ items }: { items: StatItem[] }) {
  return (
    <div className={styles.strip}>
      {items.map((item, i) => {
        const Tag = item.onClick ? 'button' : 'div';
        return (
          <Tag key={i} className={[styles.tile, item.onClick && styles.tileClickable].filter(Boolean).join(' ')} onClick={item.onClick}>
            <div className={[styles.iconWrap, styles[item.tone ?? 'neutral']].join(' ')}>{item.icon}</div>
            <div className={styles.body}>
              <div className={styles.value}>{item.value}</div>
              <div className={styles.label}>{item.label}</div>
              {item.delta && (
                <div className={[styles.delta, styles[`delta_${item.delta.direction}`]].join(' ')}>
                  {item.delta.direction === 'up' ? <ArrowUp size={11} /> : <ArrowDown size={11} />}
                  {item.delta.value}
                </div>
              )}
            </div>
          </Tag>
        );
      })}
    </div>
  );
}
