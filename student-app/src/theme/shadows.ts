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
  xs: shadow(1, 0.04, 3, 1),
  sm: shadow(2, 0.06, 8, 2),
  md: shadow(4, 0.08, 16, 4),
  lg: shadow(8, 0.1, 24, 8),
};
