# CAT Draft — Anonymous browser author-route protection

Status: **Draft, not Confirmed**. Task `TASK-20261031-001`; candidate `spec-implementation`. Inputs: AU-01–04 and PB-03/04 in `100_機能仕様.md`, AC-19/20/21/23/70 in `400_受入検証計画.md`.

An anonymous browser may read public stories, settings, dictionaries and timeline, but opening `/studio`, `/studio/memos`, `/studio/order` or `/studio/publication` must not expose private author data or actionable edit controls. The UI may show a login prompt, while protected admin APIs return 401. The test must not substitute a synthetic author session for the anonymous reader.

TCE: Playwright anonymous browser route inspection and unauthenticated API checks against real built Nuxt/Nest/PostgreSQL. Formal CAT gates and normative Red/Green: **not-run**.
