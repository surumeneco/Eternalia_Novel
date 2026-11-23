/** Source-reviewed UI6 role candidates for a bounded set of Vue SFCs.
 * These are exploratory assignments, NEVER normative classification decisions.
 * Source of rationale: docs/cat/drafts/ui6-role-trial.md
 */
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { inspectComponentDirectory } from './audit-ui-component-deps.mjs';

export const UI6_ROLES = Object.freeze(['room', 'furniture', 'partition', 'equipment', 'structure', 'decor']);

/** Trial candidates reviewed against the currently scoped component SFCs; not normative. */
export const UI6_TRIAL_ASSIGNMENTS = Object.freeze({
  // Integrated pages and work areas (room), plus the modal focus boundary (partition).
  AdminChapterPreview: 'room',
  AdminEditBridge: 'room',
  AdminMasterIndex: 'room',
  AdminMasterCatalog: 'room',
  AdminNodeGrid: 'room',
  AdminPublicationPage: 'room',
  AppDialogHost: 'partition',
  ReaderDomainDetail: 'room',
  ReaderDomainListing: 'room',
  AuthorCreateLink: 'equipment',
  AuthorEditLink: 'equipment',
  AuthorReferencePanel: 'furniture',
  CategoryPresetEditor: 'furniture',
  LanguageStructureEditor: 'furniture',
  LanguageStructureReader: 'furniture',
  PublicCollectionPage: 'room',
  ReaderPanel: 'structure',
  ReadingSkeleton: 'decor',
  RichContent: 'furniture',
  TipLinksEditor: 'furniture',
  TipLinksReader: 'furniture',
  TopicPath: 'furniture',
  WordMeaningsEditor: 'furniture',
  WordMeaningsReader: 'furniture',
});

/** Overlay proposed roles on observed edges. No role-edge is approved/denied.
 * A "reviewCandidate" is only a heuristic for further source inspection.
 */
export function describeUi6Trial(graph, trialAssignments = UI6_TRIAL_ASSIGNMENTS) {
  const allowed = new Set(UI6_ROLES);
  const components = [...graph.components].sort((a, b) => a.name.localeCompare(b.name, 'en'));
  const names = new Set(components.map(item => item.name));
  const invalidAssignments = Object.entries(trialAssignments)
    .filter(([, role]) => !allowed.has(role))
    .map(([name, role]) => ({ name, role }))
    .sort((a, b) => a.name.localeCompare(b.name, 'en'));
  const staleAssignments = Object.keys(trialAssignments).filter(name => !names.has(name)).sort();
  const assignments = components.map(item => ({
    name: item.name,
    role: allowed.has(trialAssignments[item.name]) ? trialAssignments[item.name] : null,
    dependsOn: [...item.dependsOn].sort(),
  }));
  const unclassified = assignments.filter(item => item.role === null).map(item => item.name);
  const roleCounts = Object.fromEntries(UI6_ROLES.map(role => [
    role, assignments.filter(item => item.role === role).length,
  ]));
  const byName = new Map(assignments.map(item => [item.name, item]));
  const observedEdges = assignments.flatMap(item => item.dependsOn.map(to => {
    const target = byName.get(to);
    return {
      from: item.name, fromRole: item.role, to, toRole: target?.role ?? null,
      // Candidate only: low-level components depending on a larger feature
      // often merit review, but no universal role ordering has been approved.
      reviewCandidate: ['equipment', 'structure', 'decor'].includes(item.role) &&
        ['room', 'furniture'].includes(target?.role),
    };
  }));
  return {
    classificationStatus: 'trial-candidate',
    normativeClassification: 'not-run',
    normativeDependencyRules: 'not-run',
    domContract: 'not-run',
    compositionObservationStatus: Array.isArray(graph.compositionEvidence) ? 'lexical-partial' : 'not-run',
    compositionEvidence: graph.compositionEvidence ?? [],
    sourceScope: 'same-directory Vue SFC static observation and lexical composition evidence only',
    candidateCoverage: unclassified.length || staleAssignments.length || invalidAssignments.length
      ? 'needs-review' : 'complete-in-trial',
    componentCount: assignments.length,
    roleCounts, assignments, unclassified, staleAssignments, invalidAssignments,
    observedEdges,
    reviewCandidates: observedEdges.filter(edge => edge.reviewCandidate),
    observedCycles: graph.cycles,
  };
}

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
  const index = process.argv.indexOf('--root');
  if (index >= 0 && !process.argv[index + 1]) throw new Error('--root needs a directory');
  const root = resolve(index < 0 ? 'apps/web/app/components' : process.argv[index + 1]);
  const observation = await inspectComponentDirectory(root);
  const report = describeUi6Trial(observation);
  process.stdout.write(JSON.stringify({ directory: root, ...report }, null, 2) + '\n');
  // Coverage guard is explicitly NON-normative and never verifies role correctness.
  if (process.argv.includes('--check-trial-coverage') && report.candidateCoverage !== 'complete-in-trial')
    process.exitCode = 1;
}
