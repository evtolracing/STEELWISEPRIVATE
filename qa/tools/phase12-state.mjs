// Phase 12: records the phase in phase-state.json from the result files, and adds the Phase 12 notes to the
// registers kept by hand (risk register, workflow matrix, permissions note, readme). Safe to run again.
//   node qa/tools/phase12-state.mjs [--pr 36]
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const EE = path.join(root, 'qa/enterprise-excellence');
const R = (f) => { const p = path.join(root, 'qa/results', f); return fs.existsSync(p) ? JSON.parse(fs.readFileSync(p, 'utf8')) : null; };
const FILE = path.join(EE, 'phase-state.json');
const s = JSON.parse(fs.readFileSync(FILE, 'utf8'));
const CERT = R('phase12-certification.json'); const UI = R('phase12-ui.json'); const PROC = R('phase12-process.json'); const MAN = R('phase12-manual.json'); const MUT = R('phase12-mutations.json'); const CONS = R('phase12-consolidation.json');
if (!CERT || !CONS) { console.error('The certification run or the consolidation is not on file.'); process.exit(1); }
const gatePath = path.join(root, 'qa/results/phase12-gate.txt');
const GATE = fs.existsSync(gatePath) ? fs.readFileSync(gatePath, 'utf8') : '';
const gateDone = /^== documents|^gate exit|GATE (PASS|FAIL)/m.test(GATE) || /built in/.test(GATE);
const crosses = GATE.split('\n').filter((l) => /^\s*✗/.test(l));
const pr = process.argv.includes('--pr') ? Number(process.argv[process.argv.indexOf('--pr') + 1]) : null;
const reg = JSON.parse(fs.readFileSync(path.join(EE, 'findings.json'), 'utf8')).findings;
const AA = reg.filter((f) => /^AA-/.test(f.id));
const CLOSED = ['VERIFIED FIXED', 'NOT APPLICABLE'];
const open = reg.filter((f) => !CLOSED.includes(f.status));

s.currentPhase = 12; s.findingPrefix = 'AA-'; s.phase12BaselineCommit = '9e12319';
s.phaseStatus = 'IMPLEMENTED — VERIFICATION INCOMPLETE';
s.finalRecommendation = 'NO-GO';
if (pr) { if (s.pullRequest && s.pullRequest !== pr && !s.previousPullRequests.includes(s.pullRequest)) s.previousPullRequests.push(s.pullRequest); s.pullRequest = pr; }
const tests = [
  { test: 'Phase 12: certification of 68 workflows and controls through the real server on three server copies, database read back (qa/sim/phase12-certification.mjs)', result: `${CERT.passed} of ${CERT.scenarios} scenarios, ${CERT.checks} checks; ${Object.entries(CERT.groups).map(([g, v]) => `${g} ${v.passed}/${v.scenarios}`).join('; ')}`, before: 'None: no earlier phase certified the workflows across modules in one run' },
  { test: 'Phase 12: browser checks of the manual, the cockpit question box and the time-tracking error path (qa/sim/phase12-ui.cjs)', result: UI ? `${UI.passed} of ${UI.total} scenarios, ${UI.checks} checks` : 'not on file' },
  { test: 'Phase 12: process checks: no database, a polite stop with requests in flight, production-mode CORS (qa/tools/phase12-process.mjs)', result: PROC ? `${PROC.checks - PROC.failed} of ${PROC.checks} checks pass` : 'not on file' },
  { test: 'Phase 12: the in-product manual against the screens (qa/tools/phase12-manual.mjs)', result: MAN ? `${MAN.chapters} chapters, ${MAN.checks} checks, ${MAN.failed} failed` : 'not on file' },
  { test: 'Phase 12: proof by removal (qa/tools/phase12-mutations.mjs)', result: MUT ? `${MUT.held} of ${MUT.mutations} corrections caught by the named check when removed; source restored after each` : 'not on file' },
  { test: 'Phase 12: full gate of every phase on the release candidate (qa/tools/run-gates.sh)', result: gateDone ? `ran to the end; ${crosses.length} lines marked failed${crosses.length ? `: ${crosses.map((l) => l.trim().slice(0, 110)).join(' | ').slice(0, 700)}` : ''}` : 'NOT VERIFIED: the gate log is not on file or not finished' },
];
s.testsExecuted = [...tests, ...s.testsExecuted.filter((t) => !/^Phase 12:/.test(t.test))];
const drop = (list, re) => list.filter((x) => !re.test(x));
s.unverifiedAreas = [
  'Phase 12: nothing was verified on the live system. Which database updates are applied there, the host settings, the live backups, the live database role and real outside providers are NOT VERIFIED',
  'Phase 12: user acceptance was not run; no business user has tested anything',
  'Phase 12: no accountant has reviewed the chart, the policies or any figure; the ledger is off on live',
  'Phase 12: the older manual chapters were not re-read line by line against every screen (M-018, S-024)',
  'Phase 12: what a real AI model answers is NOT VERIFIED; the assistants were tested with a stand-in for the model',
  ...drop(s.unverifiedAreas, /^Phase 12/),
];
s.currentBlockers = [
  'Finance: accounting policies, chart and opening balances are unapproved (W-001); the ledger stays off',
  'Business: user acceptance has not been run or signed (phase-12-user-acceptance.md)',
  'Executive: no deployment authorization exists',
  'Owner: restore one live backup into a scratch project (E-015)',
  'Owner: apply the missing database updates in order and point the server at the limited role (Y-008, W-014)',
  'Owner: set the alert receiver and the scheduled run (E-017, B-019)',
  'Owner: approve or change the performance thresholds and decide Z-006',
  ...drop(s.currentBlockers, /W-001|user acceptance|deployment authorization|E-015|Y-008|E-017|performance thresholds|Z-006/),
];
s.nextActions = [
  'Owner: read phase-12-final-report.md and phase-12-release-blockers.md. The recommendation is NO-GO',
  'Owner: say when to merge the Phase 12 pull request. It changes no database table',
  'Owner: the six steps to a one-branch pilot with the ledger off are listed at the end of phase-12-final-report.md',
  'Owner: decide AA-007 (branch time zones), AA-008 (adding a branch) and AA-010 (sales staff may dispatch and move work orders)',
  ...drop(s.nextActions, /Phase 12|Phase 11 pull request|AA-00|AA-010/),
];
s.lastCompletedCheckpoint = `Phase 12, the last phase, carried out on a local machine: ${AA.length} findings AA-001 to AA-${String(AA.length).padStart(3, '0')} (${AA.filter((f) => f.status === 'VERIFIED FIXED').length} VERIFIED FIXED, ${AA.filter((f) => f.status === 'REQUIRES BUSINESS DECISION').length} REQUIRES BUSINESS DECISION); ${CERT.passed} of ${CERT.scenarios} certification scenarios; ${MUT ? `${MUT.held} of ${MUT.mutations}` : '?'} corrections proven by removal; 24 certification documents. ${reg.length} findings in the register, ${open.length} open. Final recommendation NO-GO: no accounting approval, no user acceptance, no deployment authorization, live backups never restored, controls not yet in force on live. No approval was granted or claimed. Nothing was deployed. Remaining work: phase-12-release-blockers.md.`;
const adj = [
  { group: 'Platform infrastructure', category: 'Security', score: 88, evidence: 'Phase 12: the assistants take only user and assistant turns, bounded, with ground rules, audit rows and no internals in errors (AA-003, AA-006); invented executive analysis removed (AA-002); a NUL byte in an address is the caller\'s error (AA-005). Held at 88: no outside penetration test; the live database role is not switched (Y-008)' },
  { group: 'Platform infrastructure', category: 'Reliability', score: 88, evidence: 'Phase 12: with no database every signed-in route answers 503 and the dashboard no longer invents figures (AA-001); a polite stop finishes requests in flight. Held at 88: one machine; the database server itself never failed over' },
];
s.scoreAdjustments = [...s.scoreAdjustments.filter((a) => !/^Phase 12:/.test(a.evidence)), ...adj];
fs.writeFileSync(FILE, `${JSON.stringify(s, null, 2)}\n`);
console.log(`phase-state.json: phase 12, ${tests.length} tests, pull request ${s.pullRequest}`);

// ── the registers kept by hand ───────────────────────────────────────────────────────────────
function note(file, before, heading, body) {
  const p = path.join(EE, file); let t = fs.readFileSync(p, 'utf8');
  const start = t.indexOf(heading);
  if (start >= 0) { const next = t.slice(start + heading.length).search(/\n#{2,3} /); t = t.slice(0, start) + (next < 0 ? '' : t.slice(start + heading.length + next + 1)); }
  const at = before ? t.indexOf(before) : -1; const block = `${heading}\n\n${body.trim()}\n\n`;
  t = at < 0 ? `${t.trimEnd()}\n\n${block}` : t.slice(0, at) + block + t.slice(at);
  fs.writeFileSync(p, t); console.log(`  ${file}`);
}
const H = '### Phase 12 update (2026-11-19)';
note('production-risk-register.md', '### Phase 11 update', H, `
Phase 12 certified the release candidate on the local QA database and recommended **NO-GO** (\`phase-12-final-report.md\`). No risk was closed by approval, because no approval was given. What changed in this register:

- **New, closed on QA: the product could present invented information as fact.** With no database the dashboard answered sample figures (AA-001); the executive question box answered made-up analysis with a confidence figure (AA-002); the simulation and forecast answers carried no sample mark at the server (AA-004). All corrected and proven by removal. The remaining sample screens are labelled and save nothing; whether they ship is the owner's decision.
- **New, closed on QA: the assistants trusted the caller's message list.** A caller could send a message in the system's voice, any model name and any length (AA-003), and errors could carry provider text (AA-006). Corrected. What a real model answers is still NOT VERIFIED.
- **New, open: a branch has no time zone (AA-007) and no screen adds a branch (AA-008).** Both matter for an 80-branch company in several time zones. Owner's decisions.
- **New, open: sales staff may dispatch a shipment and move a work order (AA-010).** By the present role table. To be confirmed with the permissions matrix at operational acceptance.
- **Restated as the largest risk: nothing has been confirmed on the live system.** The backups (E-015), the database role (Y-008), the alert receiver (E-017), the scheduled run (B-019), and which database updates are applied are all unknown or not done. Every control proved in Phases 9.5 to 12 that depends on database updates 16 to 18 is not in force until they are applied.
- **Restated: going live with the ledger on is blocked** until an accountant approves the policies (W-001), and the cutover has never been rehearsed on a copy of live (W-005).
- Findings formerly "deferred to a later phase" have no later phase. Each is now REQUIRES BUSINESS DECISION, BLOCKED or IN PROGRESS, with what closes it (\`phase-12-release-blockers.md\`). None is DEFERRED WITH APPROVAL: no approval to defer is on file.
- Conditions for a one-branch pilot with the ledger off: the six steps at the end of \`phase-12-final-report.md\`.
`);
note('workflow-matrix.md', null, H, `
Phase 12 changed no workflow step. It ran ten cross-module workflows from the first document to the books in one script and read the database after each (\`phase-12-workflow-certification.md\`): ${CERT.passed} of ${CERT.scenarios} scenarios, ${CERT.checks} checks on the release candidate.

| Certification workflow | Purpose | Result on QA |
|---|---|---|
${CERT.results.filter((x) => /^WF-/.test(x.record?.workflowId || '')).map((x) => `| ${x.record.workflowId}: ${String(x.name).replace(/\|/g, '/')} | ${String(x.record.purpose || '').slice(0, 160).replace(/\|/g, '/')} | ${x.pass ? 'pass' : '**FAIL**'}, ${x.asserts.length} checks |`).join('\n')}

Facts about the steps confirmed while certifying, which the sections above should be read with: a draft quote may be accepted; an order ends COMPLETE (PARTIAL while part has shipped); material received beyond the purchase order is received on hold; a purchase order stays CONFIRMED after full receipt until the buyer closes it; a work order uses only pounds that are not reserved; a reversed journal entry stays posted and is answered by a second entry.

Not certified because not built: the sample modules (\`phase-12-system-certification.md\`). No workflow was certified with a real user: that is user acceptance, not run.
`);
note('permissions-matrix.md', null, H, `
The table above is generated from the code and was regenerated for the release candidate. Phase 12 tested it again from outside (\`phase-12-security-certification.md\`) and it held. Three points for the people who accept it (\`phase-12-operational-acceptance.md\`):

- Sales staff may dispatch a shipment and move a work order; warehouse and quality staff may move a job (AA-010). This is the role table as written, not a fault in enforcement. Confirm it or change it.
- The assistants answer only for the caller's own organization, list people by name, role and title only, and write an audit row for every question (AA-003).
- No one has approved this matrix. Approval status: NOT GIVEN.
`);
// readme: the phases paragraph and the files table
{ const p = path.join(EE, 'README.md'); let t = fs.readFileSync(p, 'utf8'); const mark = '<!-- phase-12 -->';
  const block = `${mark}\nPhase 12 is the last phase: production certification. Its documents are \`phase-12-*.md\` (24 files, written by \`node qa/tools/phase12-docs.mjs\` from the result files); the one to read first is \`phase-12-final-report.md\`, then \`phase-12-release-blockers.md\`. Its findings use the prefix AA. The recommendation is NO-GO, and no approval has been granted.\n${mark}`;
  t = t.includes(mark) ? t.replace(new RegExp(`${mark}[\\s\\S]*${mark}`), block) : t.replace('\n## The gates', `\n${block}\n\n## The gates`);
  fs.writeFileSync(p, t); console.log('  README.md'); }
