import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { IconButton } from './IconButton';
import { AppText } from './AppText';
import { spacing } from '@theme';

interface DetailHeaderProps {
  title?: string;
  rightAction?: React.ReactNode;
}

export function DetailHeader({ title, rightAction }: DetailHeaderProps) {
  const navigation = useNavigation();
  return (
    <View style={styles.row}>
      <IconButton icon="chevron-back" onPress={() => navigation.goBack()} />
      {title && (
        <AppText variant="h3" numberOfLines={1} style={{ flex: 1, marginLeft: spacing.sm }}>
          {title}
        </AppText>
      )}
      {rightAction ?? <View style={{ width: 40 }} />}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
  },
});
