/** LG-05: only explicitly named classes from the owning language's draft master may be used on creation. */
export function isRegisteredCreateWordPartOfSpeech(hasPart: boolean, registered: boolean): boolean {
  return !hasPart || registered;
}
