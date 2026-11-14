/** Deterministic observed Vue SFC component graph. UI6 categories are NOT assigned here. */
import { readdir, readFile } from 'node:fs/promises';
import { basename, join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const tagPattern = /<([A-Z][A-Za-z0-9]*)\b/g;
const importPattern = /\bimport\s+(?:[A-Za-z_$][\w$]*|\{[^}]*\})\s+from\s+['"]([^'"]+\.vue)['"]/g;

/** Only concrete *.vue SFCs in this directory are inventory nodes. */
export async function inspectComponentDirectory(directory) {
  const names = (await readdir(directory)).filter(name => name.endsWith('.vue')).sort();
  const known = new Set(names.map(name => basename(name, '.vue')));
  if (known.size !== names.length) throw new Error('duplicate component name');
  const components = [];
  for (const fileName of names) {
    const name = basename(fileName, '.vue');
    const content = await readFile(join(directory, fileName), 'utf8');
    const references = new Set();
    // Nuxt uses implicit component registration; PascalCase tags are observed
    // without equating DOM parentage to static imports.
    for (const match of content.matchAll(tagPattern)) {
      if (known.has(match[1])) references.add(match[1]);
    }
    for (const match of content.matchAll(importPattern)) {
      const importedName = basename(match[1], '.vue');
      if (known.has(importedName)) references.add(importedName);
    }
    components.push({ name, dependsOn: [...references].sort() });
  }
  const graph = new Map(components.map(c => [c.name, c.dependsOn]));
  const state = new Map();
  const stack = [];
  const cycles = [];
  const cycleKeys = new Set();
  function visit(name) {
    state.set(name, 1);
    stack.push(name);
    for (const next of graph.get(name) ?? []) {
      if (state.get(next) === 1) {
        const path = stack.slice(stack.indexOf(next)).concat(next);
        const rotations = path.slice(0, -1).map((_, i, nodes) =>
          nodes.slice(i).concat(nodes.slice(0, i)).join(' -> '));
        const key = rotations.sort()[0];
        if (!cycleKeys.has(key)) { cycleKeys.add(key); cycles.push(path); }
      } else if (!state.has(next)) visit(next);
    }
    stack.pop();
    state.set(name, 2);
  }
  for (const c of components) if (!state.has(c.name)) visit(c.name);
  return { componentCount: components.length, components, cycles, classificationStatus: 'undecided',
    limitations: ['explicit PascalCase tags and static .vue imports only', 'no DOM or dynamic resolution verification'] };
}

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
  const rootIndex = process.argv.indexOf('--root');
  const directory = resolve(rootIndex < 0 ? 'apps/web/app/components' : process.argv[rootIndex + 1]);
  const result = await inspectComponentDirectory(directory);
  process.stdout.write(JSON.stringify({ directory, ...result }, null, 2) + '\n');
  if (process.argv.includes('--assert-acyclic') && result.cycles.length) process.exitCode = 1;
}
