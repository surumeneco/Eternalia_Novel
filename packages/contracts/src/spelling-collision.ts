/** CAT-backed predicate for two already filtered spelling matches. */
export function hasSameLanguageSpellingCollision(draftMatches: boolean, publishedMatches: boolean): boolean {
  return draftMatches || publishedMatches;
}
