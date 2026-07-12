import type { BadgeTone } from '@/components/ui/Badge';

export const TONE_COLORS: Record<BadgeTone, { color: string; bg: string; solid: string }> = {
  primary: { color: 'var(--color-primary)', bg: 'var(--color-primary-soft)', solid: 'var(--color-primary)' },
  violet: { color: 'var(--color-violet)', bg: 'var(--color-violet-bg)', solid: 'var(--color-violet)' },
  info: { color: 'var(--color-info-strong)', bg: 'var(--color-info-bg)', solid: 'var(--color-info)' },
  success: { color: 'var(--color-success-strong)', bg: 'var(--color-success-bg)', solid: 'var(--color-success)' },
  warning: { color: 'var(--color-warning-strong)', bg: 'var(--color-warning-bg)', solid: 'var(--color-warning)' },
  danger: { color: 'var(--color-danger-strong)', bg: 'var(--color-danger-bg)', solid: 'var(--color-danger)' },
  neutral: { color: 'var(--color-text-secondary)', bg: 'var(--color-surface-alt)', solid: 'var(--color-text-tertiary)' },
};
