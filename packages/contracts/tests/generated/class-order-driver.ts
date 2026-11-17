import { moveLanguageClass } from '../../../../apps/web/app/utils/language-class-order'
export function createDriver() {
 return {
  async prepare(_state:Record<string,unknown>,_input:Record<string,unknown>) {},
  async observeState():Promise<Record<string,unknown>> { return {} },
  async trigger(_operation:string,input:Record<string,unknown>):Promise<Record<string,unknown>> {
   const before=['first','middle','last'];
   const forward=input['入力.方向']==='前';
   const canMove=input['入力.移動可能']===true;
   const index=canMove?1:(forward?0:2);
   const after=moveLanguageClass(before,index,forward?-1:1);
   return {'出力.順序変化':after.some((x,i)=>x!==before[i])};
  },
 };
}
