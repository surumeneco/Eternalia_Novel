import { hasSameLanguageSpellingCollision } from '../../src/spelling-collision'

// Adapter for an already-filtered same-language spelling predicate; not the oracle.
export function createDriver() {
  return {
    async prepare(_state: Record<string, unknown>, _input: Record<string, unknown>) {},
    async observeState(): Promise<Record<string, unknown>> { return {} },
    async trigger(_operation: string, input: Record<string, unknown>): Promise<Record<string, unknown>> {
      return { '出力.拒否': hasSameLanguageSpellingCollision(
        input['入力.下書き同綴'] === true, input['入力.公開版同綴'] === true,
      ) }
    },
  }
}
