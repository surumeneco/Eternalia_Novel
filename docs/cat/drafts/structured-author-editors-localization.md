# CAT Draft — Localizable structured author editors

Status: **Draft, not Confirmed**. Task `TASK-20261031-001`, candidate `spec-implementation`. Inputs: CM-08, ST-02–10, LG-01–07 in `100_機能仕様.md`, AC-31–39/64/75 in `400_受入検証計画.md`.

Fixed labels, validation messages, action names and accessibility names in CategoryPresetEditor, TipLinksEditor, WordMeaningsEditor and LanguageStructureEditor must use the same typed Japanese `useUiLocale` catalog as the author workspace. Preserve the exact Japanese user-facing text and all structured data semantics; user-authored symbols, meanings, tags, related titles and etymology notes are not translated. Unknown locale falls back to Japanese.

TCE: catalog-key fallback unit assertions and browser structured editor save/publish tests. Formal CAT gates and normative Red/Green: **not-run**.
