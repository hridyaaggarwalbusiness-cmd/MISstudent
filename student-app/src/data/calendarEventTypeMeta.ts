import { CalendarEvent } from '@/types';

export const eventTypeMeta: Record<CalendarEvent['type'], { label: string; color: string; icon: string }> = {
  holiday: { label: 'Holiday', color: 'rose', icon: 'sunny-outline' },
  exam: { label: 'Examination', color: 'indigo', icon: 'document-text-outline' },
  function: { label: 'School Function', color: 'violet', icon: 'sparkles-outline' },
  sports: { label: 'Sports Event', color: 'emerald', icon: 'trophy-outline' },
  meeting: { label: 'Parent Meeting', color: 'sky', icon: 'people-outline' },
  competition: { label: 'Competition', color: 'amber', icon: 'ribbon-outline' },
  other: { label: 'Other', color: 'slate', icon: 'calendar-outline' },
};
