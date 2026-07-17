import { useState } from 'react';
import { Plus } from 'lucide-react';
import { GlobalSearch } from './GlobalSearch';
import { NotificationBell } from './NotificationBell';
import { QuickActionModal } from './QuickActionModal';
import styles from './AppLayout.module.css';

export function Topbar() {
  const [quickOpen, setQuickOpen] = useState(false);

  return (
    <header className={styles.topbar}>
      <GlobalSearch />
      <div className={styles.topbarRight}>
        <NotificationBell />
        <button className={styles.quickActionBtn} onClick={() => setQuickOpen(true)}>
          <Plus size={16} /> Quick Action
        </button>
      </div>
      <QuickActionModal open={quickOpen} onClose={() => setQuickOpen(false)} />
    </header>
  );
}
