# CAT Draft — AC-19/22: authenticated non-author must not mutate author data

Status: **Draft, not Confirmed**. Parent Task: `TASK-20261031-001`. Flow candidate: `issue-work`; Work kind: `verification`. Source: `forGPT/Creating/Projects/Websites/Eternalia_Novel/10_要件定義/100_機能仕様.md` (single authorized author and Discord identity) and `40_開発・検証/400_受入検証計画.md` (AC-19, AC-22).

## Contract under verification

- An authenticated Discord identity other than the configured author is a reader, not an editor.
- The non-author's valid application session must not read private author libraries or memos, create a series/memo, edit a draft, or publish an existing draft.
- A rejected mutation must not alter existing draft revision/content or create an unauthorized record.
- Anonymous public reading remains permitted; author-only writes require both a valid session and the authorized identity.

## Exploratory verification vectors

| Case | Action with valid non-author synthetic session | Expected |
| --- | --- | --- |
| V1 | GET admin nodes and memos | 401; no private data |
| V2 | POST a new series and memo | 401; no new record |
| V3 | PATCH an existing chapter's draft | 401; revision and body unchanged |
| V4 | POST publish for an existing chapter | 401; public snapshot unchanged |
| V5 | Repeat authorized readback | No unauthorized changes |

This Work checks the actual Nest/Nuxt/PostgreSQL HTTP boundary with a synthetic non-author session in an isolated CI database. It does **not** verify Discord OAuth2 itself or a real non-author Discord account. Formal process-closure, model-conformance, generated TestModel/Queue and normative Red/Green remain **not-run**. No normative promotion is authorized by this Draft.
