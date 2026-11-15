/** Deterministic observed Vue SFC component graph. UI6 categories are NOT assigned here. */
import { readdir, readFile } from 'node:fs/promises';
import { basename, join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const scriptBlocks = /<script\b[^>]*>([\s\S]*?)<\/script\s*>/gi;
const staticVueImport = /^[ \t]*import\s+(?:[A-Za-z_$][\w$]*|\{[^}]*\}|\*\s+as\s+[A-Za-z_$][\w$]*)\s+from\s+['"]([^'"]+\.vue)['"]/gm;

/** Template-only observation: nested <template> blocks remain in the slice.
 * This is a bounded lexical scan, not a Vue compiler or a DOM verifier.
 */
function observedTemplate(source) {
  const outsideScripts = source.replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1\s*>/gi, '');
  const withoutComments = outsideScripts.replace(/<!--[\s\S]*?-->/g, '');
  const opening = /<template\b[^>]*>/i.exec(withoutComments);
  if (!opening) return '';
  const end = withoutComments.lastIndexOf('</template>');
  return end > opening.index ? withoutComments.slice(opening.index + opening[0].length, end) : '';
}

/** Bounded lexical evidence: tags and imports are separate from slot/dynamic sites.
 * Slot outlets/assignments do NOT prove a rendered parent-child DOM edge.
 * :is expressions are never resolved to guessed component dependencies.
 */
function templateEvidence(source, knownTags) {
  const markup = observedTemplate(source);
  const templateTags = new Set();
  const slotOutlets = [];
  const slotProviders = [];
  const dynamicComponentSites = [];
  for (let i = 0; i < markup.length; i++) {
    if (markup.startsWith('{{', i)) {
      const end = markup.indexOf('}}', i + 2);
      if (end >= 0) { i = end + 1; continue; }
    }
    if (markup[i] !== '<') continue;
    const tag = /^<([A-Za-z][A-Za-z0-9-]*)\b/.exec(markup.slice(i));
    if (!tag) continue;
    const tagName = tag[1];
    const ref = knownTags.get(tagName);
    if (ref) templateTags.add(ref);

    // Attribute values can contain fake markup, slot keywords or :is strings.
    let quote = '';
    let end = i + tag[0].length;
    for (; end < markup.length; end++) {
      const ch = markup[end];
      if (quote) {
        if (ch === quote && markup[end - 1] !== '\\') quote = '';
      } else if (ch === '"' || ch === "'") quote = ch;
      else if (ch === '>') break;
    }
    const openingTag = markup.slice(i, Math.min(end + 1, markup.length));
    // Preserve attribute *names* and = signs; omit quoted attribute *values*.
    const attributes = openingTag.replace(/(["'])(?:\\.|(?!\1)[\s\S])*?\1/g, '""');
    if (tagName === 'slot') {
      if (/\s(?::name|v-bind:name)\s*=/.test(attributes)) slotOutlets.push('[dynamic]');
      else slotOutlets.push(/\sname\s*=\s*(["'])([^"']+)\1/.exec(openingTag)?.[2] ?? 'default');
    }
    for (const match of attributes.matchAll(/(?:^|\s)(?:#([\w-]+)|v-slot(?::([\w-]+))?)(?=\s|=|\/?\>)/g)) {
      slotProviders.push(match[1] ?? match[2] ?? 'default');
    }
    if (['component', 'Component', 'NuxtDynamicComponent'].includes(tagName) &&
        /\s(?::is|v-bind:is)\s*=/.test(attributes)) dynamicComponentSites.push(tagName);
    i = end;
  }
  return {
    templateTags: [...templateTags].sort(),
    slotOutlets: slotOutlets.sort(), slotProviders: slotProviders.sort(),
    dynamicComponentSites: dynamicComponentSites.sort(),
  };
}

function staticImportDependencies(source, knownNames) {
  const result = new Set();
  for (const script of source.matchAll(scriptBlocks)) {
    const withoutComments = script[1]
      .replace(/\/\*[\s\S]*?\*\//g, '\n')
      .replace(/^[ \t]*\/\/.*$/gm, '');
    for (const match of withoutComments.matchAll(staticVueImport)) {
      const target = basename(match[1], '.vue');
      // This inventory only observes SFCs directly in the scanned directory.
      if (match[1] === './' + target + '.vue' && knownNames.has(target)) result.add(target);
    }
  }
  return result;
}

/** Only concrete *.vue SFCs in this directory are inventory nodes. */
export async function inspectComponentDirectory(directory) {
  const names = (await readdir(directory)).filter(name => name.endsWith('.vue')).sort();
  const known = new Set(names.map(name => basename(name, '.vue')));
  if (known.size !== names.length) throw new Error('duplicate component name');
  const knownTags = new Map();
  for (const name of known) {
    knownTags.set(name, name);
    const kebab = name.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
    if (knownTags.has(kebab) && knownTags.get(kebab) !== name)
      throw new Error('ambiguous kebab-case component: ' + kebab);
    knownTags.set(kebab, name);
  }
  const components = [];
  const compositionEvidence = [];
  for (const fileName of names) {
    const name = basename(fileName, '.vue');
    const content = await readFile(join(directory, fileName), 'utf8');
    const template = templateEvidence(content, knownTags);
    const staticImports = [...staticImportDependencies(content, known)].sort();
    const references = new Set([...template.templateTags, ...staticImports]);
    // Keep the legacy dependency graph and cycle detector unchanged. The
    // separate evidence must not be mistaken for UI6 normative conformance.
    components.push({ name, dependsOn: [...references].sort() });
    compositionEvidence.push({ name, templateTags: template.templateTags, staticImports,
      slotOutlets: template.slotOutlets, slotProviders: template.slotProviders,
      dynamicComponentSites: template.dynamicComponentSites });
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
  return { componentCount: components.length, components, compositionEvidence, cycles, classificationStatus: 'undecided',
    limitations: ['same-directory PascalCase/kebab-case template tags and line-start static .vue imports only', 'lexical slot/v-slot and :is sites do not prove slot rendering or resolve targets', 'no complete Vue/JS parsing, DOM or cross-directory dependency verification'] };
}

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
  const rootIndex = process.argv.indexOf('--root');
  const directory = resolve(rootIndex < 0 ? 'apps/web/app/components' : process.argv[rootIndex + 1]);
  const result = await inspectComponentDirectory(directory);
  process.stdout.write(JSON.stringify({ directory, ...result }, null, 2) + '\n');
  if (process.argv.includes('--assert-acyclic') && result.cycles.length) process.exitCode = 1;
}
