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

The rule requires normative review: duplicate cookies can arise from different Path scopes, and fail-closed rejection may require client-side cleanup or migration behavior. The feature branch contains a **provisional** parser guard which requires exactly one matching cookie; this is not a Confirmed specification or a deployed release. The exploratory Node test failed for two distinct/identical duplicate cases at [Red run #42633771775](https://github.com/surumeneco/Eternalia_Novel/actions/runs/42633771775), then passed for those cases at [Green run #42634122749](https://github.com/surumeneco/Eternalia_Novel/actions/runs/42634122749), 4/4 CI jobs successful. The real Discord OAuth/PKCE flow, browser Cookie Path collision/cleanup and normative CAT Process Closure, Model/Implementation Conformance remain **not-run**; these test results are not an approval to merge into `develop`.
