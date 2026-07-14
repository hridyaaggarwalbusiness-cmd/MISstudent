import type { ComponentType } from 'react';
import {
  Ruler,
  FlaskConical,
  Atom,
  Dna,
  BookOpen,
  Languages,
  Landmark,
  Globe,
  Scale,
  Monitor,
  Palette,
  Music,
  Dumbbell,
  TrendingUp,
  Library,
  Book,
} from 'lucide-react';
import { TONE_COLORS } from '@/utils/toneColors';

// Deterministic subject -> icon/color mapping so the same subject always
// reads the same way across Homework, Exams, Timetable and Materials.
const ICONS: Record<string, ComponentType<{ size?: number }>> = {
  math: Ruler,
  mathematics: Ruler,
  science: FlaskConical,
  physics: Atom,
  chemistry: FlaskConical,
  biology: Dna,
  english: BookOpen,
  hindi: Languages,
  history: Landmark,
  geography: Globe,
  civics: Scale,
  'social studies': Globe,
  computer: Monitor,
  'computer science': Monitor,
  art: Palette,
  music: Music,
  'physical education': Dumbbell,
  pe: Dumbbell,
  sports: Dumbbell,
  economics: TrendingUp,
  literature: Library,
};

const PALETTE = ['primary', 'violet', 'info', 'success', 'warning', 'danger'] as const;
export type SubjectTone = (typeof PALETTE)[number];

function hash(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
  return h;
}

export function subjectIcon(subject: string): ComponentType<{ size?: number }> {
  const key = subject.trim().toLowerCase();
  return ICONS[key] ?? Book;
}

export function subjectTone(subject: string): SubjectTone {
  const key = subject.trim().toLowerCase() || 'default';
  return PALETTE[hash(key) % PALETTE.length];
}

// CSS custom-property pair for use as inline style, e.g.
// style={subjectAccentStyle(subject)} paired with
// `border-left-color: var(--accent-color)` / `background: var(--accent-bg)` in CSS.
export function subjectAccentStyle(subject: string): Record<string, string> {
  const { color, bg } = TONE_COLORS[subjectTone(subject)];
  return { '--accent-color': color, '--accent-bg': bg } as Record<string, string>;
}
