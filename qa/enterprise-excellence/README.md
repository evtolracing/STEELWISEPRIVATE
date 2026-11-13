# Enterprise Excellence Program

The working folder of the twelve-phase program that takes STEELWISE from "works in a demonstration" to production ready for about 80 branches. Phase 1 created it on 2026-11-13.

Everything in `qa/` outside this folder is the record of the earlier audit and the six Phase 2 workstreams. It is kept as history and is still accurate for what it covers. From Phase 1 on, this folder is where the program's state lives.

## Rules of the program

The owner's permanent standard is `qa/ENGINEERING-STANDARD.md` and governs everything. In short:

1. Investigate before changing. Fix the cause, not the symptom.
2. A fix is finished only when an automated check exists that fails without it.
3. Never say a test passed unless it ran in this session. Anything else is marked NOT VERIFIED.
4. No finding is ever deleted. Each has a status and, if not fixed, a phase and what will show it is done.
5. All testing runs on a local database whose name contains `qa`. Nothing here touches the live database or the host.
6. Every database change ships with a SQL Editor file, run twice on a copy. The owner applies it.
7. Business rules are the owner's. A rule that is not written down becomes a finding with the status REQUIRES BUSINESS DECISION, not a guess in the code.
8. JavaScript and JSX only. React and Material UI. No TypeScript.
9. Merge only when the owner says so.

## The files

| File | What it is | How it is made |
|---|---|---|
| `system-inventory.md` | Every module: purpose, status, screens, server files, routes, tables, test reach, findings | Generated |
| `architecture-map.md` | How the application is built and hosted | By hand |
| `module-dependency-map.md` | What depends on what, by business flow and by shared tables and code | Generated |
| `workflow-matrix.md` | Each business workflow: states, moves, who, records, what is verified | By hand |
| `ticket-traceability.md` | Development history against features and tests | By hand, over `qa/ticket-traceability.md` (generated) |
| `database-inventory.md` | Every table, the rules the database enforces, consistency checks | Generated |
| `api-inventory.md` | Every route with what the code scan and the test logs say about it | Generated |
| `permissions-matrix.md` | Who can do what, and what boundaries do not exist | Generated |
| `quality-scorecard.md` | Scores by module group with their evidence | Generated |
| `findings-register.md` | Every finding, open ones first | Generated from `findings.json` |
| `findings.json` | The source of truth for findings | Edited by hand. Never delete an entry |
| `testing-gap-analysis.md` | What the tests reach and what they do not | Generated |
| `production-risk-register.md` | What stands between this code and going live | By hand |
| `phase-01-report.md` | What Phase 1 did, with evidence, and the Phase 2 handoff | By hand |
| `phase-02-report.md` | What Phase 2 did, with evidence, the final status and the Phase 3 handoff | By hand |
| `phase-02-architecture-audit.md` | The application as built, its weaknesses and what was left alone | By hand |
| `phase-02-correction-plan.md` | The five correction batches, by priority, and what must happen before merging | By hand |
| `phase-02-service-boundaries.md` | Sign-in, department and branch boundaries; the department table; who may change a login | By hand |
| `phase-02-business-rule-ownership.md` | Which file owns each business rule and which rules are still the owner's to give | By hand |
| `phase-02-transaction-safety.md` | All-or-nothing saves and the ten concurrency tests | By hand |
| `phase-02-api-contracts.md` | The contract every route follows and what Phase 2 changed in it | By hand |
| `phase-02-regression-results.md` | The full run on the final code, the 20 scenarios and the seven gates | By hand, from `qa/results/` |
| `phase-02-quality-scorecard.md` | Scores before and after Phase 2 | By hand, from `progress.json` |
| `phase-02-dispositions.json` | Phase 2's status for each finding it touched | By hand. Applied to `findings.json` by `findings-import.mjs` |
| `progress.json` | Program state for a machine | Generated; phase fields come from `phase-state.json` |
| `owner-decisions.json` | Decisions the owner has given, with the findings each one settles | By hand. Applied to `findings.json` by `findings-import.mjs` |
| `phase-state.json` | The few facts a person sets at the end of a phase | By hand |
| `.discovery.json` | Raw facts read from the code | Generated |

## How to rebuild the generated files

From the repository root, with the QA database up (`qa/README.md`):

```
export DATABASE_URL=postgresql://postgres:password@localhost:5432/steelwise_qa
node qa/tools/screen-audit.mjs        # screen verdicts
node qa/tools/api-contract.mjs        # screen calls against server routes
node qa/tools/exercised.mjs <server logs>   # only after a gate run with LOG_REQUESTS=on
node qa/tools/db-facts.mjs            # facts and consistency checks from the QA database
node qa/tools/discover.mjs            # reads the code
node qa/tools/excellence-docs.mjs     # writes the documents
```

`qa/tools/excellence-modules.mjs` is the module map. When a module changes classification, edit it there.

## Finding IDs

IDs are permanent. B is the Phase 1 baseline. E, S, I, M, F and X are the six earlier workstreams. D is the first audit. U is the user-experience register. A later phase adds findings with its own letter or continues B; it never reuses a number.

## Phases

Phase 1 is discovery and baseline. Phase 2 is architecture and code quality hardening. Phase 9 is user experience. The other phase numbers are known only as the owner issues each prompt, so a finding that belongs to a later phase is assigned by subject (security and multi-location, data integrity, manufacturing, integration, performance, testing) and gets its phase number when that prompt arrives.

## The gates

Run on a rebuilt QA database. Sizes as of Phase 2. `qa/tools/run-gates.sh` runs them all in order:

| Gate | Command | Size |
|---|---|---|
| Unit tests | `npm test` in `src/backend` | 105 |
| Order-to-cash simulation | `node qa/sim/run.mjs --seed N` | 50 jobs per cycle, 3 cycles |
| Security and safeguards sweep | `node qa/sim/security.mjs` | 20 sections |
| Baseline probe | `node qa/sim/baseline-probe.mjs --max-crash 0` | 4 sections over every write route |
| Branch boundary | `node qa/sim/branch-boundary.mjs` | 37 checks |
| Phase 2 integrity and concurrency | `node qa/sim/phase2-integrity.mjs` | 80 checks |
| Department rule coverage | `node qa/tools/access-coverage.mjs` | 319 changing routes |
| Screen ratchets | `node qa/tools/frontend-checks.mjs` | 2 ceilings |
| Browser suites | `node qa/sim/ui-*.cjs` | 5 suites, 125 checks, plus every route opens |
| Screen audit | `node qa/tools/screen-audit.mjs` | 143 screens |
| Lint | `npm run lint` in `src/frontend`; `npm run lint` at the root (0 errors) | whole repository |
| Build | `npx vite build` in `src/frontend` | |
