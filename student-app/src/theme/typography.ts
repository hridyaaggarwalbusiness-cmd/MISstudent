import { TextStyle } from 'react-native';

export const fontFamily = {
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semibold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
  display: 'PlusJakartaSans_700Bold',
  displaySemibold: 'PlusJakartaSans_600SemiBold',
};

type Variant = TextStyle & { fontFamily: string };

export const typography: Record<string, Variant> = {
  displayLg: { fontFamily: fontFamily.display, fontSize: 30, lineHeight: 38, letterSpacing: -0.4 },
  displayMd: { fontFamily: fontFamily.display, fontSize: 24, lineHeight: 31, letterSpacing: -0.3 },
  h1: { fontFamily: fontFamily.displaySemibold, fontSize: 22, lineHeight: 28, letterSpacing: -0.2 },
  h2: { fontFamily: fontFamily.semibold, fontSize: 18, lineHeight: 24 },
  h3: { fontFamily: fontFamily.semibold, fontSize: 16, lineHeight: 22 },
  bodyLg: { fontFamily: fontFamily.regular, fontSize: 16, lineHeight: 23 },
  body: { fontFamily: fontFamily.regular, fontSize: 14, lineHeight: 20 },
  bodyMedium: { fontFamily: fontFamily.medium, fontSize: 14, lineHeight: 20 },
  bodySemibold: { fontFamily: fontFamily.semibold, fontSize: 14, lineHeight: 20 },
  caption: { fontFamily: fontFamily.medium, fontSize: 12, lineHeight: 16 },
  captionRegular: { fontFamily: fontFamily.regular, fontSize: 12, lineHeight: 16 },
  overline: { fontFamily: fontFamily.semibold, fontSize: 11, lineHeight: 14, letterSpacing: 0.6 },
  tiny: { fontFamily: fontFamily.medium, fontSize: 10, lineHeight: 13 },
};
