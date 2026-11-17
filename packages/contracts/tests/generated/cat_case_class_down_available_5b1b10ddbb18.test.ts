// Deterministically generated from a symbolic CAT v2 model and explicit test vectors.
// Based on confirmed CAT specification; implementation still requires testing.
import {describe,it,expect} from 'vitest'
import {createDriver} from "./class-order-driver"
import {isDeepStrictEqual} from 'node:util'

function accept(after: Record<string,unknown>, output: Record<string,unknown>, alternatives: Array<{state:Record<string,unknown>,output:Record<string,unknown>}>, declared: string[], setFields: string[]): boolean {
  const canonical = (id: string, value: unknown) => setFields.includes(id) && Array.isArray(value) ? [...value].sort() : value;
  return alternatives.some(expected => declared.every(id => Object.prototype.hasOwnProperty.call(after,id) && isDeepStrictEqual(canonical(id,after[id]),canonical(id,expected.state[id]))) && isDeepStrictEqual(output,expected.output));
}

describe("eternalia.dictionary.class-order CAT symbolic contract", () => {
  it("case.class.down.available", async () => {
    // TCE: class.down.available
    const driver = createDriver()
    const pre = {} as Record<string,unknown>
    const input = {"入力.方向":"後","入力.移動可能":true} as Record<string,unknown>
    await driver.prepare(pre, input)
    const before = await driver.observeState()
    for (const id of []) { const normalized = (v: unknown) => ([] as string[]).includes(id) && Array.isArray(v) ? [...v].sort() : v; expect(normalized(before[id])).toEqual(normalized(pre[id])); }
    const output = await driver.trigger("順序変更", input)
    const after = await driver.observeState()
    const allowed = [{"output":{"出力.順序変化":true},"state":{}}] as Array<{state:Record<string,unknown>,output:Record<string,unknown>}> 
    expect(accept(after, output, allowed, [], [])).toBe(true)
  })
})
