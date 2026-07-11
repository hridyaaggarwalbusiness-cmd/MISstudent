import { TextStyle } from 'react-native';

export const fontFamily = {
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semibold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
};

type Variant = TextStyle & { fontFamily: string };

export const typography: Record<string, Variant> = {
  displayLg: { fontFamily: fontFamily.bold, fontSize: 30, lineHeight: 36, letterSpacing: -0.6 },
  displayMd: { fontFamily: fontFamily.bold, fontSize: 24, lineHeight: 30, letterSpacing: -0.4 },
  h1: { fontFamily: fontFamily.semibold, fontSize: 21, lineHeight: 27, letterSpacing: -0.3 },
  h2: { fontFamily: fontFamily.semibold, fontSize: 17, lineHeight: 23, letterSpacing: -0.15 },
  h3: { fontFamily: fontFamily.semibold, fontSize: 15, lineHeight: 21 },
  bodyLg: { fontFamily: fontFamily.regular, fontSize: 16, lineHeight: 24 },
  body: { fontFamily: fontFamily.regular, fontSize: 14, lineHeight: 20 },
  bodyMedium: { fontFamily: fontFamily.medium, fontSize: 14, lineHeight: 20 },
  bodySemibold: { fontFamily: fontFamily.semibold, fontSize: 14, lineHeight: 20 },
  caption: { fontFamily: fontFamily.medium, fontSize: 12.5, lineHeight: 17 },
  captionRegular: { fontFamily: fontFamily.regular, fontSize: 12.5, lineHeight: 17 },
  overline: { fontFamily: fontFamily.semibold, fontSize: 11, lineHeight: 14, letterSpacing: 0.8 },
  tiny: { fontFamily: fontFamily.medium, fontSize: 10.5, lineHeight: 14 },
};
