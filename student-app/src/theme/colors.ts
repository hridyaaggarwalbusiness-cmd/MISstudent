export const palette = {
  white: '#FFFFFF',
  black: '#000000',

  // Deep charcoal-navy neutral scale (dark-mode canvas)
  night950: '#08090C',
  night900: '#0E0F14',
  night850: '#14151C',
  night800: '#1A1C25',
  night750: '#20222C',
  night700: '#282A36',
  night600: '#383B48',
  night500: '#52566A',
  night400: '#767C93',
  night300: '#9CA1B5',
  night200: '#C2C5D3',
  night100: '#E4E5EC',
  night50: '#F5F6F9',

  // Brand — electric azure blue
  blue300: '#8FB1FF',
  blue400: '#5F8FFC',
  blue500: '#3E7BFA',
  blue600: '#2C5FDB',
  blue700: '#1F49B0',

  // Warm secondary accent
  amber400: '#FBBF63',
  amber500: '#F0A340',
  amber600: '#C77D1D',

  green400: '#4ADE80',
  green500: '#2ECC71',
  green600: '#1FA35A',

  red400: '#FF9891',
  red500: '#F1584F',
  red600: '#D33B34',

  cyan400: '#67E0F0',
  cyan500: '#22B8CF',
  cyan600: '#1595A8',

  violet400: '#C4B5FD',
  violet500: '#A78BFA',
  violet600: '#8259E8',

  rose400: '#FDA4C1',
  rose500: '#F0629A',
  rose600: '#D63E79',
};

export const colors = {
  // Brand
  primary: palette.blue500,
  primaryLight: palette.blue400,
  primarySoft: 'rgba(62, 123, 250, 0.16)',
  primaryDark: palette.blue600,
  secondary: palette.amber500,

  // Surfaces — dark canvas, lighter surfaces sit "above" it
  background: palette.night950,
  surface: palette.night900,
  surfaceAlt: palette.night850,
  surfaceRaised: palette.night800,
  surfaceSunken: palette.night950,
  border: 'rgba(255, 255, 255, 0.10)',
  borderSoft: 'rgba(255, 255, 255, 0.06)',
  borderStrong: 'rgba(255, 255, 255, 0.18)',
  overlay: 'rgba(4, 5, 8, 0.78)',

  // Text
  textPrimary: '#F4F5F8',
  textSecondary: '#9CA1B2',
  textTertiary: '#666B7C',
  textInverse: '#FFFFFF',
  textOnAccent: '#0A0B0F',
  textLink: palette.blue400,

  // Semantic
  success: palette.green500,
  successBg: 'rgba(46, 204, 113, 0.16)',
  successStrong: palette.green400,
  warning: palette.amber500,
  warningBg: 'rgba(240, 163, 64, 0.16)',
  warningStrong: palette.amber400,
  danger: palette.red500,
  dangerBg: 'rgba(241, 88, 79, 0.16)',
  dangerStrong: palette.red400,
  info: palette.cyan500,
  infoBg: 'rgba(34, 184, 207, 0.16)',
  infoStrong: palette.cyan400,

  // Grades / status accents used across cards, calendars, attachments
  accentIndigo: palette.blue400,
  accentViolet: palette.violet400,
  accentSky: palette.cyan400,
  accentEmerald: palette.green400,
  accentAmber: palette.amber400,
  accentRose: palette.rose400,

  shadow: palette.black,
};

// Deterministic color coding used for subjects, categories, avatars, etc.
export const accentPairs: { bg: string; fg: string }[] = [
  { bg: 'rgba(95, 143, 252, 0.16)', fg: palette.blue300 },
  { bg: 'rgba(74, 222, 128, 0.16)', fg: palette.green400 },
  { bg: 'rgba(251, 191, 99, 0.16)', fg: palette.amber400 },
  { bg: 'rgba(240, 98, 154, 0.16)', fg: palette.rose400 },
  { bg: 'rgba(103, 224, 240, 0.16)', fg: palette.cyan400 },
  { bg: 'rgba(196, 181, 253, 0.16)', fg: palette.violet400 },
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
  primary: [palette.blue400, palette.blue600] as const,
  glass: ['rgba(255,255,255,0.08)', 'rgba(255,255,255,0.0)'] as const,
};
