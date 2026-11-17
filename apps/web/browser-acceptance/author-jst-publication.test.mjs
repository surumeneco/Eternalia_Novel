/** PB-05 / AC-45 / AC-54: JST author schedule independent of browser timezone. */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { chromium } from 'playwright';

const fixture=JSON.parse(await readFile(process.env.HTTP_FIXTURE_FILE,'utf8'));
const base=process.env.HTTP_BASE_URL;
const title=fixture.prefix+'-scheduled-secret';
test('PB-05: LA/UTC browsers input JST in the publication screen across author time zones and persist the same absolute instant',
 {timeout:90_000}, async()=>{
  assert.ok(base?.startsWith('http://127.0.0.1:'));
  const browser=await chromium.launch({headless:true});
  try{
    const author=await browser.newContext({timezoneId:'America/Los_Angeles'});
    await author.addCookies([{name:'eternalia_author',value:fixture.authorToken,url:base,httpOnly:true,sameSite:'Lax'}]);
    const management=await author.newPage();
    await management.goto(base+'/studio/publication?series='+fixture.seriesA);
    await management.getByLabel('シリーズを選択').selectOption(fixture.seriesA);
    await management.getByLabel('領域').selectOption('stories');
    const row=management.locator('.publication-row').filter({
      has:management.getByRole('heading',{name:title,exact:true}),
    });
    await row.locator('input[type="datetime-local"]').waitFor();
    assert.ok((await row.innerText()).includes('JST'));
    await row.locator('input[type="datetime-local"]').fill('2031-02-03T09:15');
    await row.getByRole('button',{name:'日時を保存'}).click();
    await management.getByText('公開開始日時を更新しました。').waitFor();
    const fetchNode=async()=>{
      const result=await author.request.get(base+'/api/admin/nodes');
      assert.equal(result.status(),200);
      return (await result.json()).find(n=>n.id===fixture.scheduled);
    };
    assert.equal((await fetchNode()).publicSince,Date.parse('2031-02-03T00:15:00Z'));
    assert.equal((await author.request.get(base+'/api/public/items/'+fixture.scheduled)).status(),404);
    await management.reload();
    await management.getByLabel('シリーズを選択').selectOption(fixture.seriesA);
    await management.getByLabel('領域').selectOption('stories');
    await row.locator('input[type="datetime-local"]').waitFor();
    assert.equal(await row.locator('input[type="datetime-local"]').inputValue(),'2031-02-03T09:15');

    const studio=await author.newPage();
    await studio.goto(base+'/studio?item='+fixture.scheduled);
    await studio.getByRole('heading',{name:'章：'+title}).waitFor();
    assert.equal(await studio.locator('input[type="datetime-local"]').count(),0,
      'date management belongs to the publication screen, not the manuscript editor');
    await row.locator('input[type="datetime-local"]').fill('2032-03-04T21:30');
    await row.getByRole('button',{name:'日時を保存'}).click();
    await management.getByText('公開開始日時を更新しました。').waitFor();
    assert.equal((await fetchNode()).publicSince,Date.parse('2032-03-04T12:30:00Z'));
    assert.equal((await author.request.get(base+'/api/public/items/'+fixture.scheduled)).status(),404);
    await author.close();

    const utcAuthor=await browser.newContext({timezoneId:'UTC'});
    await utcAuthor.addCookies([{name:'eternalia_author',value:fixture.authorToken,url:base,httpOnly:true,sameSite:'Lax'}]);
    const utcManagement=await utcAuthor.newPage();
    await utcManagement.goto(base+'/studio/publication?series='+fixture.seriesA);
    await utcManagement.getByLabel('シリーズを選択').selectOption(fixture.seriesA);
    await utcManagement.getByLabel('領域').selectOption('stories');
    const utcRow=utcManagement.locator('.publication-row').filter({
      has:utcManagement.getByRole('heading',{name:title,exact:true}),
    });
    await utcRow.locator('input[type="datetime-local"]').waitFor();
    assert.equal(await utcRow.locator('input[type="datetime-local"]').inputValue(),'2032-03-04T21:30',
      'JST editor values must not change with OS/browser timezone');
    await utcAuthor.close();
  }finally{await browser.close()}
});
