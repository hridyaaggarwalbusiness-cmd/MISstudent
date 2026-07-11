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
  xs: shadow(2, 0.08, 4, 1),
  sm: shadow(3, 0.12, 10, 3),
  md: shadow(5, 0.16, 18, 6),
  lg: shadow(8, 0.20, 28, 10),
  glow: (color: string) =>
    Platform.select({
      ios: {
        shadowColor: color,
        shadowOpacity: 0.28,
        shadowRadius: 14,
        shadowOffset: { width: 0, height: 6 },
      },
      android: { elevation: 5 },
      default: {
        shadowColor: color,
        shadowOpacity: 0.28,
        shadowRadius: 14,
        shadowOffset: { width: 0, height: 6 },
      },
    }),
};
