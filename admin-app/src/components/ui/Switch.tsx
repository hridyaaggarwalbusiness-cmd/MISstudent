import styles from './Switch.module.css';

interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  disabled?: boolean;
}

export function Switch({ checked, onChange, label, disabled }: SwitchProps) {
  return (
    <label className={[styles.wrapper, disabled && styles.disabled].filter(Boolean).join(' ')}>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        disabled={disabled}
        className={[styles.track, checked && styles.trackOn].filter(Boolean).join(' ')}
        onClick={() => !disabled && onChange(!checked)}
      >
        <span className={[styles.thumb, checked && styles.thumbOn].filter(Boolean).join(' ')} />
      </button>
      {label && <span className={styles.label}>{label}</span>}
    </label>
  );
}
