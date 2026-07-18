import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '@components/ui';
import { colors, radius, spacing } from '@theme';

interface StepIndicatorProps {
  steps: string[];
  currentIndex: number;
}

export function StepIndicator({ steps, currentIndex }: StepIndicatorProps) {
  return (
    <View style={styles.row}>
      {steps.map((label, i) => {
        const done = i < currentIndex;
        const active = i === currentIndex;
        return (
          <React.Fragment key={label}>
            <View style={styles.stepWrap}>
              <View style={[styles.dot, done && styles.dotDone, active && styles.dotActive]}>
                {done ? (
                  <Ionicons name="checkmark" size={13} color={colors.textInverse} />
                ) : (
                  <AppText variant="tiny" color={active ? colors.textInverse : colors.textTertiary} style={{ fontWeight: '700' }}>
                    {i + 1}
                  </AppText>
                )}
              </View>
              <AppText
                variant="tiny"
                color={active || done ? colors.textPrimary : colors.textTertiary}
                style={{ marginTop: 4, fontWeight: active ? '700' : '500' }}
              >
                {label}
              </AppText>
            </View>
            {i < steps.length - 1 && <View style={[styles.line, (done || active) && styles.lineDone]} />}
          </React.Fragment>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  stepWrap: {
    alignItems: 'center',
    width: 64,
  },
  dot: {
    width: 26,
    height: 26,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1.5,
    borderColor: colors.borderSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  dotDone: {
    backgroundColor: colors.success,
    borderColor: colors.success,
  },
  line: {
    flex: 1,
    height: 2,
    marginTop: 12,
    backgroundColor: colors.borderSoft,
  },
  lineDone: {
    backgroundColor: colors.success,
  },
});
