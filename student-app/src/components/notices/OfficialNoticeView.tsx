import React, { useEffect, useState } from 'react';
import { View, Image, ActivityIndicator, StyleSheet } from 'react-native';
import { Button } from '@components/ui';
import { colors, radius, spacing } from '@theme';
import {
  downloadNoticeImage,
  downloadNoticePdf,
  downloadNoticePdfFromImages,
  downloadImageDataUrl,
  NoticeTemplateData,
  renderAllPagesDataUrls,
  PAGE_WIDTH_PT,
  PAGE_HEIGHT_PT,
} from '@utils/noticeTemplate';

const ASPECT_RATIO = PAGE_WIDTH_PT / PAGE_HEIGHT_PT;

// Renders the notice through the same official HTML/CSS template used
// everywhere else (see utils/noticeTemplate.ts). When the admin published
// this notice with pageImages already captured (see AiNoticeWriterPage's
// publish flow), those exact stored pages are shown/downloaded directly -
// no re-render - so what the student sees is byte-identical to what was
// published. Older notices (or ones where storage was skipped for being
// too large) fall back to live regeneration from title/body, rasterized via
// html2canvas, which produces the same visual result.
export function OfficialNoticeView({
  data,
  fileBaseName,
  pageImages,
}: {
  data: NoticeTemplateData;
  fileBaseName: string;
  pageImages?: string[];
}) {
  const hasStoredPages = !!pageImages?.length;
  const [pageUrls, setPageUrls] = useState<string[] | null>(hasStoredPages ? pageImages! : null);
  const [exportingPdf, setExportingPdf] = useState(false);
  const [exportingImage, setExportingImage] = useState(false);

  useEffect(() => {
    if (hasStoredPages) {
      setPageUrls(pageImages!);
      return;
    }
    let cancelled = false;
    setPageUrls(null);
    renderAllPagesDataUrls(data).then((urls) => {
      if (!cancelled) setPageUrls(urls);
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, hasStoredPages, pageImages]);

  async function handleDownloadPdf() {
    setExportingPdf(true);
    try {
      if (hasStoredPages) {
        await downloadNoticePdfFromImages(pageImages!, fileBaseName);
      } else {
        await downloadNoticePdf(data, fileBaseName);
      }
    } finally {
      setExportingPdf(false);
    }
  }

  async function handleDownloadImage() {
    setExportingImage(true);
    try {
      if (hasStoredPages) {
        downloadImageDataUrl(pageImages![0], fileBaseName);
      } else {
        await downloadNoticeImage(data, fileBaseName);
      }
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
