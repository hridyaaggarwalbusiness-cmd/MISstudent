import { AlertTriangle } from 'lucide-react';
import styles from './ErrorBanner.module.css';

export function ErrorBanner({ message }: { message: string }) {
  return (
    <div className={styles.banner} role="alert">
      <span className={styles.icon}>
        <AlertTriangle size={16} />
      </span>
      <span>{message}</span>
    </div>
  );
}
