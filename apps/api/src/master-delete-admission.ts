/** A pure CAT delete-admission judgment; never substitutes DB reference checks. */
export function deleteAdmission(revisionMatches: boolean, hasReferences: boolean):
  'allowed' | 'conflict' | 'referenced' {
  if (!revisionMatches) return 'conflict';
  return hasReferences ? 'referenced' : 'allowed';
}
