import { TextStyle } from 'react-native';

export const fontFamily = {
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semibold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
  display: 'Manrope_700Bold',
  displaySemibold: 'Manrope_600SemiBold',
  displayExtraBold: 'Manrope_800ExtraBold',
};

type Variant = TextStyle & { fontFamily: string };

export const typography: Record<string, Variant> = {
  displayLg: { fontFamily: fontFamily.display, fontSize: 28, lineHeight: 35, letterSpacing: -0.5 },
  displayMd: { fontFamily: fontFamily.display, fontSize: 23, lineHeight: 29, letterSpacing: -0.3 },
  h1: { fontFamily: fontFamily.display, fontSize: 22, lineHeight: 28, letterSpacing: -0.4 },
  h2: { fontFamily: fontFamily.displaySemibold, fontSize: 18, lineHeight: 24, letterSpacing: -0.2 },
  h3: { fontFamily: fontFamily.displaySemibold, fontSize: 15.5, lineHeight: 21 },
  bodyLg: { fontFamily: fontFamily.regular, fontSize: 16, lineHeight: 24 },
  body: { fontFamily: fontFamily.regular, fontSize: 14, lineHeight: 20 },
  bodyMedium: { fontFamily: fontFamily.medium, fontSize: 14, lineHeight: 20 },
  bodySemibold: { fontFamily: fontFamily.semibold, fontSize: 14, lineHeight: 20 },
  caption: { fontFamily: fontFamily.medium, fontSize: 12.5, lineHeight: 17 },
  captionRegular: { fontFamily: fontFamily.regular, fontSize: 12.5, lineHeight: 17 },
  overline: { fontFamily: fontFamily.semibold, fontSize: 11, lineHeight: 14, letterSpacing: 0.9 },
  tiny: { fontFamily: fontFamily.medium, fontSize: 10.5, lineHeight: 14 },
};
