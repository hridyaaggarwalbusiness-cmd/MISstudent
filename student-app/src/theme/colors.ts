export const palette = {
  white: '#FFFFFF',
  black: '#000000',

  // Neutral ink scale — cool, slightly desaturated grays
  gray50: '#F8F9FC',
  gray100: '#F1F3F8',
  gray150: '#E9EBF2',
  gray200: '#E1E4ED',
  gray300: '#CBD1DE',
  gray400: '#9AA0B1',
  gray500: '#767C8E',
  gray600: '#5B5F6E',
  gray700: '#3F4250',
  gray800: '#282A35',
  gray900: '#12141C',

  // Brand — confident blue
  blue300: '#A9C1FF',
  blue400: '#6690FF',
  blue500: '#3E6BFA',
  blue600: '#2C52D9',
  blue700: '#2140AD',

  violet400: '#B3A0F8',
  violet500: '#8B5CF6',
  violet600: '#6D3FD6',

  green400: '#5FD892',
  green500: '#22A55E',
  green600: '#16803F',

  amber400: '#FBC55D',
  amber500: '#F0A93B',
  amber600: '#B4720C',

  red400: '#FF8A8D',
  red500: '#E5484D',
  red600: '#C22A2F',

  teal400: '#4FD1C8',
  teal500: '#0EA5A0',
  teal600: '#0A7A76',

  orange400: '#FFA662',
  orange500: '#F2711F',
  orange600: '#C4560F',

  sky400: '#7DD3FC',
  sky500: '#0EA5E9',
  sky600: '#0876AE',

  rose400: '#FB9DBE',
  rose500: '#E5487A',
  rose600: '#BD2E5D',
};

export const colors = {
  // Brand
  primary: palette.blue500,
  primaryLight: palette.blue300,
  primarySoft: '#EAF0FF',
  primaryDark: palette.blue600,
  secondary: palette.violet500,

  // Surfaces
  background: palette.gray50,
  surface: palette.white,
  surfaceAlt: palette.gray100,
  surfaceRaised: palette.white,
  surfaceSunken: palette.gray150,
  border: palette.gray200,
  borderSoft: palette.gray150,
  borderStrong: palette.gray300,
  overlay: 'rgba(18, 20, 28, 0.55)',

  // Text
  textPrimary: palette.gray900,
  textSecondary: palette.gray600,
  textTertiary: palette.gray400,
  textInverse: palette.white,
  textLink: palette.blue500,

  // Semantic
  success: palette.green500,
  successBg: '#E9FBF1',
  successStrong: palette.green600,
  warning: palette.amber500,
  warningBg: '#FFF6E4',
  warningStrong: palette.amber600,
  danger: palette.red500,
  dangerBg: '#FFEEEE',
  dangerStrong: palette.red600,
  info: palette.sky500,
  infoBg: '#EAF7FF',
  infoStrong: palette.sky600,

  // Muted, deep-toned accents used only for the home-screen action tiles —
  // deliberately deeper than the "500" semantic tones so a single white
  // text/icon color reads cleanly on every tile without special-casing.
  tileBlue: palette.blue600,
  tileGreen: palette.green600,
  tileYellow: palette.amber600,
  tileRed: palette.red600,
  tileViolet: palette.violet600,
  tileTeal: palette.teal600,
  tileOrange: palette.orange600,
  tileSky: palette.sky600,

  // Grades / status accents used across cards, calendars, attachments
  accentIndigo: palette.blue500,
  accentViolet: palette.violet500,
  accentSky: palette.sky500,
  accentEmerald: palette.green500,
  accentAmber: palette.amber500,
  accentRose: palette.rose500,

  shadow: palette.gray900,
};

// Deterministic color coding used for subjects, categories, avatars, etc.
export const accentPairs: { bg: string; fg: string }[] = [
  { bg: '#EAF0FF', fg: palette.blue600 },
  { bg: '#E9FBF1', fg: palette.green600 },
  { bg: '#FFF6E4', fg: palette.amber600 },
  { bg: '#FFEEEE', fg: palette.rose600 },
  { bg: '#EAF7FF', fg: palette.sky600 },
  { bg: '#F3EEFF', fg: palette.violet600 },
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
  glass: ['rgba(255,255,255,0.6)', 'rgba(255,255,255,0.0)'] as const,
};
