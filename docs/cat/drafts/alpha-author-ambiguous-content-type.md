# Alpha author write boundary: ambiguous Content-Type values (CAT Draft)

Status: **Draft**, not Confirmed. Leaf: `TASK-20261101-008`.

## Process / PI

An author mutation must have a single unambiguous JSON media type and the configured exact Origin. `Content-Type` is not a comma-separated list header. A proxy-combined or otherwise ambiguous value such as `application/json; charset=utf-8, text/plain` must not be accepted merely because the prefix before the first semicolon is `application/json`.

Reject comma-bearing Content-Type values before applying the existing exact media type check. Preserve valid `application/json` and `application/json; charset=utf-8`. This is a defensive boundary check; it does not replace real Discord OAuth2/PKCE, browser cookie, or proxy configuration acceptance.

## TCE / acceptance vectors

- AUTH-MEDIA-09: `application/json; charset=utf-8, text/plain` -> forbidden.
- AUTH-MEDIA-10: `application/json; charset=utf-8, application/x-www-form-urlencoded` -> forbidden.
- AUTH-MEDIA-11: `application/json; charset=utf-8` -> allowed with matching Origin.
- AUTH-MEDIA-12: wrong Origin remains forbidden regardless of media type.

Formal CAT machine Gates and real OAuth2/PKCE browser acceptance remain not-run until executed.
