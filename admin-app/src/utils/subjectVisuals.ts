import { TONE_COLORS } from '@/utils/toneColors';

// Deterministic subject -> icon/color mapping so the same subject always
// reads the same way across Homework, Exams, Timetable and Materials.
const ICONS: Record<string, string> = {
  math: '📐',
  mathematics: '📐',
  science: '🔬',
  physics: '⚛️',
  chemistry: '🧪',
  biology: '🧬',
  english: '📖',
  hindi: '🈴',
  history: '🏛️',
  geography: '🌍',
  civics: '⚖️',
  'social studies': '🌍',
  computer: '💻',
  'computer science': '💻',
  art: '🎨',
  music: '🎵',
  'physical education': '⚽',
  pe: '⚽',
  sports: '⚽',
  economics: '📈',
  literature: '📚',
};

const PALETTE = ['primary', 'violet', 'info', 'success', 'warning', 'danger'] as const;
export type SubjectTone = (typeof PALETTE)[number];

function hash(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
  return h;
}

export function subjectIcon(subject: string): string {
  const key = subject.trim().toLowerCase();
  return ICONS[key] ?? '📘';
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
