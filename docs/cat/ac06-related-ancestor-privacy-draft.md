# CAT Draft — related Tip links respect ancestor publication boundaries

Status: **Draft, not Confirmed**. Parent Task: `TASK-20261031-001`. Flow candidate: `issue-work`; Work kind: `verification`. Related acceptance: AC-06, AC-31 and AC-70. Normative sources: `forGPT/Creating/Projects/Websites/Eternalia_Novel/必読.md` (an unpublished ancestor hides all descendants) and current `400_受入検証計画.md`. This Draft does not supersede them.

## Behavior under verification

- A published source Tip may reference another Tip in the same series but a different category.
- When the target's own publication is valid and all its ancestors are effectively public, an anonymous reader may see its related-link projection.
- Hiding the target category must remove the target from the anonymous source Tip's related links, even when the target Tip's own stored public flag remains true.
- Re-publishing that category may restore the related link without rewriting the source Tip's draft relationship or publishing an unsaved draft.
- The source Tip, its published content, and its independent visibility remain unchanged throughout.
- Author-only draft relations must not be erased as a side effect of anonymous projection filtering.

## Exploratory vectors (not generated CAT tests)

| Case | Action | Expected |
| --- | --- | --- |
| V1 | Publish series, source category/Tip, target category/Tip; link target in source and publish source | Anonymous source contains the target link |
| V2 | Hide target category only | Anonymous source still 200, target omitted from related links, target direct public API 404 |
| V3 | Read author source draft | Original target relation ID still stored |
| V4 | Re-publish target category | Anonymous target and related link return without changing source draft |
| V5 | Check unrelated source and target state | Source published body and target's own stored visibility are preserved |
| V6 | Attempt to add a related Tip from a different series | Domain and HTTP reject the change; source draft and stored revision are unchanged |
| V7 | Edit a related target's draft title without publishing, then explicitly publish it | Anonymous source link keeps the old title until publication and then uses the new title |

Use the isolated Nuxt/Nest/PostgreSQL Chromium acceptance environment and a synthetic author session. This does not test real Discord OAuth, production deployment, or human visual acceptance. Formal process-closure, TestModel, model-conformance, vectors/Queue, and implementation-conformance are **not-run**. Do not promote this Draft to Confirmed without legitimate authority.
