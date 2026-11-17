/** MOVE-07: actual Nuxt author publication status versus anonymous Nest projection. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { chromium } from 'playwright';

const fixture=JSON.parse(await readFile(process.env.HTTP_FIXTURE_FILE,'utf8'));
const base=process.env.HTTP_BASE_URL;

test('MOVE-07: published ancestor, not moved draft ancestor, governs author visibility/status/filter', {timeout:90_000}, async()=>{
  assert.ok(base?.startsWith('http://127.0.0.1:'));
  const browser=await chromium.launch({headless:true});
  try {
    const author=await browser.newContext();
    await author.addCookies([{name:'eternalia_author',value:fixture.authorToken,url:base,httpOnly:true,sameSite:'Lax'}]);
    const anonymous=await browser.newContext();
    const prefix=fixture.prefix+'-move07';
    async function nodes(){
      const response=await author.request.get(base+'/api/admin/nodes');
      assert.equal(response.status(),200,await response.text());
      return response.json();
    }
    async function make(kind,parentId,title){
      const response=await author.request.post(base+'/api/admin/nodes',{
        headers:{Origin:base},data:{kind,parentId,content:{title,body:title,details:{}}}});
      assert.equal(response.status(),201,await response.text());
      return (await response.json()).id;
    }
    async function update(id,operation,fields={}){
      const record=(await nodes()).find(item=>item.id===id);
      assert.ok(record,'author record exists');
      const response=await author.request.post(base+'/api/admin/nodes/'+id+'/'+operation,{
        headers:{Origin:base},data:{expectedRevision:record.revision,...fields}});
      assert.equal(response.status(),200,await response.text());
    }
    const series=await make('series',null,prefix+'-series');
    const oldCategory=await make('category',series,prefix+'-A');
    const newCategory=await make('category',series,prefix+'-B');
    const tip=await make('tip',oldCategory,prefix+'-tip');
    for(const id of [series,oldCategory,newCategory,tip])await update(id,'publish');
    // Public A -> private B. A moved Tip keeps its published parent A.
    await update(newCategory,'visibility',{isPublic:false,publicSince:null});
    await update(tip,'move-category',{targetCategoryId:newCategory});
    const item=(await nodes()).find(node=>node.id===tip);
    assert.equal(item.parentId,newCategory);
    assert.equal(item.published.parentId,oldCategory);
    const read=()=>anonymous.request.get(base+'/api/public/items/'+tip);
    const page=await author.newPage();
    const visibility=page.getByRole('combobox',{name:'公開状態'});
    const row=page.locator('.publication-list li').filter({has:page.getByRole('heading',{name:prefix+'-tip'})});
    async function inspect(visible,statusText){
      await page.goto(base+'/studio/publication');
      await page.getByRole('heading',{name:prefix+'-tip'}).waitFor();
      assert.equal((await read()).status(),visible?200:404);
      await row.getByText(statusText,{exact:false}).first().waitFor();
      // Path title is deliberately draft-based: the author is editing in B.
      assert.match(await row.locator('.publication-path').textContent(),new RegExp(prefix+'-B'));
      await visibility.selectOption(visible?'visible':'hidden');
      assert.equal(await row.count(),1);
      await visibility.selectOption(visible?'hidden':'visible');
      assert.equal(await row.count(),0);
    }
    await inspect(true,'閲覧可能');
    // Private A -> public B. The old published-parent visibility still wins.
    await update(oldCategory,'visibility',{isPublic:false,publicSince:null});
    await update(newCategory,'visibility',{isPublic:true,publicSince:Date.now()-3000});
    await inspect(false,'親による非公開');
    // Only explicit publish moves the reader snapshot to B.
    await update(tip,'publish');
    const after=(await nodes()).find(node=>node.id===tip);
    assert.equal(after.published.parentId,newCategory);
    await inspect(true,'閲覧可能');
    await page.close();
  } finally {await browser.close();}
});
