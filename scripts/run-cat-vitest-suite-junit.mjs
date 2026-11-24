#!/usr/bin/env node
/**
 * Format-only CAT/JUnit adapter: preserve Vitest outcomes while replacing the
 * generated describe-prefixed testcase names with the exact CAT vector IDs.
 * This file is not a CAT specification, oracle, or Gate implementation.
 */
import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve, join } from 'node:path';
import { pathToFileURL } from 'node:url';

export function normalizeCatJUnit(xml, processId, expectedIds) {
  if (!/^[a-z0-9][a-z0-9.-]*$/.test(processId)) throw new Error('Invalid process ID');
  if (expectedIds.length === 0 || new Set(expectedIds).size !== expectedIds.length ||
      expectedIds.some(id => !/^case\.[a-z0-9.-]+$/.test(id))) {
    throw new Error('CAT vector IDs must be nonempty, unique and explicit');
  }
  const prefix = `${processId} CAT symbolic contract &gt; `;
  const seen = new Set();
  let count = 0;
  const updated = xml.replace(/<testcase\b[^>]*>/g, tag => {
    const names = [...tag.matchAll(/\bname="([^"]*)"/g)];
    if (names.length !== 1 || !names[0][1].startsWith(prefix)) {
      throw new Error('Unrecognized JUnit testcase name');
    }
    const id = names[0][1].slice(prefix.length);
    if (!expectedIds.includes(id) || seen.has(id)) throw new Error('Unexpected or duplicate CAT testcase');
    seen.add(id);
    count++;
    return tag.replace(`name="${names[0][1]}"`, `name="${id}"`);
  });
  if (count !== expectedIds.length || seen.size !== expectedIds.length ||
      !/<testsuites\b/.test(xml) || /<testcase\b/.test(updated) === false) {
    throw new Error('JUnit testcase set incomplete');
  }
  // Fail closed if the JUnit document reports extra tests, or contains another
  // testcase form that escaped the strict opening-tag match.
  const totals = /<testsuites\b[^>]*\btests="(\d+)"/.exec(xml);
  if (!totals || Number(totals[1]) !== count) throw new Error('JUnit test count mismatch');
  return updated;
}

export function validateCatTestPaths(tests, ids) {
  if (tests.length === 0 || tests.length !== ids.length || new Set(tests).size !== tests.length || tests.some(file => !/^(?:packages\/contracts|apps\/web)\/tests\/generated\/cat_[a-z0-9_]+\.test\.ts$/.test(file))) {
    throw new Error('Every CAT case must have one declared generated test file');
  }
}

function main() {
  const sep = process.argv.indexOf('--');
  if (sep < 0 || sep < 6 || !process.argv[sep + 1]) throw new Error('Expected --report PATH --process ID --ids CSV -- FILE ...');
  const args = process.argv.slice(2, sep);
  const flag = name => {
    const index = args.indexOf(name);
    if (index < 0 || index + 1 >= args.length) throw new Error(`Missing ${name}`);
    return args[index + 1];
  };
  const report = resolve(flag('--report'));
  const processId = flag('--process');
  const ids = flag('--ids').split(',');
  const tests = process.argv.slice(sep + 1);
  validateCatTestPaths(tests, ids);
  const dir = mkdtempSync(join(tmpdir(), 'eternalia-cat-vitest-'));
  try {
    const raw = join(dir, 'vitest.xml');
    const child = spawnSync(process.execPath, ['node_modules/vitest/vitest.mjs', 'run', ...tests,
      '--maxWorkers=1', '--reporter=junit', `--outputFile=${raw}`],
      { cwd: process.cwd(), encoding: 'utf8', timeout: 120_000, maxBuffer: 1024 * 1024 });
    if (child.error) throw child.error;
    if (child.status === null) throw new Error('Vitest did not complete');
    const normalized = normalizeCatJUnit(readFileSync(raw, 'utf8'), processId, ids);
    writeFileSync(report, normalized, 'utf8');
    if (child.status !== 0) {
      process.stderr.write(child.stderr.slice(-1600));
      process.exitCode = child.status;
    }
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try { main(); } catch (error) {
    process.stderr.write(`${error?.message ?? error}\n`);
    process.exitCode = 2;
  }
}
