import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react';
import styles from './FormField.module.css';

interface WrapperProps {
  label: string;
  children: ReactNode;
  hint?: string;
}

interface FieldProps {
  label: string;
  hint?: string;
}

function FieldWrapper({ label, children, hint }: WrapperProps) {
  return (
    <label className={styles.wrapper}>
      <span className={styles.label}>{label}</span>
      {children}
      {hint && <span className={styles.hint}>{hint}</span>}
    </label>
  );
}

export function TextField({
  label,
  hint,
  ...rest
}: FieldProps & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <FieldWrapper label={label} hint={hint}>
      <input className={styles.input} {...rest} />
    </FieldWrapper>
  );
}

export function TextAreaField({
  label,
  hint,
  ...rest
}: FieldProps & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <FieldWrapper label={label} hint={hint}>
      <textarea className={[styles.input, styles.textarea].join(' ')} {...rest} />
    </FieldWrapper>
  );
}

export function SelectField({
  label,
  hint,
  children,
  ...rest
}: FieldProps & SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <FieldWrapper label={label} hint={hint}>
      <select className={styles.input} {...rest}>
        {children}
      </select>
    </FieldWrapper>
  );
}

// A pick-from-list field that still accepts a subject typed in by hand - the
// list is the school's common subjects, not a hard boundary, so a native
// <input list> + <datalist> combo (browser-native autocomplete, no custom
// dropdown component needed) fits better here than a plain <select>.
export function ComboField({
  label,
  hint,
  id,
  options,
  value,
  onChange,
  placeholder,
}: FieldProps & {
  id: string;
  options: string[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  const listId = `${id}-options`;
  return (
    <FieldWrapper label={label} hint={hint}>
      <input
        className={styles.input}
        list={listId}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
      <datalist id={listId}>
        {options.map((o) => (
          <option key={o} value={o} />
        ))}
      </datalist>
    </FieldWrapper>
  );
}
