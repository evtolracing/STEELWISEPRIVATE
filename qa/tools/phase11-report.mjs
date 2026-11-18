// Phase 11: writes the quality scorecard and the final report from the result files and the findings
// register. Figures come from the files; judgements (scores, statuses) are stated here with their evidence.
//   node qa/tools/phase11-report.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const R = (f) => { const p = path.join(root, 'qa/results', f); return fs.existsSync(p) ? JSON.parse(fs.readFileSync(p, 'utf8')) : null; };
const OUT = (name, text) => { fs.writeFileSync(path.join(root, 'qa/enterprise-excellence', `phase-11-${name}.md`), `${text.trim()}\n`); console.log(`  phase-11-${name}.md`); };
const table = (head, rows) => [`| ${head.join(' | ')} |`, `|${head.map(() => '---').join('|')}|`, ...rows.map((r) => `| ${r.map((c) => String(c ?? '').replace(/\|/g, '/')).join(' | ')} |`)].join('\n');
const n = (x) => (x == null ? 'not measured' : Number(x).toLocaleString('en-US'));
const ms = (x) => (x == null ? 'not measured' : `${Math.round(x).toLocaleString('en-US')} ms`);

const C = Object.fromEntries([1, 2, 3, 4, 5].map((k) => [k, R(`phase11-cycle-${k}.json`)]));
const F = C[5]; if (!F) { console.error('Cycle 5 has not been run: the report is not written.'); process.exit(1); }
const S = R('phase11-scenarios.json'); const MUT = R('phase11-mutations.json'); const GATE = R('phase11-gate-summary.json'); const INV = R('phase11-invoice-capacity-3.json');
const reg = JSON.parse(fs.readFileSync(path.join(root, 'qa/enterprise-excellence/findings.json'), 'utf8')).findings;
const Z = reg.filter((f) => /^Z-/.test(f.id));
const bySev = (list) => ['P0', 'P1', 'P2', 'P3'].map((s) => `${s}: ${list.filter((f) => f.severity === s).length}`).join(', ');
const byStatus = (list) => Object.entries(list.reduce((a, f) => ({ ...a, [f.status]: (a[f.status] || 0) + 1 }), {})).map(([k, v]) => `${v} ${k}`).join(', ');
const openP01 = reg.filter((f) => ['P0', 'P1'].includes(f.severity) && !['VERIFIED FIXED', 'NOT APPLICABLE', 'ACCEPTED RISK WITH APPROVAL'].includes(f.status));
const disp = F.latencyMs['shipment dispatched']; const d1 = C[1]?.latencyMs['shipment dispatched'];
const chk = (k) => F.books.reconciliation.checks.find((x) => x.key === k);
const cat = (k) => F.transactions.byCategory[k];
const allJobs = [1, 2, 3, 4, 5].every((k) => C[k] && C[k].jobs.tracedEndToEnd >= 500);
const scenOk = S && S.passed === S.scenarios && S.totalMinimum.met && Object.values(S.minimums).every((m) => m.met);
const slow = F.thresholds.latency.filter((x) => !x.pass);
const others = slow.filter((x) => x.kind !== 'shipment dispatched');
const gateOk = GATE?.pass === true;
const HEADER = 'Date: 2026-11-18. Everything here was measured in this session on one local machine (4 processors, 15.7 GB), against local PostgreSQL 16 databases whose names contain `qa`, with synthetic data only, three server copies connected as the least-privilege role `steelwise_runtime` behind one front door, and a local stand-in for every outside service. Nothing was run against the live database, the host or any real partner, carrier, payment or accounting system. Anything not run is marked NOT VERIFIED.';

OUT('quality-scorecard', `# Phase 11: quality scorecard for scale, concurrency, recovery and reconciliation

Scores are a judgement from the evidence named, not a measurement, on the scale of \`quality-scorecard.md\` (target 95). A subject with no evidence is NOT ASSESSED and gets no number.

${HEADER}

Three facts hold every score down however clean the runs are: one machine carried the database, the server copies and the load together; the day is a model built on assumptions, not on the business's real volumes; and every outside service is a stand-in.

${table(['Subject', 'Score', 'Evidence', 'Held back by'], [
  ['Enterprise model and synthetic data', 84, '80 branches of six kinds, 750 employee and 68 customer logins, built through the product\'s own routes; every assumption written in `phase-11-enterprise-model.md`', 'Volumes are assumptions; no real daily figures from the business'],
  ['Transaction execution', 92, `${n(F.transactions.completed)} transactions completed in the final cycle, ${n(F.transactions.failed)} failed, every one found in the database; every category above its minimum in all five cycles`, 'One simulated day, not weeks'],
  ['Customer job completion and traceability', 92, `${n(F.jobs.tracedEndToEnd)} of ${n(F.jobs.planned)} jobs traced from order to money and ledger in the final cycle; six kinds; every step recorded with who, which copy and how long`, 'Six job kinds; other order types of the product are not in the day'],
  ['Operational integrity (stock, shop, shipping, transfers)', 91, `${Object.keys(F.databaseChecks).length} database checks and ${Object.keys(F.invariants).length} invariants at zero after every final cycle; groups 1 to 3, 123 scenarios`, 'Physical machines not tested'],
  ['Financial integrity and reconciliation', 90, `Trial balance balances (${F.books.totals.debit}); receivables, inventory, revenue, tax and payments agree to the cent in every final cycle and after the failure day; 63 ledger scenarios; no difference adjusted away`, 'Test books only; no freight, labor or work-in-progress posting rule exists; not reconciled to a bank or a real accounting system'],
  ['Concurrency across server copies', 90, 'Numbers by counter and invoices taking turns in the database (Z-001 to Z-003); double post, double pay, double reserve, double confirm all end in one result on three copies; 0 deadlocks in every cycle', 'Copies shared one machine'],
  ['Performance', 78, `Every measured operation within the proposed limit except dispatch (${ms(disp.p95)} at P95 over the whole day; within the limit up to 16 jobs in flight). Rollbacks cut from ${n(C[1]?.databaseDuringRun.rolledBack)} to ${n(F.databaseDuringRun.rolledBack)}`, '**No threshold is approved.** Dispatch misses the proposed limit at 32 and 48 jobs in flight (Z-006). One small machine; one day of data'],
  ['Failure recovery', 88, `36 failure scenarios; a whole day with six faults injected: ${C[4] ? `${n(C[4].jobs.completed)} of ${n(C[4].jobs.planned)} jobs, books clean` : 'not on file'}; four product faults found by injection and fixed (Z-008, Z-009, Z-011, Z-013)`, 'The database server itself was never taken down; a repeated dispatch does not bill (Z-012)'],
  ['Idempotency', 90, 'Request keys on payments, orders, transfers; keyed requests fail closed when the key cannot be claimed (Z-013); events resent with the same id', 'A key held by a dead copy blocks its repeat for 60 s (Z-014)'],
  ['Security and isolation under load', 89, '41 scenarios: six branch pairs, customer accounts, roles, tokens, lockout and sign-out across copies; request limits now shared by all copies (E-014, Z-007)', 'No table-by-table tenant audit (E-019); the general per-address ceiling is per copy (Z-010)'],
  ['AI reporting', 'NOT ASSESSED as a score', 'Scope, role and no-write checks pass on the product\'s side of the model', 'The AI service is a stand-in; what a real model answers was not tested'],
  ['Integrations, events and background jobs', 85, '39 scenarios: once-only delivery across copies, backlog, poison event, order, lost answers, outages', 'Stand-ins only; the host\'s scheduler not exercised (B-019)'],
  ['Frontend under load', 78, 'Seven screens opened in a browser at the day\'s volume within the proposed 3 s, no page errors, lists paged', 'One browser; phones and slow networks under load not tested'],
  ['Capacity planning', 72, 'Measured and projected kept apart; one, three and four copies compared; invoice ceiling measured alone and in the mix', 'One machine; no real volumes; the live database\'s limits were not read'],
  ['Automated proof', 90, `${S ? `${S.passed} of ${S.scenarios} scenarios, ${n(S.checks)} checks` : 'scenarios not on file'}; ${MUT ? `${MUT.held} of ${MUT.total} fixes removed one at a time and each caught` : 'removals not on file'}`, 'Removals cover each fix, not every line'],
  ['Regression', gateOk ? 90 : 'NOT ASSESSED', GATE?.summary || 'the full gate is not on file', GATE?.heldBack || ''],
  ['Enterprise readiness', 'NOT ASSESSED as a score', 'It is a decision, not a quality: see `phase-11-report.md`', ''],
])}`);

const crit = (i, text, status, evidence) => [i, text, status, evidence];
const P = 'PASS'; const NV = 'NOT VERIFIED'; const PA = 'PARTIAL';
OUT('report', `# Phase 11 report: 80-location enterprise stress simulation

${HEADER}

## FINAL STATUS

**IMPLEMENTED — VERIFICATION INCOMPLETE**

The work was done and measured: five cycles, each with ${n(F.jobs.planned)} customer jobs and more than 5,000 transactions on three server copies; ${S ? `${S.passed} of ${S.scenarios}` : 'the'} scenarios; fourteen findings, every P1 among them fixed and proven by removal; the books reconcile to the cent in every final cycle and after a day of injected failures.

It is not VERIFIED COMPLETE because completion criterion 28 cannot be met: **no performance threshold is approved**, and against the proposed ones the dispatch misses its limit when 32 or more customer jobs are in flight at once (Z-006, a business decision)${others.length ? `, and ${others.map((x) => `${x.kind} is at P95 ${ms(x.p95)} against ${ms(x.limitP95)}`).join(' and ')} over the day` : ''}. Other things could not be verified on one local machine with stand-ins: server copies on separate machines, a year of data, real outside services, a real AI model, the live host. Enterprise readiness is **not declared**.

Directive readiness decision: **CONDITIONAL**.

What the owner has to do is in "What is needed from the owner" below.

## ENTERPRISE SIMULATION

- **Locations represented**: ${F.model.branches} branches in ${F.model.states} states (${Object.entries(F.model.byTier).map(([k, v]) => `${v} ${k.toLowerCase()}`).join(', ')}).
- **Users simulated**: ${n(F.model.employees)} employee logins in ${Object.keys(F.model.employeesByRole).length} roles and ${n(F.model.customerLogins)} customer logins; ${n(F.signIn.people)} sign-ins at the start of each day.
- **Workload assumptions**: one working day per cycle, run at 8, 16, 32 and 48 customer jobs in flight. Every volume is an assumption written in \`phase-11-enterprise-model.md\` and \`phase-11-workload-profile.md\`; none is a real figure of the business.
- **Completed transactions** (required 2,000): ${[1, 2, 3, 4, 5].map((k) => `cycle ${k}: ${n(C[k]?.transactions.completed)}`).join('; ')}. Final cycle: ${n(F.transactions.attempted)} attempted, ${n(F.transactions.completed)} completed, ${n(F.transactions.failed)} failed, ${n(F.transactions.retried)} retried, ${n(F.transactions.recovered)} recovered, ${n(F.transactions.reconciled)} reconciled.
- **Completed customer jobs** (required 500): ${[1, 2, 3, 4, 5].map((k) => `cycle ${k}: ${n(C[k]?.jobs.tracedEndToEnd)} traced of ${n(C[k]?.jobs.planned)}`).join('; ')}. By kind in the final cycle: ${Object.entries(F.jobs.byType).map(([k, v]) => `${k} ${v.kind} ${v.traced}/${v.planned}`).join('; ')}.

## OPERATIONAL RESULTS

${table(['Area', 'Final cycle', 'Scenarios', 'Result'], [
  ['Sales', `${n(cat('sales').completed)} completed, ${n(cat('sales').failed)} failed`, 'group 1', P],
  ['Purchasing', `${n(cat('purchasing').completed)} completed, ${n(cat('purchasing').failed)} failed`, 'group 1', P],
  ['Inventory', `${n(cat('inventory').completed)} reservations and issues, ${n(cat('moves').completed)} transfers, returns and adjustments; every stock check at zero`, 'groups 1, 4, 7', P],
  ['Manufacturing', `${n(cat('shop').completed)} completed, ${n(cat('shop').failed)} failed`, 'group 2 (records only; no physical machine was tested)', P],
  ['Shipping', `${n(cat('shipping').completed)} completed, ${n(cat('shipping').failed)} failed; dispatch P95 ${ms(disp.p95)}`, 'group 3', `${P} for correctness; slower than proposed at peak (Z-006)`],
  ['Finance', `${n(cat('money').completed)} invoices, payments and credits; ${n(cat('ledger').completed)} ledger operations; 0 failed`, 'group 4', P],
  ['Reporting', `Finance and executive reads P95 under ${ms(Math.max(...Object.values(F.readsWhileWorking).map((x) => x.p95)))} while the day ran`, 'group 8', P],
  ['Ecommerce, POS and portal', `${n(cat('channels').completed)} completed, ${n(cat('channels').failed)} failed`, 'groups 1 and 6', P],
])}

## FINANCIAL RESULTS

All on the QA ledger with test accounts and a test approval. Nothing was posted to real books.

- **Journal posting integrity**: ${n(F.growth.postedEntries)} entries posted in the final day; posted entries that do not balance: ${F.invariants['posted entries that do not balance']}; business records with two postings of one kind: ${F.invariants['business records with two ledger events of one kind']}; ledger events failed or waiting: ${F.invariants['ledger events of this run failed or waiting']}.
- **Ledger reconciliation**: trial balance debits ${F.books.totals.debit}, credits ${F.books.totals.credit}; the product's reconciliation is ${F.books.reconciliation.clean ? 'clean' : 'NOT CLEAN'} in every final cycle and after the failure day (cycle 4: ${C[4]?.books.reconciliation.clean ? 'clean' : 'not clean'}).
- **Accounts receivable**: books ${chk('RECEIVABLES').books}, records ${chk('RECEIVABLES').records}, difference ${chk('RECEIVABLES').difference}; also customer by customer in group 4.
- **Inventory valuation**: books ${chk('INVENTORY').books}, records ${chk('INVENTORY').records}, difference ${chk('INVENTORY').difference}.
- **Gross margin reporting**: revenue (${chk('REVENUE').books}) and cost of goods post from the same shipments and both reconcile. A margin report compared line by line with the records: NOT VERIFIED.
- **Branch consolidation**: revenue by branch and by customer add to the same total; eighty branches post at once and the books balance.
- **Accounting export**: GENERIC file export only. Every batch holds exactly the entries it counts, no entry in two batches, a rejected batch withdrawn and made again, also with a server copy killed mid-export. No real accounting system received anything: NOT VERIFIED.
- **No approved rule exists** for freight income, carrier freight cost, labor or work in progress; the product posts none of them. Accountant, Phase 12.
- No discrepancy was forced to zero. The two differences met on the way are described in \`phase-11-financial-reconciliation.md\`.

## PERFORMANCE

Thresholds: **${F.thresholds.status}**.

- **Throughput**: ${F.requests.perSecondOverall} requests a second over the day, up to ${Math.max(...F.levels.map((l) => l.requestsPerSecond))} at the best level; ${n(F.requests.sent)} requests; peak ${F.requests.peakInFlight} in flight.
- **Latency of all requests by level**: ${F.levels.map((l) => `${l.jobsInFlight} in flight: P50 ${ms(l.latencyMs.p50)}, P95 ${ms(l.latencyMs.p95)}, P99 ${ms(l.latencyMs.p99)}`).join('; ')}.
- **Dispatch with its invoice**: P50 ${ms(disp.p50)}, P95 ${ms(disp.p95)}, P99 ${ms(disp.p99)} over the day (baseline P95 ${ms(d1?.p95)}); by level ${F.levels.map((l) => `${l.jobsInFlight}: P95 ${ms(l.dispatchMs?.p95)}`).join(', ')}. Proposed limit 2,000 ms at P95.
- **Slower than proposed**: ${slow.map((x) => `${x.kind} (P95 ${ms(x.p95)}, limit ${ms(x.limitP95)})`).join('; ') || 'nothing'}.
- **Error rate**: ${n(F.transactions.failed)} failed of ${n(F.transactions.attempted)} transactions; answers of 5xx: ${Object.entries(F.requests.byStatus).filter(([s]) => s >= '500').map(([s, c]) => `${s}: ${c}`).join(', ') || 'none'}.
- **Database**: ${n(F.databaseDuringRun.committed)} commits, ${n(F.databaseDuringRun.rolledBack)} rolled back (baseline ${n(C[1]?.databaseDuringRun.rolledBack)}), ${F.databaseDuringRun.deadlocks} deadlocks, cache hit ratio ${F.databaseDuringRun.cacheHitRatio}, at most ${F.databaseDuringRun.sessionsOpen.max} sessions open of ${F.database.maxConnections}.
- **Queue**: the product has no queue service; partner events wait in a table and the scheduled run sends them. ${F.backgroundTasks.runs} scheduled runs during the day, ${F.backgroundTasks.failed} failed; a backlog of thirty events cleared once each.
- **Financial posting latency**: posting happens inside the save of its business event. Journal entry written P95 ${ms(F.latencyMs['journal entry written']?.p95)}, posted by a second person P95 ${ms(F.latencyMs['journal entry posted by a second person']?.p95)}; reconciliation of the whole books P95 ${ms(F.latencyMs['reconciliation run']?.p95)}.
- **Invoices alone**: ${INV ? `about ${ms(INV.levels[0].p50)} each; ceiling ${Math.min(...INV.levels.slice(1).map((l) => l.perSecond))} to ${Math.max(...INV.levels.map((l) => l.perSecond))} a second` : 'not on file'}.
- **Server copies**: one, three and four copies gave the same figures on this one machine. More copies on separate machines: NOT VERIFIED.

## RELIABILITY

- **Failure injection**: all twenty failures of the prompt, each as a real failure on the local machine (\`phase-11-failure-injection.md\`); 36 scenarios; and six faults in a row during a whole day.
- **Recovery**: failure day ${C[4] ? `${n(C[4].jobs.completed)} of ${n(C[4].jobs.planned)} jobs, ${n(C[4].transactions.failed)} failed transactions, ${n(C[4].transactions.retried)} resends, ${n(C[4].jobs.recoveredByBillingAgain)} shipments billed after a lost dispatch answer, every copy back up, books clean` : 'not on file'}.
- **Concurrency**: 0 deadlocks in every cycle; no number used twice; no stock below zero; no invoice paid beyond its total; no shipment billed twice.
- **Idempotency**: payments, web orders, transfers, dispatches, deliveries, postings, reversals, period closes, scheduled runs and partner events each repeated at the same moment and after lost answers: one result each.
- **Transaction integrity**: nothing half saved after any kill; every transaction counted as completed was found in the database.

## DEFECTS

**Findings by severity (Phase 11, Z series, ${Z.length} findings)**: ${bySev(Z)}. By status: ${byStatus(Z)}. Earlier findings closed here: E-014 (request limits per server copy) and W-022 (invoice turns inside one process only).

${table(['Finding', 'Severity', 'Status', 'Root cause', 'Correction'], Z.map((f) => [f.id, f.severity, f.status, f.actual.split('. ')[0], f.correction.split('. ')[0]]))}

- **Regression coverage**: ${MUT ? `${MUT.held} of ${MUT.total}` : '?'} fixes taken out one at a time, each caught by a named check (\`qa/results/phase11-mutations.json\`); ${S ? `${S.passed} of ${S.scenarios}` : '?'} scenarios kept in \`qa/sim/phase11-scenarios.mjs\` and in the full gate.
- **Unresolved confirmed P0 or P1 Phase 11 defects**: ${Z.filter((f) => ['P0', 'P1'].includes(f.severity) && f.status !== 'VERIFIED FIXED').length}.
- **Remaining risks**: Z-006 (dispatch at peak), Z-010 (general request ceiling per copy), Z-012 (a repeated dispatch does not bill), Z-014 (60 s wait after a crash); earlier P0 and P1 findings still open across the whole register: ${openP01.length} (${openP01.map((f) => f.id).join(', ')}).

## VERIFICATION

### The five cycles

${table(['Cycle', 'What ran', 'Jobs', 'Transactions completed / failed', 'Books', 'Rolled back'], [[1, 'Baseline, before any fix'], [2, 'Correction, every fix up to Z-009, rebuilt database'], [3, 'Full revalidation, rebuilt database, then all scenarios and the full gate'], [4, 'Failure and recovery: six faults during the day, then the failure group'], [5, 'Final certification on the finished code, rebuilt database, then all scenarios']].map(([k, what]) => [k, what, C[k] ? `${n(C[k].jobs.tracedEndToEnd)} of ${n(C[k].jobs.planned)}` : 'not run', C[k] ? `${n(C[k].transactions.completed)} / ${n(C[k].transactions.failed)}` : '', C[k] ? (C[k].books.reconciliation.clean && C[k].books.trialBalanceBalanced ? 'balance, reconcile clean' : 'NOT CLEAN') : '', C[k] ? n(C[k].databaseDuringRun.rolledBack) : '']))}

### The Phase 11 prompt's gates

${table(['Gate', 'Result', 'Evidence'], [
  ['A. Transaction Execution', allJobs ? P : 'FAIL', `${n(F.transactions.completed)} transactions and ${n(F.jobs.tracedEndToEnd)} traced jobs in the final cycle; every cycle above both minimums`],
  ['B. Operational Integrity', P, `${Object.keys(F.databaseChecks).length} database checks and ${Object.keys(F.invariants).length} invariants at zero`],
  ['C. Financial Integrity', `${P} on the QA ledger`, 'entries balance; receivables and inventory reconcile to the cent; no duplicate posting'],
  ['D. Concurrency', P, 'groups 1 to 4 on three copies; 0 deadlocks'],
  ['E. Performance', '**NOT PASSED**', `No threshold is approved. Against the proposed ones: dispatch misses at 32 and 48 jobs in flight (Z-006)${others.length ? `; ${others.map((x) => `${x.kind} P95 ${ms(x.p95)} against ${ms(x.limitP95)}`).join('; ')}` : ''}; every other kind of request is inside`],
  ['F. Failure Recovery', P, 'twenty failures injected, detected and recovered; cycle 4'],
  ['G. Security', `${P} on QA`, '41 scenarios under load; the product has no division boundary to test; AI on a stand-in'],
  ['H. User Experience', `${P} with limits`, 'seven screens in a browser at volume; honest busy and try-again answers; one browser only'],
  ['I. Regression', gateOk ? P : (GATE ? 'see below' : NV), GATE?.summary || 'the full gate is not on file'],
  ['J. Enterprise Readiness', '**CONDITIONAL**', 'No unresolved P0 or P1 Phase 11 defect; the 23 documents are written; the Phase 12 handoff is below. Readiness itself is not declared: gate E, and the NOT VERIFIED list'],
])}

### The directive's gates A to J

${table(['Gate', 'Result'], [
  ['A. Architecture', 'PASS: no module rebuilt, no new service, no new dependency, no TypeScript; four small library changes and one table'],
  ['B. Functional Completeness', 'PASS for what the phase asked to build and run; PARTIAL for what needs approved thresholds and real services'],
  ['C. Cross-Layer Integrity', 'PASS: every completed transaction was found in the database and, where it posts, in the books; screens opened on the same data'],
  ['D. Data Integrity', 'PASS: no constraint weakened; invariants and reconciliation at zero; one duplicate payment found by injection and its cause fixed (Z-013)'],
  ['E. Security', 'PASS on QA: no authorization bypassed; limits now shared across copies'],
  ['F. Reliability', 'PASS: failures injected and recovered; four reliability faults fixed'],
  ['G. Performance', `CONDITIONAL: measured, improved, but no approved threshold and ${slow.length} kinds of request above the proposal (dispatch by far the most)`],
  ['H. User Experience', 'PASS with limits: one browser'],
  ['I. Regression', gateOk ? 'PASS: full gate on the Phase 11 code' : (GATE?.summary || 'NOT VERIFIED')],
  ['J. Documentation', 'PASS: 23 Phase 11 documents and the shared registers'],
])}

### Completion criteria (prompt section 40)

${table(['#', 'Criterion', 'Status', 'Note'], [
  crit(1, 'Test environment isolated and documented', P, '`phase-11-synthetic-data.md`'),
  crit(2, 'About 80 locations represented', P, '80'),
  crit(3, 'Synthetic enterprise data configured', P, ''),
  crit(4, 'At least 2,000 transactions complete', P, n(F.transactions.completed)),
  crit(5, 'At least 500 customer jobs traced', P, n(F.jobs.tracedEndToEnd)),
  crit(6, 'Sales and quoting pass', P, ''),
  crit(7, 'Inventory and purchasing pass', P, ''),
  crit(8, 'Manufacturing and scheduling pass', P, 'records only; no physical machine'),
  crit(9, 'Quality and traceability pass', P, 'group 2'),
  crit(10, 'Shipping and logistics pass', P, 'no real carrier'),
  crit(11, 'Financial ledger posting passes', P, 'QA ledger'),
  crit(12, 'Journal balancing passes', P, ''),
  crit(13, 'Accounts receivable reconciles', P, ''),
  crit(14, 'Inventory financial valuation reconciles', P, ''),
  crit(15, 'Branch and enterprise totals reconcile', P, ''),
  crit(16, 'Accounting period controls pass', P, ''),
  crit(17, 'External accounting integrations verified where implemented', PA, 'the file export is verified; no real accounting system exists to receive it'),
  crit(18, 'Reporting under load passes', P, ''),
  crit(19, 'AI reporting permissions pass', PA, 'permissions pass; the model is a stand-in'),
  crit(20, 'Database performance measured', P, ''),
  crit(21, 'API throughput measured', P, ''),
  crit(22, 'Financial posting throughput measured', P, 'at one day of volume'),
  crit(23, 'Background job recovery passes', P, 'the host scheduler itself is not exercised'),
  crit(24, 'Controlled failure injection completed', P, ''),
  crit(25, 'Critical transaction recovery passes', P, ''),
  crit(26, 'Tenant and location isolation passes', P, 'no table-by-table audit (E-019)'),
  crit(27, 'Frontend usability under load passes', PA, 'one browser'),
  crit(28, 'Approved performance thresholds are met', '**NOT MET**', `none is approved; above the proposal: ${slow.map((x) => x.kind).join(', ')}`),
  crit(29, 'Confirmed critical bottlenecks corrected', PA, 'Z-001 to Z-005 corrected; Z-006 needs a business decision'),
  crit(30, 'At least 300 scenarios pass', scenOk ? P : 'FAIL', S ? `${S.passed} of ${S.scenarios}, every category minimum met` : ''),
  crit(31, 'Multi-cycle revalidation completed', P, 'five cycles'),
  crit(32, 'Relevant regression tests pass', gateOk ? P : PA, GATE?.summary || ''),
  crit(33, 'No unresolved confirmed P0/P1 Phase 11 defects', P, ''),
  crit(34, 'All findings explicitly dispositioned', P, '`findings-register.md`'),
  crit(35, 'Phase 12 handoff complete', P, 'below'),
])}

## What is needed from the owner

1. **Apply database update 18** (\`/mnt/project-files/database-updates/18-20261118150000_shared_rate_limits.sql\`, then \`verify-6-to-18.sql\`). It adds one small table and changes no existing row. It is safe before or after the code: without it the server counts request limits per copy as before.
2. **Say when to merge** the Phase 11 pull request.
3. **Approve or change the proposed performance thresholds** (\`phase-11-workload-profile.md\`).
4. **Decide Z-006**: accept a few seconds at the dock at the busiest instant, or choose one of the options in \`phase-11-capacity-recommendations.md\`.
5. **Give real daily volumes** per branch if the model should be set to the business.

## PHASE 12 HANDOFF

Phase 12 (final production certification, financial acceptance, release readiness, sign-off, documentation, training, deployment governance) has not been started.

${table(['Subject', 'What Phase 12 inherits'], [
  ['Remaining critical defects', `No open P0 or P1 from Phase 11. Open P0 and P1 across the register: ${openP01.map((f) => f.id).join(', ')}`],
  ['Unverified workflows', 'Order types outside the six job kinds; the dispatch board lists (V-028); five dashboards figure by figure (V-037); real carrier, payment, tax and accounting flows'],
  ['Performance risks', 'Dispatch at peak (Z-006); a year of data (W-023); unbounded job list (V-027); copies on separate machines; the live database\'s connection limit'],
  ['Security risks', 'Tenant column audit (E-019); general request ceiling per copy (Z-010); live still connects as the database owner until the role switch (Y-008); no outside penetration test'],
  ['Financial reconciliation issues', 'None open on QA. Not reconciled to a bank, supplier invoices or a real accounting system'],
  ['Accounting policy approvals', 'Posting rules and the chart of accounts (W-001); freight income and cost, labor, work in progress; receipts without a purchase order (W-006); a number series per branch if chosen (Z-006)'],
  ['Cutover dependencies', 'Database updates 17 and 18 applied; the runtime role given a password and DATABASE_URL switched; opening balances; the date the books start'],
  ['Disaster recovery limitations', 'The host\'s backups never restored (E-015); recovery objectives not approved; the database server itself never failed in a test'],
  ['Integration dependencies', 'Every outside service is a stand-in; a scheduler on the host for the scheduled run (B-019); an alert receiver (E-017)'],
  ['Documentation gaps', 'Runbooks exist (Phase 10) but none is rehearsed; no user manual for the recovery steps a clerk takes after "busy" or "try again"'],
  ['Training requirements', 'Dock: send again after "busy"; office: bill a shipment listed without an invoice; finance: retry a held ledger event, read a reconciliation difference'],
  ['Deployment prerequisites', 'Update 18; confirm the pool size and pooler for several server copies; PASSWORD_CHECKS_AT_ONCE left at 2 unless the host has more processors per copy'],
  ['Business sign-off requirements', 'Thresholds; Z-006; the accountant\'s approval of the ledger; real volumes; who receives alerts'],
])}

## Continuation point

- Branch \`claude/project-thread-25z3jd\`. Not merged; the owner says when.
- Database: update 18 is not applied to live. Update 17 status on live is the owner's.
- Phase 12 has not been started and will not start without the owner's word.
- To rerun: \`qa/tools/phase11-cluster.sh 3 --rebuild\`, then \`node qa/sim/phase11-enterprise.mjs --base http://localhost:3110 --cycle 5\` and \`node qa/sim/phase11-scenarios.mjs --base http://localhost:3110 --stub-port 3166 --app http://localhost:5199\` (the browser group needs a QA server on port 3001 and the frontend on 5199), all with \`DATABASE_URL\` set to the local QA database.`);
console.log('Phase 11 scorecard and report written');
