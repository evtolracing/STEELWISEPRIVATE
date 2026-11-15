# Phase 5: ecommerce review

Date: 2026-11-15. Local QA databases only. No payment was taken: web checkout takes none (H-013).

## 1. Flow

Customer login (CUSTOMER_BUYER, linked to an account) → catalog → configured price from the server → cart check → checkout (order or quote request) → web order inbox (NEEDS_REVIEW) → CSR accepts it with the customer and branch → sales order.

Guest checkout is off by the setting `allowGuestCheckout`; a checkout without a sign-in is refused (401).

## 2. Checks run (`qa/sim/phase5-sales.mjs` group 6, plus the security sweep)

| Check | Result |
|---|---|
| System price used, not the browser's; the buyer is told when it changed; the CSR sees "PRICE CORRECTED" | Pass. `priceNotices` added to the checkout answer in Phase 5 |
| Contract customer charged the contract price | Pass |
| Same checkout twice with one key | One web order |
| Acceptance: tax and branch the same; lines per piece; second accept 409; one-branch clerk refused another branch | Pass after J-005 |
| Empty cart, retired item, zero quantity | Refused; nothing saved |
| Price raised after the cart was filled | Order at the new price; buyer told |
| Portal isolation: my orders, documents, account portal | Pass: another account's web order 404, its documents empty |
| No sign-in | 401; guests off |
| A staff order with no customer | Reaches the inbox; cannot become a sales order until a customer is named (J-010) |
| A card number sent in the body | Not stored on the web order; no payment row |
| Quote request from the shop | Saved as a quote request with ship-to and PO |
| Closed account | Checkout refused (J-002) |

## 3. Corrections

J-005 (P2), J-010 (P2), J-002 (P2, checkout part), price notices to the buyer.

## 4. Open

| ID | Subject | Status |
|---|---|---|
| H-013 | Card payment at checkout, or on account only | REQUIRES BUSINESS DECISION |
| F-008 | Tax shown by ship-to state, charged by branch | REQUIRES BUSINESS DECISION (consistent with rule 27's fallback) |
| C-011 | Stock shown and checked at checkout for piece items | Phase 6 (inventory) |
| S-010, X-007, U-041 | Promise dates and cut-offs invented in the browser | REQUIRES BUSINESS DECISION (the owner's promise rule) |

## 5. Not verified

Payment scenarios (approved, declined, timeout, duplicate notification, refund): NOT APPLICABLE until H-013 is answered. Nothing was simulated as if a processor existed.
