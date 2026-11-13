# Phase 4: quality scorecard for the integration layer

Scores are a judgement from the evidence named, not a measurement. The whole-system scorecard is `quality-scorecard.md`; this page scores the subjects of Phase 4 only, on the scale used there (target 95).

| Subject | Score | Evidence | Held back by |
|---|---:|---|---|
| Internal API contracts | 80 | 11 contract scenarios; shapes pinned; database refusals answered 409; no breaking change | Two list shapes (E-021); other lists unbounded (B-012); 214 changing routes without a success-path test (B-016) |
| Screen to server recovery | 82 | The ten section 7 cases in a browser, 33 checks; time limit, plain messages, request keys on every creating step | Late-answer guard only on Shipping; no screen pages lists or sends a version (G-014, G-020) |
| Cross-module consistency | 88 | 10 scenarios; partial failure reported and listed; books reconcile after the whole suite | Second stock list and order hub (B-009); a failed invoice is not retried on its own |
| Event reliability | 86 | Saved with the change; once per subscriber; retries, dead letter, replay, crash recovery, stale limit, burst: 13 scenarios | The host schedule is not set (B-019) |
| Idempotency and concurrency | 90 | Two defects in the key mechanism found and fixed; 10 scenarios and Phase 3's | Partners are not required to send a key; edits are last write wins outside orders |
| Outside-service calls | 78 | Time limit, bounded tries, breaker, plain failure: 11 scenarios and 8 unit tests | Real providers never called; breaker per instance (H-012) |
| External integrations | 40 | An honest inventory; each unconnected service says so | Email, text, cards, carriers, tax and accounting are not connected (H-015); web checkout takes no payment (H-013) |
| Partner API | 78 | Rewritten and verified for customers, carriers and purchase orders; isolation, scopes, revocation, rate limit | Four supplier functions answer 501 (H-014); no real partner has used it; limits per instance |
| Webhook and partner security | 84 | Signature with time, address rules, no redirects, uniform sign-in failure, immediate revocation, no secret in logs | Secrets readable in the database; limits per instance |
| Observability | 68 | Integration report and screen; structured failure lines; request ids | Nothing alerts anyone (E-017); counters per instance |
| Recovery | 74 | A recovery path stated and tested for each critical integration | No restore of a backup has been tested (E-015); the host is unverified |
| Performance at 80 branches | 80 | Measured on the 85-branch copy; two problems found and fixed; 0 failures | One local process, not the host; bursts only |

## Gates

| Gate | Result | Basis |
|---|---|---|
| A. API contract integrity | PASS with stated limits | Contract scenarios; no breaking change; E-021 and B-012 deferred with reasons |
| B. Cross-module consistency | PASS | 10 scenarios; reconciliation after the suite; B-009 remains from Phase 3 |
| C. Event reliability | PASS locally; NOT VERIFIED on the host | 13 scenarios; B-019 is the owner's setting |
| D. External integration reliability | PARTIAL | Verified for what exists (stand-ins); payment, carrier, email, text, tax and accounting are not connected |
| E. Security | PASS with stated limits | Security scenarios and the sweep; per-instance limits deferred to Phase 10 |
| F. Operational recovery | PARTIAL | Recovery paths tested; no alerting (E-017); backup not verified (E-015) |
| G. Performance | PASS locally; NOT VERIFIED on the host | `phase-04-performance-results.md` |
| H. Regression | PASS | `phase-04-regression-results.md`: every earlier suite unchanged |
