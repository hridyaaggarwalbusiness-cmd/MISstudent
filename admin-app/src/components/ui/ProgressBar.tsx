import styles from './ProgressBar.module.css';

export function ProgressBar({ value, color }: { value: number; color: string }) {
  const clamped = Math.min(100, Math.max(0, value));
  return (
    <div className={styles.track}>
      <div className={styles.fill} style={{ width: `${clamped}%`, background: color }} />
    </div>
  );
}
