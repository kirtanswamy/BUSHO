import React from 'react';
import { StyleSheet, Text, TextInput, TextInputProps, View } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';

type FieldInputProps = TextInputProps & { label: string; hint?: string; error?: string; required?: boolean };

export function FieldInput({ label, hint, error, required = false, style, ...inputProps }: FieldInputProps) {
  const { theme, typeScale } = useTheme();
  const helper = error || hint;
  return (
    <View style={styles.wrapper}>
      <Text style={[styles.label, { color: theme.colors.text, fontSize: 14 * typeScale }]}>{label}{required ? ' *' : ''}</Text>
      <TextInput
        {...inputProps}
        accessibilityLabel={label}
        accessibilityHint={hint}
        placeholderTextColor={theme.colors.textSubtle}
        selectionColor={theme.colors.focus}
        style={[styles.input, { color: theme.colors.text, backgroundColor: theme.colors.surface, borderColor: error ? theme.colors.danger : theme.colors.borderStrong, fontSize: 15 * typeScale, minHeight: theme.touchTarget }, style]}
      />
      {helper ? <Text accessibilityLiveRegion={error ? 'polite' : 'none'} style={[styles.helper, { color: error ? theme.colors.danger : theme.colors.textMuted, fontSize: 12 * typeScale }]}>{helper}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: 6 },
  label: { fontWeight: '700' },
  input: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12 },
  helper: { lineHeight: 18 },
});
