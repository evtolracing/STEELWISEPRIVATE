# Phase 5: product configuration

Date: 2026-11-15. Local QA databases only.

## 1. How an industrial product is described

STEELWISE does not sell a generic catalog item. A line is a material with requirements:

| Requirement | Request line | Quote line | Order line | Work order |
|---|---|---|---|---|
| Grade (record and text) | `specifications.gradeId`, `gradeOverride` | `gradeOverride` | `gradeId`, `gradeOverride` | Instructions and notes |
| Thickness, width, length (in) | `specifications` | Columns | Columns | "Size T x W x L" |
| Tolerances (thickness, width, length, plus and minus) or a preset | `specifications` | Columns | Columns | Instructions |
| Surface finish | `specifications.surfaceFinish` | Column | Column | Instructions |
| Certificates (MTR, COC, ...) | `specifications.certRequirements` | Column | Column | Instructions |
| Processing (shear, saw, ...) | `specifications.processing` | In spec notes, said once | In spec notes; intake processes on the line | Operation type and instructions |
| Other requirements | `specifications.specNotes` | Spec notes | Spec notes | Instructions |

Before Phase 5 the request line held only a description, quantity and unit; nothing above reached the quote, the order or the shop floor (J-001, J-009). The carrying rules are in one file, `src/backend/src/lib/lineSpecs.js`, with unit tests. No schema change was needed: the request line already had a JSON column and the quote and order lines already had the columns.

## 2. Rules

- A requirement is validated when typed: sizes greater than zero, tolerances zero or more, at most 100,000; certificates a list of names, kept once each in upper case. A wrong value is refused with the line and field named, and nothing is saved.
- Fields that do not apply are left empty. Nothing is required of a line that does not need it; a plain line keeps no requirements (tested), so simple products are not forced through configuration.
- A quote line may change any requirement; the change, not the request, reaches the order. Fields the quote did not touch are carried from the request.
- An order line made from a quote keeps the grade record, so the shop and stock can match it.

## 3. Tests run

| Test | Result |
|---|---|
| `src/backend/test/lineSpecs.test.js` (5 tests) | Pass |
| Request keeps every requirement; a bad value refused, nothing saved | Pass |
| Request to quote to order: every requirement arrives | Pass |
| A quote line changes a requirement; the change reaches the order | Pass |
| Accepted order to work order: instructions and notes carry the requirements; asking twice makes one job | Pass |
| Order entry requirements reach the order line and the work order | Pass |
| A stock order ships with no work order | Pass |
| Browser: the new request dialog offers the requirement fields; a quoted request shows them | Pass (`qa/sim/ui-phase5.cjs`) |

## 4. Machine capability

No machine capability was added or assumed. A requirement is carried as written; whether a work center can meet it is the scheduler's subject (Phase 7).

## 5. Not done

- No configurator with rules between fields (for example, a finish allowed only for a grade): no such rules were given, and none were invented.
- The web shop's own configuration (dimensions and processing on store items) was not changed; it was checked for price only.
