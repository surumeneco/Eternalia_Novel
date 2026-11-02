---
cat_version: '0.3'
kind: domain-spec
id: eternalia.alpha.logout-duplicate-session-revocation
status: draft
process: eternalia.auth
source_refs:
  - https://drive.google.com/file/d/1nFaATrccBmk965tp5qx_mJnZgjctZZNa/view
  - https://github.com/surumeneco/Eternalia_Novel/pull/11
refs: []
semantic_contract: markdown-v2
language: ja
---

# Alpha auth — duplicate session cookies on logout (CAT Draft)

## Targets

| Ref | Aspect |
| --- | --- |
| eternalia.auth.logout | A logout request must not silently leave another presented valid author-session token active merely because cookieValue selected the first match |

## Rules

| ID | Condition | Requirement | Verification |
| --- | --- | --- | --- |
| AUTH-LOGOUT-01 | Cookie header contains two distinct syntactically valid author-session tokens | Revoke both presented token digests, or prove an equivalent complete invalidation policy; never silently revoke only the first | logoutRevokesBothDistinctPresentedSessionTokens |
| AUTH-LOGOUT-02 | Cookie header repeats the same token twice | Deduplicate revocation work, without treating the repeated token as two separate sessions | logoutDeduplicatesIdenticalSessionTokens |
| AUTH-LOGOUT-03 | One valid author-session cookie | Preserve single-session revocation | logoutRevokesOneSession |

## Test vectors

| ID | Input | Required result |
| --- | --- | --- |
| AUTH-LOGOUT-01 | eternalia_author=A; eternalia_author=B | Two distinct DELETE digest parameters |
| AUTH-LOGOUT-02 | eternalia_author=A; eternalia_author=A | One DELETE digest parameter |
| AUTH-LOGOUT-03 | eternalia_author=A | One DELETE digest parameter |

## Scope and decision status

**Draft only.** The existing isAuthor() duplicate-cookie rejection candidate is covered by PR #11; this Draft addresses the distinct logout revocation boundary. Browsers may present same-name cookies with different Path values, and clearing only the root Path does not prove that all server-side sessions are invalidated. The final policy (revoke all presented tokens, invalidate all sessions for the author, or a proven equivalent) requires normative review. These synthetic DB-spy tests do not prove real cookie Path behavior.

CAT Process/PI/TCE confirmation, normative machine Gates, production Green, real HTTP/PostgreSQL/Discord/browser acceptance: **not-run**. Do not merge expected Red.
