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
