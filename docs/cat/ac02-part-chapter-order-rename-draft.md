# CAT Draft — AC-02: part and chapter order/rename persistence

Status: **Draft, not Confirmed**. Parent Task: `TASK-20261031-001`. Flow candidate: `issue-work`; Work kind: `verification`. Source: `forGPT/Creating/Projects/Websites/Eternalia_Novel/40_開発・検証/400_受入検証計画.md` (AC-02). Complements `docs/cat/ac02-volume-order-and-rename-draft.md`; does not replace it.

## Behavior under verification

- Within one volume, two sibling parts can be reordered from the author's order screen. The persisted order is stable after reload and leaves IDs, parent IDs and children unchanged.
- Renaming a part updates only its draft title, without changing sibling order or the identity/parent of its chapter.
- Renaming a chapter updates only its draft title, without changing the parent part, other chapters or the saved order.
- Author draft saves do not silently publish a new public title. This Work verifies author-side persistence; public snapshot changes, Discord OAuth and manual acceptance require separate evidence.

## Exploratory vectors

| Case | Action | Expected |
| --- | --- | --- |
| V1 | Create sibling parts A/B under one volume and reorder A below B | DB order B=0/A=1; same IDs and parent IDs |
| V2 | Reload order screen | B→A order remains |
| V3 | Rename A in Studio, save and reload | A draft title changes, B unchanged; order preserved |
| V4 | Rename a chapter under A, save and reload | Chapter draft title changes, parent ID and part identity unchanged |

Use isolated Nuxt/Nest/PostgreSQL Chromium tests with a synthetic author session. Formal CAT process-closure, TestModel, model-conformance, vectors/Queue, Red/Green and implementation-conformance are **not-run**; this Draft is not normative approval.
