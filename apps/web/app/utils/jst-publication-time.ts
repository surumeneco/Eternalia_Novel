/**
 * Publication start dates are authored in JST (UTC+09:00) regardless of the
 * browser, operating system or server timezone. Stored values are UTC epoch
 * milliseconds. This module deliberately does not use local Date parsing or
 * getTimezoneOffset().
 */
const JST_OFFSET_MS = 9 * 60 * 60 * 1000;
const JAPAN_DATETIME = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/;

export function parseJstLocalDateTime(value: string): number | null {
  const match = JAPAN_DATETIME.exec(value);
  if (!match) return null;
  const year = Number(match[1]!);
  const month = Number(match[2]!);
  const day = Number(match[3]!);
  const hour = Number(match[4]!);
  const minute = Number(match[5]!);
  const second = Number(match[6] ?? '0');
  if (month < 1 || month > 12 || day < 1 || day > 31 ||
      hour > 23 || minute > 59 || second > 59) return null;

  // Date.UTC(0..99) aliases 1900..1999, so use setUTCFullYear instead.
  const date = new Date(0);
  date.setUTCFullYear(year, month - 1, day);
  date.setUTCHours(hour, minute, second ?? 0, 0);
  const timestamp = date.getTime() - JST_OFFSET_MS;
  if (!Number.isSafeInteger(timestamp) || timestamp < 0) return null;
  // Reject invalid calendar values instead of JS Date's silent normalization.
  if (formatJstLocalDateTime(timestamp) !== value) return null;
  return timestamp;
}

export function formatJstLocalDateTime(timestamp: number): string | null {
  if (!Number.isSafeInteger(timestamp) || timestamp < 0) return null;
  const date = new Date(timestamp + JST_OFFSET_MS);
  if (!Number.isFinite(date.getTime())) return null;
  const iso = date.toISOString().slice(0, 19);
  // Preserve seconds if the stored date has non-zero seconds.
  return iso.endsWith(':00') ? iso.slice(0, 16) : iso;
}

export function formatJstDisplay(timestamp: number, language: string): string | null {
  if (!Number.isSafeInteger(timestamp) || timestamp < 0) return null;
  const date = new Date(timestamp);
  if (!Number.isFinite(date.getTime())) return null;
  return new Intl.DateTimeFormat(language === 'en' ? 'en-US' : 'ja-JP', {
    timeZone: 'Asia/Tokyo', year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: false,
  }).format(date);
}
