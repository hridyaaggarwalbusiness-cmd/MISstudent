export const palette = {
  white: '#FFFFFF',
  black: '#000000',

  // Neutral ink scale — cool, slightly desaturated grays (not pure black/gray)
  gray50: '#FAFAFB',
  gray100: '#F4F4F7',
  gray150: '#ECECF1',
  gray200: '#E1E1E8',
  gray300: '#CBCBD6',
  gray400: '#9E9EAE',
  gray500: '#77778B',
  gray600: '#5A5A6E',
  gray700: '#40404F',
  gray800: '#26262F',
  gray900: '#15151C',
  gray950: '#0C0C11',

  // Brand — a single, confident indigo-violet
  brand50: '#F4F4FE',
  brand100: '#E7E7FD',
  brand200: '#C9C9FA',
  brand300: '#A5A4F5',
  brand400: '#8180F0',
  brand500: '#5B58EA',
  brand600: '#4640D1',
  brand700: '#3730A8',

  // Semantic accents
  green50: '#EFFCF4',
  green500: '#18A957',
  green600: '#128245',

  amber50: '#FFF9EC',
  amber500: '#DA8B0A',
  amber600: '#B06D06',

  red50: '#FEF2F2',
  red500: '#DE3730',
  red600: '#B5231D',

  blue50: '#EFF5FF',
  blue500: '#2568EB',
  blue600: '#1A4FC4',

  violet50: '#F7F2FF',
  violet500: '#8646E8',
  violet600: '#6D31C9',

  rose50: '#FFF1F4',
  rose500: '#E23A72',
  rose600: '#BC1F57',

  sky50: '#EEF9FF',
  sky500: '#0B93D6',
  sky600: '#0876AE',

  emerald50: '#EDFCF6',
  emerald500: '#0FA97A',
  emerald600: '#0C8863',
};

export const colors = {
  // Brand
  primary: palette.brand500,
  primaryLight: palette.brand200,
  primarySoft: palette.brand50,
  primaryDark: palette.brand600,
  secondary: palette.violet500,

  // Surfaces
  background: palette.gray50,
  surface: palette.white,
  surfaceAlt: palette.gray100,
  surfaceSunken: palette.gray150,
  surfaceRaised: palette.white,
  border: palette.gray200,
  borderSoft: palette.gray150,
  borderStrong: palette.gray300,
  overlay: 'rgba(12, 12, 17, 0.55)',

  // Text
  textPrimary: palette.gray900,
  textSecondary: palette.gray600,
  textTertiary: palette.gray400,
  textInverse: palette.white,
  textLink: palette.brand500,

  // Semantic
  success: palette.green500,
  successBg: palette.green50,
  successStrong: palette.green600,
  warning: palette.amber500,
  warningBg: palette.amber50,
  warningStrong: palette.amber600,
  danger: palette.red500,
  dangerBg: palette.red50,
  dangerStrong: palette.red600,
  info: palette.blue500,
  infoBg: palette.blue50,
  infoStrong: palette.blue600,

  // Grades / status accents used across cards, calendars, attachments
  accentIndigo: palette.brand500,
  accentViolet: palette.violet500,
  accentSky: palette.sky500,
  accentEmerald: palette.emerald500,
  accentAmber: palette.amber500,
  accentRose: palette.rose500,

  shadow: palette.gray900,
};

// Deterministic color coding used for subjects, categories, avatars, etc.
export const accentPairs: { bg: string; fg: string }[] = [
  { bg: palette.brand50, fg: palette.brand600 },
  { bg: palette.emerald50, fg: palette.emerald600 },
  { bg: palette.amber50, fg: palette.amber600 },
  { bg: palette.rose50, fg: palette.rose600 },
  { bg: palette.sky50, fg: palette.sky600 },
  { bg: palette.violet50, fg: palette.violet600 },
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
  primary: [palette.brand500, palette.brand700] as const,
};
