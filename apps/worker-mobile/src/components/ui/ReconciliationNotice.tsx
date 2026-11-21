import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';

export function ReconciliationNotice({ visible }: { visible: boolean }) {
  const { theme, typeScale } = useTheme();
  if (!visible) return null;
  return (
    <View accessibilityRole="alert" accessibilityLiveRegion="assertive" style={[styles.notice, { backgroundColor: theme.colors.warningSurface, borderColor: theme.colors.warning }]}>
      <Text style={[styles.title, { color: theme.colors.warning, fontSize: 14 * typeScale }]}>Connection interrupted</Text>
      <Text style={[styles.body, { color: theme.colors.text, fontSize: 13 * typeScale }]}>Connection interrupted — refresh case list to verify before resending</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  notice: { borderWidth: 1, borderRadius: 10, padding: 12, gap: 4 },
  title: { fontWeight: '800' },
  body: { lineHeight: 19 },
});
