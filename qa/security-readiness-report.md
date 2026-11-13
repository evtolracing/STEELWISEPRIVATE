# Security readiness report

Yardstick: OWASP Top 10 and ASVS, used as a checklist. No penetration test was run and no compliance is claimed.

| Control | State | Evidence |
|---|---|---|
| Every API route needs a sign-in unless listed as public | In place | Sweep: 535 routes refuse a request with no token |
| Customer logins held to the store | In place | Sweep: 512 staff routes refuse a customer login |
| Customers and divisions isolated from each other | In place | Sweep: 31 checks |
| Staff limited to their department's records; money decisions need a manager | In place | Sweep: 18 checks; unit tests |
| Forged, expired and wrong-key tokens refused | In place | Sweep: 5 cases |
| Partner API uses its own key | In place | Sweep: 60 calls |
| Secrets: production refuses to start with a missing or short signing key | In place | `config/index.js` |
| Security headers | In place | `helmet` in `app.js` |
| Cross-origin requests | Allow-list in production | `app.js` |
| Login attempts limited per address and email | In place, per instance only | E-014 |
| General rate limit | Per instance only | E-014, open |
| Error replies do not expose internals | In place | Sweep: 0 exposed across 750 bad-input reads |
| Web checkout price set by the server | In place | Sweep: 4 checks |
| Uploads: type allow-list and size limit | In place | Sweep: 11 checks |
| Known-vulnerable packages | Backend 8 to 1, frontend 11 to 2; none high or critical | `npm audit --omit=dev` |
| Request tracing | Added | E-008 |

## Open

- Shared rate limit (E-014).
- The three remaining moderate package advisories need major version changes (uuid, react-router).
- Sign-in sessions last 8 hours. Deactivating a user stops their token at once, but there is no way to end one session of an active user. Not yet assessed in depth.
- No audit of who can read what at the branch level beyond the customer and department rules above (Workstream 6).
- Password policy, lockout and multi-factor sign-in not yet reviewed.
- No independent penetration test.
