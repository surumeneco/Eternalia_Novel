# CAT Draft — Localizable shared reader/author shell

Status: **Draft, not Confirmed**. Task `TASK-20261031-001`; candidate `spec-implementation`. Inputs: CM-08 and DS-05 in `100_機能仕様.md`, AC-60/64/75 in `400_受入検証計画.md`.

The shared shell's remaining fixed navigation, accessibility labels and footer description use the typed `useUiLocale` catalog, preserving the existing Japanese strings and route structure. Brand name and user-authored content are not translated. Unknown locale falls back to Japanese. Browser route and responsive acceptance must remain unchanged.

Formal CAT gates and normative Red/Green: **not-run**.
