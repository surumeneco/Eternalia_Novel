# CAT Draft — Localizable author memo UI

Status: **Draft, not Confirmed**. Task `TASK-20261031-001`, candidate `spec-implementation`. Inputs: CM-02/05/08 in `100_機能仕様.md` and AC-58/64/75 in `400_受入検証計画.md`.

The memo page's fixed prompts, validation, save/readback status, form labels, search and empty-state text use the typed `useUiLocale` catalog while preserving their existing Japanese wording. User-authored memo titles, bodies and tags are not translated. Unknown locale falls back to Japanese; no new translation language is adopted.

TCE: catalog-key fallback unit assertions and existing Playwright memo create/edit/search/readback acceptance. Formal CAT doctor/guards/process-closure/TestModel/vectors/Queue/conformance and normative Red/Green: **not-run**.
