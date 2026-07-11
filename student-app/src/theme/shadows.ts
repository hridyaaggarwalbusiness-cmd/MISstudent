import { Platform } from 'react-native';
import { colors } from './colors';

function shadow(elevation: number, opacity: number, radius: number, offsetY: number) {
  return Platform.select({
    ios: {
      shadowColor: colors.shadow,
      shadowOpacity: opacity,
      shadowRadius: radius,
      shadowOffset: { width: 0, height: offsetY },
    },
    android: { elevation },
    default: {
      shadowColor: colors.shadow,
      shadowOpacity: opacity,
      shadowRadius: radius,
      shadowOffset: { width: 0, height: offsetY },
    },
  });
}

export const shadows = {
  none: {},
  xs: shadow(1, 0.18, 3, 1),
  sm: shadow(2, 0.22, 8, 3),
  md: shadow(4, 0.28, 16, 6),
  lg: shadow(8, 0.34, 26, 10),
  glow: (color: string) =>
    Platform.select({
      ios: {
        shadowColor: color,
        shadowOpacity: 0.45,
        shadowRadius: 16,
        shadowOffset: { width: 0, height: 6 },
      },
      android: { elevation: 6 },
      default: {
        shadowColor: color,
        shadowOpacity: 0.45,
        shadowRadius: 16,
        shadowOffset: { width: 0, height: 6 },
      },
    }),
};
