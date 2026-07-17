import type { ReactNode } from 'react';
import styles from './PageHeader.module.css';

interface PageHeaderProps {
  title?: string;
  description?: string;
  toolbar?: ReactNode;
}

export function PageHeader({ title, description, toolbar }: PageHeaderProps) {
  return (
    <div className={styles.header}>
      <div className={styles.left}>
        {title && <h1 className={styles.title}>{title}</h1>}
        {description && <span className={styles.description}>{description}</span>}
      </div>
      <div className={styles.toolbar}>{toolbar}</div>
    </div>
  );
}

export { styles as pageHeaderStyles };
