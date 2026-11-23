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

test('UI-DEP-OBS-08: separate template tag and direct import provenance without changing graph edges', async () => {
  await withVueFiles({
    Host: `<script setup>
      import ReaderPanel from './ReaderPanel.vue';
      import OnlyImport from './OnlyImport.vue';
    </script>
    <template><ReaderPanel /></template>`,
    ReaderPanel: '<template><section><slot /></section></template>',
    OnlyImport: '<template><article /></template>',
  }, async root => {
    const graph = await inspectComponentDirectory(root);
    assert.deepEqual(graph.components.find(x => x.name === 'Host')?.dependsOn,
      ['OnlyImport', 'ReaderPanel']);
    assert.deepEqual(graph.compositionEvidence.find(x => x.name === 'Host'), {
      name: 'Host', templateTags: ['ReaderPanel'], staticImports: ['OnlyImport', 'ReaderPanel'],
      slotOutlets: [], slotProviders: [], dynamicComponentSites: [],
    });
    assert.deepEqual(graph.compositionEvidence.find(x => x.name === 'ReaderPanel')?.slotOutlets,
      ['default']);
  });
});

test('UI-DEP-OBS-09: slots and dynamic component sites are unresolved lexical evidence, not graph edges', async () => {
  await withVueFiles({
    Host: `<script setup>const fake = '<slot /><component :is="Sneaky" />';</script>
    <template>
      <!-- <slot /><template #ignored><component :is="Fake" /></template> -->
      <ReaderPanel #actions>
        <template v-slot:header><div title='<slot /><component :is="Fake" />' /></template>
        <component :is="selection" />
        <slot name="footer" />
      </ReaderPanel>
    </template>`,
    ReaderPanel: '<template><section><slot /><slot name="details" /></section></template>',
    Fake: '<template><span /></template>',
  }, async root => {
    const graph = await inspectComponentDirectory(root);
    const host = graph.compositionEvidence.find(x => x.name === 'Host');
    assert.deepEqual(graph.components.find(x => x.name === 'Host')?.dependsOn, ['ReaderPanel']);
    assert.deepEqual(host, {
      name: 'Host', templateTags: ['ReaderPanel'], staticImports: [],
      slotOutlets: ['footer'], slotProviders: ['actions', 'header'],
      dynamicComponentSites: ['component'],
    });
    assert.deepEqual(graph.compositionEvidence.find(x => x.name === 'ReaderPanel')?.slotOutlets,
      ['default', 'details']);
    assert.deepEqual(graph.cycles, []);
  });
});

test('UI-DEP-OBS-10: real ReaderPanel slot is observed without inventing UI6 conformance', async () => {
  const graph = await inspectComponentDirectory('apps/web/app/components');
  assert.equal(graph.componentCount, 24);
  assert.deepEqual(graph.compositionEvidence.find(x => x.name === 'ReaderPanel')?.slotOutlets,
    ['default']);
  assert.equal(graph.compositionEvidence.length, graph.componentCount);
  assert.equal(graph.classificationStatus, 'undecided');
  assert.deepEqual(graph.cycles, []);
});
