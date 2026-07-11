export const palette = {
  white: '#FFFFFF',
  black: '#000000',

  indigo50: '#EEF2FF',
  indigo100: '#E0E7FF',
  indigo200: '#C7D2FE',
  indigo400: '#818CF8',
  indigo500: '#6366F1',
  indigo600: '#4F46E5',
  indigo700: '#4338CA',

  violet500: '#8B5CF6',
  violet600: '#7C3AED',

  emerald50: '#ECFDF5',
  emerald100: '#D1FAE5',
  emerald500: '#10B981',
  emerald600: '#059669',

  amber50: '#FFFBEB',
  amber100: '#FEF3C7',
  amber500: '#F59E0B',
  amber600: '#D97706',

  rose50: '#FFF1F2',
  rose100: '#FFE4E6',
  rose500: '#F43F5E',
  rose600: '#E11D48',

  sky50: '#F0F9FF',
  sky100: '#E0F2FE',
  sky500: '#0EA5E9',
  sky600: '#0284C7',

  slate50: '#F8FAFC',
  slate100: '#F1F5F9',
  slate200: '#E2E8F0',
  slate300: '#CBD5E1',
  slate400: '#94A3B8',
  slate500: '#64748B',
  slate600: '#475569',
  slate700: '#334155',
  slate800: '#1E293B',
  slate900: '#0F172A',
};

export const colors = {
  // Brand
  primary: palette.indigo600,
  primaryLight: palette.indigo100,
  primarySoft: palette.indigo50,
  primaryDark: palette.indigo700,
  secondary: palette.violet600,

  // Surfaces
  background: '#F7F8FC',
  surface: palette.white,
  surfaceAlt: palette.slate50,
  surfaceRaised: palette.white,
  border: palette.slate200,
  borderSoft: '#EDEFF6',
  overlay: 'rgba(15, 23, 42, 0.55)',

  // Text
  textPrimary: palette.slate900,
  textSecondary: palette.slate500,
  textTertiary: palette.slate400,
  textInverse: palette.white,
  textLink: palette.indigo600,

  // Semantic
  success: palette.emerald500,
  successBg: palette.emerald50,
  successStrong: palette.emerald600,
  warning: palette.amber500,
  warningBg: palette.amber50,
  warningStrong: palette.amber600,
  danger: palette.rose500,
  dangerBg: palette.rose50,
  dangerStrong: palette.rose600,
  info: palette.sky500,
  infoBg: palette.sky50,
  infoStrong: palette.sky600,

  // Grades / status accents used across cards
  accentIndigo: palette.indigo600,
  accentViolet: palette.violet500,
  accentSky: palette.sky500,
  accentEmerald: palette.emerald500,
  accentAmber: palette.amber500,
  accentRose: palette.rose500,

  shadow: '#0F172A',
};

// Deterministic color coding used for subjects, categories, avatars, etc.
export const accentPairs: { bg: string; fg: string }[] = [
  { bg: palette.indigo50, fg: palette.indigo600 },
  { bg: palette.emerald50, fg: palette.emerald600 },
  { bg: palette.amber50, fg: palette.amber600 },
  { bg: palette.rose50, fg: palette.rose600 },
  { bg: palette.sky50, fg: palette.sky600 },
  { bg: '#F5F3FF', fg: palette.violet600 },
];

export function accentForKey(key: string) {
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    hash = (hash << 5) - hash + key.charCodeAt(i);
    hash |= 0;
  }
  const idx = Math.abs(hash) % accentPairs.length;
  return accentPairs[idx];
}

export const gradients = {
  primary: [palette.indigo600, palette.violet600] as const,
  sunrise: ['#6366F1', '#8B5CF6', '#EC4899'] as const,
  ocean: [palette.sky500, palette.indigo600] as const,
  success: [palette.emerald500, '#059669'] as const,
  dark: [palette.slate800, palette.slate900] as const,
  amber: [palette.amber500, '#EA580C'] as const,
  berry: [palette.rose500, palette.violet600] as const,
  violet: [palette.violet500, palette.indigo700] as const,
  teal: ['#14B8A6', palette.sky600] as const,
  slateGrad: [palette.slate600, palette.slate800] as const,
};
