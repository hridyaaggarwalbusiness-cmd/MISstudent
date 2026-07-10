import styles from './Badge.module.css';

export type BadgeTone = 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'violet';

interface BadgeProps {
  label: string;
  tone?: BadgeTone;
}

export function Badge({ label, tone = 'neutral' }: BadgeProps) {
  return <span className={[styles.badge, styles[tone]].join(' ')}>{label}</span>;
}
