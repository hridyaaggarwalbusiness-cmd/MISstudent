import type { ReactNode } from 'react';
import { Inbox } from 'lucide-react';
import styles from './EmptyState.module.css';

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  compact?: boolean;
}

export function EmptyState({ icon = <Inbox size={32} />, title, description, action, compact }: EmptyStateProps) {
  return (
    <div className={[styles.wrapper, compact && styles.compact].filter(Boolean).join(' ')}>
      <div className={styles.icon}>{icon}</div>
      <span className={styles.title}>{title}</span>
      {description && <span className={styles.description}>{description}</span>}
      {action && <div className={styles.action}>{action}</div>}
    </div>
  );
}
