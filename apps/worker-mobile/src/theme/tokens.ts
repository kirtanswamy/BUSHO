export type ThemeMode = 'light' | 'highContrast';
export type TypeScale = 'A-' | 'A' | 'A+';

export const TYPE_SCALE: Record<TypeScale, number> = { 'A-': 0.9, A: 1, 'A+': 1.15 };

const base = {
  brand: '#0B3D6B',
  brandPressed: '#082F52',
  accent: '#F59E0B',
  spacing: { xxs: 4, xs: 8, sm: 12, md: 16, lg: 24, xl: 32, xxl: 40 },
  radius: { control: 10, card: 12, pill: 999 },
  touchTarget: 48,
  typography: {
    family: 'NotoSans',
    familyDevanagari: 'NotoSansDevanagari',
    weights: { regular: '400' as const, medium: '500' as const, semibold: '600' as const, bold: '700' as const, extraBold: '800' as const },
    sizes: { caption: 12, small: 13, body: 15, bodyLarge: 17, title: 22, display: 28 },
    lineHeights: { compact: 1.25, body: 1.5, heading: 1.2 },
  },
};

export const lightColors = {
  background: '#F5F8FC', surface: '#FFFFFF', surfaceSubtle: '#EEF3F8',
  border: '#D7E0EA', borderStrong: '#AAB9C9',
  text: '#142536', textMuted: '#526579', textSubtle: '#596B7E',
  primary: '#0B3D6B', primaryPressed: '#082F52', onPrimary: '#FFFFFF',
  accent: '#F59E0B', success: '#176B45', successSurface: '#E8F5EE',
  warning: '#8A4B08', warningSurface: '#FFF4DF', danger: '#A12622',
  dangerSurface: '#FCEDEC', info: '#175B91', infoSurface: '#EAF3FB',
  offline: '#7A3E08', offlineSurface: '#FFF1D9', focus: '#005FCC',
  scrim: 'rgba(10, 28, 45, 0.48)',
} as const;

export const highContrastColors = {
  background: '#FFFFFF', surface: '#FFFFFF', surfaceSubtle: '#F2F2F2',
  border: '#595959', borderStrong: '#262626',
  text: '#000000', textMuted: '#262626', textSubtle: '#404040',
  primary: '#003B70', primaryPressed: '#00284C', onPrimary: '#FFFFFF',
  accent: '#7A3900', success: '#005A2B', successSurface: '#E6F4EA',
  warning: '#713800', warningSurface: '#FFF0D5', danger: '#8A0000',
  dangerSurface: '#FCE8E6', info: '#003E78', infoSurface: '#E7F1FC',
  offline: '#713800', offlineSurface: '#FFF0D5', focus: '#000000',
  scrim: 'rgba(0, 0, 0, 0.68)',
} as const;

export type ThemeColors = { [K in keyof typeof lightColors]: string };
export type AppTheme = {
  mode: ThemeMode;
  colors: ThemeColors;
  spacing: typeof base.spacing;
  radius: typeof base.radius;
  touchTarget: number;
  typography: typeof base.typography;
};

export function createTheme(mode: ThemeMode = 'light'): AppTheme {
  return {
    mode,
    colors: mode === 'highContrast' ? highContrastColors : lightColors,
    spacing: base.spacing,
    radius: base.radius,
    touchTarget: base.touchTarget,
    typography: base.typography,
  };
}

export const DESIGN_TOKENS = base;
