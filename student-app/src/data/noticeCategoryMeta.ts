import { Ionicons } from '@expo/vector-icons';
import { NoticeCategory } from '@/types';
import { colors } from '@theme';

export const noticeCategoryMeta: Record<
  NoticeCategory,
  { label: string; icon: keyof typeof Ionicons.glyphMap; bg: string; fg: string }
> = {
  general: { label: 'General', icon: 'information-circle-outline', bg: colors.infoBg, fg: colors.infoStrong },
  academic: { label: 'Academic', icon: 'school-outline', bg: '#F3EEFF', fg: colors.accentViolet },
  event: { label: 'Event', icon: 'sparkles-outline', bg: colors.successBg, fg: colors.successStrong },
  holiday: { label: 'Holiday', icon: 'sunny-outline', bg: colors.warningBg, fg: colors.warningStrong },
};

export const NOTICE_FILTERS: { key: 'all' | NoticeCategory; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'general', label: 'General' },
  { key: 'academic', label: 'Academic' },
  { key: 'event', label: 'Events' },
  { key: 'holiday', label: 'Holidays' },
];
