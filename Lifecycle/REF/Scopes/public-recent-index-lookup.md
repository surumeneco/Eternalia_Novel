# Recent-publication projection ID index — independent refactor scope

## Existing guaranteed behavior

At `develop@731d4bf2cf23efada5644d13ac8a658f7b0387b5`, `publicRecent` uses published timestamps and ID ties, clamps the caller limit to [0,50], and invokes the anonymous public ancestor/snapshot projection for each eligible candidate. It must not leak draft, hidden, scheduled or foreign-parent content. This is an independent CAT `refactor` without any new semantic adoption.

## Bounded change

Inside `publicRecent` after the zero-limit early return, build an ID-to-node lookup preserving the *first match* semantics of the original `find()`; pass it into the existing `projectReader` helper for candidate projections. Keep candidate filter/sort, early stopping, error behavior, timestamps, privacy and serialized labels identical. The `publicTree` path and standalone `toReader` signatures remain unchanged. Only `packages/contracts/src/novel.ts` may be hand edited; `packages/contracts/dist/novel.js` is built locally for tests, not committed. Existing tests are immutable.

## Unchanged verification

Five original JUnit cases in `public-recent-privacy`, 187-node `public-tree-volume-privacy`, and `publication-crossdomain-boundary`; supplement with the full contracts exploratory suite and TypeScript compilation. Use pinned CAT-TDD `896cae83` baseline, Guard and regression. No numerical performance SLA or CAT spec-implementation Gate is asserted.
