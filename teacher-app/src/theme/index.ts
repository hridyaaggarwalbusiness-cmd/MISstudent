export * from './colors';
export * from './spacing';
export * from './typography';
export * from './shadows';

import { colors, gradients } from './colors';
import { spacing, radius, layout } from './spacing';
import { typography, fontFamily } from './typography';
import { shadows } from './shadows';

export const theme = {
  colors,
  gradients,
  spacing,
  radius,
  layout,
  typography,
  fontFamily,
  shadows,
};

export type Theme = typeof theme;
