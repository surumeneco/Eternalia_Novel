# Public search lifecycle guard unification — refactor scope

Source: `surumeneco/Eternalia_Novel` `develop@98925abe05c82c39023de1cba2570206bda174b3` (tree `e7b77febcbc1c0219685259f30b55e999e74df87`).

## Production write boundary

- `apps/web/app/pages/search.vue` only. Replace its locally duplicated visibility/BFCache lifecycle machinery with the existing `usePublicReaderRevalidation` composable that other public reader screens already use.
- Do not edit the shared composable, HTTP endpoints, publication model, generated tests, acceptance oracles, reader filter logic, or server-side rendering.

## Preserved observable behavior

- Anonymous search still clears previously published result data when the tab is hidden or the page is cached; backgrounded pages do not refetch until visible.
- A visible return and a persisted `pageshow` re-fetch both series and selected-series public tree; stale data never reappears on a failed refresh.
- During refresh the existing skeleton and error/retry UI remain in control; search query, selected series, domain and sort are retained.
- Published ancestor becoming scheduled/private removes titles and snippets; re-publication can re-display a newly published snapshot without navigating away.
- SSR initial HTML, anonymous access controls, author permissions and real-time revocation guarantees are unchanged; real OS tab switches, actual BFCache and external caches are not covered by the synthetic browser lifecycle tests.

## Unchanged acceptance oracle

- `apps/web/browser-acceptance/public-search-resume-revalidation.test.mjs`: two Chromium/PostgreSQL scenarios (`PUB-RESUME-01/02` and `PUB-RESUME-03/04`) for hidden/visible and BFCache-style 503.
- Baseline evidence: successful `develop@98925abe` run [#43620482653](https://github.com/surumeneco/Eternalia_Novel/actions/runs/43620482653). A CI run is exploratory behavior evidence, **not** a CAT script-owned refactor-baseline Gate. CAT formal Gate is pending if the browser runner cannot be executed under its declared stage.
- Repeat the identical existing acceptance tests and build/typecheck in CI on the changed feature HEAD. No test rewrite or artificial Red for a behavior-preserving refactor.
