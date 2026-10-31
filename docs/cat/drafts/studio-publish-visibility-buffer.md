# CAT Draft — Studio publication and edit-buffer preservation

Status: **Draft / not Confirmed**. Task: `TASK-20261031-001`.
Flow: `spec-implementation` candidate; formal CAT routing, guards, process-closure, TestModel, vectors and Queue are **not-run** in this execution environment. This document is not a generated CAT artifact or a passed gate.

## Normative inputs

- `forGPT/Eternalia_Novel/10_要件定義/100_機能仕様.md`: WR-02/05/07, PB-18 (saved draft versus explicit public snapshot), CM-06.
- `forGPT/Eternalia_Novel/40_開発・検証/400_受入検証計画.md`: AC-03, AC-11, AC-16, AC-65, AC-69.
- Existing `apps/web/app/pages/studio.vue`, `apps/web/browser-acceptance/browser-acceptance.test.mjs` on feature branch.

## Process candidate

1. Given a published series, the author edits the form without saving.
2. Publishing applies the **last saved draft** only; the unsaved editor buffer is not published and remains in the textarea.
3. The author can explicitly change the series visibility to private; an anonymous reader must receive 404 on the direct public item endpoint and public page.
4. Restoring visibility makes the existing public snapshot readable again without publishing the unsaved editor buffer.
5. A subsequent explicit save followed by publish updates the reader-visible snapshot.

## PI candidates

- PI-1: Unsaved form content never changes public snapshots, including when publication or visibility refreshes the author library.
- PI-2: Publication/visibility reloads preserve the current item's unsaved form buffer.
- PI-3: The effective-public rule applies to anonymous API and direct browser navigation.
- PI-4: The published content remains the saved draft until the author explicitly republishes.

## TCE candidates (browser + real disposable PostgreSQL)

- TCE-1: Published series is anonymously visible.
- TCE-2: Unsaved edits survive the publish action; anonymous content stays unchanged.
- TCE-3: Private toggle hides the direct URL and public API; restoration exposes the same published snapshot.
- TCE-4: Saved draft plus explicit republish becomes reader-visible.

Test environment: built Nuxt + NestJS, ephemeral PostgreSQL, Playwright Chromium, **synthetic** author session. This does **not** verify real Discord OAuth2, actual device IME or formal CAT gates. Avoid production databases; require `HTTP_ACCEPTANCE_DISPOSABLE_DB=1`.

## Execution state

- Source requirements: adopted as described above.
- CAT Draft: created before changes to browser test or production source.
- Formal CAT promotion/doctor/process-closure/model-conformance/vectors/Queue: not-run, not passed.
- Red/Green: pending observed CI for exact commits.
