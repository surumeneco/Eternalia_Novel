/** CM-09 / AC-66: author-only new item paths from home/section listings. */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { chromium } from 'playwright';

const fixture=JSON.parse(await readFile(process.env.HTTP_FIXTURE_FILE,'utf8'));
const base=process.env.HTTP_BASE_URL;
const types={
  stories:{kind:'volume',label:'このシリーズに新しい編を作成'},
  tips:{kind:'category',label:'このシリーズに新しいカテゴリを作成'},
  dictionaries:{kind:'language',label:'このシリーズに新しい言語を作成'},
  timeline:{kind:'periodization',label:'このシリーズに新しい年代区分を作成'},
};

test('CM-09: author-only home and area creation paths use validated existing Studio editor',
  {timeout:120_000},async()=>{
  assert.ok(base?.startsWith('http://127.0.0.1:'));
  const browser=await chromium.launch({headless:true});
  try{
    const anonymous=await browser.newContext();
    const anon=await anonymous.newPage();
    await anon.goto(base+'/');
    await anon.getByRole('heading',{name:'公開シリーズ'}).waitFor();
    assert.equal(await anon.getByRole('link',{name:'新規シリーズ'}).count(),0);
    await anon.goto(base+'/stories');
    await anon.getByRole('heading',{name:'ストーリー'}).waitFor();
    assert.equal(await anon.getByRole('link',{name:'新規シリーズ'}).count(),0);
    assert.equal(await anon.getByRole('link',{name:types.stories.label}).count(),0);
    await anon.goto(base+'/studio?create=series');
    await anon.getByText('作者としてログインしてください。',{exact:false}).waitFor();
    assert.equal(await anon.locator('form.create-form').count(),0);
    await anonymous.close();

    const context=await browser.newContext({viewport:{width:390,height:844}});
    await context.addCookies([{name:'eternalia_author',value:fixture.authorToken,url:base,httpOnly:true,sameSite:'Lax'}]);
    const page=await context.newPage();
    await page.goto(base+'/');
    const seriesCreate=page.getByRole('link',{name:'新規シリーズ'});
    await seriesCreate.waitFor();
    assert.match(await seriesCreate.getAttribute('href'),/create=series/);
    await seriesCreate.click();
    await page.getByRole('heading',{name:'項目を追加'}).waitFor();
    assert.equal(await page.locator('form.create-form select').inputValue(),'series');
    const newSeries=fixture.prefix+'-created-from-home';
    await page.locator('form.create-form input[maxlength="150"]').fill(newSeries);
    await page.getByRole('button',{name:'作成',exact:true}).click();
    await page.getByRole('heading',{name:'シリーズ：'+newSeries}).waitFor();
    const list=async()=>{
      const response=await context.request.get(base+'/api/admin/nodes');
      assert.equal(response.status(),200);
      return response.json();
    };
    const created=(await list()).find(n=>n.draft.title===newSeries);
    assert.ok(created);
    assert.equal(created.kind,'series');
    assert.equal(created.parentId,null);
    assert.equal(new URL(page.url()).searchParams.get('item'),created.id,
      'successful deep link creation should navigate to the created node');

    for(const [area,expected] of Object.entries(types)){
      await page.goto(base+'/'+area);
      await page.getByRole('heading',{name:area==='stories'?'ストーリー':
        area==='tips'?'設定集':area==='dictionaries'?'辞書':'年表'}).waitFor();
      const link=page.getByRole('link',{name:expected.label}).first();
      await link.waitFor();
      const href=await link.getAttribute('href');
      const params=new URL(href,base).searchParams;
      assert.equal(params.get('create'),expected.kind,area);
      assert.equal(params.get('parent'),fixture.seriesA,area);
      await link.click();
      await page.getByRole('heading',{name:'項目を追加'}).waitFor();
      assert.equal(await page.locator('form.create-form select').inputValue(),expected.kind,area);
      if(area==='stories'){
        const newArc=fixture.prefix+'-created-from-collection';
        await page.locator('form.create-form input[maxlength="150"]').fill(newArc);
        await page.getByRole('button',{name:'作成',exact:true}).click();
        const item=(await list()).find(n=>n.draft.title===newArc);
        assert.ok(item);
        assert.equal(item.parentId,fixture.seriesA);
        assert.equal(item.kind,'volume');
      }
    }
    await page.goto(base+'/studio?create=chapter&parent='+fixture.seriesA);
    await page.getByText('新規作成の対象または種類が正しくありません。').waitFor();
    assert.equal(await page.locator('form.create-form').count(),0);
    await page.goto(base+'/studio?create=tip&parent=nonexistent');
    await page.getByText('新規作成の対象または種類が正しくありません。').waitFor();
    assert.equal(await page.locator('form.create-form').count(),0);

    await page.goto(base+'/stories');
    await page.getByRole('link',{name:types.stories.label}).first().waitFor();
    await page.getByRole('button',{name:'英語に切り替え'}).click();
    await page.getByRole('link',{name:'Create a new arc in this series'}).first().waitFor();
    await page.getByRole('link',{name:newSeries}).waitFor();
    await context.close();
  }finally{await browser.close()}
});
