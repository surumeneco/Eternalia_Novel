import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { inspectComponentDirectory } from './audit-ui-component-deps.mjs';

async function withVueFiles(files, run) {
  const root = await mkdtemp(join(tmpdir(), 'eternalia-ui-deps-'));
  try {
    for (const [name, content] of Object.entries(files)) {
      const path = join(root, name + '.vue');
      await mkdir(dirname(path), { recursive: true });
      await writeFile(path, content);
    }
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

test('UI-DEP-OBS-04: ignore fake component tags in script strings, CSS, HTML comments and attributes', async () => {
  await withVueFiles({
    Host: `<script setup>const example = '<FakePanel />';</script>
<template>
  <!-- <FakePanel /> -->
  <div :title="'<FakePanel />'"><RealPanel /></div>
</template>
<style>.caption::after { content: "<FakePanel />" }</style>`,
    FakePanel: '<template><div /></template>',
    RealPanel: '<template><div /></template>',
  }, async root => {
    const result = await inspectComponentDirectory(root);
    assert.deepEqual(result.components.find(node => node.name === 'Host')?.dependsOn, ['RealPanel'],
      'non-template fake tags cannot create dependencies');
    assert.deepEqual(result.cycles, []);
  });
});

test('UI-DEP-OBS-05: recognize kebab-case SFC tags after nested Vue template blocks', async () => {
  await withVueFiles({
    Host: `<template>
      <template v-if="true"><reader-panel /></template>
      <topic-path />
    </template>`,
    ReaderPanel: '<template><section /></template>',
    TopicPath: '<template><nav /></template>',
  }, async root => {
    const result = await inspectComponentDirectory(root);
    assert.deepEqual(result.components.find(node => node.name === 'Host')?.dependsOn,
      ['ReaderPanel', 'TopicPath']);
  });
});

test('UI-DEP-OBS-06: static SFC imports count, but commented imports do not', async () => {
  await withVueFiles({
    Host: `<script setup lang="ts">
      // import FakePanel from './FakePanel.vue';
      /* import FakePanel from './FakePanel.vue'; */
      import Alias from './RealPanel.vue';
      const example = "import FakePanel from './FakePanel.vue'";
    </script>
    <template><div /></template>`,
    FakePanel: '<template><div /></template>',
    RealPanel: '<template><div /></template>',
  }, async root => {
    const result = await inspectComponentDirectory(root);
    assert.deepEqual(result.components.find(node => node.name === 'Host')?.dependsOn, ['RealPanel']);
  });
});

test('UI-DEP-OBS-07: importing a nested same-basename Vue file is not a local SFC dependency', async () => {
  await withVueFiles({
    Host: `<script setup lang="ts">
      import NestedPanel from './nested/ReaderPanel.vue';
      import LocalPanel from './TopicPath.vue';
    </script><template><main /></template>`,
    ReaderPanel: '<template><article /></template>',
    TopicPath: '<template><nav /></template>',
    'nested/ReaderPanel': '<template><aside /></template>',
  }, async root => {
    const result = await inspectComponentDirectory(root);
    assert.equal(result.componentCount, 3, 'nested components are outside this directory inventory');
    assert.deepEqual(result.components.find(node => node.name === 'Host')?.dependsOn,
      ['TopicPath'], 'an imported basename from another directory is not the local ReaderPanel');
    assert.deepEqual(result.cycles, []);
  });
});
