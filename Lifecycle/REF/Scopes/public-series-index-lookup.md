# Published series list ID lookup — independent refactor scope

## Existing authority and source

Preserve adopted PB-03/PB-10/PB-18 anonymity, published snapshots and public series navigation. Fixed source: `develop@0ee8c6643b18a0e8717b5e290cda395303c49c82`, `packages/contracts/src/novel.ts` blob `b4924916b2620c19859768a9c2176f65a1624a10`. The source was independently reconstructed from authenticated full Git snapshot `5997cb49` with all intervening contract-source diffs; its git blob hash matches current GitHub. This host staging has a **synthetic local git HEAD** and is not a remote checkout identity.

## Behavior and write boundary

`publicSeries` currently calls standalone `toReader` for each top-level series, causing a linear `find(library, id)` search per candidate and ancestor. Reuse a per-call map of **first ID occurrence**, and call the already existing `projectReader` helper. Keep series eligibility, public/ancestor/scheduled visibility, title and draft separation, returned order, and serialized payload *exactly* as before. Do not change `toReader`, `publicTree`, `publicRecent`, DB/HTTP output, error literals, or any tests. Only hand-edit `packages/contracts/src/novel.ts`; its `dist/novel.js` output is compiler-generated for local tests and is not committed.

## Unchanged oracle and Gate boundaries

Two existing named Node JUnit cases in `packages/contracts/exploratory/novel.test.mjs` are required for CAT before/after. Supplement with full existing contracts exploratory tests and TypeScript compilation, and compare old/new output over randomized multi-series libraries including unpublished/private/scheduled and repeated-ID cases. Execute pinned CAT-TDD `896cae83` refactor-baseline, Guard START/FINISH and regression. These are independent refactor checks, not CAT Process Closure/Model Conformance nor user approval. No speedup SLA or release claim is made.
