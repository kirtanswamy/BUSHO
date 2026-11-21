import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';

export const STOCKOUT_UNITS = ['tablets', 'strips', 'bottles', 'sachets', 'Other'] as const;
export type StockoutUnit = (typeof STOCKOUT_UNITS)[number];
type UnitChipsProps = { value: StockoutUnit; onChange: (unit: StockoutUnit) => void };

export function UnitChips({ value, onChange }: UnitChipsProps) {
  const { theme, typeScale } = useTheme();
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
      {STOCKOUT_UNITS.map((unit) => {
        const selected = value === unit;
        return (
          <Pressable key={unit} accessibilityRole="radio" accessibilityState={{ selected }} accessibilityLabel={unit} onPress={() => onChange(unit)}
            style={[styles.chip, { minHeight: theme.touchTarget, backgroundColor: selected ? theme.colors.primary : theme.colors.surface, borderColor: selected ? theme.colors.primary : theme.colors.borderStrong }]}>
            <Text style={{ color: selected ? theme.colors.onPrimary : theme.colors.text, fontSize: 13 * typeScale, fontWeight: '700' }}>{unit}</Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 8, paddingVertical: 2 },
  chip: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 14, alignItems: 'center', justifyContent: 'center' },
});
