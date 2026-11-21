import React from 'react';
import { StyleSheet, View, ViewProps } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';

type CardProps = ViewProps & { padded?: boolean };

export function Card({ children, style, padded = true, ...props }: CardProps) {
  const { theme } = useTheme();
  return (
    <View {...props} style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border, padding: padded ? theme.spacing.md : 0 }, style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({ card: { borderWidth: 1, borderRadius: 12 } });
