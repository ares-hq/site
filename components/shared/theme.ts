import { Platform } from 'react-native';
import { useDarkMode } from '@/context/DarkModeContext';

/**
 * Design tokens for ARES. One source of truth for colour, spacing, radius,
 * typography and elevation so search / tables / dashboards / sidebars all
 * read as one product.
 *
 * Direction: restrained, "analyst tool" serious — neutral slate surfaces,
 * a single deep accent used sparingly for interaction, categorical colour
 * shown only as thin marks (never as pastel fills).
 */

export type ThemeColors = {
  /** app background */
  bg: string;
  /** slightly raised ground: table wells, inset panels */
  bgSubtle: string;
  /** card / popover surface (may be translucent in dark mode — only safe when flat on the page) */
  surface: string;
  surfaceHover: string;
  /** OPAQUE elevated surface — use for anything that floats or overhangs
   *  (dropdowns, popovers, the command palette, cards that hang off an edge) */
  raised: string;
  raisedHover: string;
  /** input fields */
  field: string;
  border: string;
  borderStrong: string;
  hairline: string;
  text: string;
  textMuted: string;
  textFaint: string;
  accent: string;
  accentHover: string;
  /** neutral fill for active/selected rows (NOT a blue tint) */
  accentSoft: string;
  /** accent-coloured text/marks for active/selected state */
  accentText: string;
  success: string;
  danger: string;
  overlay: string;
  rowHover: string;
};

const light: ThemeColors = {
  bg: '#FFFFFF',
  bgSubtle: '#F6F7F9',
  surface: '#FFFFFF',
  surfaceHover: '#F3F4F6',
  field: '#FFFFFF',
  raised: '#FFFFFF',
  raisedHover: '#F3F4F6',
  border: '#E2E5EA',
  borderStrong: '#CBD0D8',
  hairline: '#ECEEF1',
  text: '#0F1729',
  textMuted: '#5B6472',
  textFaint: '#8A94A3',
  accent: '#2563EB',
  accentHover: '#1D4ED8',
  accentSoft: '#EEF0F4',
  accentText: '#1D4ED8',
  success: '#047857',
  danger: '#C0392B',
  overlay: 'rgba(15, 23, 42, 0.5)',
  rowHover: 'rgba(15, 23, 42, 0.04)',
};

const dark: ThemeColors = {
  bg: 'rgba(42, 42, 42, 1)',
  bgSubtle: 'rgba(255, 255, 255, 0.035)',
  surface: 'rgba(255, 255, 255, 0.045)',
  surfaceHover: 'rgba(255, 255, 255, 0.08)',
  field: 'rgba(255, 255, 255, 0.05)',
  raised: '#303030',
  raisedHover: '#3A3A3A',
  border: '#414141',
  borderStrong: '#545454',
  hairline: 'rgba(255, 255, 255, 0.07)',
  text: '#F3F4F6',
  textMuted: '#A2A8B2',
  textFaint: '#6B7280',
  accent: '#3B82F6',
  accentHover: '#60A5FA',
  accentSoft: 'rgba(255, 255, 255, 0.07)',
  accentText: '#7FA9F5',
  success: '#10B981',
  danger: '#EF4444',
  overlay: 'rgba(0, 0, 0, 0.62)',
  rowHover: 'rgba(255, 255, 255, 0.055)',
};

/** Categorical marks — used for small dots / left rules / icons, never as fills. */
export const tone = {
  blue: { light: '#2563EB', dark: '#60A5FA' },
  indigo: { light: '#4F46E5', dark: '#8B85F0' },
  green: { light: '#047857', dark: '#34D399' },
  purple: { light: '#7C3AED', dark: '#A78BFA' },
} as const;

export type ToneName = keyof typeof tone;

export function toneColor(name: ToneName, isDark: boolean) {
  return isDark ? tone[name].dark : tone[name].light;
}

export const space = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  pill: 999,
} as const;

export const font = {
  display: { fontSize: 27, fontWeight: '700', letterSpacing: -0.4 },
  h1: { fontSize: 22, fontWeight: '700', letterSpacing: -0.3 },
  h2: { fontSize: 17, fontWeight: '700', letterSpacing: -0.2 },
  h3: { fontSize: 15, fontWeight: '600' },
  bodyStrong: { fontSize: 14, fontWeight: '600' },
  body: { fontSize: 14, fontWeight: '400' },
  small: { fontSize: 13, fontWeight: '400' },
  caption: { fontSize: 12, fontWeight: '500' },
  micro: { fontSize: 11, fontWeight: '500' },
} as const;

const isWeb = Platform.OS === 'web';

export const shadow = {
  sm: isWeb
    ? ({ boxShadow: '0px 1px 2px rgba(15, 23, 42, 0.05)' } as any)
    : { elevation: 2 },
  md: isWeb
    ? ({ boxShadow: '0px 1px 2px rgba(15, 23, 42, 0.04), 0px 6px 18px rgba(15, 23, 42, 0.05)' } as any)
    : { elevation: 4 },
  lg: isWeb
    ? ({ boxShadow: '0px 10px 28px rgba(15, 23, 42, 0.10)' } as any)
    : { elevation: 9 },
  pop: isWeb
    ? ({ boxShadow: '0px 14px 42px rgba(15, 23, 42, 0.18)' } as any)
    : { elevation: 14 },
} as const;

export type Theme = {
  c: ThemeColors;
  isDark: boolean;
  space: typeof space;
  radius: typeof radius;
  font: typeof font;
  shadow: typeof shadow;
  tone: (name: ToneName) => string;
};

export function useTheme(): Theme {
  const { isDarkMode } = useDarkMode();
  return {
    c: isDarkMode ? dark : light,
    isDark: isDarkMode,
    space,
    radius,
    font,
    shadow,
    tone: (name: ToneName) => toneColor(name, isDarkMode),
  };
}

/** Standard card container style. */
export function cardStyle(t: Theme, elevated = false) {
  return {
    backgroundColor: t.c.surface,
    borderColor: t.c.border,
    borderWidth: 1,
    borderRadius: t.radius.lg,
    padding: t.space.xl,
    ...(elevated ? t.shadow.md : null),
  };
}
