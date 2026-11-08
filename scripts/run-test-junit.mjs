/**
 * Run a real Node test suite once, with human-readable TAP and machine-readable
 * JUnit XML tied to the exact CI commit. No mocks, no skipped artificial Red.
 */
import { spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';

const [suite, ...files] = process.argv.slice(2);
if (!suite || !/^[a-z][a-z0-9-]{0,60}$/.test(suite) || !files.length) {
  throw new Error('usage: node scripts/run-test-junit.mjs SUITE test-file...');
}
const directory = resolve(process.env.ALPHA_JUNIT_DIR || 'artifacts/alpha-junit');
const output = join(directory, suite + '.xml');
await mkdir(directory, { recursive: true });
const args = [
  '--test',
  '--test-reporter=tap', '--test-reporter=junit',
  '--test-reporter-destination=stdout', '--test-reporter-destination=' + output,
  ...files,
];
const child = spawn(process.execPath, args, { cwd: process.cwd(), env: process.env, stdio: 'inherit' });
const exitCode = await new Promise((resolvePromise, reject) => {
  child.once('error', reject);
  child.once('close', code => resolvePromise(code));
});
let xml = '';
try { xml = await readFile(output, 'utf8'); } catch { /* explicitly reported as missing below */ }
const testCases = (xml.match(/<testcase\b/g) ?? []).length;
const failures = (xml.match(/<(?:failure|error)\b/g) ?? []).length;
// Skipped and TODO tests are not executed acceptance evidence, even if Node exits 0.
const skipped = (xml.match(/<skipped\b/g) ?? []).length;
const valid = xml.includes('<testsuites>') && xml.includes('</testsuites>') && testCases > 0;
const manifest = {
  suite, status: exitCode === 0 && valid && failures === 0 && skipped === 0 ? 'passed' : 'failed',
  node: process.version, testcaseCount: testCases, failureCount: failures, skippedCount: skipped,
  sha256: xml ? createHash('sha256').update(xml).digest('hex') : null,
  githubSha: process.env.GITHUB_SHA || null,
  githubRunId: process.env.GITHUB_RUN_ID || null,
  githubJob: process.env.GITHUB_JOB || null,
  sourceFiles: files,
};
await writeFile(join(directory, suite + '.manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
console.log('JUNIT_EVIDENCE ' + JSON.stringify(manifest));
if (manifest.status !== 'passed') process.exitCode = exitCode || 1;
