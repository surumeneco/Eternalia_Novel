import { readFile } from 'node:fs/promises';
import { chromium } from 'playwright';
export function createDriver() {
  return {
    async prepare() {},
    async observeState() { return {}; },
    async trigger(name,input) {
      if(name!=='章一覧遷移'||input['入力.詳細']!=='正規公開章') throw new Error('Unexpected CAT input');
      if(process.env.HTTP_ACCEPTANCE_DISPOSABLE_DB!=='1'||!process.env.HTTP_BASE_URL?.startsWith('http://127.0.0.1:')) throw new Error('Disposable HTTP fixture required');
      const f=JSON.parse(await readFile(process.env.HTTP_FIXTURE_FILE,'utf8'));
      const path='/series/'+f.seriesA+'/stories/'+f.volume+'/parts/'+f.part;
      const browser=await chromium.launch({headless:true});
      try {
        const page=await browser.newPage();
        await page.goto(process.env.HTTP_BASE_URL+path+'/chapters/'+f.chapter);
        const link=page.locator('main .chapter-navigation a').filter({hasText:'目次'});
        await link.waitFor({timeout:10000});
        await link.click();
        await page.waitForURL(url=>!url.pathname.endsWith('/chapters/'+f.chapter),{timeout:10000});
        const actual=new URL(page.url()).pathname;
        if(actual===path){await page.locator('main').getByRole('heading',{name:f.prefix+'-part-A',exact:true}).waitFor({timeout:10000});}
        return {'出力.遷移先':actual===path?'所属部の章一覧':'その他'};
      } finally { await browser.close(); }
    }
  };
}
