---
cat_version: '0.3'
kind: domain-spec
id: eternalia.alpha.oauth-duplicate-state-cookie
status: draft
process: eternalia.auth
source_refs:
  - https://drive.google.com/file/d/1nFaATrccBmk965tp5qx_mJnZgjctZZNa/view
refs: []
semantic_contract: markdown-v2
language: ja
---

# Alpha: ambiguous OAuth state-cookie rejection (CAT Draft)

Status: **Draft**, not Confirmed. Leaf TASK-20261101-008.

## Security boundary

OAuth callback receives a `Cookie` header and a query `state`. A request can contain two `eternalia_oauth_state` cookie pairs, including a valid value followed by a conflicting or identical value. Choosing the first matching cookie silently depends on header ordering and cookie-path collision behavior. This Draft proposes that ambiguity be rejected **before** consuming a one-time state, contacting Discord, or creating a session.

## Candidate acceptance vectors

| ID | Input | Expected observation |
| --- | --- | --- |
| AC-OAUTH-COOKIE-01 | Two different state-cookie values; first matches query | Unauthorized; no state deletion, token request, or session |
| AC-OAUTH-COOKIE-02 | Two identical state-cookie values | Unauthorized; no state deletion, token request, or session |
| AC-OAUTH-COOKIE-03 | Exactly one valid state-cookie value and matching query | Existing one-time state consumption and subsequent OAuth error handling unchanged |

The rule requires normative review: duplicate cookies can arise from different Path scopes, and fail-closed rejection may require client-side cleanup or migration behavior. These are synthetic Node tests only, not real Discord OAuth/PKCE, browser or DB acceptance. Formal CAT machine Gates not-run; do not implement production changes or merge an intentionally Red PR until Confirmed.
