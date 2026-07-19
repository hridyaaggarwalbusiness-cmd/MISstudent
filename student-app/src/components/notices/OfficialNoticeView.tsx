import React, { useEffect, useState } from 'react';
import { View, Image, ActivityIndicator, StyleSheet } from 'react-native';
import { Button } from '@components/ui';
import { colors, radius, spacing } from '@theme';
import {
  downloadNoticeImage,
  downloadNoticePdf,
  NoticeTemplateData,
  renderAllPagesDataUrls,
  PAGE_WIDTH_PT,
  PAGE_HEIGHT_PT,
} from '@utils/noticeTemplate';

const ASPECT_RATIO = PAGE_WIDTH_PT / PAGE_HEIGHT_PT;

// Renders the notice through the same official HTML/CSS template used
// everywhere else (see utils/noticeTemplate.ts) - every page is rasterized
// via html2canvas (student-app is Expo web-only, so document/iframe/canvas
// are always available) and shown here in full, so a multi-page notice is
// never silently truncated to page 1: what's shown is exactly what
// downloadNoticePdf() would produce.
export function OfficialNoticeView({ data, fileBaseName }: { data: NoticeTemplateData; fileBaseName: string }) {
  const [pageUrls, setPageUrls] = useState<string[] | null>(null);
  const [exportingPdf, setExportingPdf] = useState(false);
  const [exportingImage, setExportingImage] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setPageUrls(null);
    renderAllPagesDataUrls(data).then((urls) => {
      if (!cancelled) setPageUrls(urls);
    });
    return () => {
      cancelled = true;
    };
  }, [data]);

  async function handleDownloadPdf() {
    setExportingPdf(true);
    try {
      await downloadNoticePdf(data, fileBaseName);
    } finally {
      setExportingPdf(false);
    }
  }

  async function handleDownloadImage() {
    setExportingImage(true);
    try {
      await downloadNoticeImage(data, fileBaseName);
    } finally {
      setExportingImage(false);
    }
  }

  return (
    <View>
      {pageUrls ? (
        pageUrls.map((url, i) => (
          <View key={i} style={[styles.frame, i > 0 && styles.pageSpacing]}>
            <Image source={{ uri: url }} style={styles.image} resizeMode="contain" />
          </View>
        ))
      ) : (
        <View style={styles.frame}>
          <View style={[styles.image, styles.loading]}>
            <ActivityIndicator color={colors.textTertiary} />
          </View>
        </View>
      )}
      <View style={styles.actions}>
        <Button
          label="Download PDF"
          icon="document-text-outline"
          variant="outline"
          size="sm"
          loading={exportingPdf}
          onPress={handleDownloadPdf}
          style={styles.actionBtn}
        />
        <Button
          label="Download Image"
          icon="image-outline"
          variant="outline"
          size="sm"
          loading={exportingImage}
          onPress={handleDownloadImage}
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
  pageSpacing: {
    marginTop: spacing.sm,
  },
  image: {
    width: '100%',
    aspectRatio: ASPECT_RATIO,
  },
  loading: {
    alignItems: 'center',
    justifyContent: 'center',
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
