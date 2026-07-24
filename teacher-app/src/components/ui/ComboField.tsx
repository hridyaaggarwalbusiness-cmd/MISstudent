import React, { useState } from 'react';
import { View, Modal, Pressable, ScrollView, StyleSheet, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from './AppText';
import { AnimatedPressable } from './AnimatedPressable';
import { colors, spacing, radius } from '@theme';

interface ComboFieldProps {
  value: string;
  options: string[];
  onChange: (value: string) => void;
  placeholder?: string;
  title?: string;
}

// Like SelectField, but the sheet also has a text input - the options are
// the school's common subjects, not a hard boundary, so typing something not
// on the list and confirming it is just as valid as tapping a suggestion.
export function ComboField({ value, options, onChange, placeholder = 'Select', title }: ComboFieldProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  const filtered = query.trim()
    ? options.filter((o) => o.toLowerCase().includes(query.trim().toLowerCase()))
    : options;
  const exactMatch = options.some((o) => o.toLowerCase() === query.trim().toLowerCase());

  function openSheet() {
    setQuery(value);
    setOpen(true);
  }

  function choose(v: string) {
    onChange(v);
    setOpen(false);
  }

  return (
    <>
      <AnimatedPressable onPress={openSheet} haptic={false} style={styles.field}>
        <AppText variant="bodyMedium" color={value ? colors.textPrimary : colors.textTertiary} numberOfLines={1}>
          {value || placeholder}
        </AppText>
        <Ionicons name="chevron-down" size={18} color={colors.textSecondary} />
      </AnimatedPressable>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.overlay} onPress={() => setOpen(false)}>
          <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
            <View style={styles.grabber} />
            {title && (
              <AppText variant="h3" style={{ marginBottom: spacing.sm }}>
                {title}
              </AppText>
            )}
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Type to search or add your own"
              placeholderTextColor={colors.textTertiary}
              style={styles.input}
              autoFocus
              onSubmitEditing={() => query.trim() && choose(query.trim())}
            />
            <ScrollView style={{ maxHeight: 280, marginTop: spacing.sm }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              {query.trim() && !exactMatch && (
                <AnimatedPressable onPress={() => choose(query.trim())} haptic={false} style={styles.option}>
                  <AppText variant="bodyMedium" color={colors.primary}>
                    Use "{query.trim()}"
                  </AppText>
                </AnimatedPressable>
              )}
              {filtered.map((option) => (
                <AnimatedPressable key={option} onPress={() => choose(option)} haptic={false} style={styles.option}>
                  <AppText variant="bodyMedium">{option}</AppText>
                  {option === value && <Ionicons name="checkmark" size={18} color={colors.primary} />}
                </AnimatedPressable>
              ))}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 46,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceAlt,
    paddingHorizontal: spacing.sm,
  },
  overlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingTop: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
  grabber: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.borderSoft,
    alignSelf: 'center',
    marginBottom: spacing.md,
  },
  input: {
    height: 44,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.sm,
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: colors.textPrimary,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm + 4,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.borderSoft,
  },
});
