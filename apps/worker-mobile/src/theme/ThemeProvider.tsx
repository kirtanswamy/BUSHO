import React, { createContext, useContext, useMemo, useState } from 'react';
import { AppTheme, createTheme, ThemeMode, TypeScale, TYPE_SCALE } from './tokens';

type ThemeContextValue = {
  theme: AppTheme;
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  typeScale: number;
  typeScaleChoice: TypeScale;
  setTypeScaleChoice: (scale: TypeScale) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: React.PropsWithChildren) {
  const [mode, setMode] = useState<ThemeMode>('light');
  const [typeScaleChoice, setTypeScaleChoice] = useState<TypeScale>('A');
  const value = useMemo(() => ({
    theme: createTheme(mode),
    mode,
    setMode,
    typeScale: TYPE_SCALE[typeScaleChoice],
    typeScaleChoice,
    setTypeScaleChoice,
  }), [mode, typeScaleChoice]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const value = useContext(ThemeContext);
  if (!value) throw new Error('useTheme must be used within ThemeProvider');
  return value;
}
