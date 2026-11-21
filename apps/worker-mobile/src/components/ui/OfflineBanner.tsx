import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';

type OfflineBannerProps = { visible: boolean; message?: string };

export function OfflineBanner({ visible, message = 'Offline · Saved on device · Pending sync' }: OfflineBannerProps) {
  const { theme, typeScale } = useTheme();
  if (!visible) return null;
  return (
    <View accessibilityRole="alert" accessibilityLiveRegion="polite" style={[styles.banner, { backgroundColor: theme.colors.offlineSurface, borderColor: theme.colors.offline }]}>
      <Text style={[styles.text, { color: theme.colors.offline, fontSize: 13 * typeScale }]}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10 },
  text: { fontWeight: '700', lineHeight: 19 },
});
