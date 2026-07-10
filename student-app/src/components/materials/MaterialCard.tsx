import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card, AppText, Badge } from '@components/ui';
import { colors, spacing, radius, accentForKey } from '@theme';
import { StudyMaterial } from '@/types';
import { friendlyDateShort } from '@utils/date';

const typeIcon: Record<StudyMaterial['type'], keyof typeof Ionicons.glyphMap> = {
  note: 'document-text-outline',
  presentation: 'easel-outline',
  worksheet: 'create-outline',
  question_bank: 'help-circle-outline',
  video: 'play-circle-outline',
  other: 'folder-outline',
};

export function MaterialCard({ material, onPress }: { material: StudyMaterial; onPress: () => void }) {
  const accent = accentForKey(material.subject);
  return (
    <Card onPress={onPress} style={styles.card}>
      <View style={styles.row}>
        <View style={[styles.iconWrap, { backgroundColor: accent.bg }]}>
          <Ionicons name={typeIcon[material.type]} size={20} color={accent.fg} />
        </View>
        <View style={{ flex: 1, marginLeft: spacing.sm }}>
          <Badge label={material.subject} tone="neutral" size="sm" />
          <AppText variant="bodySemibold" numberOfLines={2} style={{ marginTop: 4 }}>
            {material.title}
          </AppText>
          <AppText variant="tiny" color={colors.textTertiary} style={{ marginTop: 3 }}>
            {material.uploadedBy} · {friendlyDateShort(material.uploadedAt)}
            {material.sizeLabel ? ` · ${material.sizeLabel}` : ''}
            {material.durationLabel ? ` · ${material.durationLabel}` : ''}
          </AppText>
        </View>
        <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: spacing.sm },
  row: { flexDirection: 'row', alignItems: 'flex-start' },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
