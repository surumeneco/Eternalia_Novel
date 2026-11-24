import { selectUiLanguage } from './ui-language.mjs';
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

test('CM-09: author-only home and area creation paths use validated canonical creation and edit routes',
  {timeout:120_000},async()=>{
  assert.ok(base?.startsWith('http://127.0.0.1:'));
  const browser=await chromium.launch({headless:true});
  try{
    const anonymous=await browser.newContext();
    const anon=await anonymous.newPage();
    await anon.goto(base+'/');
    await anon.locator('main').getByRole('heading',{name:'公開シリーズ'}).waitFor();
    assert.equal(await anon.getByRole('link',{name:'新規シリーズ'}).count(),0);
    await anon.goto(base+'/stories');
    await anon.getByRole('heading',{name:'ストーリー'}).waitFor();
    assert.equal(await anon.getByRole('link',{name:'新規シリーズ'}).count(),0);
    assert.equal(await anon.getByRole('link',{name:types.stories.label}).count(),0);
    await anon.goto(base+'/admin/series/create');
    await anon.getByText('編集するには、許可された作者のDiscordアカウントで認証してください。',{exact:false}).waitFor();
    assert.equal(await anon.locator('form.create-form').count(),0);
    await anonymous.close();

    const context=await browser.newContext({viewport:{width:390,height:844}});
    await context.addCookies([{name:'eternalia_author',value:fixture.authorToken,url:base,httpOnly:true,sameSite:'Lax'}]);
    const page=await context.newPage();
    await page.goto(base+'/');
    const seriesCreate=page.getByRole('link',{name:'新規シリーズ'});
    await seriesCreate.waitFor();
    assert.equal(await seriesCreate.getAttribute('href'),'/admin/series/create');
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
    await page.waitForURL(url=>url.pathname==='/admin/series/'+created.id+'/edit');
    assert.equal(new URL(page.url()).pathname,'/admin/series/'+created.id+'/edit',
      'successful deep link creation should navigate to the created node');

    for(const [area,expected] of Object.entries(types)){
      await page.goto(base+'/'+area);
      await page.getByRole('heading',{name:area==='stories'?'ストーリー':
        area==='tips'?'設定集':area==='dictionaries'?'辞書':'年表'}).waitFor();
      const link=page.locator('.reader-list li').filter({has:page.getByRole('link',{name:fixture.prefix+'-world-A'})})
        .getByRole('link',{name:expected.label});
      await link.waitFor();
      const href=await link.getAttribute('href');
      assert.equal(new URL(href,base).pathname,'/admin/series/'+fixture.seriesA+'/create/'+expected.kind+'/'+fixture.seriesA,area);
      await link.click();
      await page.getByRole('heading',{name:'項目を追加'}).waitFor();
      assert.equal(await page.locator('form.create-form select').inputValue(),expected.kind,area);
      if(area==='stories'){
        const newArc=fixture.prefix+'-created-from-collection';
        await page.locator('form.create-form input[maxlength="150"]').fill(newArc);
        await page.getByRole('button',{name:'作成',exact:true}).click();
        await page.getByRole('heading',{name:'編：'+newArc}).waitFor();
        const item=(await list()).find(n=>n.draft.title===newArc);
        assert.ok(item);
        assert.equal(item.parentId,fixture.seriesA);
        assert.equal(item.kind,'volume');
        await page.waitForURL(url=>url.pathname==='/admin/series/'+fixture.seriesA+'/stories/volumes/'+item.id+'/edit');
      }
    }
    await page.goto(base+'/admin/series/'+fixture.seriesA+'/create/chapter/'+fixture.seriesA);
    await page.getByText('新規作成の対象または種類が正しくありません。').waitFor();
    assert.equal(await page.locator('form.create-form').count(),0);
    await page.goto(base+'/admin/series/'+fixture.seriesA+'/create/tip/nonexistent');
    await page.getByText('新規作成の対象または種類が正しくありません。').waitFor();
    assert.equal(await page.locator('form.create-form').count(),0);

    await page.goto(base+'/admin/series/'+fixture.seriesA+'/create/word/'+fixture.languageB);
    await page.getByText('新規作成の対象または種類が正しくありません。').waitFor();
    assert.equal(await page.locator('form.create-form').count(),0,'foreign series parent refused');
    await page.goto(base+'/admin/series/'+fixture.seriesA+'/dictionaries/words');
    const wordLink=page.locator('.grid-create a[href="/admin/series/'+fixture.seriesA+'/create/word/'+fixture.language+'"]');
    await wordLink.click();
    const createForm=page.locator('form.create-form');
    await createForm.waitFor();
    assert.equal(await createForm.locator('select').first().inputValue(),'word');
    assert.equal(await createForm.locator('select').first().isDisabled(),true);
    await createForm.locator('input[maxlength="150"]').fill(fixture.prefix+'-canonical-new-word');
    await createForm.getByRole('button',{name:'作成',exact:true}).click();
    await page.getByRole('heading',{name:'単語：'+fixture.prefix+'-canonical-new-word'}).waitFor();
    const createdWord=(await list()).find(n=>n.draft.title===fixture.prefix+'-canonical-new-word');
    assert.ok(createdWord);
    assert.equal(createdWord.parentId,fixture.language);
    await page.waitForURL(url=>url.pathname==='/admin/series/'+fixture.seriesA+'/dictionaries/words/'+createdWord.id+'/edit');
    assert.equal((await context.request.get(base+'/api/public/items/'+createdWord.id)).status(),404);
    await page.goto(base+'/stories');
    await page.getByRole('link',{name:types.stories.label}).first().waitFor();
    await selectUiLanguage(page, 'en');
    await page.getByRole('link',{name:'Create a new arc in this series'}).first().waitFor();
    await page.getByRole('link',{name:fixture.prefix+'-world-A'}).waitFor();
    await context.close();
  }finally{await browser.close()}
});
