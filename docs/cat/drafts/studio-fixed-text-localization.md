# CAT Draft — Localizable fixed text in author workspace

Status: **Draft, not Confirmed**. Task `TASK-20261031-001`. Candidate flow `spec-implementation`; CAT machine gates **not-run**.

## Requirements

- `100_機能仕様.md`: CM-08 (fixed UI and error text must be localization-capable), WR-02/05 and PB-18.
- `400_受入検証計画.md`: AC-64/75 (fixed messages, errors, state), AC-65 (editor toolbar).
- Current `useUiLocale.ts` provides Japanese fallback and extension point for reviewed catalogs. No unapproved additional locale or translation is introduced.

## Process / PI candidates

- A Japanese author sees the same established labels, warnings, prompts and status messages.
- Fixed text comes from a typed catalog key rather than hardcoded in the studio component.
- User-authored titles, manuscript body and dictionary entries are never translated.
- An unknown locale falls back to Japanese; only explicitly supplied complete reviewed catalogs override it.
- Dialogs for unsaved work and explicit publication continue to protect edits.

## TCE candidates

- Static catalog-key presence for all newly migrated studio messages.
- Japanese fallback assertions for prompts and validation messages.
- Existing browser acceptance retains identical Japanese text and author workflow.

The implementation is a **partial migration** of fixed text, not a claim that every screen is fully internationalized. No CAT process-closure/TestModel/vectors/Queue/guard or official Red/Green pass is claimed.

## Extended scope candidate (same Work)

The remaining fixed text in the studio template (navigation, authentication, library filters, create/edit form, publication controls, empty states), plus the static kind/filter labels, should use the same typed Japanese catalog. Preserve existing Japanese strings exactly, including the distinction between `設定` and `設定集`. Keep user-authored data and backend-provided validation messages untouched. TCE: static catalog fallback assertions plus existing browser acceptance of unchanged Japanese labels.
