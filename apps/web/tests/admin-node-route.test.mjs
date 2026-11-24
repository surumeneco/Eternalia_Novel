import test from 'node:test';
import assert from 'node:assert/strict';
import { adminCreatePath,adminEditPath,adminGridPath,canonicalCreateAdmission } from '../app/utils/admin-node-route.ts';

test('canonical author route projection covers every material kind',()=>{
  const paths={volume:'stories/volumes',part:'stories/parts',chapter:'stories/chapters',
    category:'settings/categories',tip:'settings/tips',tipSection:'settings/sections',
    language:'dictionaries/languages',word:'dictionaries/words',grammar:'dictionaries/grammar',
    periodization:'timeline/periods',event:'timeline/events'};
  assert.equal(adminCreatePath(null,'series',null),'/admin/series/create');
  assert.equal(adminEditPath('s','series','s'),'/admin/series/s/edit');
  for(const [kind,group] of Object.entries(paths)){
    assert.equal(adminGridPath('s',kind),'/admin/series/s/'+group);
    assert.equal(adminEditPath('s',kind,'id'),'/admin/series/s/'+group+'/id/edit');
    assert.equal(adminCreatePath('s',kind,'parent'),'/admin/series/s/create/'+kind+'/parent');
    assert.throws(()=>adminCreatePath('s',kind,null));
  }
});
test('bounded canonical creation admission has no authorization or parent bypass',()=>{
  for(const author of [false,true])for(const scope of ['root','child'])
    for(const parent of ['none','same','invalid'])for(const matches of [false,true]){
      const expected=author===true&&matches===true&&((scope==='root'&&parent==='none')||(scope==='child'&&parent==='same'));
      assert.equal(canonicalCreateAdmission(author,scope,parent,matches),expected,JSON.stringify({author,scope,parent,matches}));
    }
});
