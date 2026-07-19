// Formats an ISO date ("2026-07-19") as "19th July, 2026" - the date
// format used on the official notice template.
export function formatOfficialDate(iso: string): string {
  if (!iso) return '';
  const [y, m, d] = iso.split('-').map(Number);
  if (!y || !m || !d) return iso;
  const date = new Date(y, m - 1, d);
  const day = date.getDate();
  const suffix = day % 10 === 1 && day !== 11 ? 'st' : day % 10 === 2 && day !== 12 ? 'nd' : day % 10 === 3 && day !== 13 ? 'rd' : 'th';
  const month = date.toLocaleDateString('en-IN', { month: 'long' });
  return `${day}${suffix} ${month}, ${date.getFullYear()}`;
}
