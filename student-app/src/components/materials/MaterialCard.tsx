import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card, AppText } from '@components/ui';
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
    <Card onPress={onPress} style={[styles.card, { borderLeftWidth: 3, borderLeftColor: accent.fg }]}>
      <View style={styles.row}>
        <View style={[styles.iconWrap, { backgroundColor: accent.bg }]}>
          <Ionicons name={typeIcon[material.type]} size={22} color={accent.fg} />
        </View>
        <View style={{ flex: 1, marginLeft: spacing.sm }}>
          <View style={[styles.subjectBadge, { backgroundColor: accent.bg }]}>
            <AppText variant="tiny" color={accent.fg}>
              {material.subject}
            </AppText>
          </View>
          <AppText variant="bodySemibold" numberOfLines={2} style={{ marginTop: 4, fontSize: 15 }}>
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
    width: 44,
    height: 44,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subjectBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.xs,
  },
});
