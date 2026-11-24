import { canonicalCreateAdmission } from '../../app/utils/canonical-create-admission.ts';
export function createDriver() {
  let input;
  return {
    async prepare(_pre, nextInput) { input=nextInput; },
    async observeState() { return {}; },
    async trigger(name, nextInput) {
      if(name!=='作成入場判定')throw new Error('Unexpected CAT trigger: '+name);
      const data=nextInput??input;
      return {'出力.入場可':canonicalCreateAdmission(data['入力.作者'],data['入力.作成範囲'],data['入力.親関係'],data['入力.種別整合'])};
    }
  };
}
