# Alpha Discord author configuration: canonical APP_ORIGIN (CAT Draft)

Status: **Draft**, not Confirmed. Leaf: `TASK-20261101-008`.

## Process / PI

The configured application origin is an exact browser Origin and the base of the OAuth2 redirect URI. A permissive `http(s)://` prefix check can accept a string containing URL userinfo, query, fragment, or noncanonical authority text, which is not an origin and may construct an incorrect redirect.

Treat `APP_ORIGIN` as configured only when it parses as an HTTP(S) URL whose canonical `URL.origin` equals the supplied string, with no username or password. Do not silently trim or rewrite configuration. A missing or malformed origin leaves author authentication unavailable, not partially configured.

## TCE / acceptance vectors

- AUTH-ORIGIN-01: `https://example.test` and `http://127.0.0.1:3000` are valid.
- AUTH-ORIGIN-02: `https://example.test?next=evil`, `https://example.test#fragment`, `https://user@example.test` are invalid.
- AUTH-ORIGIN-03: `https://example.test/path` and `https://example.test/` are invalid as exact configured origins.
- AUTH-ORIGIN-04: a valid origin still requires the other author configuration fields.

This does not replace a real Discord OAuth2/PKCE integration test or validate deployment proxy headers.
