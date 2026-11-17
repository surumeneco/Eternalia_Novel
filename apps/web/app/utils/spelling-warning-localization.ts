import type { SpellingWarning } from '@eternalia/contracts';

export type SpellingWarningMessageKey =
  | 'studioDuplicateSpellingWarning'
  | 'studioPhonotacticsWarning'
  | 'studioUnknownAlphabetWarning';

const warningKeys: Record<SpellingWarning['code'], SpellingWarningMessageKey> = {
  'duplicate-spelling': 'studioDuplicateSpellingWarning',
  phonotactics: 'studioPhonotacticsWarning',
  'unknown-alphabet': 'studioUnknownAlphabetWarning',
};

/** Localize a fixed author diagnostic without modifying stored or published content. */
export function localizeSpellingWarning(
  code: SpellingWarning['code'],
  translate: (key: SpellingWarningMessageKey) => string,
): string {
  return translate(warningKeys[code]);
}
