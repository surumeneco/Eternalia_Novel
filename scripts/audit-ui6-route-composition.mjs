/** Bounded page/layout-to-component observations. No UI6 normative decisions. */
import { readdir, readFile, lstat } from 'node:fs/promises';
import { dirname, join, relative, resolve, sep } from 'node:path';
import { pathToFileURL } from 'node:url';
import {
  inspectComponentDirectory, buildKnownComponentTagMap,
  templateEvidence, staticVueImportSpecifiers,
} from './audit-ui-component-deps.mjs';

const FRAMEWORK_OUTLETS = Object.freeze(['NuxtPage', 'NuxtLayout', 'RouterView']);
const FRAMEWORK_PREFIX = '@framework:';
const slash = path => path.split(sep).join('/');

async function existsFile(path) {
  try { const stat = await lstat(path); return stat.isFile() && !stat.isSymbolicLink(); }
  catch (error) { if (error?.code === 'ENOENT') return false; throw error; }
}

async function vueFiles(directory) {
  let entries;
  try { entries = await readdir(directory, { withFileTypes: true }); }
  catch (error) { if (error?.code === 'ENOENT') return []; throw error; }
  const files = [];
  for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name, 'en'))) {
    const target = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await vueFiles(target));
    else if (entry.isFile() && entry.name.endsWith('.vue')) files.push(target);
  }
  return files.sort();
}

/** Do not follow a relative import outside this app, or silently identify a basename. */
async function resolveStaticImports(source, filePath, root) {
  const imports = [];
  for (const specifier of staticVueImportSpecifiers(source)) {
    if (!specifier.startsWith('.')) {
      imports.push({ specifier, target: null, resolution: 'unresolved-alias' });
      continue;
    }
    const target = resolve(dirname(filePath), specifier);
    const rel = relative(root, target);
    if (rel === '..' || rel.startsWith('..' + sep) || rel.startsWith(sep)) {
      imports.push({ specifier, target: null, resolution: 'outside-app' });
      continue;
    }
    const resolved = await existsFile(target);
    imports.push({
      specifier, target: slash(rel), resolution: resolved ? 'resolved' : 'missing',
    });
  }
  return imports;
}

/** The returned edges are source syntax, not observed runtime component trees. */
export async function inspectAppRouteComposition(appRoot = 'apps/web/app') {
  const root = resolve(appRoot);
  const graph = await inspectComponentDirectory(join(root, 'components'));
  const knownTags = buildKnownComponentTagMap(graph.components.map(item => item.name));
  for (const name of FRAMEWORK_OUTLETS) knownTags.set(name, FRAMEWORK_PREFIX + name);
  const sources = [];
  if (await existsFile(join(root, 'app.vue'))) sources.push({ path: join(root, 'app.vue'), kind: 'app' });
  for (const path of await vueFiles(join(root, 'layouts'))) sources.push({ path, kind: 'layout' });
  for (const path of await vueFiles(join(root, 'pages'))) sources.push({ path, kind: 'page' });
  const owners = [];
  for (const source of sources.sort((a, b) => a.path.localeCompare(b.path, 'en'))) {
    const contents = await readFile(source.path, 'utf8');
    const observed = templateEvidence(contents, knownTags);
    const localComponents = observed.templateTags.filter(tag => !tag.startsWith(FRAMEWORK_PREFIX));
    const frameworkOutlets = observed.templateTags
      .filter(tag => tag.startsWith(FRAMEWORK_PREFIX))
      .map(tag => tag.slice(FRAMEWORK_PREFIX.length));
    owners.push({
      source: slash(relative(root, source.path)), kind: source.kind, localComponents,
      frameworkOutlets, slotOutlets: observed.slotOutlets,
      slotProviders: observed.slotProviders, dynamicComponentSites: observed.dynamicComponentSites,
      staticVueImports: await resolveStaticImports(contents, source.path, root),
    });
  }
  return {
    kind: 'ui6-route-composition-observation',
    sourceScope: 'app.vue, layouts/**/*.vue, pages/**/*.vue (source syntax only)',
    compositionObservationStatus: 'lexical-partial',
    normativeClassification: 'not-run',
    normativeDependencyRules: 'not-run',
    domContract: 'not-run',
    runtimeResolution: 'not-run',
    componentCount: graph.componentCount,
    sourceCount: owners.length,
    pageCount: owners.filter(owner => owner.kind === 'page').length,
    layoutCount: owners.filter(owner => owner.kind === 'layout').length,
    owners,
    limitations: [
      'only known same-directory component names are matched in page templates',
      'Nuxt router/layout outlets and component :is targets are not runtime-resolved',
      'slot outlets/providers are lexical sites, not verified DOM projections',
      'static imports are limited to line-start .vue import statements',
      'source edges and UI6 roles do not establish normative allowed dependencies',
    ],
  };
}

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
  const at = process.argv.indexOf('--app-root');
  if (at >= 0 && !process.argv[at + 1]) throw new Error('--app-root needs a directory');
  const root = at < 0 ? 'apps/web/app' : process.argv[at + 1];
  const result = await inspectAppRouteComposition(root);
  process.stdout.write(JSON.stringify(result, null, 2) + '\n');
}
