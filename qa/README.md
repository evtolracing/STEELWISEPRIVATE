# QA: audit, simulation and regression suite

Everything here runs against a **local** database whose name contains `qa`. The scripts refuse to start against anything else (`qa/sim/lib.mjs`, `assertSafeDatabase`). Nothing here sends email, texts, charges or calls any outside service.

## What is in this folder

| File | What it is |
|---|---|
| `system-inventory.md` | Every server route, screen, table and enum, generated from the code |
| `ticket-traceability.md` | Commit history against tests |
| `workflow-coverage-matrix.md` | Each business workflow, the rules enforced, and what is covered |
| `api-contract.md` | API calls written in the screens that have no server route |
| `defect-register.md` | Every defect found, fixed or open |
| `test-execution-results.md` | Results, generated from `results/*.json` |
| `operational-certification.md` | The certification decision and why |
| `sim/run.mjs` | The 50-job simulation cycle |
| `sim/security.mjs` | Security, isolation and robustness sweep over every route |
| `sim/ui-smoke.cjs` | Opens every screen in a browser |
| `sim/ui-sales.cjs` | Operates the sales screens and the credit hold in a browser, as a clerk and as a manager |
| `sim/ui-inventory.cjs` | Operates the stock, heat and receiving screens in a browser |
| `sim/ui-shop.cjs` | Operates the job, schedule, time tracking and work order screens in a browser |
| `sim/ui-shipping.cjs` | Creates, dispatches, delivers and cancels a shipment and records a payment in a browser |
| `sim/ui-experience.cjs` | Checks that sample screens say so and that no dashboard figure or assistant answer is invented |
| `tools/screen-audit.mjs` | Says for every screen where its data comes from; fails when made-up data has no notice. Writes `screen-audit.md` |
| `sim/fixtures.mjs` | Builds the QA data set (80 branches) |
| `tools/*.mjs` | Generators for the documents above |

## Run it

```bash
# one time: a local database with the app's tables and the QA data
createdb steelwise_qa
cd src/backend
export DATABASE_URL=postgresql://postgres:password@localhost:5432/steelwise_qa DIRECT_URL=$DATABASE_URL
npx prisma migrate deploy && node prisma/seed.js && npm run db:seed:demo
cd ../.. && node qa/sim/fixtures.mjs

# every time
qa/tools/start-qa-server.sh &                       # backend on port 3011, QA database only
(cd src/backend && npm test)                        # unit tests
node qa/sim/run.mjs --seed 8001 --out qa/results/my-run.json
node qa/sim/security.mjs
node qa/tools/report.mjs                            # rebuild test-execution-results.md
```

A cycle can be replayed exactly by passing the same `--seed` on a freshly built QA database. Each cycle uses up QA stock, so after many cycles jobs start to show as blocked with "no stock"; rebuild the QA database (the one-time steps above) before a certification run. The screen check also needs the frontend dev server (`npx vite --port 5199` in `src/frontend`) and a QA backend on port 3001 (`PORT=3001 qa/tools/start-qa-server.sh`).

## Reading a cycle's result

- `PASS`: every step answered as expected and every check on the database held.
- `FAIL`: a step or check did not.
- `BLOCKED`: the app has no way to do that job at all. It is not a pass.
- A cycle is "clean" when no job failed, all eight simultaneous-request probes passed and the whole-database reconciliation found nothing.
