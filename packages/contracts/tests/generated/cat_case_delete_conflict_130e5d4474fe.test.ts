// Deterministically generated from a symbolic CAT v2 model and explicit test vectors.
// Based on confirmed CAT specification; implementation still requires testing.
import {describe,it,expect} from 'vitest'
import {createDriver} from "./master-delete-admission-driver"
import {isDeepStrictEqual} from 'node:util'

function sameCATSet(observed: unknown, expected: unknown): boolean {
  if (!Array.isArray(observed) || !Array.isArray(expected) || observed.length !== expected.length) return false;
  const hasDuplicate = (items: unknown[]) => items.some((item,index) => items.slice(index+1).some(other => isDeepStrictEqual(item,other)));
  if (hasDuplicate(observed) || hasDuplicate(expected)) return false;
  const used = new Set<number>();
  for (const item of observed) {
    const i = expected.findIndex((candidate,index) => !used.has(index) && isDeepStrictEqual(item, candidate));
    if (i < 0) return false;
    used.add(i);
  }
  return true;
}
function equalCATValue(id: string, observed: unknown, expected: unknown, setFields: string[]): boolean {
  if (setFields.includes(id) && Array.isArray(observed) && Array.isArray(expected)) return sameCATSet(observed,expected);
  return isDeepStrictEqual(observed,expected);
}
function accept(after: Record<string,unknown>, output: Record<string,unknown>, alternatives: Array<{state:Record<string,unknown>,output:Record<string,unknown>}>, declared: string[], stateSetFields: string[], outputSetFields: string[]): boolean {
  return alternatives.some(expected => declared.every(id => Object.prototype.hasOwnProperty.call(after,id) && equalCATValue(id,after[id],expected.state[id],stateSetFields)) && Object.keys(output).length === Object.keys(expected.output).length && Object.keys(output).every(id => Object.prototype.hasOwnProperty.call(expected.output,id) && equalCATValue(id,output[id],expected.output[id],outputSetFields)));
}

describe("eternalia.master.delete-admission CAT symbolic contract", () => {
  it("case.delete.conflict", async () => {
    // TCE: delete.conflict
    const driver = createDriver()
    const pre = {} as Record<string,unknown>
    const input = {"入力.参照あり":false,"入力.改訂一致":false} as Record<string,unknown>
    await driver.prepare(pre, input)
    const before = await driver.observeState()
    for (const id of []) { expect(equalCATValue(id,before[id],pre[id],[])).toBe(true); }
    const output = await driver.trigger("削除可否判定", input)
    const after = await driver.observeState()
    const allowed = [{"output":{"出力.結果":"競合"},"state":{}}] as Array<{state:Record<string,unknown>,output:Record<string,unknown>}> 
    expect(accept(after, output, allowed, [], [], [])).toBe(true)
  })
})
