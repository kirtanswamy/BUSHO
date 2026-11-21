import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';
import { Button } from './Button';

type EmptyStateProps = { title: string; description: string; actionLabel?: string; onAction?: () => void };

export function EmptyState({ title, description, actionLabel, onAction }: EmptyStateProps) {
  const { theme, typeScale } = useTheme();
  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: theme.colors.text, fontSize: 18 * typeScale }]}>{title}</Text>
      <Text style={[styles.description, { color: theme.colors.textMuted, fontSize: 14 * typeScale }]}>{description}</Text>
      {actionLabel && onAction ? <Button label={actionLabel} onPress={onAction} variant="secondary" style={styles.action} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', justifyContent: 'center', padding: 24, gap: 10 },
  title: { fontWeight: '800', textAlign: 'center' },
  description: { lineHeight: 21, textAlign: 'center', maxWidth: 300 },
  action: { marginTop: 8, alignSelf: 'stretch' },
});
