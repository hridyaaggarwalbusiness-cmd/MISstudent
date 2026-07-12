import type { SchoolClass } from '@/types';

export function classDisplayLabel(cls: SchoolClass): string {
  return `${cls.name} - ${cls.section}`;
}

export function classLabelById(id: string, classes: SchoolClass[]): string {
  const cls = classes.find((c) => c.id === id);
  return cls ? classDisplayLabel(cls) : id;
}

// Resolves a "Class 9 - B; Class 10 - A" style string into class IDs.
// Returns an error naming the first label that didn't match any class.
export function resolveClassLabels(
  text: string,
  classes: SchoolClass[],
): { ids: string[] } | { error: string } {
  const labels = text
    .split(/[;,]/)
    .map((s) => s.trim())
    .filter(Boolean);
  const resolved = labels.map((label) => ({
    label,
    id: classes.find((c) => classDisplayLabel(c).toLowerCase() === label.toLowerCase())?.id,
  }));
  const unmatched = resolved.find((r) => !r.id);
  if (unmatched) {
    return { error: `Class not found: "${unmatched.label}" (expected format "Class 9 - B")` };
  }
  return { ids: resolved.map((r) => r.id as string) };
}

// Resolves a single "Class 9 - B" label into a class, for fields that hold
// exactly one class (e.g. a student's class).
export function resolveSingleClassLabel(
  text: string,
  classes: SchoolClass[],
): { cls: SchoolClass } | { error: string } {
  const label = text.trim();
  const cls = classes.find((c) => classDisplayLabel(c).toLowerCase() === label.toLowerCase());
  if (!cls) return { error: `Class not found: "${label}" (expected format "Class 9 - B")` };
  return { cls };
}
