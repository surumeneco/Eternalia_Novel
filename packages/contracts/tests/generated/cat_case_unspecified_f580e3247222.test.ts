// Deterministically generated from a symbolic CAT v2 model and explicit test vectors.
// Based on confirmed CAT specification; implementation still requires testing.
import {describe,it,expect} from 'vitest'
import {createDriver} from "./stable-pos-driver"
import {isDeepStrictEqual} from 'node:util'

function accept(after: Record<string,unknown>, output: Record<string,unknown>, alternatives: Array<{state:Record<string,unknown>,output:Record<string,unknown>}>, declared: string[], setFields: string[]): boolean {
  const canonical = (id: string, value: unknown) => setFields.includes(id) && Array.isArray(value) ? [...value].sort() : value;
  return alternatives.some(expected => declared.every(id => Object.prototype.hasOwnProperty.call(after,id) && isDeepStrictEqual(canonical(id,after[id]),canonical(id,expected.state[id]))) && isDeepStrictEqual(output,expected.output));
}

describe("eternalia.dictionary.stable-pos-reference CAT symbolic contract", () => {
  it("case.unspecified", async () => {
    // TCE: unspecified
    const driver = createDriver()
    const pre = {} as Record<string,unknown>
    const input = {"入力.公開マスタ内に同IDあり":false,"入力.品詞ID指定あり":false} as Record<string,unknown>
    await driver.prepare(pre, input)
    const before = await driver.observeState()
    for (const id of []) { const normalized = (v: unknown) => ([] as string[]).includes(id) && Array.isArray(v) ? [...v].sort() : v; expect(normalized(before[id])).toEqual(normalized(pre[id])); }
    const output = await driver.trigger("品詞名解決", input)
    const after = await driver.observeState()
    const allowed = [{"output":{"出力.公開名を表示":false},"state":{}}] as Array<{state:Record<string,unknown>,output:Record<string,unknown>}> 
    expect(accept(after, output, allowed, [], [])).toBe(true)
  })
})
