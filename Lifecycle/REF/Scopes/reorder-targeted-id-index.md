# Sibling reorder: restrict temporary ID map to ordered targets

## Fixed source and existing behavior

Refactor only the internal lookup in `packages/contracts/src/reorder.ts::reorderSiblings`, based on `surumeneco/Eternalia_Novel` `develop@23c39e246323a07df86b54f465f7614f34b535f8` and source Git blob (verified from an immutable full-tree snapshot). Preserve the adopted sibling ordering, complete membership checks, optimistic revision conflict handling, publication behavior, and unrelated nodes. No new API or user-facing rule is introduced.

## Minimal source-only change

The existing code creates `new Map(next.nodes.map(...))` for **every node**, while looking up only IDs already present in the validated `request.orderedIds` set. Instead, iterate the cloned nodes and add an entry **only if** `orderedIdSet.has(node.id)`. Preserve the traversal order and `Map#set` overwrite behavior, so even malformed duplicated-ID libraries retain the old last-match lookup semantics. The number of temporary map entries becomes bounded by requested sibling IDs rather than total library nodes. There is no performance SLA or assumption of guaranteed speedup.

Production write set: `packages/contracts/src/reorder.ts` only. Build output `packages/contracts/dist/reorder.js` is ephemeral and must not be committed; existing handwritten/Exploratory tests and CAT semantic artifacts remain unchanged. This is the independent CAT `refactor` flow, not a specification update.

## Preserved oracle / measured checks

Run canonical `refactor-baseline` with the *unchanged* two existing reorder test files (5 JUnit cases) before editing. Run official refactor guard START and FINISH, followed by unchanged-oracle JUnit regression and the entire contracts exploratory suite, plus TypeScript compilation. Additionally compare original and modified exports under deterministic randomized reorder inputs, including optional duplicated IDs, invalid members and revision mismatches. Formal Process Closure / Model Conformance and human acceptance are not inferred from this refactor check.
