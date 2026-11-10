# Reader chapter-sequence index refactor scope

Source: `surumeneco/Eternalia_Novel` α feature HEAD `ffd9667a229536be4fc9fe637bcd6166b3266ea7` (root tree `69f068321a9ba08bdce9a410567c2d385591407c`).

## Authorized production change

- `apps/web/app/utils/chapter-navigation.ts` only.
- Replace repeated full-tree child filtering with a one-pass lookup by `parentId` and `kind` for published volume/part/chapter traversal. Keep input immutable and return a new array.

## Preserved observable behavior

- Unknown series ID or a node lacking `series` kind returns an empty sequence.
- Traverse only the supplied public tree; preserve series→volume→part→chapter ancestry.
- Preserve existing numeric `order` sort and Japanese title tie-breaking at each sibling level. Preserve stable sort behavior on exact ties.
- Returned chapter objects remain original ReaderNode references; no mutation or filtering of original input.
- No change to public visibility, fetch/API, content, UI routes, test or specification semantics.

## Baseline and regression

- Unmodified oracle: `apps/web/tests/chapter-navigation.test.mjs` (three independent tests).
- JUnit baseline: execute the pinned Node 22 test on the source before changing production.
- JUnit regression: run precisely the same test and its unchanged assertions after changing production.
- Full web unit regression (50 tests) run separately, with actual exit status recorded.

This is a behavior-preserving internal refactor. If the old oracle would need changing, the refactor must stop and be routed to a specification decision.
