import { useState } from 'react';
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

const OTHER_VALUE = '__other__';

// A plain <select> - same look and interaction as picking a Teacher - with
// one extra "Other" entry that reveals a text field below for a subject not
// on the list. The list is the school's common subjects, not a hard
// boundary, so typing one in stays possible without the field looking or
// behaving differently from every other select in the app.
export function SubjectSelectField({
  label,
  hint,
  options,
  value,
  onChange,
}: FieldProps & {
  options: string[];
  value: string;
  onChange: (value: string) => void;
}) {
  const [customMode, setCustomMode] = useState(() => value !== '' && !options.includes(value));

  return (
    <>
      <FieldWrapper label={label} hint={hint}>
        <select
          className={styles.input}
          value={customMode ? OTHER_VALUE : value}
          onChange={(e) => {
            if (e.target.value === OTHER_VALUE) {
              setCustomMode(true);
              onChange('');
            } else {
              setCustomMode(false);
              onChange(e.target.value);
            }
          }}
        >
          <option value="">Select subject</option>
          {options.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
          <option value={OTHER_VALUE}>Other (type your own)</option>
        </select>
      </FieldWrapper>
      {customMode && (
        <TextField
          label="Custom Subject"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Type the subject name"
        />
      )}
    </>
  );
}
