// Phase 11: records the phase in phase-state.json from the result files. Safe to run again.
//   node qa/tools/phase11-state.mjs [--pr 35]
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const R = (f) => { const p = path.join(root, 'qa/results', f); return fs.existsSync(p) ? JSON.parse(fs.readFileSync(p, 'utf8')) : null; };
const FILE = path.join(root, 'qa/enterprise-excellence/phase-state.json');
const s = JSON.parse(fs.readFileSync(FILE, 'utf8'));
const F = R('phase11-cycle-5.json'); const C4 = R('phase11-cycle-4.json'); const C1 = R('phase11-cycle-1.json'); const S = R('phase11-scenarios.json'); const MUT = R('phase11-mutations.json'); const GATE = R('phase11-gate-summary.json');
if (!F || !S) { console.error('The final cycle or the final scenario run is not on file.'); process.exit(1); }
const pr = process.argv.includes('--pr') ? Number(process.argv[process.argv.indexOf('--pr') + 1]) : null;
const n = (x) => Number(x).toLocaleString('en-US');
const disp = F.latencyMs['shipment dispatched'];

s.currentPhase = 11; s.findingPrefix = 'Z-'; s.phase11BaselineCommit = 'fdbece6';
s.phaseStatus = 'IMPLEMENTED — VERIFICATION INCOMPLETE';
if (pr) { if (s.pullRequest && s.pullRequest !== pr && !s.previousPullRequests.includes(s.pullRequest)) s.previousPullRequests.push(s.pullRequest); s.pullRequest = pr; }
const tests = [
  { test: 'Phase 11: one working day of the 80-branch model through the real server on three server copies, five cycles (qa/sim/phase11-enterprise.mjs); 500 traced customer jobs and 2,000 completed transactions required', result: `Final cycle: ${n(F.jobs.tracedEndToEnd)} of ${n(F.jobs.planned)} jobs traced end to end, ${n(F.transactions.completed)} transactions completed, ${n(F.transactions.failed)} failed, every category above its minimum; trial balance balances and the reconciliation is clean; ${F.databaseDuringRun.deadlocks} deadlocks; dispatch P95 ${Math.round(disp.p95)} ms (proposed limit 2,000)`, before: C1 ? `Baseline cycle: ${n(C1.databaseDuringRun.rolledBack)} database transactions rolled back and dispatch P95 ${Math.round(C1.latencyMs['shipment dispatched'].p95)} ms; final: ${n(F.databaseDuringRun.rolledBack)} rolled back` : '' },
  { test: 'Phase 11: failure, security and concurrency scenarios on three server copies, database read back (qa/sim/phase11-scenarios.mjs), 300 required with eight minimums', result: `${S.passed} of ${S.scenarios}, ${n(S.checks)} checks; ${Object.entries(S.minimums).map(([g, m]) => `${g} ${m.passed}/${m.ran}`).join('; ')}`, before: 'None: every earlier phase ran one server process' },
  { test: 'Phase 11: a whole day with six failures injected (a copy killed, every database connection cut, a polite restart, the invoice counter held, answers delayed, outside services down)', result: C4 ? `${n(C4.jobs.tracedEndToEnd)} of ${n(C4.jobs.planned)} jobs, ${n(C4.transactions.failed)} failed transactions, ${n(C4.transactions.retried)} resends, books clean, every copy back up` : 'not on file' },
  { test: 'Phase 11: proof by removal (qa/tools/phase11-mutations.mjs)', result: MUT ? `${MUT.held} of ${MUT.total} removals caught by the named check; source restored after each` : 'not on file' },
  { test: 'Phase 11: full gate of every earlier phase on the Phase 11 code (qa/tools/run-gates.sh)', result: GATE?.summary || 'not on file' },
];
s.testsExecuted = [...tests, ...s.testsExecuted.filter((t) => !/^Phase 11:/.test(t.test))];
const drop = (list, re) => list.filter((x) => !re.test(x));
s.unverifiedAreas = [
  'Phase 11 scale: one machine carried the database, three server copies and the load. Server copies on separate machines, the live database and its pooler are NOT VERIFIED',
  'Phase 11 volume: one simulated day built on assumptions, not on real volumes of the business. A year of data is NOT VERIFIED (W-023)',
  'Phase 11 thresholds: proposed, not approved. Dispatch is above the proposal with 32 or more customer jobs in flight (Z-006)',
  'Phase 11 AI: the AI service was a stand-in; what a real model answers is NOT VERIFIED',
  ...drop(s.unverifiedAreas, /^Phase 11|^Scale: one server process/),
];
s.currentBlockers = [
  'Owner: approve or change the proposed performance thresholds (phase-11-workload-profile.md); without approved thresholds Phase 11 cannot be VERIFIED COMPLETE',
  'Owner: decide Z-006, the wait at the dock at peak (phase-11-capacity-recommendations.md)',
  ...drop(s.currentBlockers, /performance thresholds|Z-006/),
];
s.nextActions = [
  'Owner: apply /mnt/project-files/database-updates/18-20261118150000_shared_rate_limits.sql in the SQL editor, then verify-6-to-18.sql; every row OK or APPLIED. Safe before or after the code',
  'Owner: say when to merge the Phase 11 pull request',
  'Owner: approve the thresholds and decide Z-006',
  'Owner: issue the Phase 12 prompt. Its handoff is in phase-11-report.md. Phase 12 has not been started',
  ...drop(s.nextActions, /18-20261118150000|Phase 11 pull request|approve the thresholds|Phase 12 prompt|issue the Phase 11 prompt|merge the Phase 10 pull request/),
];
s.lastCompletedCheckpoint = `Phase 11 implemented and measured on a local machine: 14 findings Z-001 to Z-014 (10 VERIFIED FIXED including every P1, 2 REQUIRES BUSINESS DECISION, 2 DEFERRED to Phase 12); E-014 and W-022 closed; five enterprise cycles on three server copies, final cycle ${n(F.jobs.tracedEndToEnd)} jobs and ${n(F.transactions.completed)} transactions with the books reconciled; ${S.passed} of ${S.scenarios} scenarios; ${MUT ? `${MUT.held} of ${MUT.total}` : '?'} fixes proven by removal. Status IMPLEMENTED — VERIFICATION INCOMPLETE: no threshold is approved and dispatch is above the proposal at peak. Database update 18 is for the owner to apply.`;
const adj = [
  { group: 'Platform infrastructure', category: 'Reliability', score: 88, evidence: 'Phase 11: twenty kinds of failure injected on three server copies and recovered; a database interruption answers "try again" (Z-009, Z-011); a keyed request is never run without its key (Z-013); polite stop under 3 s (Z-008). Held at 88: the database server itself was never failed; one machine' },
  { group: 'Platform infrastructure', category: 'Performance', score: 80, evidence: 'Phase 11: password checks take turns (Z-004); request limits in one table for all copies (Z-007, E-014); about 90 requests a second with ordinary requests well inside the proposed limits. Held at 80: no approved threshold; one small machine; a year of data not measured' },
  { group: 'Logistics and financial operations', category: 'Performance', score: 76, evidence: 'Phase 11: invoice and document numbers by counter, invoices take turns in the database (Z-001 to Z-003); rollbacks cut by more than nine tenths. Held at 76: dispatch is above the proposed 2 s at the 95th percentile with 32 or more customer jobs in flight (Z-006, owner decision)' },
  { group: 'Logistics and financial operations', category: 'Data integrity', score: 92, evidence: 'Phase 11: five days of 545 customer jobs on three server copies, every invariant and every reconciliation check at zero, also after a day of injected failures; no difference adjusted away. Held at 92: test books; one day of volume' },
];
s.scoreAdjustments = [...s.scoreAdjustments.filter((a) => !/^Phase 11:/.test(a.evidence)), ...adj];
fs.writeFileSync(FILE, `${JSON.stringify(s, null, 2)}\n`);
console.log(`phase-state.json: phase 11, ${tests.length} tests, pull request ${s.pullRequest}`);
