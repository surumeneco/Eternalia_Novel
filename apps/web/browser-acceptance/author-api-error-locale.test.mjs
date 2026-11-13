/** AC-59: real author conflict must be expressed in the selected UI language. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { chromium } from 'playwright';

const fixture=JSON.parse(await readFile(process.env.HTTP_FIXTURE_FILE,'utf8'));
const base=process.env.HTTP_BASE_URL;

test('ERROR-01/02/04: stale revision in Studio is English or Japanese without losing draft input',
 {timeout:90_000},async()=>{
  assert.ok(base?.startsWith('http://127.0.0.1:'));
  const browser=await chromium.launch({headless:true});
  try {
    const context=await browser.newContext();
    await context.addCookies([{name:'eternalia_author',value:fixture.authorToken,url:base,httpOnly:true,sameSite:'Lax'}]);
    const page=await context.newPage();
    await page.goto(base+'/studio?item='+fixture.tip);
    const title=fixture.prefix+'-visible-setting';
    await page.getByRole('heading',{name:'設定：'+title}).waitFor();
    await page.getByRole('button',{name:'英語に切り替え'}).click();
    await page.getByRole('button',{name:'Switch to Japanese'}).waitFor();
    const input=page.getByRole('textbox',{name:'Name or heading'});
    await input.fill(title+'-unsaved-local');

    const nodes=await(await context.request.get(base+'/api/admin/nodes')).json();
    const previous=nodes.find(n=>n.id===fixture.tip);
    assert.ok(previous);
    const concurrent=await context.request.patch(base+'/api/admin/nodes/'+fixture.tip,{
      headers:{Origin:base},data:{expectedRevision:previous.revision,content:previous.draft},
    });
    assert.equal(concurrent.status(),200,await concurrent.text());

    await page.getByRole('button',{name:'Save draft'}).click();
    await page.getByRole('alert').getByText('Another edit has changed this item.',{exact:false}).waitFor();
    assert.equal(await input.inputValue(),title+'-unsaved-local');

    await page.getByRole('button',{name:'Switch to Japanese'}).click();
    await page.getByRole('button',{name:'英語に切り替え'}).waitFor();
    await page.getByRole('button',{name:'下書きを保存'}).click();
    await page.getByRole('alert').getByText('変更が競合しています。',{exact:false}).waitFor();
    assert.equal(await page.getByRole('textbox',{name:'名称・見出し'}).inputValue(),title+'-unsaved-local');
    const latest=await(await context.request.get(base+'/api/admin/nodes')).json();
    const node=latest.find(n=>n.id===fixture.tip);
    assert.equal(node.revision,previous.revision+1,'failed attempts must not mutate server draft');
    await context.close();
  }finally{await browser.close()}
});
