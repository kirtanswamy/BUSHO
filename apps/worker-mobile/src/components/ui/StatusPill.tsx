import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';

export type StatusTone = 'neutral' | 'info' | 'success' | 'warning' | 'danger' | 'offline';
type StatusPillProps = { label: string; tone?: StatusTone };

export function StatusPill({ label, tone = 'neutral' }: StatusPillProps) {
  const { theme, typeScale } = useTheme();
  const palette = {
    neutral: [theme.colors.surfaceSubtle, theme.colors.text],
    info: [theme.colors.infoSurface, theme.colors.info],
    success: [theme.colors.successSurface, theme.colors.success],
    warning: [theme.colors.warningSurface, theme.colors.warning],
    danger: [theme.colors.dangerSurface, theme.colors.danger],
    offline: [theme.colors.offlineSurface, theme.colors.offline],
  } as const;
  const [backgroundColor, color] = palette[tone];
  return (
    <View style={[styles.container, { backgroundColor }]}>
      <Text style={[styles.label, { color, fontSize: 12 * typeScale }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignSelf: 'flex-start', minHeight: 28, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999, justifyContent: 'center' },
  label: { fontWeight: '700', letterSpacing: 0.1 },
});
