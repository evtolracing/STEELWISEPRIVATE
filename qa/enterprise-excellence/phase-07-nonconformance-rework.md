# Phase 7: nonconformance, corrective action and rework

## 1. Nonconformance and corrective action: not built (finding L-023)

There is no nonconformance report and no corrective-action record that the production code reads or writes. A failed inspection, with its defects, disposition and instructions, is the only nonconformance record. The production-quality and customer-quality screens are labelled samples. This is recorded NOT APPLICABLE in group 5 with the evidence (no table used by production code, no address).

It was not built in this phase: it is a new module, and owner decision 4 already calls for the quality modules to be built on real records (M-011). Deferred to that work.

## 2. Rework (finding L-020, owner decision 9: a rework step)

| Step | Behaviour | Evidence |
|---|---|---|
| Send for rework | From a failed inspection, or a failed job on hold. The job returns to scheduled with the instructions in its notes | Group 6 "sent for rework..." and "a failed job on hold can be sent for rework..." |
| The rework step | One step is added after the last step of the plan, named "Rework (inspection number)" and tied to the inspection. It is of the same kind of work center as the last step, or of the kind the inspector names | Group 6 "sent for rework..." and "the rework step can be sent to another kind of work center..." |
| Doing the work | The step is started, paused and finished like any step: right kind of work center, operator of the branch, planned order. Its time is on record against the operator and work center | Same |
| While it is open | The job cannot be completed or packed | Same |
| When it is finished | The job goes back to inspection and must pass a new one before it can be packed (the gate of L-001) | Same |
| A second failure | A second rework step, tied to the second inspection | Same |
| The same inspection twice | Refused; no second step | Same |
| A kind of work center that is not on file | Refused; nothing changes | Same |
| A job with no planned steps | Goes back with the instructions and a note that no step was added | Same |
| A passed inspection | Cannot be sent for rework | Group 6 |

Finished steps are never reopened, so the time first spent stays as it was recorded. Rework time is counted in the job's labor cost like any other step (`phase-07-production-costing.md`). There is no separate rework cost figure or rework count report.

Needs database update 13 (one column tying the step to the inspection).

## 3. Dispositions

Fail accepts rework, scrap, return to supplier, use as is, sell as secondary. Conditional pass accepts only "use as is" and "sell as secondary" (L-002). Scrap and return dispositions are records only; the stock side is done separately by inventory staff with a reason (Phase 6 rules), and nothing ties the two (L-023).
