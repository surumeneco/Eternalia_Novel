# CAT Draft — Browser word meanings and meaning-specific etymology

Status: **Draft, not Confirmed**. Task `TASK-20261031-001`; candidate `spec-implementation`. Inputs: LG-01–07 and PB-18 in `100_機能仕様.md`, AC-36/37/38/57/69 in `400_受入検証計画.md`.

The author word editor supports independently identified meanings. The author can add a meaning, enter its definition and an etymology note, save the draft, and explicitly publish. The persisted JSON contains stable UUID identifiers and meaning-local etymology records; the public projection exposes only the published version. Editing the draft later must not silently update the published meaning.

TCE: Playwright WordMeaningsEditor controls on a disposable word, real Nest/PostgreSQL admin and anonymous readback, synthetic author only. Formal CAT gates and normative Red/Green: **not-run**.
