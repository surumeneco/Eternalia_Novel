# Alpha author write Origin: exact JSON media type (CAT Draft)

Status: **Draft** (not Confirmed). Leaf TASK-20261101-008.

## Process / PI

An authenticated author's state-changing HTTP request must satisfy both the configured same-origin check and an exact `application/json` media type, allowing ordinary semicolon parameters such as `charset=utf-8`. Prefix lookalikes such as `application/jsonp`, `application/json-seq`, or `application/json-malformed` must not pass the write-origin guard. This is independent of the Nest body parser and is not a substitute for real Discord OAuth2/PKCE acceptance.

## TCE

- AUTHOR-JSON-01 (Red): `application/jsonp` and `application/json-malformed` are rejected, not accepted by a prefix check.
- AUTHOR-JSON-02: `application/json` and `Application/JSON; charset=utf-8` are accepted.
- AUTHOR-JSON-03: missing, empty and non-JSON media types are rejected.
- AUTHOR-JSON-04: same-origin and authenticated author checks remain independent requirements.

Formal CAT machine Gate and real Discord account test: **not-run**.
