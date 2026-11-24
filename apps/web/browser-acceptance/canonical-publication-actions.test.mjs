/** AC-90/93: exploratory actual canonical editor actions, not generated CAT tests. */
import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { chromium } from 'playwright';

assert.equal(process.env.HTTP_ACCEPTANCE_DISPOSABLE_DB,'1');
assert.notEqual(process.env.NODE_ENV,'production');
const fixture=JSON.parse(await readFile(process.env.HTTP_FIXTURE_FILE,'utf8'));
const base=process.env.HTTP_BASE_URL;
assert.match(base??'',/^http:\/\/127\.0\.0\.1:\d+$/);
const stamp=fixture.prefix+'-canonical-pub-'+randomUUID().slice(0,8);
async function request(method,path,data){
  const result=await fetch(base+path,{method,headers:{Origin:base,'Content-Type':'application/json',Cookie:'eternalia_author='+fixture.authorToken},...(data===undefined?{}:{body:JSON.stringify(data)})});
  const raw=await result.text();
  assert.ok(result.ok,method+' '+path+' '+result.status+' '+raw);
  return JSON.parse(raw);
}
async function get(id){const n=(await request('GET','/api/admin/nodes')).find(n=>n.id===id);assert.ok(n,id);return n;}
async function create(kind,parentId,details={}){
  const title=stamp+'-'+kind;
  return (await request('POST','/api/admin/nodes',{kind,parentId,content:{title,body:'original:'+title,details}})).id;
}
async function action(id,operation,fields={}){
  return request('POST','/api/admin/nodes/'+id+'/'+operation,{expectedRevision:(await get(id)).revision,...fields});
}
async function reader(id,status,title){
  const res=await fetch(base+'/api/public/items/'+id);
  assert.equal(res.status,status,id);
  if(status===200)assert.equal((await res.json()).content.title,title,id);
}
async function waitStatus(page,caption){
  await page.getByText(caption,{exact:true}).waitFor();
}
test('AC-93: all canonical editor kinds change their own snapshot, visibility and JST start date without touching drafts', {timeout:240000},async()=>{
  let series;
  const browser=await chromium.launch({headless:true});
  try{
    series=await create('series',null);
    const volume=await create('volume',series);
    const part=await create('part',volume);
    const chapter=await create('chapter',part);
    const category=await create('category',series,{presets:'[]'});
    const tip=await create('tip',category);
    const section=await create('tipSection',tip);
    const nounId=randomUUID();
    const language=await create('language',series,{wordClasses:JSON.stringify([{id:nounId,name:'名詞',description:''}])});
    const word=await create('word',language,{meanings:JSON.stringify([{id:randomUUID(),partOfSpeechId:nounId,definition:'意味',etymologies:[]}])});
    const grammar=await create('grammar',language);
    const period=await create('periodization',series);
    const event=await create('event',period,{year:'12'});
    const root='/admin/series/'+series;
    const items=[
      [series,root+'/edit'],[volume,root+'/stories/volumes/'+volume+'/edit'],
      [part,root+'/stories/parts/'+part+'/edit'],[chapter,root+'/stories/chapters/'+chapter+'/edit'],
      [category,root+'/settings/categories/'+category+'/edit'],[tip,root+'/settings/tips/'+tip+'/edit'],
      [section,root+'/settings/sections/'+section+'/edit'],[language,root+'/dictionaries/languages/'+language+'/edit'],
      [word,root+'/dictionaries/words/'+word+'/edit'],[grammar,root+'/dictionaries/grammar/'+grammar+'/edit'],
      [period,root+'/timeline/periods/'+period+'/edit'],[event,root+'/timeline/events/'+event+'/edit'],
    ];
    const ctx=await browser.newContext({timezoneId:'America/Los_Angeles'});
    await ctx.addCookies([{name:'eternalia_author',value:fixture.authorToken,url:base,httpOnly:true,sameSite:'Lax'}]);
    const page=await ctx.newPage();
    for(const [id,path] of items){
      const initial=await get(id);
      await page.goto(base+path);
      const editor=page.locator('.publication-editor');
      await editor.waitFor();
      const publish=editor.getByRole('button',{name:'保存済み下書きを公開版へ反映',exact:true});
      const date=editor.locator('input[type="datetime-local"]');
      const dateButton=editor.getByRole('button',{name:'日時を設定',exact:true});
      const visible=editor.getByRole('button',{name:'非公開にする',exact:true});
      const hidden=editor.getByRole('button',{name:'公開に戻す',exact:true});
      assert.equal(await date.isDisabled(),true,path);
      await reader(id,404);
      await publish.click();
      const dialog=page.locator('dialog[open]');
      await dialog.waitFor();
      await dialog.getByRole('button',{name:'実行',exact:true}).click();
      await waitStatus(page,'公開スナップショットを更新しました。');
      await reader(id,200,initial.draft.title);
      await date.fill('2099-02-03T09:15');
      await dateButton.click();
      await waitStatus(page,'公開条件を変更しました。');
      assert.equal((await get(id)).publicSince,Date.parse('2099-02-03T00:15:00Z'),path);
      await reader(id,404);
      await date.fill('2020-02-03T09:15');
      await dateButton.click();
      await waitStatus(page,'公開条件を変更しました。');
      assert.equal((await get(id)).publicSince,Date.parse('2020-02-03T00:15:00Z'),path);
      await reader(id,200,initial.draft.title);
      await visible.click();
      await hidden.waitFor();
      await reader(id,404);
      await hidden.click();
      await visible.waitFor();
      await reader(id,200,initial.draft.title);
      const after=await get(id);
      assert.deepEqual(after.draft,initial.draft,path+' draft unchanged');
      assert.equal(after.isPublic,true,path);
    }
    await action(category,'visibility',{isPublic:false,publicSince:null});
    await page.goto(base+root+'/settings/tips/'+tip+'/edit');
    await page.locator('.publication-editor').getByRole('button',{name:'非公開にする',exact:true}).waitFor();
    assert.equal((await get(tip)).isPublic,true);
    await reader(tip,404);
    await reader(section,404);
    await ctx.close();
  }finally{
    if(series)try{await action(series,'visibility',{isPublic:false,publicSince:null})}catch(error){console.error('fixture cleanup',error)}
    await browser.close();
  }
});

test('AC-90/93: shared confirmation traps focus and cancel/Escape preserve saved and unsaved drafts; explicit publish uses saved snapshot only', {timeout:90000},async()=>{
  const browser=await chromium.launch({headless:true});
  let series;
  try{
    series=(await request('POST','/api/admin/nodes',{kind:'series',parentId:null,content:{title:stamp+'-dialog-series',body:'',details:{}}})).id;
    const category=await create('category',series,{presets:'[]'});
    const tip=await create('tip',category);
    for(const id of [series,category,tip])await action(id,'publish');
    const initial=await get(tip);
    const savedTitle=stamp+'-saved';
    await request('PATCH','/api/admin/nodes/'+tip,{expectedRevision:initial.revision,content:{...initial.draft,title:savedTitle}});
    const baseline=await get(tip);
    const ctx=await browser.newContext();
    await ctx.addCookies([{name:'eternalia_author',value:fixture.authorToken,url:base,httpOnly:true,sameSite:'Lax'}]);
    const page=await ctx.newPage();
    await page.goto(base+'/admin/series/'+series+'/settings/tips/'+tip+'/edit');
    const title=page.locator('.studio-editor form input[maxlength="150"]').first();
    await title.waitFor();
    await title.fill(stamp+'-unsaved');
    const publish=page.locator('.publication-editor').getByRole('button',{name:'保存済み下書きを公開版へ反映',exact:true});
    for(const dismissal of ['escape','cancel']){
      await publish.click();
      const dialog=page.locator('dialog[open]');
      await dialog.waitFor();
      await page.waitForFunction(()=>document.querySelector('dialog[open]')?.contains(document.activeElement));
      for(const key of ['Tab','Tab','Shift+Tab']){
        await page.keyboard.press(key);
        // Native modal may temporarily focus the browser chrome/body on a Tab boundary;
        // it must never move to an application element outside the modal.
        assert.ok(await page.evaluate(()=>document.activeElement===document.body||document.querySelector('dialog[open]')?.contains(document.activeElement)));
      }
      if(dismissal==='escape')await page.keyboard.press('Escape');
      else await dialog.getByRole('button',{name:'キャンセル',exact:true}).click();
      await dialog.waitFor({state:'hidden'});
      await publish.evaluate(el=>{if(document.activeElement!==el)throw Error('focus not restored')});
      assert.equal(await title.inputValue(),stamp+'-unsaved');
      assert.deepEqual(await get(tip),baseline);
      await reader(tip,200,initial.draft.title);
    }
    await publish.click();
    await page.locator('dialog[open]').getByRole('button',{name:'実行',exact:true}).click();
    await waitStatus(page,'公開スナップショットを更新しました。');
    await reader(tip,200,savedTitle);
    assert.equal(await title.inputValue(),stamp+'-unsaved');
    assert.deepEqual((await get(tip)).draft,baseline.draft);
    await ctx.close();
  }finally{
    if(series)try{await action(series,'visibility',{isPublic:false,publicSince:null})}catch(error){console.error('fixture cleanup',error)}
    await browser.close();
  }
});

test('AC-94: canonical publication batch updates across story, dictionary and timeline preserve schedules and series scope', {timeout:150000},async()=>{
  const browser=await chromium.launch({headless:true});
  const prefix=stamp+'-batch';
  const roots=[];
  const make=async(kind,parentId,suffix,details={})=>
    (await request('POST','/api/admin/nodes',{kind,parentId,content:{title:prefix+'-'+suffix,body:'',details}})).id;
  const past=Date.parse('2020-02-03T00:15:00Z');
  const future=Date.parse('2099-02-03T00:15:00Z');
  try{
    const series=await make('series',null,'series');
    roots.push(series);
    await action(series,'publish');
    const volume=await make('volume',series,'volume');
    const part=await make('part',volume,'part');
    const chapter1=await make('chapter',part,'chapter-past');
    const chapter2=await make('chapter',part,'chapter-future');
    const chapter3=await make('chapter',part,'chapter-no-snapshot');
    const language=await make('language',series,'language',{characters:'[]',wordClasses:'[]'});
    const word=await make('word',language,'word',{meanings:'[]'});
    const grammar=await make('grammar',language,'grammar');
    const period=await make('periodization',series,'period');
    const event1=await make('event',period,'event-past',{year:'1'});
    const event2=await make('event',period,'event-future',{year:'2'});
    const foreignSeries=await make('series',null,'foreign-series');
    roots.push(foreignSeries);
    const foreignLanguage=await make('language',foreignSeries,'foreign-language',{characters:'[]',wordClasses:'[]'});
    const foreignWord=await make('word',foreignLanguage,'foreign-word',{meanings:'[]'});
    for(const id of [volume,part,chapter1,chapter2,language,word,grammar,period,event1,event2,foreignSeries,foreignLanguage,foreignWord])await action(id,'publish');
    for(const id of [chapter1,word,event1])await action(id,'visibility',{isPublic:true,publicSince:past});
    for(const id of [chapter2,grammar,event2])await action(id,'visibility',{isPublic:true,publicSince:future});
    const foreignBefore=await get(foreignWord);
    const ctx=await browser.newContext({timezoneId:'America/Los_Angeles'});
    await ctx.addCookies([{name:'eternalia_author',value:fixture.authorToken,url:base,httpOnly:true,sameSite:'Lax'}]);
    const page=await ctx.newPage();
    await page.goto(base+'/admin/series/'+series+'/publication');
    await page.waitForFunction(id=>document.querySelector('.publication-filters select')?.value===id,series);
    const check=id=>page.locator('.publication-row input[type="checkbox"][value="'+id+'"]');
    const batch=async(kind,count)=>{
      await page.getByRole('button',{name:kind,exact:true}).click();
      if(kind==='選択項目の公開版更新')await page.locator('dialog[open]').getByRole('button',{name:'実行',exact:true}).click();
      await page.getByText('変更完了件数 '+count,{exact:true}).waitFor();
    };
    for(const [section,first,second] of [['stories',chapter1,chapter2],['dictionaries',word,grammar],['timeline',event1,event2]]){
      await page.getByLabel('領域').selectOption(section);
      await check(first).waitFor();
      await check(second).waitFor();
      assert.equal(await check(foreignWord).count(),0);
      const initialFirst=await get(first);
      const initialSecond=await get(second);
      await reader(first,200,initialFirst.draft.title);
      await reader(second,404);
      // Hide/show modifies only the chosen rows, not draft or start dates.
      await check(first).check();
      await check(second).check();
      await batch('選択項目を非公開',2);
      await reader(first,404);
      await reader(second,404);
      assert.equal((await get(first)).publicSince,past);
      assert.equal((await get(second)).publicSince,future);
      await check(first).check();
      await check(second).check();
      await batch('選択項目を公開',2);
      await reader(first,200,initialFirst.draft.title);
      await reader(second,404);
      assert.deepEqual((await get(first)).draft,initialFirst.draft);
      assert.deepEqual((await get(second)).draft,initialSecond.draft);
      assert.equal((await get(second)).publicSince,future);
      // A saved draft change remains private until the explicit batch snapshot.
      for(const [id,initial] of [[first,initialFirst],[second,initialSecond]]){
        const current=await get(id);
        await request('PATCH','/api/admin/nodes/'+id,{expectedRevision:current.revision,content:{...current.draft,title:initial.draft.title+'-updated'}});
      }
      await reader(first,200,initialFirst.draft.title);
      await page.getByRole('button',{name:'再読込',exact:true}).click();
      await page.getByRole('heading',{name:initialFirst.draft.title+'-updated',exact:true}).waitFor();
      await check(first).check();
      await check(second).check();
      await batch('選択項目の公開版更新',2);
      await reader(first,200,initialFirst.draft.title+'-updated');
      await reader(second,404);
      assert.equal((await get(second)).publicSince,future);
      assert.equal((await get(second)).published.content.title,initialSecond.draft.title+'-updated');
    }
    // A selected unpublished node cannot be made visible just by the visibility batch.
    await page.getByLabel('領域').selectOption('stories');
    await check(chapter1).check();
    await check(chapter3).check();
    await batch('選択項目を公開',1);
    await page.getByRole('alert').filter({hasText:prefix+'-chapter-no-snapshot'}).waitFor();
    assert.equal((await get(chapter3)).published,null);
    await reader(chapter3,404);
    assert.deepEqual(await get(foreignWord),foreignBefore);
    await reader(foreignWord,200,foreignBefore.draft.title);
    await ctx.close();
  }finally{
    for(const id of roots)try{await action(id,'visibility',{isPublic:false,publicSince:null})}catch(error){console.error('fixture cleanup',error)}
    await browser.close();
  }
});
