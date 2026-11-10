# CAT Draft — Author memo persistence and post-write readback

Status: **Draft, not Confirmed**. Task `TASK-20261031-001`, candidate `spec-implementation`. Inputs: `100_機能仕様.md` CM-02/05/06 and `400_受入検証計画.md` AC-11/14/58/75.

## Process candidate

An authenticated author creates a memo with title, body and tags in the actual Nuxt memo editor. The memo is persisted through Nest/PostgreSQL, appears in the author list, and can be found by tag. Unsaved edits trigger a discard confirmation. Saving an edit updates the memo revision and persistence. If the mutation succeeds but the subsequent memo-list readback fails, the UI must report the readback failure instead of claiming verified success; a manual reload must reconcile the saved state.

## PI/TCE candidates

- PI-1: Title/body/tags persist, with no anonymous memo access.
- PI-2: Unsaved memo changes are not silently discarded on navigation.
- PI-3: Successful write + failed readback is not falsely acknowledged as confirmed.
- PI-4: A later reload reconciles the server state without automatically replaying the write.
- TCE: Playwright browser author flow with disposable PostgreSQL, synthetic author, GET interception for the post-write readback and API verification.

Formal CAT doctor/guards/process-closure/TestModel/vectors/Queue/conformance and normative Red/Green: **not-run**.
