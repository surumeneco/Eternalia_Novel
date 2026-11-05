# CAT Draft — Browser author edit/save/publish across four domains

Status: **Draft, not Confirmed**. Task `TASK-20261031-001`; candidate `spec-implementation`.

## Normative inputs

`100_機能仕様.md` WR-02, ST-02, LG-01–07, TL-01–06, PB-18; `400_受入検証計画.md` AC-03/05/08/16/20/57/69/70; `430_α版段階的実装計画・引継ぎ_20261029.md` A2–A6.

## Process candidate

Using an empty disposable PostgreSQL DB and a synthetic authorized author session, create the required ancestors through the real admin API under a newly published series. For each representative leaf (Chapter, TipSection, Word, Event), use the **actual Nuxt author editor** to enter text and save a draft. Anonymous direct API access must still return 404 before publication. Explicitly publish the saved draft from the browser, then verify anonymous access to that exact body. Edit and save a second draft, verify the reader still sees the first published body, then explicitly republish and verify the new body.

## PI/TCE candidates

- PI-1: All four content domains support author editor save and explicit publication.
- PI-2: Draft saving alone does not expose an unpublished item or replace its existing published snapshot.
- PI-3: Publication is the only operation that updates the reader-visible snapshot.
- PI-4: Ancestor publication is required for anonymous access; created test nodes do not affect existing fixtures.
- TCE: Browser editor interactions + real Nest API/PostgreSQL assertions for 4 leaf kinds × two publication revisions.

This does not verify real Discord OAuth2 or a human-operated device. Formal CAT doctor/guards/process-closure/TestModel/vectors/Queue/conformance and normative Red/Green: **not-run**.
