# CAT Draft — Author-scheduled publication boundary

Status: **Draft, not Confirmed**; task `TASK-20261031-001`. Candidate `spec-implementation` flow.

## Normative inputs

`100_機能仕様.md` PB-05: publication start time is required and future-dated content is not public; ancestor conditions apply. `400_受入検証計画.md` AC-17/20/54/70 and `430_α版段階的実装計画・引継ぎ_20261029.md` A6/W6.1.

## Process candidate

A published series is visible anonymously. The author sets its publication start date to a future local datetime using the existing studio UI. The API and reader view must withhold the series until that time. Clearing the date via the author UI makes the unchanged published snapshot immediately available again. This test uses a far-future date, not a claim about sub-second boundary precision or time-zone rounding rules (still undecided).

## PI / TCE candidates

- PI-1: A future `publicSince` hides a published series and its descendants from anonymous readers.
- PI-2: Clearing `publicSince` restores visibility without rewriting the snapshot or draft.
- PI-3: UI input roundtrip and backend timestamp semantics agree for a far-future date.
- TCE: Playwright author date input → API 404 → clear date → API 200 and unchanged content; synthetic author + disposable DB only.

Formal CAT gates and normative Red/Green: **not-run**.
