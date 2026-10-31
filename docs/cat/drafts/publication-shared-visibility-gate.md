# CAT Draft — Shared effective-public gate in author publication management

Status: **Draft, not Confirmed**. Task `TASK-20261031-001`, candidate `spec-implementation`. Normative inputs: PB-03/05/10–18 in `100_機能仕様.md`, AC-17/20/54/70 in `400_受入検証計画.md`.

The publication management visible/hidden filters must use the same effective-public semantics as the domain's `canReadPublished` contract: all ancestors and self have a published snapshot, are public, and have a non-null start timestamp no later than now. A future-dated or private ancestor hides descendants. This change must not redefine public state or expose drafts.

TCE: Browser publication management visible/hidden filters against seeded public, future and ancestor-private fixtures; existing domain tests for `canReadPublished`. Formal CAT gates and normative Red/Green: **not-run**.
