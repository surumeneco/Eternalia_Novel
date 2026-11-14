import test from 'node:test';
import assert from 'node:assert/strict';
import { inspectComponentDirectory } from './audit-ui-component-deps.mjs';
import { describeUi6Trial, UI6_ROLES, UI6_TRIAL_ASSIGNMENTS } from './audit-ui6-trial.mjs';

test('UI6-TRIAL-01: real Vue components have an explicit, source-reviewed candidate role each', async () => {
  const graph = await inspectComponentDirectory('apps/web/app/components');
  const report = describeUi6Trial(graph);
  assert.equal(report.componentCount, 15);
  assert.deepEqual(report.unclassified, []);
  assert.deepEqual(report.staleAssignments, []);
  assert.deepEqual(report.invalidAssignments, []);
  assert.equal(report.candidateCoverage, 'complete-in-trial');
  assert.deepEqual(report.roleCounts, {
    room: 1, furniture: 10, partition: 0, equipment: 2, structure: 1, decor: 1,
  });
  const roles = new Map(report.assignments.map(item => [item.name, item.role]));
  assert.equal(roles.get('PublicCollectionPage'), 'room');
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
  assert.equal(Object.keys(UI6_TRIAL_ASSIGNMENTS).length, 15);
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
