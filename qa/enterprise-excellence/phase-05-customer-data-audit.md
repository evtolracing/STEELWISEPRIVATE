# Phase 5: customer data audit

Date: 2026-11-15. Local QA databases only: `steelwise_qa` (function) and `steelwise_qa_scale3` (85 branches, synthetic volume). Nothing was read from or written to the live database. Every check marked "run" was run in this session.

## 1. Where customer data lives

| Record | Table | Notes |
|---|---|---|
| Account, division, ship-to company | `Organization` (type FABRICATOR, OEM, SERVICE_CENTER, also MILL and BROKER for suppliers and carriers) | `parentId` makes a division; pricing and credit are held on the top account |
| Pricing tier and credit limit | `CustomerPricingTier` (one row per top account) | Tier A to D maps to a price level; effective dates; credit limit |
| Preferences | `CustomerPreference` | Shipping, packaging, tolerances, documents; six fields are not applied (J-008) |
| Tax status | `Organization.taxExempt` | Changes are audited (CUSTOMER_TAX_STATUS_CHANGED, Phase 3) |
| Customer logins | `User` with role CUSTOMER_BUYER and `customerId` | The web shop and portal scope every read by this |
| Contacts | Contact fields on the request for quote and the account (name, email, phone) | No separate contact table exists |

There is no separate CRM. Customer relationship data is the account, its divisions, its preferences, its requests, quotes and orders.

## 2. Checks run

| Check | Where | Result |
|---|---|---|
| A new account is created once, with its fields, and found by search; a repeated code is refused (409); a bad type is refused (400) | `qa/sim/phase5-sales.mjs` group 1 | Pass |
| Closing and reopening an account is on the record with the person | same | Pass after J-002. Before: no record |
| A closed account takes no new business in any channel | same | Pass after J-002. Before: order entry, request for quote, quote acceptance and web checkout accepted it |
| An account cannot be placed under its own division | same | Pass after J-003. Before: saved |
| A division buys at the top account's contract | same, group 2 | Pass (documented rule in `lib/customerPricing.js`; no other precedence invented) |
| Customer logins cannot list or change accounts | same, group 7, and the security sweep | Pass |
| Accounts merged | none | NOT APPLICABLE: no merge function exists. Duplicates are refused by code at creation; nothing was merged and no history touched |

## 3. Data quality on the 85-branch copy (synthetic data)

Read-only counts on `steelwise_qa_scale3`:

| Measure | Value |
|---|---:|
| Organizations | 35 (1 inactive, 6 divisions, 1 tax exempt) |
| With no state (tax fallback needs it when no branch is known) | 13 |
| Names repeated (ignoring case and spaces) | 1 group |
| Top-level customer accounts with no pricing tier (pay list) | 23 |
| Customer accounts with no email / no phone | 30 / 29 |
| Web orders with no customer account | 24 of 39 (these can no longer become sales orders until a customer is named: J-010) |

The data is synthetic, so these are not statements about the live data.

## 4. Findings

| ID | Severity | Status | Subject |
|---|---|---|---|
| J-002 | P2 | VERIFIED FIXED | Closed accounts took new business; closing was not recorded |
| J-003 | P3 | VERIFIED FIXED | An account could be placed under its own division |
| J-008 | P2 | REQUIRES BUSINESS DECISION | Six preference fields saved and applied nowhere (now labelled as such) |
| S-020, U-012 | P2, P3 | REQUIRES BUSINESS DECISION | Default discount (part of J-008) |
| G-018 | P3 | DEFERRED (Phase 3 subject) | Orders with no branch: new orders from quotes, web, intake and counter now get one |

## 5. Not done, stated plainly

- No merge of duplicate accounts: none exists and none was built without a business rule.
- No backfill of missing state, email or phone: it needs the owner's data and approval.
- Live data quality is NOT VERIFIED.
