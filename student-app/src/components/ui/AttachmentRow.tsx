import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from './AppText';
import { AnimatedPressable } from './AnimatedPressable';
import { colors, spacing, radius } from '@theme';
import { Attachment } from '@/types';
import { attachmentIcon, attachmentColor } from '@utils/attachments';

interface AttachmentRowProps {
  attachment: Attachment;
  onPress?: () => void;
  onRemove?: () => void;
}

export function AttachmentRow({ attachment, onPress, onRemove }: AttachmentRowProps) {
  const color = attachmentColor(attachment.type);
  return (
    <AnimatedPressable
      onPress={onPress}
      haptic={false}
      style={styles.row}
      disabled={!onPress}
    >
      <View style={[styles.iconWrap, { backgroundColor: `${color}29` }]}>
        <Ionicons name={attachmentIcon(attachment.type)} size={18} color={color} />
      </View>
      <View style={{ flex: 1, marginLeft: spacing.sm }}>
        <AppText variant="bodyMedium" numberOfLines={1}>
          {attachment.name}
        </AppText>
        {attachment.sizeLabel && (
          <AppText variant="tiny" color={colors.textTertiary}>
            {attachment.sizeLabel}
          </AppText>
        )}
      </View>
      {onRemove ? (
        <AnimatedPressable onPress={onRemove} haptic={false}>
          <Ionicons name="close-circle" size={20} color={colors.textTertiary} />
        </AnimatedPressable>
      ) : onPress ? (
        <Ionicons name="download-outline" size={18} color={colors.textTertiary} />
      ) : null}
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.sm,
    padding: spacing.sm,
    marginBottom: spacing.xs,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
