import { hasPublishedWordClassLabel } from '../../src/word-pos-reference'

// Symbolic CAT adapter only. Full published-master data-flow is covered by separate HTTP/Chromium tests.
export function createDriver() {
  return {
    async prepare(_state: Record<string, unknown>, _input: Record<string, unknown>) {},
    async observeState(): Promise<Record<string, unknown>> { return {} },
    async trigger(_operation: string, input: Record<string, unknown>): Promise<Record<string, unknown>> {
      return { '出力.公開名を表示': hasPublishedWordClassLabel(
        input['入力.品詞ID指定あり'] === true,
        input['入力.公開マスタ内に同IDあり'] === true,
      ) }
    },
  }
}
