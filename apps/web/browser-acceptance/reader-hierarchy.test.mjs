/** W03 / AC-79,80,82,92,95: exploratory verification.
 * Runs against a fresh disposable HTTP acceptance fixture; creates isolated test series only.
 * This is not a generated CAT Gate or manual acceptance.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { chromium } from 'playwright';

assert.equal(process.env.HTTP_ACCEPTANCE_DISPOSABLE_DB, '1');
assert.notEqual(process.env.NODE_ENV, 'production');
const fixture = JSON.parse(await readFile(process.env.HTTP_FIXTURE_FILE, 'utf8'));
const base = process.env.HTTP_BASE_URL;
assert.match(base ?? '', /^http:\/\/127\.0\.0\.1:\d+$/);
const root = '/series/' + fixture.seriesA;
const foreign = '/series/' + fixture.seriesB;
const story = root + '/stories';
const volume = story + '/' + fixture.volume;
const part = volume + '/parts/' + fixture.part;
const chapter = part + '/chapters/' + fixture.chapter;
const settings = root + '/settings';
const category = settings + '/' + fixture.category;
const tip = category + '/' + fixture.tip;
const dictionaries = root + '/dictionaries';
const language = dictionaries + '/' + fixture.language;
const timeline = root + '/timeline';
const period = timeline + '/periods/' + fixture.period;
const event = period + '/events/' + fixture.event;

async function withReader(run) {
  const browser = await chromium.launch({headless: true});
  try {
    const page = await browser.newPage();
    await page.goto(base + '/');
    await page.locator('main a[href="' + root + '"]').first().waitFor();
    await page.waitForFunction(() => Boolean(document.querySelector('#__nuxt')?.__vue_app__));
    await run(page);
  } finally { await browser.close(); }
}
async function clickPath(page, path, title) {
  const link = page.locator('main a[href="' + path + '"]').first();
  await link.waitFor();
  await link.click();
  await page.waitForURL(url => url.pathname === path);
  if (title) await page.locator('main').getByRole('heading', {name: title, exact: true}).waitFor();
  assert.equal(await page.locator('main [role="alert"]').count(), 0, path);
}
const title = suffix => fixture.prefix + '-' + suffix;

test('AC-79/92: actual links traverse story hierarchy and exclude the scheduled chapter', {timeout: 90000}, async () => {
  await withReader(async page => {
    await clickPath(page, root, title('world-A'));
    await clickPath(page, story, 'ストーリー');
    await clickPath(page, volume, title('book-A'));
    await clickPath(page, part, title('part-A'));
    assert.equal(await page.locator('main a[href="' + part + '/chapters/' + fixture.scheduled + '"]').count(), 0);
    await clickPath(page, chapter, title('chapter-A'));
    assert.ok((await page.locator('main').innerText()).includes(title('published-body')));
    assert.ok(!(await page.locator('main').innerText()).includes(title('unpublished-draft-body')));
    const nav = page.locator('main .chapter-navigation');
    await nav.waitFor();
    assert.equal(await nav.locator('a').count(), 1, 'only the contents link, no hidden next chapter');
    assert.equal(await nav.locator('a').getAttribute('href'), story);
    await page.goBack();
    await page.waitForURL(url => url.pathname === part);
    await page.locator('main').getByRole('heading', {name: title('part-A'), exact:true}).waitFor();
  });
});

test('AC-80/95: actual links traverse settings, dictionary and timeline', {timeout: 90000}, async () => {
  await withReader(async page => {
    await clickPath(page, root, title('world-A'));
    await clickPath(page, settings, '設定集');
    assert.equal(await page.locator('main a[href="' + settings + '/' + fixture.hiddenCategory + '"]').count(), 0);
    await clickPath(page, category, title('visible-category'));
    assert.equal(await page.locator('main a[href="' + category + '/' + fixture.unpublishedTip + '"]').count(), 0);
    await clickPath(page, tip, title('visible-setting'));

    await page.goto(base + root);
    await clickPath(page, dictionaries, '辞書');
    await clickPath(page, language, title('visible-language'));
    await clickPath(page, language + '/details', title('visible-language'));
    await page.goBack();
    await page.waitForURL(url => url.pathname === language);
    await clickPath(page, language + '/words/' + fixture.word, title('visible-word'));
    await page.goBack();
    await page.waitForURL(url => url.pathname === language);
    await clickPath(page, language + '/grammar/' + fixture.grammar, title('visible-grammar'));

    await page.goto(base + root);
    await clickPath(page, timeline);
    await page.locator('main .period-filter select').selectOption(fixture.period);
    await clickPath(page, period, title('visible-period'));
    await page.goBack();
    await page.waitForURL(url => url.pathname === timeline);
    await clickPath(page, event, title('visible-event'));
  });
});

test('AC-82/95: wrong ancestor or series cannot open a canonical item and legacy area URLs redirect', {timeout: 90000}, async () => {
  await withReader(async page => {
    for (const path of [
      foreign + '/stories/' + fixture.volume,
      story + '/' + fixture.category + '/parts/' + fixture.part + '/chapters/' + fixture.chapter,
      settings + '/' + fixture.hiddenCategory + '/' + fixture.tip,
      dictionaries + '/' + fixture.languageB + '/words/' + fixture.word,
      foreign + '/timeline/periods/' + fixture.period + '/events/' + fixture.event,
      part + '/chapters/' + fixture.scheduled,
      category + '/' + fixture.unpublishedTip,
    ]) {
      await page.goto(base + path);
      await page.locator('main [role="alert"]').waitFor();
      assert.equal(await page.locator('main article').count(), 0, path);
      const body = await page.locator('main').innerText();
      for (const secret of ['published-body', 'unpublished-draft-body', 'private-content', 'visible-word-body', 'visible-event-body']) {
        assert.ok(!body.includes(title(secret)), path + ' rendered a body outside its canonical scope');
      }
    }
    for (const [legacy, canonical] of [
      ['/stories/', story], ['/tips/', settings], ['/dictionaries/', dictionaries], ['/timeline/', timeline],
    ]) {
      await page.goto(base + legacy + fixture.seriesA);
      await page.waitForURL(url => url.pathname === canonical);
    }
  });
});

/** Fresh isolated series; dispose by hiding the series, never alter the shared fixture. */
async function author(method,path,data){
  const response=await fetch(base+path,{method,headers:{Origin:base,'Content-Type':'application/json',Cookie:'eternalia_author='+fixture.authorToken},...(data===undefined?{}:{body:JSON.stringify(data)})});
  const body=await response.text();
  assert.ok(response.ok,method+' '+path+': '+response.status+' '+body);
  return JSON.parse(body);
}
async function create(kind,parentId,title,details={}){
  return (await author('POST','/api/admin/nodes',{kind,parentId,content:{title,body:'body:'+title,details}})).id;
}
async function revision(id){
  const n=(await author('GET','/api/admin/nodes')).find(n=>n.id===id);
  assert.ok(n,'missing author node '+id);
  return n.revision;
}
async function publish(id){
  await author('POST','/api/admin/nodes/'+id+'/publish',{expectedRevision:await revision(id)});
}
async function hide(id){
  await author('POST','/api/admin/nodes/'+id+'/visibility',{expectedRevision:await revision(id),isPublic:false,publicSince:null});
}

test('AC-92/95: chapter links cross parts and volumes, omit unpublished chapters and support browser history', {timeout:120000},async()=>{
  const prefix=fixture.prefix+'-chapter-cross-'+randomUUID().slice(0,8);
  let series;
  const browser=await chromium.launch({headless:true});
  try{
    series=await create('series',null,prefix+'-series');
    const v1=await create('volume',series,prefix+'-volume-1');
    const v2=await create('volume',series,prefix+'-volume-2');
    const p1=await create('part',v1,prefix+'-part-1');
    const p2=await create('part',v1,prefix+'-part-2');
    const p3=await create('part',v2,prefix+'-part-3');
    const a=await create('chapter',p1,prefix+'-chapter-A');
    const hidden=await create('chapter',p1,prefix+'-chapter-hidden');
    const b=await create('chapter',p2,prefix+'-chapter-B');
    const c=await create('chapter',p3,prefix+'-chapter-C');
    for(const id of [series,v1,v2,p1,p2,p3,a,b,c])await publish(id);
    const root='/series/'+series+'/stories';
    const paths=[root+'/'+v1+'/parts/'+p1+'/chapters/'+a,root+'/'+v1+'/parts/'+p2+'/chapters/'+b,root+'/'+v2+'/parts/'+p3+'/chapters/'+c];
    const page=await browser.newPage({viewport:{width:390,height:844}});
    async function check(index){
      await page.locator('main').getByRole('heading',{name:prefix+'-chapter-'+['A','B','C'][index],exact:true}).waitFor();
      const nav=page.locator('.chapter-navigation');
      await nav.waitFor();
      const expected=[...(index>0?[paths[index-1]]:[]),root,...(index<2?[paths[index+1]]:[])];
      assert.deepEqual(await nav.locator('a').evaluateAll(a=>a.map(x=>x.getAttribute('href'))),expected);
      assert.equal(await page.locator('main a[href*="'+hidden+'"]').count(),0);
    }
    await page.goto(base+paths[0]);await check(0);
    for(let i=1;i<3;i++){
      await page.locator('.chapter-navigation a[href="'+paths[i]+'"]').click();
      await page.waitForURL(url=>url.pathname===paths[i]);await check(i);
    }
    await page.goBack();await page.waitForURL(url=>url.pathname===paths[1]);await check(1);
    await page.goForward();await page.waitForURL(url=>url.pathname===paths[2]);await check(2);
    for(let i=1;i>=0;i--){
      await page.locator('.chapter-navigation a[href="'+paths[i]+'"]').click();
      await page.waitForURL(url=>url.pathname===paths[i]);await check(i);
    }
    await page.locator('.chapter-navigation a[href="'+root+'"]').click();
    await page.waitForURL(url=>url.pathname===root);
  }finally{
    if(series)try{await hide(series)}catch(error){console.error('fixture cleanup',error)}
    await browser.close();
  }
});

test('AC-31/55/95: search and related setting links reach canonical details and revoked targets disappear', {timeout:120000},async()=>{
  const prefix=fixture.prefix+'-related-click-'+randomUUID().slice(0,8);
  let series;
  const browser=await chromium.launch({headless:true});
  try{
    series=await create('series',null,prefix+'-series');
    const category=await create('category',series,prefix+'-category',{presets:'[]'});
    const target=await create('tip',category,prefix+'-target');
    const source=await create('tip',category,prefix+'-source',{relatedTipIds:JSON.stringify([target])});
    for(const id of [series,category,target,source])await publish(id);
    const root='/series/'+series+'/settings/'+category+'/';
    const page=await browser.newPage({viewport:{width:390,height:844}});
    await page.goto(base+'/search?series='+series);
    await page.locator('.search-filters input[type="search"]').fill(prefix+'-source');
    const search=page.locator('main .search-result a[href="'+root+source+'"]');
    await search.waitFor();
    await search.click();
    await page.waitForURL(url=>url.pathname===root+source);
    await page.locator('main').getByRole('heading',{name:prefix+'-source',exact:true}).waitFor();
    const related=page.locator('main article a').filter({hasText:prefix+'-target'});
    await related.waitFor();
    await related.click();
    await page.waitForURL(url=>url.pathname===root+target);
    await page.locator('main').getByRole('heading',{name:prefix+'-target',exact:true}).waitFor();
    await page.goBack();await page.waitForURL(url=>url.pathname===root+source);
    await page.locator('main').getByRole('heading',{name:prefix+'-source',exact:true}).waitFor();
    await hide(target);
    await page.reload();
    await page.locator('main').getByRole('heading',{name:prefix+'-source',exact:true}).waitFor();
    assert.equal(await page.locator('main article a').filter({hasText:prefix+'-target'}).count(),0);
    assert.ok(!(await page.locator('main').innerText()).includes(prefix+'-target'));
    await page.goto(base+root+target);
    await page.locator('main [role="alert"]').waitFor();
    assert.equal(await page.locator('main article').count(),0);
  }finally{
    if(series)try{await hide(series)}catch(error){console.error('fixture cleanup',error)}
    await browser.close();
  }
});
