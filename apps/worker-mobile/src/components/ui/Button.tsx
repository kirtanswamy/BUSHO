import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, ViewStyle } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';

type ButtonProps = {
  label: string;
  onPress?: () => void;
  variant?: 'primary' | 'secondary' | 'tertiary' | 'danger';
  disabled?: boolean;
  loading?: boolean;
  accessibilityHint?: string;
  style?: ViewStyle;
};

export function Button({ label, onPress, variant = 'primary', disabled = false, loading = false, accessibilityHint, style }: ButtonProps) {
  const { theme, typeScale } = useTheme();
  const isDisabled = disabled || loading;
  const backgroundColor = variant === 'primary' ? theme.colors.primary : variant === 'danger' ? theme.colors.danger : variant === 'secondary' ? theme.colors.surface : 'transparent';
  const foregroundColor = variant === 'primary' || variant === 'danger' ? '#FFFFFF' : theme.colors.primary;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      disabled={isDisabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        { minHeight: theme.touchTarget, backgroundColor, borderColor: variant === 'tertiary' ? 'transparent' : theme.colors.borderStrong, opacity: isDisabled ? 0.55 : pressed ? 0.86 : 1 },
        style,
      ]}
    >
      {loading ? <ActivityIndicator color={foregroundColor} /> : <Text style={[styles.label, { color: foregroundColor, fontSize: 15 * typeScale }]}>{label}</Text>}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: { minHeight: 48, paddingHorizontal: 18, paddingVertical: 12, borderWidth: 1, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  label: { fontWeight: '700', textAlign: 'center' },
});
