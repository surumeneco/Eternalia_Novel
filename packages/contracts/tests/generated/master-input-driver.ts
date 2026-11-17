import { wordClassInputPolicy } from '../../../../apps/web/app/utils/word-class-input-policy'
export function createDriver() {
 return {
  async prepare(_state:Record<string,unknown>,_input:Record<string,unknown>) {},
  async observeState():Promise<Record<string,unknown>> { return {} },
  async trigger(_operation:string,input:Record<string,unknown>):Promise<Record<string,unknown>> {
   const result=wordClassInputPolicy(input['入力.マスタ登録あり']===true,input['入力.マスタ外旧値あり']===true);
   return {'出力.選択有効':result.choiceEnabled,'出力.旧値保持表示':result.showLegacy,'出力.自由入力':result.freeTextAllowed};
  },
 };
}
