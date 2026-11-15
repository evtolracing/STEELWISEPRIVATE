# Phase 6: remnants and scrap

Date: 2026-11-15. Group "Consumption, remnants and scrap": 15 scenarios, all pass.

## 1. Remnants that are stock

A remnant is a stock item with a parent. It is created two ways, both in one transaction with the parent's balance:

- by a work order's outputs, or
- entered against its parent (receipt form or the remnants upload), which takes its weight off the parent.

## 2. The ten remnant tests

| # | Test | Result |
|---|---|---|
| 1 | Entered against its parent: keeps heat, names the parent; parent and remnant together weigh what the parent weighed | PASS |
| 2 | Made by a work order: heat, grade and owner inherited | PASS |
| 3 | Cannot weigh more than what is free on the parent | PASS |
| 4 | Cannot be cut from a parent that is in transit | PASS |
| 5 | A branch login cannot cut one from another branch's parent | PASS |
| 6 | Can be reserved for a line it fits, and shipped | PASS |
| 7 | Travels to another branch and keeps parent and heat | PASS |
| 8 | Scrapped: SCRAP movement with the person and note, nothing left, item used up | PASS |
| 9 | The parent's history lists the cut; the piece names its parent | PASS |
| 10 | The Steel Outlet remnant list moves no stock balance (records the gap, K-006) | PASS as a statement of today's behaviour |

After each, the item's balance identity, its reservations and its history adding up to its balance were checked.

## 3. Scrap

| Path | Record | Checked |
|---|---|---|
| Work order scrap | SCRAP movement on the source; yield worked out by the server | Output plus scrap cannot exceed what went in |
| Stock correction with reason SCRAP | SCRAP movement, note required, manager or inventory manager only | Only free stock: scrapping into the reserved part is refused |
| A scrapped customer return | RECEIVE then SCRAP, so the history still adds up (K-003, fixed) | Balance unchanged |
| A shortage confirmed on a transfer | ADJUST, reason TRANSFER_SHORT_DOWN | Taken off once |

## 4. Not decided, not invented

- **What a remnant is worth and how it is priced.** The outlet discounts are fixed in code at 15% and 25% on two screens (S-009). No remnant valuation rule was written (K-007).
- **When a piece becomes a remnant or scrap** (a minimum usable size). No threshold exists on file; a person decides.
- **Scrap value and scrap sales.** Scrap leaves the books by weight with no amount.
- **The Steel Outlet list** (K-006, with J-012): it is to be connected to stock under owner decision 1, and that waits for the pricing rule because the list is where the remnant price lives.
