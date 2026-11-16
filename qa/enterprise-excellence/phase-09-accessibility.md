# Phase 9: accessibility

Written by `qa/tools/phase9-docs.cjs` from the result files named in each section. All measurements were taken on a local machine against a local database whose name contains `qa`.

**This is not a certificate of conformance to WCAG 2.2 AA.** Automated measures find a part of accessibility faults, never all. No screen reader user and no person using a switch or voice control has tested the product. What follows is what was measured, what was fixed and what is known to remain.

## Measured on every screen

Before: 130 screens (2026-11-16T03:29:34.619Z). Now: 154 screens (2026-11-16T05:59:00.002Z); the later run also opens record pages on real records, which is why it has more.

| Measure | WCAG 2.2 | Before | Now |
|---|---|---:|---:|
| Controls with no name | 4.1.2 | 613 | 0 |
| Fields with no label | 1.3.1, 3.3.2 | 280 | 0 |
| Texts below 4.5 to 1 against their background | 1.4.3 | 1,751 | 42 on 10 screens |
| Screens with no main heading | 1.3.1, 2.4.6 | 129 | 6 |
| Screens sharing a browser title with another | 2.4.2 | 130 | 34 |
| Screens wider than the window at any size | 1.4.10 | 0 | 0 |
| Touch targets under 24 by 24 on a phone | 2.5.8 | 458 | 3 |

Held in the gate run by `qa/tools/ui-audit-gate.cjs` against `qa/ui-audit-ceilings.json`: a count may fall and may not rise.

Screens that still share a title are addresses that show the same page (an old address and its new one, a list and the same list reached from another menu entry, record pages opened on the same record, and unknown record ids that all say "Page not found"). "Page not found · SteelWise" 3; "Shop Floor Control · SteelWise" 2; "Inventory · SteelWise" 2; "Shipping · SteelWise" 2; "SHP-00524 · SteelWise" 2; "RFQs and quotes · SteelWise" 9; "Quality Dashboard · SteelWise" 2; "Production Workflow · SteelWise" 2; "Traceability · SteelWise" 2; "Freight Comparison · SteelWise" 2; "Shipment Tracking · SteelWise" 2; "Orders · SteelWise" 2; "My Orders · SteelWise" 2.

### Screens still with no main heading

- `/maintenance/pm-schedules` (first heading found: none)
- `/orders/invoices` (first heading found: none)
- `/shop/search` (first heading found: H6 Aluminum 6061-T6 Plate)
- `/shop/checkout` (first heading found: none)
- `/shop/orders/:id` (first heading found: none)
- `/help/manual` (first heading found: none)

### Hard-to-read texts that remain (V-011)

| Colours | Ratio | Texts | Screens | Example |
|---|---:|---:|---:|---|
| #1976d2 on #e8f1fb | 4.04 | 12 | 2 | QA saw |
| #c62828 on #c62828 | 1 | 8 | 1 | UCL |
| #c77e53 on #fff3e0 | 2.93 | 8 | 1 | Last One! |
| #2e7d32 on #2e7d32 | 1 | 4 | 1 | CL |
| #1976d2 on #dfeaf6 | 3.78 | 2 | 2 | QA saw |
| #ffffff on #ffffff | 1 | 2 | 1 | 6.4h |
| #d84315 on #fcf0ec | 3.96 | 1 | 1 | Heat Treatment |
| #aeb1b5 on #f5f7fa | 2 | 1 | 1 | Refresh |
| #d32f2f on #fae5e5 | 4.12 | 1 | 1 | ACTIVE |
| #b45309 on #f6eae0 | 4.23 | 1 | 1 | MITIGATION IN PROGRESS |
| #b45309 on #ede3dc | 3.96 | 1 | 1 | MITIGATION IN PROGRESS |
| #ff6b35 on #ffffff | 2.84 | 1 | 1 | 50 |

## Fixed in this phase

| What | Finding | How it is held |
|---|---|---|
| Every control named, every field labelled | V-006, B-015, J-013 | Audit ceiling 0; static check fails on a new unnamed icon button |
| One main heading and its own title on each page; focus moves to the content on a change of page; a skip link | V-004, V-033 | Scenarios; static check fails on a page with no heading |
| 87 rows and cards that opened only on a mouse click open from the keyboard | V-012 | Scenarios; static check |
| A visible focus ring on every control | V-013 | Scenario tabs through twenty stops |
| Colours darkened in the theme to reach 4.5 to 1 | V-010 | Audit ceiling |
| The phone menu is a landmark and keeps focus | V-015 | Scenario |
| Required fields are marked as a property, not a typed asterisk | V-024 | Scenario |
| Browser confirm and alert boxes replaced by named dialogs | V-008, V-009 | Static check reads 0 |
| Less motion when the person asks for it | Theme | Scenario |
| Touch target sizes | V-034 | Audit ceiling |

## Scenarios that use the keyboard or check what a screen reader is told

| Group | Scenario | Result |
|---|---|---|

## Known to remain

- 42 hard-to-read texts on 10 screens (V-011, Phase 12).
- Dialogs open with focus on the dialog, not on the first field (V-029). This conforms; it costs one key press.
- Charts (schedule bars, control charts, dashboards) have no text alternative or data table. Not measured by the audit; NOT VERIFIED and likely to fail 1.1.1 on the sample screens that draw charts.
- Drag and drop on the order board and the schedule has a keyboard alternative only where a button or menu does the same move (the board's status menu). 2.5.7 is NOT VERIFIED screen by screen.
- Error messages on forms are announced where the scenarios checked (order entry, customer, user, payment, heat). Every other form is NOT VERIFIED for 3.3.1 and 4.1.3.
- Reading order, meaningful link text, language of parts, timing and re-authentication without data loss beyond the session scenario are NOT VERIFIED.
- No test with NVDA, JAWS, VoiceOver, TalkBack, a switch or voice control. No test by a person with a disability.

