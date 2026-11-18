# Phase 10: API and document security

Group 3 of the Phase 10 suite (`qa/sim/phase10/g3-api.mjs`, 40 scenarios) and the partner scenarios of group 6.

## Requests

| Control | Behaviour | Scenario |
|---|---|---|
| Security headers | On every answer; the server does not name what it runs | "Security headers are on every answer ..." |
| Body size | 5 MB limit; a 6 MB body is refused without being read into memory | "A body larger than the 5 MB limit is refused ..." |
| Broken JSON | 400, no stack trace | "Broken JSON is answered with 400 ..." |
| Injection | Search text that looks like SQL or a template is text everywhere | "Search text that looks like SQL ..." |
| Prototype pollution | A body with `__proto__` changes nothing | "A body that tries to change object prototypes ..." |
| Database errors | Never reach the caller | "An error from the database does not reach the caller" |
| Production start | Refuses to start without its signing secret and database | "In production the server refuses to start ..." |
| Browser origins | In production only the allowed origins | "In production only the allowed origins ..." |
| Download headers | A file name with quotes and line breaks cannot split headers | "A file name with quotes and line breaks ..." |

## Uploads (Y-004, Y-005, Y-006, B-021)

- The folder is taken from the entity type only if it is plain letters and underscores; anything else is `general`. A traversal attempt is written inside the uploads folder.
- The stored name is a random stem plus the extension of the accepted type. The sender's name is kept only as the display name.
- The first bytes must match the declared type. Refused, with nothing kept: a web page sent as text or as a PDF, an SVG with a script attribute or element, a PNG that is a GIF, a JPEG that is text, an empty file, a spreadsheet that is not a zip, a program, a web page by its own type.
- The static `/uploads` route is gone. A file is read only through `GET /api/documents/:id/download`, signed in, and within the branch boundary (Y-016).

## Partner API

- Tokens from `POST /api/v1/partner/auth/token` with client id and secret. A wrong secret is refused without saying which part was wrong. The partner API refuses a token from the staff signing path (issuer checked).
- A revoked key stops working at once, not when its token expires, and records who revoked it (Y-017).
- Scopes are enforced per route; a partner without the scope is refused.
- Per-partner rate limits, with a burst limit, answer 429.
- Webhooks: signed over the body and with a timed signature; the secret is shown once at creation and never in a list; a private address is refused in production; another partner never receives this partner's events.
- Partner administration is administrators only (Y-019).

## Rate limits

The per-address limit for staff routes counts per server instance (E-014, unchanged). Sign-in guessing is stopped per login in the database (Y-002), which does not depend on the instance.
