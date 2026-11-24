import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { inspectAppRouteComposition } from './audit-ui6-route-composition.mjs';

async function withApp(files, run) {
  const root = await mkdtemp(join(tmpdir(), 'eternalia-ui6-routes-'));
  try {
    for (const [name, contents] of Object.entries(files)) {
      const target = join(root, name);
      await mkdir(dirname(target), { recursive: true });
      await writeFile(target, contents);
    }
    await run(root);
  } finally { await rm(root, { recursive: true, force: true }); }
}

test('UI6-ROUTE-01/03: route, layout and app source records distinguish local tags, slots and Nuxt outlets', async () => {
  await withApp({
    'components/ReaderPanel.vue': '<template><section><slot /></section></template>',
    'components/TopicPath.vue': '<template><nav /></template>',
    'app.vue': '<template><NuxtLayout><NuxtPage /></NuxtLayout></template>',
    'layouts/default.vue': '<template><main><slot /></main></template>',
    'pages/index.vue': `<script setup>const fake = '<TopicPath />';</script><template>
      <!-- <TopicPath /> -->
      <ReaderPanel><topic-path /><template #header><p /></template>
        <component :is="selection" />
        <div :title="'<TopicPath />'" />
      </ReaderPanel>
    </template>`,
  }, async root => {
    const report = await inspectAppRouteComposition(root);
    assert.equal(report.componentCount, 2);
    assert.equal(report.sourceCount, 3);
    assert.equal(report.pageCount, 1);
    assert.equal(report.layoutCount, 1);
    assert.deepEqual(report.owners.map(item => item.source),
      ['app.vue', 'layouts/default.vue', 'pages/index.vue']);
    const entry = report.owners.find(item => item.source === 'pages/index.vue');
    assert.deepEqual(entry.localComponents, ['ReaderPanel', 'TopicPath']);
    assert.deepEqual(entry.frameworkOutlets, []);
    assert.deepEqual(entry.slotProviders, ['header']);
    assert.deepEqual(entry.dynamicComponentSites, ['component']);
    assert.deepEqual(report.owners.find(item => item.source === 'app.vue')?.frameworkOutlets,
      ['NuxtLayout', 'NuxtPage']);
    assert.deepEqual(report.owners.find(item => item.source === 'layouts/default.vue')?.slotOutlets,
      ['default']);
    assert.equal(report.runtimeResolution, 'not-run');
    assert.equal(report.normativeDependencyRules, 'not-run');
    assert.equal(report.domContract, 'not-run');
  });
});

test('UI6-ROUTE-02: relative Vue imports resolve by actual path, never same basename or out-of-app source', async () => {
  await withApp({
    'components/Panel.vue': '<template><div /></template>',
    'components/Other.vue': '<template><article /></template>',
    'pages/sub/entry.vue': `<script setup>
      import Panel from '../../components/Panel.vue';
      import Missing from '../missing.vue';
      import Outside from '../../../outside.vue';
      import Alias from '~/components/Other.vue';
      // import Fake from '../../components/Other.vue';
    </script><template><Panel /></template>`,
  }, async root => {
    const report = await inspectAppRouteComposition(root);
    const entry = report.owners.find(item => item.source === 'pages/sub/entry.vue');
    assert.deepEqual(entry.localComponents, ['Panel']);
    assert.deepEqual(entry.staticVueImports, [
      { specifier: '../../../outside.vue', target: null, resolution: 'outside-app' },
      { specifier: '../../components/Panel.vue', target: 'components/Panel.vue', resolution: 'resolved' },
      { specifier: '../missing.vue', target: 'pages/missing.vue', resolution: 'missing' },
      { specifier: '~/components/Other.vue', target: null, resolution: 'unresolved-alias' },
    ]);
    assert.ok(!entry.staticVueImports.some(item => item.specifier.includes('Fake')));
  });
});

test('UI6-ROUTE-04/05: current series-first pages and layout retain non-normative source observation', async () => {
  const report = await inspectAppRouteComposition('apps/web/app');
  assert.equal(report.pageCount, 74);
  assert.equal(report.layoutCount, 1);
  assert.equal(report.sourceCount, 76);
  assert.equal(report.componentCount, 24);
  for(const path of ['pages/admin/series/create.vue','pages/admin/series/[id]/create/[kind]/[parentId].vue']) {
    const owner=report.owners.find(item=>item.source===path);
    assert.ok(owner, path);
    assert.ok(owner.staticVueImports.some(item=>item.specifier==='~/pages/studio.vue'),path);
  }
  assert.ok(report.owners.find(item => item.source === 'pages/index.vue')?.localComponents.includes('ReaderPanel'));
  assert.ok(report.owners.find(item => item.source === 'pages/series/[id]/index.vue')?.localComponents.includes('ReaderPanel'));
  assert.ok(report.owners.find(item => item.source === 'pages/series/[id]/stories/[volumeId]/parts/[partId]/chapters/[chapterId].vue')?.localComponents.includes('ReaderDomainDetail'));
  assert.ok(report.owners.find(item => item.source === 'pages/admin/series/[id]/stories/chapters/index.vue')?.localComponents.includes('AdminNodeGrid'));
  assert.ok(report.owners.find(item => item.source === 'pages/studio/memos.vue')?.localComponents.includes('ReaderPanel'));
  assert.deepEqual(report.owners.find(item => item.source === 'app.vue')?.frameworkOutlets,
    ['NuxtLayout', 'NuxtPage']);
  assert.deepEqual(report.owners.find(item => item.source === 'layouts/default.vue')?.slotOutlets, ['default']);
  assert.equal(report.compositionObservationStatus, 'lexical-partial');
  assert.equal(report.normativeClassification, 'not-run');
  assert.equal(report.normativeDependencyRules, 'not-run');
  assert.equal(report.domContract, 'not-run');
  const cli = spawnSync(process.execPath, ['scripts/audit-ui6-route-composition.mjs'], {
    encoding: 'utf8',
  });
  assert.equal(cli.status, 0, cli.stderr);
  const json = JSON.parse(cli.stdout);
  assert.deepEqual(json.owners, report.owners);
  assert.equal(json.runtimeResolution, 'not-run');
});
