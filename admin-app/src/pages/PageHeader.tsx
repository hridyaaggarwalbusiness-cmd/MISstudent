import type { ReactNode } from 'react';
import styles from './PageHeader.module.css';

interface PageHeaderProps {
  description?: string;
  toolbar?: ReactNode;
}

export function PageHeader({ description, toolbar }: PageHeaderProps) {
  return (
    <div className={styles.header}>
      <div className={styles.left}>{description && <span className={styles.description}>{description}</span>}</div>
      <div className={styles.toolbar}>{toolbar}</div>
    </div>
  );
}

export { styles as pageHeaderStyles };
