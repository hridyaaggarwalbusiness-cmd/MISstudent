import { useAuthStore } from '@/store/useAuthStore';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import styles from './AppLayout.module.css';

export function Topbar({ title }: { title: string }) {
  const profile = useAuthStore((s) => s.profile);
  const signOut = useAuthStore((s) => s.signOut);

  return (
    <header className={styles.topbar}>
      <span className={styles.pageTitle}>{title}</span>
      <div className={styles.topbarRight}>
        <div className={styles.userChip}>
          <Avatar name={profile?.displayName ?? 'Admin'} size={36} />
          <div className={styles.userMeta}>
            <span className={styles.userName}>{profile?.displayName ?? 'Admin'}</span>
            <span className={styles.userRole}>Administrator</span>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={() => signOut()}>
          Sign out
        </Button>
      </div>
    </header>
  );
}
