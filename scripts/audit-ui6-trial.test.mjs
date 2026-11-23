import test from 'node:test';
import assert from 'node:assert/strict';
import { inspectComponentDirectory } from './audit-ui-component-deps.mjs';
import { describeUi6Trial, UI6_ROLES, UI6_TRIAL_ASSIGNMENTS } from './audit-ui6-trial.mjs';

test('UI6-TRIAL-01: real Vue components have an explicit, source-reviewed candidate role each', async () => {
  const graph = await inspectComponentDirectory('apps/web/app/components');
  const report = describeUi6Trial(graph);
  assert.equal(report.componentCount, 24);
  assert.deepEqual(report.unclassified, []);
  assert.deepEqual(report.staleAssignments, []);
  assert.deepEqual(report.invalidAssignments, []);
  assert.equal(report.candidateCoverage, 'complete-in-trial');
  assert.deepEqual(report.roleCounts, {
    room: 9, furniture: 10, partition: 1, equipment: 2, structure: 1, decor: 1,
  });
  const roles = new Map(report.assignments.map(item => [item.name, item.role]));
  assert.equal(roles.get('PublicCollectionPage'), 'room');
  assert.equal(roles.get('AdminMasterCatalog'), 'room');
  assert.equal(roles.get('AppDialogHost'), 'partition');
  assert.equal(roles.get('ReaderDomainDetail'), 'room');
  assert.equal(roles.get('ReaderPanel'), 'structure');
  assert.equal(roles.get('ReadingSkeleton'), 'decor');
  assert.equal(roles.get('RichContent'), 'furniture');
  assert.equal(roles.get('AuthorCreateLink'), 'equipment');
  assert.equal(roles.get('AuthorReferencePanel'), 'furniture');
  assert.ok(report.observedEdges.some(edge =>
    edge.from === 'PublicCollectionPage' && edge.to === 'ReaderPanel' &&
    edge.fromRole === 'room' && edge.toRole === 'structure'));
  assert.ok(report.observedEdges.some(edge =>
    edge.from === 'AuthorReferencePanel' && edge.to === 'WordMeaningsReader' &&
    edge.fromRole === 'furniture' && edge.toRole === 'furniture'));
  assert.deepEqual(graph.cycles, []);
});

test('UI6-TRIAL-02: new, invalid and removed candidate entries remain visible instead of guessed', () => {
  const report = describeUi6Trial({
    components: [
      { name: 'ReaderPanel', dependsOn: [] },
      { name: 'FutureDialog', dependsOn: [] },
    ], cycles: [],
  }, {
    ReaderPanel: 'structure',
    FutureDialog: 'unknown-role',
    RetiredPanel: 'furniture',
  });
  assert.equal(report.candidateCoverage, 'needs-review');
  assert.deepEqual(report.unclassified, ['FutureDialog']);
  assert.deepEqual(report.invalidAssignments, [{ name: 'FutureDialog', role: 'unknown-role' }]);
  assert.deepEqual(report.staleAssignments, ['RetiredPanel']);
  assert.equal(report.assignments.find(x => x.name === 'FutureDialog')?.role, null);
  assert.equal(UI6_ROLES.length, 6);
  assert.equal(Object.keys(UI6_TRIAL_ASSIGNMENTS).length, 24);
});

test('UI6-TRIAL-03: candidate reverse dependencies require review, not automatic normative rejection', () => {
  const report = describeUi6Trial({
    components: [
      { name: 'Button', dependsOn: ['ReaderPage'] },
      { name: 'ReaderPage', dependsOn: ['Button'] },
    ], cycles: [['Button', 'ReaderPage', 'Button']],
  }, { Button: 'equipment', ReaderPage: 'room' });
  assert.deepEqual(report.reviewCandidates, [{
    from: 'Button', fromRole: 'equipment', to: 'ReaderPage', toRole: 'room',
    reviewCandidate: true,
  }]);
  assert.deepEqual(report.observedCycles, [['Button', 'ReaderPage', 'Button']]);
  assert.equal(report.candidateCoverage, 'complete-in-trial');
  assert.equal(report.normativeDependencyRules, 'not-run');
});

test('UI6-TRIAL-04: even complete candidate coverage never promotes CAT Gate or DOM conformance', () => {
  const report = describeUi6Trial({
    components: [{ name: 'Panel', dependsOn: [] }], cycles: [],
  }, { Panel: 'structure' });
  assert.equal(report.candidateCoverage, 'complete-in-trial');
  assert.equal(report.classificationStatus, 'trial-candidate');
  assert.equal(report.normativeClassification, 'not-run');
  assert.equal(report.normativeDependencyRules, 'not-run');
  assert.equal(report.domContract, 'not-run');
  assert.equal(report.roleCounts.partition, 0, 'a role need not be represented in every inventory');
});

test('UI6-TRIAL-05: CLI coverage check reports observed current roles and fails only on candidate drift', async () => {
  const { spawnSync } = await import('node:child_process');
  const { mkdtemp, writeFile, rm } = await import('node:fs/promises');
  const { tmpdir } = await import('node:os');
  const { join } = await import('node:path');
  const args = ['scripts/audit-ui6-trial.mjs', '--check-trial-coverage'];
  const current = spawnSync(process.execPath, args, { encoding: 'utf8' });
  assert.equal(current.status, 0, current.stderr);
  const report = JSON.parse(current.stdout);
  assert.equal(report.componentCount, 24);
  assert.equal(report.candidateCoverage, 'complete-in-trial');
  assert.equal(report.normativeClassification, 'not-run');

  const root = await mkdtemp(join(tmpdir(), 'eternalia-ui6-unknown-'));
  try {
    await writeFile(join(root, 'FutureOverlay.vue'), '<template><div /></template>');
    const drift = spawnSync(process.execPath,
      ['scripts/audit-ui6-trial.mjs', '--root', root, '--check-trial-coverage'],
      { encoding: 'utf8' });
    assert.equal(drift.status, 1, drift.stderr);
    const driftReport = JSON.parse(drift.stdout);
    assert.deepEqual(driftReport.unclassified, ['FutureOverlay']);
    assert.equal(driftReport.candidateCoverage, 'needs-review');
    assert.equal(driftReport.normativeClassification, 'not-run');
  } finally { await rm(root, { recursive: true, force: true }); }
});

test('UI6-TRIAL-06: composition evidence is observable, not an approved dependency/DOM rule', async () => {
  const graph = await inspectComponentDirectory('apps/web/app/components');
  const report = describeUi6Trial(graph);
  assert.equal(report.compositionObservationStatus, 'lexical-partial');
  assert.equal(report.compositionEvidence.length, 24);
  assert.deepEqual(report.compositionEvidence.find(x => x.name === 'ReaderPanel')?.slotOutlets,
    ['default']);
  assert.equal(report.candidateCoverage, 'complete-in-trial');
  assert.equal(report.normativeClassification, 'not-run');
  assert.equal(report.normativeDependencyRules, 'not-run');
  assert.equal(report.domContract, 'not-run');
  const withoutEvidence = describeUi6Trial({
    components: [{ name: 'ReaderPanel', dependsOn: [] }], cycles: [],
  }, { ReaderPanel: 'structure' });
  assert.equal(withoutEvidence.compositionObservationStatus, 'not-run');
  assert.deepEqual(withoutEvidence.compositionEvidence, []);
});
