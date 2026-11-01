# Alpha publication: stale revision write rejection (CAT Draft)

Status: **Draft** (not Confirmed). Leaf TASK-20261101-008.

## Process / PI

With a valid synthetic author session, publication and visibility writes must enforce the current draft revision. A stale `expectedRevision` returns HTTP 409 without changing the published snapshot or visibility. A subsequent write with the current revision remains valid. These checks complement the existing stale PATCH test; they do not replace real Discord OAuth2/PKCE or non-author browser tests.

## TCE

- SC-PUBLIC-REV-01: after an author saves revision 2, publishing with expected revision 1 returns 409 and the old published body remains readable.
- SC-PUBLIC-REV-02: publishing with revision 2 succeeds and exposes the approved body.
- SC-PUBLIC-REV-03: visibility mutation with stale revision 1 returns 409 and leaves the public chapter visible.
- SC-PUBLIC-REV-04: all mutations use the seeded synthetic author session; anonymous and non-author denial remain independently tested.

Formal CAT machine Gates: **not-run**. Real Discord account/PKCE E2E: **not-run**. No merge or deployment.

Additional guard TCE: authenticated PATCH and DELETE requests must call the write-origin policy; GET and HEAD must not. This is a synthetic guard unit test, not a real OAuth2 test.
