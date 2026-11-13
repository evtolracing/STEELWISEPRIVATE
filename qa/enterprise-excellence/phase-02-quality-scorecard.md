# Phase 2: quality scorecard

Scores before and after Phase 2. The method, the weights and the full evidence for every category are in `quality-scorecard.md`, which a tool rebuilds from the findings register and the test results. This file states what moved, why, and what did not.

The target for every group is 95. No group meets it. A score is the engineer's judgement held against written criteria; where a number rests on a measurement, the measurement is named.

## 1. Group scores

| Module group | Before Phase 2 | After Phase 2 | Open P0 or P1 before | Open P0 or P1 after | Meets 95 |
|---|---:|---:|---:|---:|:-:|
| Platform infrastructure | 70 | 73 | 2 | 2 | No |
| Sales and customer operations | 70 | 72 | 5 | 4 | No |
| Inventory and purchasing | 70 | 73 | 6 | 4 | No |
| Manufacturing and processing | 69 | 73 | 3 | 2 | No |
| Logistics and financial operations | 73 | 75 | 3 | 2 | No |
| Enterprise experience | 57 | 60 | 7 | 5 | No |

Before: `progress.json` at commit `0ad7857`. After: `progress.json` rebuilt at the end of this session.

## 2. What moved, and the evidence

| Category | Group | Before | After | Evidence | Why not higher |
|---|---|---:|---:|---|---|
| Security | All six | 60 | 78 | The cap of 60 stood while any staff login could read and change every branch (B-003) and 16 areas had no department (B-004). Both are VERIFIED FIXED: `branch-boundary` 37 of 37 (25 fail with the boundary off); coverage check 319 changing routes, 0 without a rule; a branch manager can no longer create a super admin (C-001) | Records with no branch column (C-009); request limit per instance (E-014); package upgrades waiting for approval (E-011) |
| Data integrity | Manufacturing | 78 | 82 | Shop-floor start, complete, reassign and job planning are all-or-nothing; job moves are conditional. Race trials: stuck in 8 of 8 before, 0 of 8 after | A completed work order still moves no stock (M-016) |
| Reliability | Manufacturing | 70 | 78 | Simultaneous completion, start after cancel and double moves are refused with 409; work centers can be created again (C-004) | 65 of 91 changing routes have no success-path test |
| Data integrity | Sales | 82 | 84 | A counter sale takes shelf stock and a void returns it, in the sale's own transaction; orders carry a branch | No duplicate protection on order creation (C-006); a void's credit is a second transaction (C-010) |
| Data integrity | Enterprise experience | 70 | 72 | Two real screens no longer invent records on failure (C-007); executive decisions record the signed-in person | Reported figures are not checked against the records |
| Maintainability | Platform | 57 | 65 | Branch boundary, department table and login rules each in one tested file; a coverage check in the gates | Most rules still in handlers (B-014); 1,524 lint warnings |

Every other category in every group is unchanged, because Phase 2 produced no new evidence for it.

## 3. Measured changes

| Measure | Before | After |
|---|---:|---:|
| Findings in the register | 210 | 223 (13 new, the C-series) |
| VERIFIED FIXED | 126 | 142 |
| Open P0 | 2 | 2 (X-001, X-002: sample modules to be built, decision 4) |
| Open P1 | 20 | 17 |
| Findings with status OPEN or an undated deferral | 59 | 0: each now has one of the permitted statuses, and every deferral names its reason, phase, correction, dependencies, acceptance and verification |
| Unit tests | 90 | 105 |
| Automated checks on branch access | 0 | 37 |
| Automated checks on shop-floor, login and counter integrity | 0 | 80 |
| Routes that returned a success in a test | 269 of 611 | 284 of 611 |
| Changing routes that returned a success in a test | 72 of 319 | 87 of 319 |
| Changing routes with no department rule or stated reason | Routes in 16 areas | 0 of 319 |
| Server errors on an empty request body | 3 | 0 |
| Saves of a record from nothing | 7 | 2, both by design |
| Handlers that save in several steps with no transaction | 16 | 5, each dispositioned |
| Real screens that invent records when the server fails | 2 | 0 |
| Repository lint errors | 0 | 0 |

## 4. Not measured, and so not scored

- **Accessibility:** NOT VERIFIED in every group. No keyboard or screen-reader test exists.
- **Performance:** only the routes in the Workstream 1 benchmark were ever measured. The cost of the branch filter at 80 branches is NOT VERIFIED and is in the Phase 3 handoff.
- **Coverage by line of code:** not measured. Reach is counted by route.
- **Forty-five route files and 18 service files** were examined by tool only, not read. Their maintainability and reliability scores carry over from Phase 1.

## 5. Distance to the target

The three largest gaps, in order of what they hold back:

1. **Test reach.** 232 of 319 changing routes have never returned a success in a test. Functional correctness cannot pass 80 in any group until they do (B-016).
2. **Sample modules.** 58 screens are labelled samples. Enterprise experience stays near 60 until they are built (decision 4, the module phases).
3. **Rules only the owner can give:** what processing consumes and produces, stock adjustment, promise dates, purchasing. Nineteen findings wait on them.
