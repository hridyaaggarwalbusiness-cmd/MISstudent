import React, { useEffect, useState } from 'react';
import { View, FlatList, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { AppText, Card, Badge, IconButton, DetailHeader, EmptyState, Skeleton } from '@components/ui';
import { colors, spacing, layout } from '@theme';
import { RootStackParamList } from '@navigation/types';
import { repo } from '@data/repositories';
import { Notice } from '@/types';
import { relativeTime } from '@utils/date';

export function NoticesScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [notices, setNotices] = useState<Notice[] | null>(null);

  useEffect(() => repo.notices.subscribeAll(setNotices), []);

  const confirmDelete = (notice: Notice) => {
    Alert.alert('Delete notice', `Remove "${notice.title}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => repo.notices.remove(notice.id) },
    ]);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <DetailHeader
        title="Notices"
        rightAction={
          <IconButton icon="add" onPress={() => navigation.navigate('NoticeCreate')} backgroundColor={colors.primary} color={colors.textInverse} />
        }
      />
      {notices === null ? (
        <View style={{ paddingHorizontal: spacing.lg }}>
          <Skeleton height={100} borderRadius={16} />
        </View>
      ) : (
        <FlatList
          data={notices}
          keyExtractor={(n) => n.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={<EmptyState icon="megaphone-outline" title="No notices posted" />}
          renderItem={({ item }) => (
            <Card style={{ marginBottom: spacing.sm }}>
              <View style={styles.row}>
                <View style={{ flex: 1 }}>
                  <Badge label={item.category} tone="neutral" size="sm" />
                  <AppText variant="bodySemibold" style={{ marginTop: 4 }}>
                    {item.title}
                  </AppText>
                  <AppText variant="caption" color={colors.textSecondary} numberOfLines={2} style={{ marginTop: 3 }}>
                    {item.body}
                  </AppText>
                  <AppText variant="tiny" color={colors.textTertiary} style={{ marginTop: 4 }}>
                    {relativeTime(item.postedAt)}
                  </AppText>
                </View>
                <Ionicons name="trash-outline" size={18} color={colors.textTertiary} onPress={() => confirmDelete(item)} />
              </View>
            </Card>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  list: { paddingHorizontal: spacing.lg, paddingBottom: layout.tabBarClearance, flexGrow: 1 },
  row: { flexDirection: 'row', alignItems: 'flex-start' },
});
