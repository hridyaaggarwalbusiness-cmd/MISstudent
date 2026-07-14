import type { ButtonHTMLAttributes, ComponentType } from 'react';
import styles from './IconButton.module.css';

interface IconButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'className'> {
  icon: ComponentType<{ size?: number }>;
  size?: number;
  tone?: 'default' | 'danger';
}

export function IconButton({ icon: Icon, size = 16, tone = 'default', ...rest }: IconButtonProps) {
  return (
    <button
      type="button"
      className={[styles.button, tone === 'danger' && styles.danger].filter(Boolean).join(' ')}
      {...rest}
    >
      <Icon size={size} />
    </button>
  );
}
