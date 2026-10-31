# CAT Draft — Localizable public search UI

Status: **Draft, not Confirmed**. Task `TASK-20261031-001`; candidate `spec-implementation`. Inputs: CM-08 and PB-10–18 in `100_機能仕様.md`, AC-45/64/75 in `400_受入検証計画.md`.

The public search screen's fixed navigation, filter, sort, loading/error/empty and result metadata labels use the typed Japanese `useUiLocale` catalog. The existing Japanese strings, search behavior, published-only data source and route structure remain unchanged. User-authored titles, bodies, tags and word meanings are never translated. Unknown locale falls back to Japanese.

TCE: catalog fallback assertions and anonymous search privacy browser acceptance. Formal CAT gates and normative Red/Green: **not-run**.
