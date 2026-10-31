# CAT Draft — Localizable publication management UI

Status: **Draft, not Confirmed**. Task `TASK-20261031-001`; candidate `spec-implementation`. Requirements: CM-08 and CM-05 in `100_機能仕様.md`, AC-64/75 in `400_受入検証計画.md`.

## Process / PI candidates

The author publication-management page retains its current Japanese labels, status text, confirmation, validation and error messages. All fixed text is obtained from the same typed `useUiLocale` catalog used by the studio. Domain data (author titles, published content, dates and server-supplied validation messages) is not translated. Unknown locale falls back to Japanese. No unapproved additional language is shipped.

## TCE candidates

- Static tests assert every migrated publication-management catalog key and Japanese fallback.
- Existing Playwright management route, schedule, privacy and readback tests continue to find the same Japanese labels.
- The migration must not change publication state semantics or API requests.

Formal CAT gates and normative Red/Green: **not-run**.
