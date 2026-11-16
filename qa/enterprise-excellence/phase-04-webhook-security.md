# Phase 4: webhook and partner API security

## 1. Webhooks coming in

None exist. No payment processor, carrier, ecommerce platform or other service sends notifications to this system, because none is connected (INT-08 to INT-13). The only machine callers are partner systems using the partner API with their own key, and the host's scheduler. Inbound webhook verification is NOT APPLICABLE today and becomes a requirement the day a provider is connected: signature check on the raw body, a time window, the provider's event id stored under a unique rule, the business change and the stored id in one transaction.

## 2. Webhooks going out (events to partner addresses)

| Control | State | Test |
|---|---|---|
| Body signature | HMAC-SHA256 with the subscription's secret, `X-SteelWise-Signature: sha256=…` (unchanged, for existing receivers) | "an event is delivered once, signed…" |
| Replay protection | New header `X-SteelWise-Signature-Timestamp: t=<seconds>,v1=<hmac of "t.body">`. A receiver refuses anything older than five minutes | "a forged, altered or old event fails the signature check a receiver would make"; `test/webhookRules.test.js` |
| Duplicate recognition | `X-SteelWise-Event-Id` equals `id` in the body on every attempt; `X-SteelWise-Attempt` counts | "a failed delivery waits its turn…" |
| Where an event may go | https only in production; no user name or password in the address; not localhost, `.local`, `.internal` or a private, link-local or shared-range address; the name is resolved again at send time | "a webhook address must be one this server may call"; unit test with production set |
| Redirects | Not followed; a redirect is a failed delivery | "a partner address that redirects is not followed" |
| Time limit | 10 s | "a slow partner address is given up on at the time limit…" |
| Secret | At least 16 characters; shown once when the subscription is created; never in a list, a log or the Integrations report | "the integration report … holds no secret", "the server log holds … no key, token or signing secret" |
| Response kept | The first 1,000 characters of the partner's answer, for diagnosis, visible to that partner and to administrators | Code read |
| Limit per partner | Ten subscriptions | Code read |
| Payload | Only the receiving partner's data; a carrier's events carry no prices | "a carrier sees only its own loads, and no prices" |

The private-address rule applies when `NODE_ENV` is `production`, so that tests can deliver to a local stand-in. In production the check cannot be turned off by a partner.

## 3. Partner sign-in and authorization

| Control | Before | Now | Test |
|---|---|---|---|
| Failed sign-in | Different answers for unknown key, revoked key and wrong secret | One answer; the secret is always compared, against a dummy hash when the key is unknown | "a revoked key, a suspended partner and a wrong secret all stop at once and say the same little" |
| Revocation | A token stayed valid up to an hour after its key was revoked | Every call re-checks the key; 401 `KEY_REVOKED` | Same |
| Token algorithm | Whatever the token said | HS256 only | Code read |
| Partner type | Declared on the route | Enforced by the route stack before anything else | "scopes and partner types are enforced on every kind of route" |
| Scopes | Declared | Enforced per route; a key without the scope gets 403 | Same |
| Ownership | Filters on columns that did not exist | Every read and write filters on the partner's organisation: `Shipment.carrierId`, the order's buyer, the purchase order's supplier | "a carrier sees only its own loads…", "one customer's system cannot read another customer's records", "a supplier reads and acknowledges only purchase orders placed with it" |
| Staff and partner tokens | Not tested | Neither works on the other's API | "staff and partner credentials do not work on each other's API" |
| Rate limit | In memory, per instance | The same (H-012); 429 with `Retry-After` | "a partner is slowed down at its limit and told when to come back" |
| Request keys | All partners shared one scope (H-003) | Scoped to the partner | Group "Idempotency…" |
| Mass assignment | Not tested | Ids, totals, branch and status sent by the caller are ignored or refused | "fields a caller must not set are ignored or refused, never applied" |

## 4. The scheduler address

`/api/internal/tasks/run` sits outside staff sign-in. It answers 503 with a plain sentence when no secret is configured, 401 for a wrong or missing secret (compared in constant time), and does nothing a repeat can harm. The secret is the owner's host setting (`CRON_SECRET`).

## 5. Secrets

| Secret | Where it lives | Seen in a log, a reply or a report? |
|---|---|---|
| Provider keys (AI, speech) | Environment | No. The speech route used to log the first characters of its key and return them from a test route; removed (H-005) |
| Partner client secret | Hash in the database; shown once | No |
| Webhook signing secret | Database; shown once to the partner | No |
| Scheduler secret | Environment | No |
| Staff and partner tokens | The caller | No |

Checked by "the server log holds request ids and reasons, and no key, token or signing secret", which searches the whole server log of the run for each of these values.

## 6. Open

| Subject | Finding | State |
|---|---|---|
| Limits count per server instance | H-012, E-014 | Deferred to Phase 10 |
| Webhook secrets are stored readable, because the server must sign with them | Recorded here | Encrypting them at rest needs a key held outside the database; a host decision for Phase 10 |
| `PARTNER_JWT_SECRET` must be set on the host | Owner's setting | NOT VERIFIED from here |
| Malicious files in uploads, spreadsheet formulas in exports | Not audited in this phase | Listed as unverified |
