# Phase 5: customer portal review

Date: 2026-11-15. Local QA databases only.

## 1. What a customer can reach

| Area | Route | Scope |
|---|---|---|
| Web shop and checkout | `/api/ecom/*` | The login's own account; the account is forced from the login, never from the body |
| My orders and their documents | `/api/ecom/my-orders`, `/:id/documents` | The account and its divisions |
| Account portal (orders, shipments, invoices) | `/api/enterprise/*` | The account tree of the login |
| Customer system | Partner API `/customer/*` (Phase 4) | The partner's own organisation |

## 2. Isolation checks run

| Check | Result | Source |
|---|---|---|
| Two customers' "my orders" share no order | Pass | `qa/sim/phase5-sales.mjs` group 6 |
| Opening another account's web order | 404 | same |
| Its documents | Empty list (the service returns nothing for an order outside the account) | same |
| Naming another account in the account portal | Only the login's own rows | same |
| Customer logins on 537 staff routes | 0 not refused | Security sweep |
| Customers and divisions cannot see each other | 31 checks, 0 problems | Security sweep |
| Customer logins on staff sales actions (requests, quotes, orders, list price, counter, credit holds, account changes, branch list) | All refused | group 7 |

## 3. Screens

The shop screens were driven in a browser by `qa/sim/ui-shop.cjs` (30 checks, gate run). Desktop width was checked by the shop suite and phone width by the sales suite; a tablet width was not checked separately in this phase: NOT VERIFIED.

## 4. Findings

No new portal defect was found. J-002 (closed accounts) and J-010 (orders with no customer) touch the shop's edge.

## 5. Not done

- Account statements and online invoice payment: no payment provider (H-013, H-015).
- Messages to the customer: email and text later (decision 5).
