# Mobile shell background predicate boundary — refactor scope

Fixed baseline: develop `4c4e6e8d15171dd99102b30b5641f5472996b153`. Confirmed Process/PI/TCE `eternalia.ui.mobile-shell-focus` limits the background predicate to the three menu states; actual DOM, focus and touch remain independent observations.

- Extract the existing boolean `navOpen.value || asideOpen.value` into a pure predicate for `closed`, `primary`, `secondary`. Keep all current state transitions and DOM bindings. If both flags were true, preserve old result by primary priority.
- Only `apps/web/app/layouts/default.vue` and new `apps/web/app/utils/mobile-shell-background.ts` may change in refactor stage. No test, Confirmed spec, Queue, other feature or evidence changes.
- Baseline and regression: unchanged six tests in `apps/web/browser-acceptance/admin-grid-shell.test.mjs`, real Chromium/PostgreSQL, includes existing navigation, access, labels, focus, touch, reflow and session expiry. Verify exact named JUnit and guard before committing the source.
