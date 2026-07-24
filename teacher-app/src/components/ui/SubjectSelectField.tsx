import React, { useState } from 'react';
import { TextInput, StyleSheet } from 'react-native';
import { SelectField } from './SelectField';
import { colors, spacing, radius } from '@theme';

const OTHER_VALUE = '__other__';

interface SubjectSelectFieldProps {
  value: string;
  options: string[];
  onChange: (value: string) => void;
  title?: string;
}

// Same bottom-sheet picker as SelectField (used for Teacher, Class, etc. -
// this looks and behaves identically), with one extra "Other" entry that
// reveals a text input below for a subject not on the list. The list is the
// school's common subjects, not a hard boundary, so typing one in stays
// possible without this field looking different from any other picker.
export function SubjectSelectField({ value, options, onChange, title }: SubjectSelectFieldProps) {
  const [customMode, setCustomMode] = useState(() => value !== '' && !options.includes(value));

  const selectOptions = [
    ...options.map((o) => ({ value: o, label: o })),
    { value: OTHER_VALUE, label: 'Other (type your own)' },
  ];

  return (
    <>
      <SelectField
        value={customMode ? OTHER_VALUE : value}
        options={selectOptions}
        placeholder="Select subject"
        title={title}
        onChange={(v) => {
          if (v === OTHER_VALUE) {
            setCustomMode(true);
            onChange('');
          } else {
            setCustomMode(false);
            onChange(v);
          }
        }}
      />
      {customMode && (
        <TextInput
          value={value}
          onChangeText={onChange}
          placeholder="Type the subject name"
          placeholderTextColor={colors.textTertiary}
          style={styles.input}
        />
      )}
    </>
  );
}

const styles = StyleSheet.create({
  input: {
    height: 46,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceAlt,
    paddingHorizontal: spacing.sm,
    marginTop: spacing.sm,
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: colors.textPrimary,
  },
});
