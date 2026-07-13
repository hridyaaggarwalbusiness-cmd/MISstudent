import { Ionicons } from '@expo/vector-icons';
import { palette } from '@theme';

export interface SubjectMeta {
  icon: keyof typeof Ionicons.glyphMap;
  gradient: readonly [string, string];
}

const KNOWN_SUBJECTS: Record<string, SubjectMeta> = {
  mathematics: { icon: 'book', gradient: [palette.violet400, palette.violet600] },
  maths: { icon: 'book', gradient: [palette.violet400, palette.violet600] },
  math: { icon: 'book', gradient: [palette.violet400, palette.violet600] },
  english: { icon: 'book', gradient: [palette.rose400, palette.rose600] },
  science: { icon: 'flask', gradient: [palette.green400, palette.green600] },
  history: { icon: 'document-text', gradient: [palette.orange400, palette.orange600] },
  social: { icon: 'document-text', gradient: [palette.orange400, palette.orange600] },
  'social studies': { icon: 'document-text', gradient: [palette.orange400, palette.orange600] },
  computer: { icon: 'desktop-outline', gradient: [palette.sky400, palette.sky600] },
  'computer science': { icon: 'desktop-outline', gradient: [palette.sky400, palette.sky600] },
  'physical education': { icon: 'body-outline', gradient: [palette.violet400, palette.violet600] },
  pe: { icon: 'body-outline', gradient: [palette.violet400, palette.violet600] },
  'p.e.': { icon: 'body-outline', gradient: [palette.violet400, palette.violet600] },
};

const FALLBACK_GRADIENTS: readonly (readonly [string, string])[] = [
  [palette.blue400, palette.blue600],
  [palette.teal400, palette.teal600],
  [palette.amber400, palette.amber600],
  [palette.rose400, palette.rose600],
  [palette.violet400, palette.violet600],
];

export function subjectMeta(subject: string): SubjectMeta {
  const key = subject.trim().toLowerCase();
  if (KNOWN_SUBJECTS[key]) return KNOWN_SUBJECTS[key];
  const idx = Math.abs(hashKey(subject)) % FALLBACK_GRADIENTS.length;
  return { icon: 'book-outline', gradient: FALLBACK_GRADIENTS[idx] };
}

function hashKey(key: string): number {
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    hash = (hash << 5) - hash + key.charCodeAt(i);
    hash |= 0;
  }
  return hash;
}

export function subjectTextColor(subject: string): string {
  return subjectMeta(subject).gradient[1];
}
