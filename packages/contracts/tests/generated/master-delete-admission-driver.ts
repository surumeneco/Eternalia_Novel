import { deleteAdmission } from '../../../../apps/api/src/master-delete-admission';
const labels = { allowed: '許可', conflict: '競合', referenced: '参照あり' } as const;
export function createDriver() {
  return {
    async prepare() {}, async observeState() { return {}; },
    async trigger(name: string, input: Record<string, unknown>) {
      if (name !== '削除可否判定') throw new Error('Unexpected CAT trigger');
      return { '出力.結果': labels[deleteAdmission(input['入力.改訂一致'] === true, input['入力.参照あり'] === true)] };
    },
  };
}
