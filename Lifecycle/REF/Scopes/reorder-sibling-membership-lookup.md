# Reorder sibling membership lookup — refactor scope

- Product repository: `surumeneco/Eternalia_Novel`.
- Verified baseline: `develop` `884b15fce8069828d277cc72f46e8ac75eaae529`, Git tree `48ddb7bc2dcc2a70799d615ac74ad904cf434476`.
- Domain requirement: WR-03, the author can reorder siblings of the same kind within the same parent without changing their identity or visibility.
- Refactor target: `packages/contracts/src/reorder.ts`, `reorderSiblings`, sibling-order validation only.

## Change boundary

Replace the linear membership scan within `siblings.every(...)` with a single precomputed `Set` membership lookup to avoid quadratic validation work on large sibling arrays. Keep the existing behavior for missing, duplicated, foreign-parent, wrong-kind, empty, stale-revision and invalid requests, including the same error codes and messages. Preserve sort ordering, index assignments, clone behavior, published snapshots and returned library shape. No API, persistent model, user-visible control, spec, or test change.

## Unchanged oracle

`packages/contracts/exploratory/reorder.test.mjs`: all 3 tests and exact assertions remain unchanged. Use the same JUnit runner for a fresh pre-change baseline and post-change regression. Supplement with `packages/contracts/exploratory/*.test.mjs` full contract suite. Any change requiring updates to the oracle falls outside this refactor scope.

CAT normative semantic approval is not inferred from this document; this is a behavior-preserving refactor using the independent `refactor` flow.
