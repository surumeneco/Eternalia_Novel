# CAT Draft — Localizable author order editor

Status: **Draft, not Confirmed**. Task `TASK-20261031-001`, candidate `spec-implementation`. Requirements: CM-08 and WR-03 in `100_機能仕様.md`, AC-02/64/75 in `400_受入検証計画.md`.

The order editor's fixed labels, move controls, confirmation dialogs, loading/error/success text and navigation use the typed `useUiLocale` catalog without changing Japanese wording or order semantics. Author-created titles remain unchanged. Unknown locales fall back to Japanese; no unapproved translations are added. Browser reorder and discard-guard acceptance must remain green.

Formal CAT gates and normative Red/Green: **not-run**.
