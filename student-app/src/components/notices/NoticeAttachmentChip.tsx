import React from 'react';
import { View, StyleSheet, Platform, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText, AnimatedPressable } from '@components/ui';
import { colors, spacing } from '@theme';
import { Attachment } from '@/types';

const badgeMeta: Record<Attachment['type'], { label: string; color: string }> = {
  pdf: { label: 'PDF', color: colors.danger },
  doc: { label: 'DOC', color: colors.primary },
  image: { label: 'IMG', color: colors.accentEmerald },
  video: { label: 'VID', color: colors.accentViolet },
  link: { label: 'LINK', color: colors.accentAmber },
};

// Chrome/Edge/Firefox all refuse to navigate a top-level tab straight to a
// data: URL (attachments are stored as base64 data URLs since Cloud Storage
// isn't provisioned on this project) -- it silently opens a blank tab.
// Converting to a blob: URL first is the standard workaround.
async function toOpenableUrl(url: string): Promise<string> {
  if (!url.startsWith('data:')) return url;
  const blob = await (await fetch(url)).blob();
  return URL.createObjectURL(blob);
}

// Browsers can render PDFs (and images) inline, so open those directly in a
// new tab -- the closest web equivalent to a PDF "just opening". Other file
// types (doc/docx, ...) have no in-browser viewer, so those still trigger a
// real download; the device's own download-complete notification is what
// then offers an "Open with" app picker, same as WhatsApp.
function openAttachment(url: string, filename: string, type: Attachment['type']) {
  if (Platform.OS === 'web') {
    if (type === 'pdf' || type === 'image') {
      // window.open must run synchronously in the click handler or popup
      // blockers kill it once we're past an await -- open a blank tab now,
      // then point it at the real (blob) URL once conversion finishes. Can't
      // pass noopener/noreferrer here: both make window.open() return null,
      // which is exactly the handle we need to navigate afterwards.
      const tab = window.open('', '_blank');
      toOpenableUrl(url)
        .then((target) => {
          if (tab) tab.location.href = target;
        })
        .catch(() => {
          if (tab) tab.location.href = url;
        });
      return;
    }
    toOpenableUrl(url)
      .then((target) => {
        const a = document.createElement('a');
        a.href = target;
        a.download = filename;
        a.rel = 'noopener noreferrer';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      })
      .catch(() => {});
  } else {
    Linking.openURL(url).catch(() => {});
  }
}

function FileBadge({ color, label }: { color: string; label: string }) {
  return (
    <View style={[styles.badge, { backgroundColor: color }]}>
      <View style={styles.badgeFold} />
      <AppText variant="tiny" color="#fff" style={styles.badgeLabel}>
        {label}
      </AppText>
    </View>
  );
}

export function NoticeAttachmentChip({ attachment }: { attachment: Attachment }) {
  const meta = badgeMeta[attachment.type];
  return (
    <AnimatedPressable
      onPress={() => openAttachment(attachment.url, attachment.name, attachment.type)}
      haptic={false}
      style={styles.row}
    >
      <FileBadge color={meta.color} label={meta.label} />
      <View style={{ flex: 1, marginLeft: spacing.sm }}>
        <AppText variant="bodyMedium" numberOfLines={1} style={{ fontWeight: '700' }}>
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
        size={20}
        color={colors.primary}
      />
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  badge: {
    width: 38,
    height: 46,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: 6,
    overflow: 'hidden',
  },
  badgeFold: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 0,
    height: 0,
    borderTopWidth: 11,
    borderLeftWidth: 11,
    borderTopColor: 'rgba(255,255,255,0.45)',
    borderLeftColor: 'transparent',
  },
  badgeLabel: {
    fontWeight: '800',
    fontSize: 9,
    letterSpacing: 0.3,
  },
});
