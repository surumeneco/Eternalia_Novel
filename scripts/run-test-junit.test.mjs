import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { readFile, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const runner = fileURLToPath(new URL('./run-test-junit.mjs', import.meta.url));
const standaloneEnv = {...process.env};
delete standaloneEnv.NODE_TEST_CONTEXT; // Do not pass parent node:test V8 worker marker into the child runner.

test('one Node22 test run emits a nonempty JUnit XML and exact-CI metadata', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'eternalia-junit-'));
  try {
    const source = join(dir, 'sample.test.mjs');
    await writeFile(source, "import {test} from 'node:test';import assert from 'node:assert/strict';test('sample',()=>assert.equal(1,1));\n");
    const result = spawnSync(process.execPath, [runner, 'unit-proof', source], {
      encoding: 'utf8',
      env: { ...standaloneEnv, ALPHA_JUNIT_DIR: dir, GITHUB_SHA: 'a'.repeat(40), GITHUB_RUN_ID: '123456' },
    });
    assert.equal(result.status, 0, result.stderr + result.stdout);
    const xml = await readFile(join(dir, 'unit-proof.xml'), 'utf8');
    const manifest = JSON.parse(await readFile(join(dir, 'unit-proof.manifest.json'), 'utf8'));
    assert.match(xml, /<testsuites>/);
    assert.match(xml, /<testcase\s/);
    assert.equal(manifest.testcaseCount, 1);
    assert.equal(manifest.status, 'passed');
    assert.equal(manifest.githubSha, 'a'.repeat(40));
    assert.equal(manifest.githubRunId, '123456');
    assert.match(result.stdout, /JUNIT_EVIDENCE/);
  } finally { await rm(dir, {recursive:true,force:true}); }
});

test('failed test exits nonzero and records a failed JUnit manifest', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'eternalia-junit-'));
  try {
    const source = join(dir, 'broken.test.mjs');
    await writeFile(source, "import {test} from 'node:test';import assert from 'node:assert/strict';test('broken',()=>assert.equal(1,2));\n");
    const result = spawnSync(process.execPath, [runner, 'failed-proof', source], {
      encoding: 'utf8', env: {...standaloneEnv, ALPHA_JUNIT_DIR:dir},
    });
    assert.notEqual(result.status, 0);
    const manifest = JSON.parse(await readFile(join(dir, 'failed-proof.manifest.json'), 'utf8'));
    assert.equal(manifest.status, 'failed');
    assert.equal(manifest.testcaseCount, 1);
    assert.ok(manifest.failureCount >= 1);
  } finally { await rm(dir, {recursive:true,force:true}); }
});

test('skipped or todo acceptance tests cannot produce a passed JUnit receipt', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'eternalia-junit-skips-'));
  try {
    for (const [suite, source] of [
      ['only-skip', "import {test} from 'node:test';test('not executed', {skip: 'incomplete'}, () => { throw new Error('should not run'); });\n"],
      ['mixed-skip', "import {test} from 'node:test';test('executed', () => {});test('not executed', {skip: true}, () => {});\n"],
      ['todo-only', "import {test} from 'node:test';test.todo('not implemented');\n"],
    ]) {
      const file = join(dir, suite + '.test.mjs');
      await writeFile(file, source);
      const result = spawnSync(process.execPath, [runner, suite, file], {
        encoding: 'utf8', env: {...standaloneEnv, ALPHA_JUNIT_DIR: dir},
      });
      const manifest = JSON.parse(await readFile(join(dir, suite + '.manifest.json'), 'utf8'));
      assert.notEqual(result.status, 0, suite + ': unexpectedly accepted skipped CI evidence');
      assert.equal(manifest.status, 'failed', suite);
      assert.equal(manifest.skippedCount, 1, suite);
      assert.ok(manifest.testcaseCount >= 1, suite);
    }
  } finally { await rm(dir, {recursive:true,force:true}); }
});
