/**
 * CAT driver for the author-publication observer. The SFC segment is the
 * actual production implementation; a virtual library isolates domain inputs.
 * No expected result is copied from implementation into this driver.
 */
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { resolve, dirname } from 'node:path';
import { canReadPublished } from '../../../../packages/contracts/dist/publication.js';
const require = createRequire(import.meta.url);
const ts = require('typescript');
const here = dirname(fileURLToPath(import.meta.url));
const component = resolve(here, '../../app/pages/studio/publication.vue');
const source = readFileSync(component, 'utf8');
const start = source.indexOf('const byId = computed(');
const end = source.indexOf('const filtered = computed(');
if (start < 0 || end < start) throw new Error('CAT driver: publication observer missing from SFC');
const snippet = source.slice(start, end);
if (!snippet.includes('function published(') || !snippet.includes('function status(')) {
  throw new Error('CAT driver: public status observer not found');
}
const transpiled = ts.transpileModule(snippet, {
  compilerOptions: {target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.None},
}).outputText;
const buildObserver = new Function('nodes', 'computed', 'canReadPublished', 't', 'Date',
  transpiled + '\nreturn {published,status};');
const now = Date.UTC(2026, 10, 17, 6, 0, 0);
const computed = fn => ({get value() { return fn(); }});
const pub = (parentId = null) => ({parentId, value:{title:'snapshot',body:'',details:{}},sourceRevision:1,publishedAt:now-1000});

export function createDriver() {
  let input;
  return {
    async prepare(_pre, nextInput) { input = nextInput; },
    async observeState() { return {}; },
    async trigger(name, overrideInput) {
      if (name !== '公開状態照会') throw new Error('Unexpected CAT trigger: ' + name);
      const inData = overrideInput ?? input;
      const snapshot = inData['入力.公開版あり'];
      const selfVisible = inData['入力.自身の公開条件成立'];
      const publishedAncestorVisible = inData['入力.公開祖先の公開条件成立'];
      const draftAncestorVisible = inData['入力.下書き祖先の公開条件成立'];
      const series = {id:'series',parentId:null,isPublic:true,publicSince:now-2000,published:pub(null)};
      const oldCategory = {id:'old',parentId:'series',isPublic:publishedAncestorVisible,
        publicSince:now-2000,published:pub('series')};
      const draftCategory = {id:'new',parentId:'series',isPublic:draftAncestorVisible,
        publicSince:now-2000,published:pub('series')};
      const tip = {id:'tip',parentId:'new',isPublic:selfVisible,publicSince:now-2000,
        published:snapshot ? pub('old') : null};
      const nodes = {value:[series,oldCategory,draftCategory,tip]};
      const clock = { now: () => now };
      const current = buildObserver(nodes, computed, canReadPublished, id=>id, clock);
      return {'出力.実効公開可':current.published(tip)};
    },
  };
}
