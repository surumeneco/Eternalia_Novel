# Sibling reorder validation: remove redundant sort (refactor scope)

## Authority and observed source

- Existing adopted requirement: WR-03, reorder siblings of the requested kind/parent while preserving draft and reader publication boundaries. This refactor makes **no new semantic decision**.
- At `develop@9b01cf9630bfeb369d3646720d52a369f7651b61`, `packages/contracts/src/reorder.ts` sorts siblings before using them solely for membership and revision checks. `orderedIds` determines actual updated positions.
- Local source authenticity: the unmodified production and test files were extracted from verified `5997cb49` tree `a697334f9af0b5cda46695bddb82189d2e97fff5`. The GitHub comparison `5997cb49...9b01cf96` changes only CAT Work metadata/docs. A local *synthetic* Git HEAD was used for guard testing, never represented as a remote SHA. Generated TypeScript dist was rebuilt locally before and after the change.

## Production write boundary

Only `packages/contracts/src/reorder.ts`: remove its redundant `siblings.sort(...)` in `reorderSiblings` and preserve filtering, membership, revision checks, cloning, positions and error literals. `packages/contracts/dist/reorder.js` is a generated local/CI build output and is not hand-edited or committed. Do not modify tests, publication semantics, API, database, CAT specs, Queue or evidence.

## Preserved observable behavior

- Same same-parent/same-kind full permutation, duplicate/missing ID checks, wrong-kind/foreign parent handling and stale revision conflicts, with the same error code and message.
- Same `order`, `revision`, `updatedAt`, cloning, `next.nodes` ordering and reader-projection results.
- Only the order of internal revision checks may vary. All resulting conflict errors are identical; no loop side effects exist.
- Eliminates an unnecessary O(s log s) sort over s siblings for every reorder validation, while retaining the current Set membership check. No performance SLA or measured latency improvement is claimed.

## Unchanged test oracle and CAT procedure

- `packages/contracts/exploratory/reorder.test.mjs`: 3 unchanged named Node JUnit cases.
- Pinned CAT-TDD source `896cae83`: actual `refactor-baseline` JUnit 3/3 PASS; Guard START PASS; first isolated Guard FINISH BLOCKED because executor-owned `.cat-flow/guards` appeared as untracked files; clean second local worktree with *Git info/exclude only* for `.cat-flow/`: baseline 3/3 PASS, Guard START/FINISH PASS with zero violations, regression 3/3 PASS.
- Separate supplementary TypeScript compilation and `packages/contracts/exploratory/*.test.mjs` tests 96/96 PASS. The original baseline is normally `stale` after source modification by CAT fingerprint design; its pre-change receipt and successful Guard start are retained.
- No Process Closure, Model Conformance, implementation-conformance, user acceptance or release approval is inferred from independent refactor checks.
