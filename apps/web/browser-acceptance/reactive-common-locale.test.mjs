/** CM-08 / AC-59,66,75: live ja/en across writer labels, dictionaries and dates. */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { chromium } from 'playwright';

const fixture=JSON.parse(await readFile(process.env.HTTP_FIXTURE_FILE,'utf8'));
const base=process.env.HTTP_BASE_URL;

test('LABEL-01/02/03/04: writer filter/kind labels and public fixed dates follow UI language without changing drafts',
 {timeout:90_000},async()=>{
  assert.ok(base?.startsWith('http://127.0.0.1:'));
  const browser=await chromium.launch({headless:true});
  try {
    const context=await browser.newContext({viewport:{width:390,height:844}});
    await context.addCookies([{name:'eternalia_author',value:fixture.authorToken,url:base,httpOnly:true,sameSite:'Lax'}]);
    const page=await context.newPage();
    const title=fixture.prefix+'-visible-setting';
    await page.goto(base+'/studio?item='+fixture.tip);
    await page.getByRole('heading',{name:'設定：'+title}).waitFor();
    await page.getByRole('button',{name:'設定集'}).waitFor();
    const input=page.getByRole('textbox',{name:'名称・見出し'});
    await input.fill(title+'-local-unsaved');
    await page.getByRole('button',{name:'英語に切り替え'}).click();
    await page.getByRole('button',{name:'Worldbuilding'}).waitFor();
    await page.getByRole('heading',{name:'Setting：'+title}).waitFor();
    assert.equal(await page.getByRole('textbox',{name:'Name or heading'}).inputValue(),
      title+'-local-unsaved','language switch must preserve unsaved author input');
    await page.getByRole('button',{name:'Switch to Japanese'}).click();
    await page.getByRole('heading',{name:'設定：'+title}).waitFor();
    assert.equal(await input.inputValue(),title+'-local-unsaved');

    // Do not navigate away without dismissing the intentional unsaved buffer.
    page.once('dialog',dialog=>dialog.accept());
    await page.goto(base+'/dictionaries');
    await page.getByRole('heading',{name:'辞書',exact:true}).waitFor();
    await page.getByText('シリーズの創作言語、単語、文法を閲覧します。').waitFor();
    await page.getByRole('button',{name:'英語に切り替え'}).click();
    await page.getByRole('heading',{name:'Dictionary',exact:true}).waitFor();
    await page.getByText('Browse the languages, vocabulary and grammar of each series.').waitFor();
    assert.ok((await page.locator('main').innerText()).includes(fixture.prefix+'-world-A'),
      'authored series title remains untranslated');

    await page.goto(base+'/');
    await page.getByRole('heading',{name:'Recent updates'}).waitFor();
    const recentDate=page.locator('ol.reader-list time').first();
    await recentDate.waitFor();
    const iso=await recentDate.getAttribute('datetime');
    const en=await recentDate.innerText();
    assert.ok(en.includes('2026')||en.includes('2027')||en.includes('2031'),
      'published timestamp should include a year');
    await page.getByRole('button',{name:'Switch to Japanese'}).click();
    await page.getByRole('button',{name:'英語に切り替え'}).waitFor();
    assert.equal(await recentDate.getAttribute('datetime'),iso);
    const ja=await recentDate.innerText();
    assert.notEqual(ja,en,'locale formatting should be reactive');
    const instant=Date.parse(iso);
    assert.equal(new Intl.DateTimeFormat('ja-JP',{timeZone:'Asia/Tokyo',year:'numeric',month:'numeric',day:'numeric'}).format(new Date(instant)).replace(/\D/g,''),
      ja.replace(/\D/g,'').slice(0,8),
      'publication date must show JST calendar day');
    await context.close();
  } finally {await browser.close()}
});
