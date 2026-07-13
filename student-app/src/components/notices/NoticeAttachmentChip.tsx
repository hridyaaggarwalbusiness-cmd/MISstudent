import React from 'react';
import { View, StyleSheet, Platform, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText, AnimatedPressable } from '@components/ui';
import { colors, spacing, radius } from '@theme';
import { Attachment } from '@/types';

const badgeMeta: Record<Attachment['type'], { label: string; color: string }> = {
  pdf: { label: 'PDF', color: colors.danger },
  doc: { label: 'DOC', color: colors.primary },
  image: { label: 'IMG', color: colors.accentEmerald },
  video: { label: 'VID', color: colors.accentViolet },
  link: { label: 'LINK', color: colors.accentAmber },
};

// Browsers can render PDFs (and images) inline, so open those directly in a
// new tab -- the closest web equivalent to a PDF "just opening". Other file
// types (doc/docx, ...) have no in-browser viewer, so those still trigger a
// real download; the device's own download-complete notification is what
// then offers an "Open with" app picker, same as WhatsApp.
function openAttachment(url: string, filename: string, type: Attachment['type']) {
  if (Platform.OS === 'web') {
    if (type === 'pdf' || type === 'image') {
      window.open(url, '_blank', 'noopener,noreferrer');
      return;
    }
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  } else {
    Linking.openURL(url).catch(() => {});
  }
}

export function NoticeAttachmentChip({ attachment }: { attachment: Attachment }) {
  const meta = badgeMeta[attachment.type];
  return (
    <AnimatedPressable
      onPress={() => openAttachment(attachment.url, attachment.name, attachment.type)}
      haptic={false}
      style={styles.row}
    >
      <View style={[styles.badge, { backgroundColor: meta.color }]}>
        <AppText variant="tiny" color="#fff" style={{ fontWeight: '800' }}>
          {meta.label}
        </AppText>
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
      <Ionicons
        name={attachment.type === 'pdf' || attachment.type === 'image' ? 'open-outline' : 'download-outline'}
        size={18}
        color={colors.primary}
      />
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.borderSoft,
    borderRadius: radius.md,
    padding: spacing.sm,
    marginTop: spacing.xs,
  },
  badge: {
    width: 40,
    height: 40,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
