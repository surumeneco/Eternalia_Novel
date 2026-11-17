import { compareDictionaryWordSpelling } from '../../../../apps/web/app/utils/dictionary-order'
export function createDriver() {
 return {
  async prepare(_state:Record<string,unknown>,_input:Record<string,unknown>) {},
  async observeState():Promise<Record<string,unknown>> { return {} },
  async trigger(_operation:string,input:Record<string,unknown>):Promise<Record<string,unknown>> {
   const relation=input['入力.スペル比較'];
   const left={id:'A',content:{title:relation==='右前'?'い':'あ'}};
   const right={id:relation==='同順位'?'A':'B',content:{title:relation==='左前'?'い':'あ'}};
   const direction=compareDictionaryWordSpelling(left,right);
   return {'出力.表示順':direction<0?'左前':direction>0?'右前':'同順位'};
  },
 };
}
