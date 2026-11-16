/** LG-05: the author UI never offers free-text parts of speech. */
export function wordClassInputPolicy(hasMasterEntries: boolean, hasLegacySelection: boolean) {
  return {
    choiceEnabled: hasMasterEntries,
    showLegacy: hasLegacySelection,
    freeTextAllowed: false,
  } as const;
}
