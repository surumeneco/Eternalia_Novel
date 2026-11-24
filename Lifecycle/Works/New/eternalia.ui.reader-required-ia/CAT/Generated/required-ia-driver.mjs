import { readFile, appendFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { chromium } from 'playwright';
const yes=x=>x?'適合':'不適合';
async function fixture(){if(process.env.HTTP_ACCEPTANCE_DISPOSABLE_DB!=='1'||!process.env.HTTP_BASE_URL?.startsWith('http://127.0.0.1:'))throw Error('Disposable fixture required');return JSON.parse(await readFile(process.env.HTTP_FIXTURE_FILE,'utf8'))}
async function ready(page){await page.waitForFunction(()=>Boolean(document.querySelector('#__nuxt')?.__vue_app__))}
export function createDriver(){return{async prepare(){},async observeState(){return{}},async trigger(name,input){
if(name!=='公開資料閲覧'||input['入力.操作']!=='正規設定集と辞書')throw Error('Unexpected input');
const f=await fixture(),base=process.env.HTTP_BASE_URL,p=f.prefix+'-ia-'+randomUUID().slice(0,8);
async function req(method,path,data){const r=await fetch(base+path,{method,headers:{Origin:base,'Content-Type':'application/json',Cookie:'eternalia_author='+f.authorToken},...(data===undefined?{}:{body:JSON.stringify(data)})});if(!r.ok)throw Error(method+' '+path+' '+r.status+' '+await r.text());return r.json()}
async function add(kind,parentId,title,details={}){return(await req('POST','/api/admin/nodes',{kind,parentId,content:{title,body:'body:'+title,details}})).id}
async function publish(id){await req('POST','/api/admin/nodes/'+id+'/publish',{expectedRevision:1})}
const root=await add('series',null,p+'-series'),cat=await add('category',root,p+'-category',{presets:'[]'}),tag=await req('POST','/api/admin/masters/tags',{group:p,name:p+'-tag',order:0});
const zz=await add('tip',cat,p+'-zz',{tagIds:JSON.stringify([tag.id])}),aa=await add('tip',cat,p+'-aa'),hidden=await add('tip',cat,p+'-hidden'),section=await add('tipSection',zz,p+'-section');
for(const id of [root,cat,zz,aa,section])await publish(id);
const browser=await chromium.launch({headless:true});
try{
const page=await browser.newPage(),path='/series/'+root+'/settings/'+cat;
await page.goto(base+path);await page.locator('main').getByRole('heading',{name:p+'-category',exact:true}).waitFor();await ready(page);
const q=page.getByLabel('設定を検索',{exact:true}),t=page.getByLabel('タグ',{exact:true}),s=page.getByLabel('並び順',{exact:true}),a=page.locator('main .domain-list a');
let search=false,tagFilter=false,order=false;
if(await q.count()===1){await q.fill(p+'-section');search=(await a.allTextContents()).join('|')===p+'-zz';await q.fill('')}
if(await t.count()===1){await t.selectOption(p+'-tag');tagFilter=(await a.allTextContents()).join('|')===p+'-zz';await t.selectOption('')}
if(await s.count()===1){await s.selectOption('title');order=(await a.allTextContents()).join('|')===[p+'-aa',p+'-zz'].join('|')}
const privacy=await page.locator('main a[href*="'+hidden+'"]').count()===0;
await page.goto(base+path+'/'+zz);await page.locator('main').getByRole('heading',{name:p+'-zz',exact:true}).waitFor();
const sectionVisible=(await page.locator('main article').innerText()).includes('body:'+p+'-section');
await page.goto(base+'/series/'+f.seriesA+'/dictionaries/'+f.language+'/details');await page.locator('main').getByRole('heading',{name:f.prefix+'-visible-language',exact:true}).waitFor();
const grammar=await page.locator('main article a[href="/series/'+f.seriesA+'/dictionaries/'+f.language+'/grammar/'+f.grammar+'"]').count()===1;
const output={'出力.名称項目検索':yes(search),'出力.タグ絞込':yes(tagFilter),'出力.名称順':yes(order),'出力.非公開除外':yes(privacy),'出力.設定項目本文':yes(sectionVisible),'出力.文法導線':yes(grammar)};
if(process.env.CAT_IA_OBSERVATIONS)await appendFile(process.env.CAT_IA_OBSERVATIONS,JSON.stringify({work:"reader",output})+'\n');
return output;
}finally{await browser.close();const nodes=await req('GET','/api/admin/nodes');const n=nodes.find(x=>x.id===root);if(n)await req('POST','/api/admin/nodes/'+root+'/visibility',{expectedRevision:n.revision,isPublic:false,publicSince:null})}
}}}
