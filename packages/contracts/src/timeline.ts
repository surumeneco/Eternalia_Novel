/** Relative years are comparable only within the same periodization.
 * Cross-periodization conversion requires a separately approved epoch model.
 */
export interface RelativeYearEvent {
  id: string;
  order: number;
  content: { title: string; details: Record<string, string> };
}

export function parseRelativeYear(raw: string | undefined): number | null {
  if (raw === undefined || !/^[+-]?\d+(?:\.\d+)?$/.test(raw.trim())) return null;
  const year = Number(raw.trim());
  return Number.isFinite(year) ? year : null;
}

export function compareEventsWithinPeriod(a: RelativeYearEvent, b: RelativeYearEvent): number {
  const yearA = parseRelativeYear(a.content.details.year);
  const yearB = parseRelativeYear(b.content.details.year);
  if (yearA !== null && yearB !== null && yearA !== yearB) return yearA < yearB ? -1 : 1;
  if (yearA === null && yearB !== null) return 1;
  if (yearA !== null && yearB === null) return -1;
  return a.order - b.order || a.content.title.localeCompare(b.content.title, 'ja') || a.id.localeCompare(b.id);
}
