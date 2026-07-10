import type { ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import styles from './AppLayout.module.css';

export function AppLayout({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className={styles.shell}>
      <Sidebar />
      <div className={styles.main}>
        <Topbar title={title} />
        <main className={styles.content}>{children}</main>
      </div>
    </div>
  );
}
