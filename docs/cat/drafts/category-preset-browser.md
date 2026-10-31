# CAT Draft — Category preset copy-on-create via author browser

Status: **Draft, not Confirmed**. Task `TASK-20261031-001`; candidate `spec-implementation`. Inputs: ST-01–05 and WR-02 in `100_機能仕様.md`, AC-30/31/32/69 in `400_受入検証計画.md`.

An author edits category presets in the actual browser editor and saves the category draft. Creating a new Tip under that category copies the current preset titles, order and bodies into new TipSection children once. Subsequent edits to the category presets must not mutate previously created TipSections. The test uses a disposable subtree and real Nest/PostgreSQL readback.

TCE: Playwright CategoryPresetEditor controls, admin create/read, and explicit checks of one-time copy semantics. Synthetic author only; formal CAT gates and normative Red/Green **not-run**.
