import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { inspectComponentDirectory } from './audit-ui-component-deps.mjs';

async function withVueFiles(files, run) {
  const root = await mkdtemp(join(tmpdir(), 'eternalia-ui-deps-'));
  try {
    for (const [name, content] of Object.entries(files))
      await writeFile(join(root, name + '.vue'), content);
    await run(root);
  } finally { await rm(root, { recursive: true, force: true }); }
}

test('UI-DEP-OBS-01: PascalCase Nuxt tags and explicit SFC imports produce stable dependencies', async () => {
  await withVueFiles({
    Shell: "<template><ReaderPanel/><NuxtLink to='/' /></template>",
    ReaderPanel: "<template><TopicPath /></template>",
    TopicPath: "<template><nav /></template>",
    Extra: "<script setup>import ReaderPanel from './ReaderPanel.vue';</script><template></template>",
  }, async root => {
    const result = await inspectComponentDirectory(root);
    assert.deepEqual(result.components, [
      { name: 'Extra', dependsOn: ['ReaderPanel'] },
      { name: 'ReaderPanel', dependsOn: ['TopicPath'] },
      { name: 'Shell', dependsOn: ['ReaderPanel'] },
      { name: 'TopicPath', dependsOn: [] },
    ]);
    assert.deepEqual(result.cycles, []);
    assert.equal(result.classificationStatus, 'undecided');
  });
});

test('UI-DEP-OBS-02: actual multi-step and self cycles are reported, not silently accepted', async () => {
  await withVueFiles({
    First: '<template><Second /></template>',
    Second: '<template><Third /></template>',
    Third: '<template><First /></template>',
    Self: '<template><Self /></template>',
  }, async root => {
    const result = await inspectComponentDirectory(root);
    assert.deepEqual(result.cycles, [ ['First', 'Second', 'Third', 'First'], ['Self', 'Self'] ]);
  });
});

test('UI-DEP-OBS-03: current app component graph is observed but not promoted to UI6 approval', async () => {
  const result = await inspectComponentDirectory('apps/web/app/components');
  assert.ok(result.componentCount >= 10);
  assert.ok(result.components.some(item => item.name === 'PublicCollectionPage'));
  assert.deepEqual(result.cycles, [], 'unexpected observed static Vue component cycle');
  assert.equal(result.classificationStatus, 'undecided');
});
