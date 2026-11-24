import {readFile} from 'node:fs/promises';
import {chromium} from 'playwright';
async function fixture(){
  const base=process.env.HTTP_BASE_URL;
  if(process.env.HTTP_ACCEPTANCE_DISPOSABLE_DB!=='1'||!base?.startsWith('http://127.0.0.1:')||!process.env.HTTP_FIXTURE_FILE)throw Error('Disposable acceptance fixture required');
  return {base,f:JSON.parse(await readFile(process.env.HTTP_FIXTURE_FILE,'utf8'))};
}
async function ready(page){await page.waitForFunction(()=>Boolean(document.querySelector('#__nuxt')?.__vue_app__));}
export function createDriver(){return {async prepare(){},async observeState(){return{}},async trigger(name,input){
  if(name!=='メニュー状態照合')throw Error('Unexpected trigger');
  const {base,f}=await fixture(),browser=await chromium.launch({headless:true});
  try{
    const ctx=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true}),page=await ctx.newPage();
    await page.goto(base+'/series/'+f.seriesA);await ready(page);
    const menu=input['入力.メニュー'];
    if(menu!=='閉'){
      const sel=menu==='主'?'.nav-toggle':'.aside-toggle';
      await page.locator(sel).click();
      await page.waitForFunction(s=>document.querySelector(s)?.getAttribute('aria-expanded')==='true',sel);
    }
    return {'出力.背景操作可':await page.locator('#main-content').evaluate(e=>!e.inert)};
  }finally{await browser.close()}
}}}
