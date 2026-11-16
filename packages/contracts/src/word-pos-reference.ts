import type { LanguageWordClass } from './language-structure.js';

/** Symbolic public-only CAT predicate: do not expose an unpublished class. */
export function hasPublishedWordClassLabel(hasId: boolean, registeredInPublishedMaster: boolean): boolean {
  return hasId && registeredInPublishedMaster;
}

/** Resolve a word's class ID only from its owning language's PUBLISHED master. */
export function publishedWordClassName(partOfSpeechId: string,
  publishedClasses: readonly LanguageWordClass[]): string {
  if (!partOfSpeechId) return '';
  const match = publishedClasses.find(wordClass => wordClass.id === partOfSpeechId);
  return hasPublishedWordClassLabel(true, Boolean(match)) ? match!.name : '';
}
