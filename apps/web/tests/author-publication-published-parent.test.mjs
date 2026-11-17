/** MOVE-07: execute the confirmed CAT vectors against the actual publication SFC observer. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createDriver } from './generated/cat_move07_driver.mjs';
const root = new URL('../../../Lifecycle/Works/New/eternalia.publication.author-status-on-tip-move/.cat-flow/generated/',import.meta.url);
const model = JSON.parse(await readFile(new URL('model.json',root),'utf8'));
const vectors = JSON.parse(await readFile(new URL('vectors.json',root),'utf8'));
assert.equal(model.status,'confirmed');
assert.equal(vectors.process,model.process);
assert.equal(vectors.selection_rule,'rule-witness/v1');

for(const vector of vectors.cases){
  test('MOVE-07 normative '+vector.id,async()=>{
    const rule=model.rules.find(item=>item.id===vector.id.slice('case.'.length));
    assert.ok(rule,'CAT source rule exists');
    const effects=rule.allowed[0].write.filter(x=>x.target==='出力.実効公開可');
    assert.equal(effects.length,1);
    const driver=createDriver();
    await driver.prepare(vector.state,vector.input);
    const result=await driver.trigger(vector.trigger,vector.input);
    assert.deepEqual(result,{'出力.実効公開可':effects[0].expr.literal});
  });
}
