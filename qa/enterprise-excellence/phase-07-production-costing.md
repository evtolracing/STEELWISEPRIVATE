# Phase 7: production costing

## Finding: production costing does not exist (L-026, P1, the owner's decision)

| Element | State in the code |
|---|---|
| Material cost into a job | None. A job names no stock (L-024). Stock has cost columns that are empty at receipt (K-007, Phase 6) |
| Labor cost | `Operator.hourlyRate` exists. Nothing multiplies it by clocked time |
| Machine or work-center rate | No field |
| Overhead | No field |
| Cost carried from a source item to the pieces cut from it | Not carried. A coil work order changes no cost on file (group 6, checked on the rows) |
| Scrap and remnant value | None |
| Job cost, cost per piece, margin from actual cost | Not calculated anywhere |

Recorded NOT APPLICABLE in group 6: "production costing is not part of this product" and "a work order does not carry cost from the source to the pieces it makes, and changes no cost on file".

## What was done

Nothing was built and nothing was changed. The Phase 7 instruction forbids inventing cost rates and silently changing costing, remnant valuation or scrap accounting, and the costing method is still the owner's open question from Phase 6 (K-007).

## What the owner needs to decide

1. The costing method and where material cost comes from at receipt (K-007).
2. Whether labor is costed at each operator's rate, at one rate per kind of work center, or not at all.
3. Whether machines carry an hourly rate, and who sets it.
4. How scrap and remnants are valued (also S-009, K-006).

Until then gate E "Material and cost integrity" can pass on material only. The cost half is NOT ASSESSED.

## Why it is P1

Without it the business cannot see what a job cost or whether it made money, and Phase 8 (invoicing and financial reconciliation) will reconcile revenue with no cost of goods beside it.
