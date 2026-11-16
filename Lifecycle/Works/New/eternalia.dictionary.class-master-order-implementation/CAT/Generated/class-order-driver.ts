import { moveLanguageClass } from '../../../../../../apps/web/app/utils/language-class-order'

export function createDriver() {
  return {
    async prepare(_state: Record<string, unknown>, _input: Record<string, unknown>) {},
    async observeState(): Promise<Record<string, unknown>> { return {} },
    async trigger(_operation: string, input: Record<string, unknown>): Promise<Record<string, unknown>> {
      const entries = [{id:'noun'}, {id:'verb'}, {id:'adjective'}];
      const direction = input['入力.方向'] === '前' ? -1 : 1;
      const index = input['入力.移動可能'] === true ? 1 : direction < 0 ? 0 : 2;
      const changed = moveLanguageClass(entries, index, direction);
      return {'出力.順序変化': changed.some((entry, index) => entry.id !== entries[index]?.id)};
    },
  };
}
