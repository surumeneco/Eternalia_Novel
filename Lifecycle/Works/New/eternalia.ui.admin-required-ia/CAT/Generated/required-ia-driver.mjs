import { readFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { chromium } from 'playwright';
const yes=x=>x?'適合':'不適合';
async function fixture(){if(process.env.HTTP_ACCEPTANCE_DISPOSABLE_DB!=='1'||!process.env.HTTP_BASE_URL?.startsWith('http://127.0.0.1:'))throw Error('Disposable fixture required');return JSON.parse(await readFile(process.env.HTTP_FIXTURE_FILE,'utf8'))}
async function ready(page){await page.waitForFunction(()=>Boolean(document.querySelector('#__nuxt')?.__vue_app__))}
export function createDriver(){return{async prepare(){},async observeState(){return{}},async trigger(name,input){
if(name!=='管理一覧閲覧'||input['入力.操作']!=='正規管理一覧')throw Error('Unexpected input');
const f=await fixture(),base=process.env.HTTP_BASE_URL,p=f.prefix+'-grid-'+randomUUID().slice(0,8);
const browser=await chromium.launch({headless:true});
try{
const ctx=await browser.newContext();await ctx.addCookies([{name:'eternalia_author',value:f.authorToken,url:base,httpOnly:true,sameSite:'Lax'}]);const page=await ctx.newPage();
async function add(kind,parentId,title){const r=await ctx.request.post(base+'/api/admin/nodes',{headers:{Origin:base},data:{kind,parentId,content:{title,body:'',details:{}}}});if(r.status()!==201)throw Error('Fixture create '+r.status()+' '+await r.text());return(await r.json()).id}
const lang=await add('language',f.seriesA,p+'-language'),word=await add('word',lang,p+'-word');
const root='/admin/series/'+f.seriesA;
async function grid(path){await page.goto(base+root+'/'+path);await page.locator('main .admin-node-grid').waitFor();await ready(page);return page.locator('main .admin-node-grid')}
const chapterGrid=await grid('stories/chapters'),row=chapterGrid.locator('tbody tr').filter({has:page.locator('a[href$="/'+f.chapter+'/edit"]')});await row.waitFor();
const rowText=await row.innerText(),chapter=rowText.includes(f.prefix+'-book-A')&&rowText.includes(f.prefix+'-part-A'),order=(await chapterGrid.locator('thead').innerText()).includes('表示順');
const volumeGrid=await grid('stories/volumes'),noSeries=!(await volumeGrid.locator('tbody').innerText()).includes(f.prefix+'-world-A');
const words=await grid('dictionaries/words'),filter=page.getByLabel('言語',{exact:true});let scoped=false;
if(await filter.count()===1){await filter.selectOption(lang);scoped=await words.locator('a[href$="/'+word+'/edit"]').count()===1&&await words.locator('a[href$="/'+f.word+'/edit"]').count()===0&&await words.locator('a[href*="'+f.languageB+'"]').count()===0}
return {'出力.章の編部':yes(chapter),'出力.表示順':yes(order),'出力.シリーズ非重複':yes(noSeries),'出力.言語限定':yes(scoped)}
}finally{await browser.close()}
}}}
