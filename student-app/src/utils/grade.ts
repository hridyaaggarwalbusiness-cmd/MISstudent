import { colors } from '@theme';

export function gradeColor(grade: string): { bg: string; fg: string } {
  switch (grade) {
    case 'A+':
    case 'A':
      return { bg: colors.successBg, fg: colors.successStrong };
    case 'B+':
    case 'B':
      return { bg: colors.primarySoft, fg: colors.primary };
    case 'C':
      return { bg: colors.warningBg, fg: colors.warningStrong };
    default:
      return { bg: colors.dangerBg, fg: colors.dangerStrong };
  }
}
