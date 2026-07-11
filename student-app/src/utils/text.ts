// Chart x-axis / tab labels need to be short without turning into a mangled
// mid-word fragment ("Social Studies" -> "Soci"). Multi-word labels become
// initials ("Social Studies" -> "SS"); single words are trimmed to a clean
// 4-character prefix ("Mathematics" -> "Math").
export function abbreviateLabel(label: string, shortWordLimit = 4, truncateTo = 3): string {
  const words = label.trim().split(/\s+/).filter(Boolean);
  if (words.length > 1) {
    return words.map((w) => w[0].toUpperCase()).join('');
  }
  const word = words[0] ?? '';
  return word.length > shortWordLimit ? word.slice(0, truncateTo) : word;
}
