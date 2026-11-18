# Phase 11: security and isolation under load

Date: 2026-11-18. Every figure here was measured in this session on one local machine (4 processors, 15.7 GB), against a local PostgreSQL 16 database whose name contains `qa`, with synthetic data only, the server copies connected as the least-privilege role `steelwise_runtime`, and a local stand-in for every outside service. Nothing was run against the live database, the host or any real partner, carrier, payment or accounting system. Anything not run is marked NOT VERIFIED.

The boundaries proven one request at a time in Phase 10 are attacked here while other branches work at full speed and while requests land on different server copies.

## Scenarios

From the final run on a rebuilt database (`qa/results/phase11-scenarios.json`).

| Scenario | Result | Checks |
|---|---|---:|
| Large processing branch QA-L10: the people of QA-L20 cannot open its order, shipment or invoice | pass | 5 |
| Large processing branch QA-L10: the lists of QA-L20 do not carry its records | pass | 10 |
| Large processing branch QA-L10: QA-L20 tries to change its records twelve times at the same moment | pass | 4 |
| Large processing branch QA-L10: people without a finance role cannot take money or touch the books | pass | 3 |
| Large processing branch QA-L10: forty reads from QA-L20 are refused while QA-L10 works at full speed | pass | 3 |
| Large processing branch QA-L10: a customer of QA-L20 cannot see the web order of a customer of QA-L10 | pass | 4 |
| Medium service center QA-L32: the people of QA-L33 cannot open its order, shipment or invoice | pass | 5 |
| Medium service center QA-L32: the lists of QA-L33 do not carry its records | pass | 10 |
| Medium service center QA-L32: QA-L33 tries to change its records twelve times at the same moment | pass | 4 |
| Medium service center QA-L32: people without a finance role cannot take money or touch the books | pass | 3 |
| Medium service center QA-L32: forty reads from QA-L33 are refused while QA-L32 works at full speed | pass | 3 |
| Medium service center QA-L32: a customer of QA-L33 cannot see the web order of a customer of QA-L32 | pass | 4 |
| Small distribution branch QA-L43: the people of QA-L44 cannot open its order, shipment or invoice | pass | 5 |
| Small distribution branch QA-L43: the lists of QA-L44 do not carry its records | pass | 10 |
| Small distribution branch QA-L43: QA-L44 tries to change its records twelve times at the same moment | pass | 4 |
| Small distribution branch QA-L43: people without a finance role cannot take money or touch the books | pass | 3 |
| Small distribution branch QA-L43: forty reads from QA-L44 are refused while QA-L43 works at full speed | pass | 3 |
| Small distribution branch QA-L43: a customer of QA-L44 cannot see the web order of a customer of QA-L43 | pass | 4 |
| Warehouse-heavy branch QA-L27: the people of QA-L37 cannot open its order, shipment or invoice | pass | 5 |
| Warehouse-heavy branch QA-L27: the lists of QA-L37 do not carry its records | pass | 10 |
| Warehouse-heavy branch QA-L27: QA-L37 tries to change its records twelve times at the same moment | pass | 4 |
| Warehouse-heavy branch QA-L27: people without a finance role cannot take money or touch the books | pass | 3 |
| Warehouse-heavy branch QA-L27: forty reads from QA-L37 are refused while QA-L27 works at full speed | pass | 3 |
| Warehouse-heavy branch QA-L27: the branch manager's books stop at the branch | pass | 4 |
| Sales-focused branch QA-L48: the people of QA-L58 cannot open its order, shipment or invoice | pass | 5 |
| Sales-focused branch QA-L48: the lists of QA-L58 do not carry its records | pass | 10 |
| Sales-focused branch QA-L48: QA-L58 tries to change its records twelve times at the same moment | pass | 4 |
| Sales-focused branch QA-L48: people without a finance role cannot take money or touch the books | pass | 3 |
| Sales-focused branch QA-L48: forty reads from QA-L58 are refused while QA-L48 works at full speed | pass | 3 |
| Sales-focused branch QA-L48: a customer of QA-L58 cannot see the web order of a customer of QA-L48 | pass | 4 |
| Forged and damaged tokens are refused by every server copy | pass | 2 |
| A login that is switched off stops working on every server copy at once | pass | 5 |
| Signing out everywhere ends the sign-ins held on the other server copies | pass | 2 |
| Wrong passwords tried on several server copies at once pause the login once | pass | 4 |
| No route answers without a sign-in while the enterprise is busy | pass | 1 |
| An auditor reads the books under load and can change nothing | pass | 3 |

## What these show

- **Branch**: for six pairs of branches of every tier, the people of one branch cannot open, list or change the orders, shipments and invoices of the other, twelve attempts at once and forty reads at once, while the other branch works undisturbed.
- **Customer account**: a buyer of one customer cannot see the web order of another.
- **Role**: people without a finance role cannot take money or touch the books; an auditor reads and can change nothing; the person who wrote an entry cannot post it.
- **Across server copies**: a login switched off, a sign-out everywhere, a revoked partner key and a wrong-password pause each take effect on every copy at once, because each is kept in the database. Forged and damaged tokens are refused by every copy.
- **Request limits**: the sign-in limit per address and the partner limits are one limit for all copies (E-014, Z-007).
- **No route answers without a sign-in** while the enterprise is busy.

## Not verified

- A table-by-table audit of every tenant id column (E-019): the scenarios test behaviour, not every query.
- Division as a boundary of its own: the product has branches, not divisions with separate access.
- An outside penetration test. Phase 12.
