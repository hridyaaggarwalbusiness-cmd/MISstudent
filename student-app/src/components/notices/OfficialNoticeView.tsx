import React, { useMemo } from 'react';
import { View, Image, StyleSheet } from 'react-native';
import { Button } from '@components/ui';
import { colors, radius, spacing } from '@theme';
import { downloadNoticeImage, downloadNoticePdf, NoticeTemplateData, renderNoticeDataUrl } from '@utils/noticeTemplate';

const ASPECT_RATIO = 1000 / 1414;

// Renders the notice through the same official template used everywhere
// else (see utils/noticeTemplate.ts) - the canvas draw runs once here
// (student-app is Expo web-only, so document/canvas are always available)
// and the resulting PNG is what's shown, downloaded as an image, and
// embedded into the downloaded PDF, so all three are always pixel-identical.
export function OfficialNoticeView({ data, fileBaseName }: { data: NoticeTemplateData; fileBaseName: string }) {
  const dataUrl = useMemo(() => renderNoticeDataUrl(data), [data]);

  return (
    <View>
      <View style={styles.frame}>
        <Image source={{ uri: dataUrl }} style={styles.image} resizeMode="contain" />
      </View>
      <View style={styles.actions}>
        <Button
          label="Download PDF"
          icon="document-text-outline"
          variant="outline"
          size="sm"
          onPress={() => downloadNoticePdf(data, fileBaseName)}
          style={styles.actionBtn}
        />
        <Button
          label="Download Image"
          icon="image-outline"
          variant="outline"
          size="sm"
          onPress={() => downloadNoticeImage(data, fileBaseName)}
          style={styles.actionBtn}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    borderRadius: radius.lg,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  image: {
    width: '100%',
    aspectRatio: ASPECT_RATIO,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  actionBtn: {
    flex: 1,
  },
});
