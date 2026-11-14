/** Integer relative years are comparable only within the same periodization.
 * Cross-periodization conversion requires a separately approved epoch model.
 */
export interface RelativeYearEvent {
  id: string;
  order: number;
  content: { title: string; details: Record<string, string> };
}

export function parseRelativeYear(raw: string | undefined): number | null {
  if (raw === undefined || !/^[+-]?\d+$/.test(raw.trim())) return null;
  const year = Number(raw.trim());
  return Number.isSafeInteger(year) ? year : null;
}

export function compareEventsWithinPeriod(a: RelativeYearEvent, b: RelativeYearEvent): number {
  const yearA = parseRelativeYear(a.content.details.year);
  const yearB = parseRelativeYear(b.content.details.year);
  if (yearA !== null && yearB !== null && yearA !== yearB) return yearA < yearB ? -1 : 1;
  if (yearA === null && yearB !== null) return 1;
  if (yearA !== null && yearB === null) return -1;
  return a.order - b.order || a.content.title.localeCompare(b.content.title, 'ja') || a.id.localeCompare(b.id);
}

/** v0.3-derived provisional interpretation: a period's RelativeYears is the
 * common-axis position of its local year zero. Never coerce an absent offset
 * or an unsafe sum into a real date. See the Draft and Issue #5. */
export function commonTimelineYear(relativeYears: string | undefined, eventYear: string | undefined): number | null {
  const offset = parseRelativeYear(relativeYears);
  const year = parseRelativeYear(eventYear);
  if (offset === null || year === null) return null;
  const common = offset + year;
  return Number.isSafeInteger(common) ? common : null;
}

export interface UnifiedTimelineEntry {
  period: { id: string; order: number; content: { title: string } };
  event: RelativeYearEvent;
  commonYear: number;
}

/** Stable tie order keeps explicit period/event display order within one year. */
export function compareUnifiedTimelineEntries(a: UnifiedTimelineEntry, b: UnifiedTimelineEntry): number {
  if (a.commonYear !== b.commonYear) return a.commonYear < b.commonYear ? -1 : 1;
  return a.period.order - b.period.order ||
    a.event.order - b.event.order ||
    a.period.content.title.localeCompare(b.period.content.title, 'ja') ||
    a.event.content.title.localeCompare(b.event.content.title, 'ja') ||
    a.period.id.localeCompare(b.period.id) ||
    a.event.id.localeCompare(b.event.id);
}
