/**
 * Mechanical structural guard for the alpha acceptance traceability matrix.
 * It does NOT validate CI, CAT conformance, manual acceptance, or the truth of
 * an evidence claim. CI and CAT Gate evidence must be verified independently.
 */
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

const allowed = new Set(['pass', 'fail', 'not-run', 'pending-decision', 'scope-excluded']);
const fullSha = /\b[0-9a-f]{40}\b/i;
const actionsRun = /https:\/\/github\.com\/[^/\s|]+\/[^/\s|]+\/actions\/runs\/\d+/;
const testPath = /(?:^|[\s;])(?:apps|packages|scripts)\/[\w.\-/]+(?:\.test\.mjs|\.spec\.ts|\.test\.ts|\.mjs)(?=$|[\s;,])/;

export function verifyAcTraceability(markdown) {
  const errors = [];
  const counts = { pass: 0, fail: 0, 'not-run': 0, 'pending-decision': 0, 'scope-excluded': 0 };
  const seen = new Set();
  const rows = [];
  const lines = markdown.split(/\r?\n/);
  const headers = lines.filter(line => /^\|\s*AC\s*\|\s*受入シナリオ\s*\|/.test(line));
  if (headers.length !== 1) errors.push(`expected one AC evidence table header, got ${headers.length}`);

  for (const [index, line] of lines.entries()) {
    if (!/^\|\s*AC-\d{2}\s*\|/.test(line)) continue;
    const cols = line.trim().split('|').slice(1, -1).map(cell => cell.trim());
    const id = cols[0];
    rows.push({ id, lineNumber: index + 1 });
    if (cols.length !== 5) {
      errors.push(`line ${index + 1}: ${id} has ${cols.length} columns, expected 5`);
      continue;
    }
    if (seen.has(id)) errors.push(`line ${index + 1}: duplicate ${id}`);
    seen.add(id);
    if (cols.slice(1).some(cell => cell.length === 0)) {
      errors.push(`line ${index + 1}: ${id} has an empty required cell`);
    }
    const status = cols[4];
    if (!allowed.has(status)) {
      errors.push(`line ${index + 1}: ${id} invalid status ${JSON.stringify(status)}`);
      continue;
    }
    counts[status]++;
    if (status === 'pass') {
      const [,,source, evidence] = cols;
      if (!testPath.test(source) || !fullSha.test(evidence) || !actionsRun.test(evidence)) {
        errors.push(`line ${index + 1}: ${id} pass claim lacks a test path, exact-head SHA, or GitHub Actions run URL`);
      }
    }
  }
  const sequence = Array.from({length: 78}, (_, i) => `AC-${String(i + 1).padStart(2, '0')}`);
  for (const id of sequence) if (!seen.has(id)) errors.push(`missing ${id}`);
  if (rows.length !== sequence.length) errors.push(`found ${rows.length} AC rows, expected ${sequence.length}`);
  for (const [idx, row] of rows.entries()) {
    if (row.id !== sequence[idx]) {
      errors.push(`line ${row.lineNumber}: AC order mismatch: expected ${sequence[idx]}, got ${row.id}`);
      break;
    }
  }
  return { checked: rows.length, counts, errors };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const path = process.argv[2] ?? 'docs/alpha-ac-traceability.md';
  const result = verifyAcTraceability(await readFile(path, 'utf8'));
  console.log(JSON.stringify({path, ...result}, null, 2));
  if (result.errors.length) process.exitCode = 1;
}
