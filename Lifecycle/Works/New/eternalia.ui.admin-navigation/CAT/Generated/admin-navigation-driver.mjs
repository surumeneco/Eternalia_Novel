import {readFile} from 'node:fs/promises';
import {chromium} from 'playwright';
async function fixture(){
  const base=process.env.HTTP_BASE_URL;
  if(process.env.HTTP_ACCEPTANCE_DISPOSABLE_DB!=='1'||!base?.startsWith('http://127.0.0.1:')||!process.env.HTTP_FIXTURE_FILE)throw Error('Disposable acceptance fixture required');
  return {base,f:JSON.parse(await readFile(process.env.HTTP_FIXTURE_FILE,'utf8'))};
}
async function ready(page){await page.waitForFunction(()=>Boolean(document.querySelector('#__nuxt')?.__vue_app__));}
export function createDriver(){return {async prepare(){},async observeState(){return{}},async trigger(name,input){
  if(name!=='正規編集要求')throw Error('Unexpected trigger');
  const {base,f}=await fixture(),browser=await chromium.launch({headless:true});
  try{
    const ctx=await browser.newContext();
    if(input['入力.作者'])await ctx.addCookies([{name:'eternalia_author',value:f.authorToken,url:base,httpOnly:true,sameSite:'Lax'}]);
    const series=input['入力.所属一致']?f.seriesA:f.seriesB;
    const node=input['入力.対象存在']?f.chapter:'00000000-0000-4000-8000-000000000001';
    const area=input['入力.種別一致']?'stories/chapters':'settings/tips';
    const q=new URLSearchParams();
    if(['item','両方'].includes(input['入力.旧クエリ']))q.set('item',f.languageB);
    if(['create','両方'].includes(input['入力.旧クエリ'])){q.set('create','language');q.set('parent',f.seriesB)}
    const page=await ctx.newPage();
    await page.goto(base+'/admin/series/'+series+'/'+area+'/'+node+'/edit'+(q.size?'?'+q:''));
    await ready(page);
    const editor=page.locator('.studio-editor'),denied=page.locator('.admin-editor-page [role="alert"]'),missing=page.locator('.admin-editor-page h1');
    await editor.or(denied).or(missing).first().waitFor({timeout:10000});
    if(await editor.count()){
      await editor.getByRole('heading',{name:'章：'+f.prefix+'-unpublished-draft-title',exact:true}).waitFor({timeout:10000});
      if(await page.locator('form.create-form').count())throw Error('Unexpected create form');
      return {'出力.結果':'正規編集'};
    }
    if(await denied.count())return {'出力.結果':'認可拒否'};
    if(await missing.count())return {'出力.結果':'対象拒否'};
    throw Error('No observed outcome');
  }finally{await browser.close()}
}}}
