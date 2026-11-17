import { isRegisteredCreateWordPartOfSpeech } from '../../src/word-pos-create-policy'
export function createDriver() {
 return {
  async prepare(_state:Record<string,unknown>,_input:Record<string,unknown>) {},
  async observeState():Promise<Record<string,unknown>> { return {} },
  async trigger(_operation:string,input:Record<string,unknown>):Promise<Record<string,unknown>> {
   return {'出力.登録可':isRegisteredCreateWordPartOfSpeech(
    input['入力.品詞指定あり']===true,input['入力.品詞が所属言語マスタ内']===true)};
  },
 };
}
