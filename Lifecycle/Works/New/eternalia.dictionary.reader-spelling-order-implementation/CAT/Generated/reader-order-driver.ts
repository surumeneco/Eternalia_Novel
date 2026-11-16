import { compareDictionaryWordSpelling } from '../../../../../../apps/web/app/utils/dictionary-order'

// Transport adapter: fixed distinct spellings exercise actual product comparison.
// Does not itself declare the oracle: permitted TCE outputs own expectations.
export function createDriver() {
  return {
    async prepare(_state: Record<string, unknown>, _input: Record<string, unknown>) {},
    async observeState(): Promise<Record<string, unknown>> { return {} },
    async trigger(_operation: string, input: Record<string, unknown>): Promise<Record<string, unknown>> {
      const category = input['入力.スペル比較'];
      const left = category === '右前' ? 'zeta' : category === '同順位' ? 'same' : 'alpha';
      const right = category === '右前' ? 'alpha' : category === '同順位' ? 'same' : 'zeta';
      const leftId = category === '同順位' ? 'same-id' : 'left-id';
      const rightId = category === '同順位' ? 'same-id' : 'right-id';
      const order = compareDictionaryWordSpelling(
        { id: leftId, content: { title: left }, order: 90 },
        { id: rightId, content: { title: right }, order: 1 },
      );
      return { '出力.表示順': order < 0 ? '左前' : order > 0 ? '右前' : '同順位' };
    },
  };
}
