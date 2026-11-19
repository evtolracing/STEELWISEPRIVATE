// Phase 12: the text of the certification documents, second half (performance, recovery, plans, acceptance,
// blockers, scorecard, final report). Called by write.mjs.
export function part2(c, h) {
  const { CERT, PROC, MAN, MUT, CONS, RESTORE, ENT, AUDIT, REG, GATE, RC1, productFiles, stamp, suite, scen, groupLine, scenTable, open, sev, blockers, HUMAN_BLOCKERS, SCORE, overall, weight, GATES, RECOMMENDATION, gateOK, T, NOT_GIVEN, BLANK, sign, esc, money, OUT, ROLES, plans } = c;
  const { FL, FI, RE, DA, AI, SE, ML, GP, gl, caps, openCount, capTotals, allCaps } = h;
  const arr = (x) => (Array.isArray(x) ? x : String(x).split('\n'));
  const ms = (v) => (v == null ? 'not measured' : `${Math.round(v).toLocaleString('en-US')} ms`);

  // 12 ── performance ─────────────────────────────────────────────────────────────────────────
  const lat = ENT?.latencyMs || {}; const lim = ENT?.thresholds?.limits?.latency || {};
  const KEY = ['order written', 'quote accepted into an order', 'goods received', 'stock reserved', 'work order completed', 'shipment dispatched', 'payment taken', 'counter sale paid', 'web order placed', 'return received and credited', 'transfer received', 'journal entry written', 'reconciliation run'];
  OUT('performance-certification', [
    '# Phase 12: performance certification', '', stamp, '',
    '## The dependency that decides this certification', '',
    `**No performance threshold was ever approved.** Phase 11 proposed limits (\`phase-11-workload-profile.md\`, status "${ENT?.thresholds?.status || 'PROPOSED'}") and measured against them. Gate F asks for "approved workload thresholds": until the owner approves or changes the proposal, performance is **NOT VERIFIED** as a gate, whatever the figures. No capacity claim is made for the live system: nothing was measured there.`, '',
    '## What was measured, on the release candidate, in the final gate', '',
    ...(ENT ? [
      ...T(['Item', 'Value'], [['Machine', `${ENT.machine.cpus} processors (${esc(ENT.machine.cpu)}), ${ENT.machine.memoryGb} GB; it carried the database, the server copies and the load`], ['Server copies', ENT.serverCopies], ['Workload', `one simulated enterprise day for 80 branches: ${ENT.jobs?.total ?? Object.values(ENT.jobs || {}).length} customer jobs`], ['Duration', `${ENT.seconds} s`], ['Transactions', gl(/transactions: attempted/)], ['Customer jobs', gl(/customer jobs:/).slice(0, 150)], ['Books and database', gl(/books: trial balance/)], ['Verdict of the run', Object.entries(ENT.verdict).map(([k, v]) => `${k} ${v ? 'yes' : '**no**'}`).join(', ')]]),
      '### Response times of the transactions that matter', '',
      ...T(['Transaction', 'Requests', 'Median', 'p95', 'p99', 'Proposed limit p95 / p99', 'Within the proposal'], KEY.filter((k) => lat[k]).map((k) => { const l = lim[k] || Object.entries(lim).find(([n]) => k.includes(n) || n.includes(k))?.[1]; return [k, lat[k].requests, ms(lat[k].p50), ms(lat[k].p95), ms(lat[k].p99), l ? `${l.p95} / ${l.p99} ms` : 'none proposed for this one', l ? (lat[k].p95 <= l.p95 && lat[k].p99 <= l.p99 ? 'yes' : '**no**') : 'n/a']; })),
      'Slower than the proposal in this run:', '', ...(GATE.split('\n').filter((l) => /slower than the proposed limit/.test(l)).map((l) => `- ${l.replace(/^\s*✗\s*/, '')}`)), '',
      'Any other line in that list was within the proposal in earlier runs and is reported as measured in this one: the figures move from run to run on a machine that carries the database, the servers and the load together. Dispatch is the constant one (Z-006): invoices are numbered one at a time for the whole company, by the owner\'s decision that numbers are never skipped or repeated. The options and their cost are in `phase-11-capacity-recommendations.md`. It is the owner\'s and the accountant\'s decision, not a defect to be tuned away.', '',
    ] : ['**The enterprise run result is missing: NOT VERIFIED.**', '']),
    '## Section 22, item by item', '',
    ...T(['Item', 'Evidence', 'State'], [
      ['Workload configuration', '`phase-11-workload-profile.md`, `phase-11-enterprise-model.md`: built on stated assumptions, not on the business\'s real volumes', 'Reviewed; **assumptions not confirmed by the business**'],
      ['Environment configuration', 'One machine, above', 'Reviewed; **not the live host**'], ['Throughput, median, p95, p99', 'Above, and the five cycles of Phase 11', 'Measured on QA'], ['Error rates', gl(/transactions: attempted/), 'Measured on QA'],
      ['Database performance', `${gl(/books: trial balance/)}; \`phase-11-database-performance.md\``, 'Measured on QA'], ['Queue performance', 'Partner events and scheduled work: `phase-11-event-queue-results.md`; rerun in Phase 11 scenarios group 6', 'Measured on QA'],
      ['Ledger posting throughput', gl(/Phase 9\.5 load:/), 'Measured on QA'], ['Reporting performance', `Reports read while the day ran; reconciliation ${ENT ? ms(ENT.books.reconciliation.ms) : 'not measured'}; cockpit read ${(scen(GP).flatMap((x) => x.asserts).find((a) => /median read/.test(a.what))?.measured) || 'not measured'}`, 'Measured on QA'],
      ['Comparison with approved thresholds', 'None approved', '**Certification dependency: open**'], ['A year of data; the live host; separate machines', 'W-023', '**NOT VERIFIED**'],
    ]),
    '## 80-location readiness (section 23)', '', `${groupLine(ML)}.`, '', ...scenTable(ML), ...caps('80-location readiness (section 23)'),
    'Two facts that matter for a company in several time zones or one that adds branches often: a branch record holds no time zone (AA-007), and no screen adds a branch (AA-008). Both are the owner\'s decisions.', '',
  ]);

  // 13 ── disaster recovery ───────────────────────────────────────────────────────────────────
  OUT('disaster-recovery', [
    '# Phase 12: backup and disaster recovery certification', '', stamp, '',
    '## Verdict', '',
    '**Recovery is verified for the method, on a local database. It is NOT VERIFIED for the live system.** The host\'s backups have never been restored (E-015; owner, 2026-11-13: "backups later"). Unverified backup recovery is a named release blocker and it stands.', '',
    '## The actual restore evidence (Phase 10, `qa/results/phase10-restore.json`)', '',
    ...(RESTORE ? T(['Item', 'Measured'], [['Source', RESTORE.source], ['Target', RESTORE.target], ['Backup', `${RESTORE.backup.format}; ${RESTORE.backup.bytes.toLocaleString('en-US')} bytes in ${RESTORE.backup.seconds} s`], ['Restore', `${RESTORE.restore.seconds} s, exit ${RESTORE.restore.exitCode}, ${RESTORE.restore.errors} errors`], ['Recovery point', `${RESTORE.recoveryPoint.definition}; written after the start and lost: ${RESTORE.recoveryPoint.writtenAfterStartAndLost}`], ['Tables', RESTORE.before.tables], ['Journal (lines : debits : credits) before', RESTORE.before.journal], ['Journal after', RESTORE.after?.journal ?? 'see the file'], ['Stock (items : value) before / after', `${RESTORE.before.stock} / ${RESTORE.after?.stock ?? 'see the file'}`], ['Audit rows before / after', `${RESTORE.before.audit} / ${RESTORE.after?.audit ?? 'see the file'}`], ['Run at', RESTORE.at]]) : ['**The restore result file is missing: NOT VERIFIED.**', '']),
    `The restore test is part of the Phase 10 security suite, which ran again in the final gate: ${suite('p10').text}.`, '',
    '## Section 24, item by item', '',
    ...T(['Item', 'On QA', 'On live'], [
      ['Backup coverage', 'Whole database, one consistent snapshot', '**Not confirmed**: the host\'s backup plan and retention were not read (G-015)'], ['Restore success', 'Yes, into a separate server', '**Never done**'], ['Database integrity', 'Tables, rows and migrations identical', 'unknown'], ['Ledger integrity', 'Journal balances; the four guards and the numbering are kept; the restored application reconciles with no difference', 'unknown'],
      ['Inventory integrity', 'Stock count and value identical', 'unknown'], ['Audit history', 'Identical', 'unknown'], ['Recovery time', 'Seconds, at QA size. **Not a figure for the live database**', 'unknown'], ['Recovery point', 'The moment the backup starts; anything after is lost', 'Depends on the host\'s plan: **not confirmed**'], ['Recovery procedures', '`phase-10-disaster-recovery.md`, `phase-10-restore-test.md`', 'Written for the owner; not rehearsed'],
    ]),
    '## Does RC-2 change recovery behaviour', '',
    `No. This phase made no database change (no migration, no SQL Editor file) and changed no backup or restore code. Product files changed: ${productFiles.length}, all in request handling and the help manual. An additional restore test is therefore not required by the change; the one in the gate was run anyway.`, '',
    '## Unresolved limitations', '',
    '- The live restore (E-015). One restore of a host backup into a scratch project, followed by the reconciliation, closes it. Only the owner can do it.', '- Uploaded files are not in the database backup. Where they live on the host and whether they are backed up is not confirmed (D-011b).', '- No measured recovery time for the real database size.', '- No second region or standby is configured, and none is claimed.',
  ]);

  // 14 ── deployment checklist ────────────────────────────────────────────────────────────────
  const step = (rows) => T(['#', 'Step', 'Who', 'How to verify', 'Done'], rows.map((r, i) => [i + 1, ...r, '[ ]']));
  OUT('deployment-checklist', [
    '# Phase 12: deployment checklist', '', stamp, '',
    '**Nothing in this checklist has been executed. Claude does not deploy, does not apply database updates and does not change host settings.** It is written to be executed by the owner, top to bottom. A step that cannot be ticked stops the deployment.', '',
    '## A. Before the day', '',
    ...step([
      ['Written authorization to deploy this release candidate to the agreed scope (stage and branches)', 'Executive, owner', 'The approvals table in `phase-12-final-report.md` filled in by the people themselves'],
      ['The pull request for RC-2 is merged by the owner\'s word, and the commit to deploy is recorded', 'Owner', 'Commit id written here: ' + BLANK],
      ['A backup of the live database is taken **and restored once into a scratch project** (E-015)', 'Owner', 'The restored copy signs in; `phase-10-restore-test.md` steps pass'],
      ['Which database updates are applied on live is established (files 1 to 18 in `src/backend/prisma/upgrades/sql-editor/`)', 'Owner', 'Sign-in on the current site names a missing update; the `_prisma_migrations` table lists the applied ones'],
      ['Host settings reviewed against `phase-10-deployment-safety.md`: `NODE_ENV=production`, `JWT_SECRET` (32 characters or more), `DATABASE_URL`, `CORS_ORIGIN` empty or the site\'s own address, **`SEED_ON_START` absent**', 'Owner', 'Read on the host; never pasted into a document or chat'],
      ['The alert address (`ALERT_WEBHOOK_URL`) is set to a receiver that a named person reads (E-017)', 'Owner', 'A test alert arrives'],
      ['The scheduled run is configured on the host (B-019)', 'Owner', 'Admin, Integrations shows when it last ran'],
      ['An outside monitor polls `/api/health/ready`', 'Owner or IT', 'It alerts when the address is wrong on purpose'],
    ]),
    '## B. Database, then code (in this order)', '',
    ...step([
      ['Apply the missing SQL Editor files in number order. Each is safe to run twice', 'Owner', 'Each ends without error; run the file\'s own check query'],
      ['File 17 last among them, then point `DATABASE_URL` at the limited role `steelwise_runtime` (Y-008). **Deploying the Phase 10 code before file 17 stops every sign-in**', 'Owner', '`/api/health/ready` is 200; a sign-in works'],
      ['Deploy the recorded commit', 'Owner', '`/api/health` names that commit'],
      ['Frontend build is the one from the same commit', 'Owner', 'The page footer or `/api/health` commit matches'],
    ]),
    '## C. First hour', '',
    ...step([
      ['Sign in as an administrator, a branch user and a customer login', 'IT', 'Each sees its own menu; the customer sees only its account'],
      ['Admin, Integrations: no failed events, no shipped-not-invoiced, scheduled run recent', 'IT', 'Screen read'],
      ['Upload a small file and download it again (D-011b: never verified on the host)', 'IT', 'Bytes identical'],
      ['The first real outside call, if any provider is configured (H-005: never verified against a real provider)', 'IT', 'Admin, Integrations shows the call succeeded'],
      ['Counts on live data that were unknown here: H-006, H-018, L-031, N-004', 'IT', 'Read from the reports named in each finding'],
      ['Finance, Overview says the books are **not running** (the ledger stays off until the accountant approves)', 'Finance', 'Screen read'],
    ]),
    '## D. Section 25, item by item: what was verified here', '',
    ...T(['Item', 'Verified in this phase', 'State'], [
      ['Production configuration', `A server started in production mode on QA: ${PROC ? PROC.results.filter((r) => r.finding === 'SC-07').map((r) => `${r.ok ? 'pass' : 'FAIL'}: ${r.what}`).join('; ') : 'not run'}`, 'Verified for the code; **host values not read**'],
      ['Environment variables and secrets', 'The server refuses to start in production with a short or missing secret (Phase 10); no secret is in the repository or the page bundle (Security 10)', 'Verified for the code'],
      ['Database migrations', 'Rebuilt from migrations in the gate; no new one in this phase', 'Verified on QA; **live state unknown**'], ['API compatibility', suite('p4').text, 'Verified on QA'], ['Frontend build', gl(/built in/), gateOK ? 'Verified' : 'NOT VERIFIED until the gate ends'],
      ['Worker deployment and queue configuration', 'There is no separate worker: scheduled work is one route a scheduler calls. Tested on three copies in Phase 11', '**Not configured on the host (B-019)**'], ['Integration configuration', 'Stand-ins only', '**NOT VERIFIED against real providers**'], ['Monitoring and alerting', 'See `phase-12-operational-acceptance.md`', '**Reaches nobody on live (E-017)**'], ['Backups', 'See `phase-12-disaster-recovery.md`', '**Not verified on live (E-015)**'],
    ]),
  ]);

  // 15, 16, 17 ── rollback, cutover, rollout ──────────────────────────────────────────────────
  const pc = { stamp }; const recon = `Phase 12: ${groupLine(RE)}`;
  OUT('rollback-plan', arr(plans.rollback(pc)));
  OUT('cutover-plan', arr(plans.cutover(pc)));
  OUT('rollout-plan', arr(plans.rollout(pc)));

  // 18 ── training plan ───────────────────────────────────────────────────────────────────────
  const verdict = Object.fromEntries(AUDIT.rows.map((r) => [`/${r.route}`.replace(/\/+/g, '/'), r.verdict]));
  const bad = ROLES.flatMap((r) => r.screens.filter((s) => !['REAL', 'MIXED'].includes(verdict[s])).map((s) => `${r.role}: ${s} (${verdict[s] || 'not a screen'})`));
  if (bad.length) { console.error(`The training plan names screens that are not real screens:\n  ${bad.join('\n  ')}`); process.exit(1); }
  OUT('training-plan', [
    '# Phase 12: role-based training plan', '', stamp, '',
    `Twelve roles. Every screen named is a real screen of the product (checked against the screen audit when this page was written: ${ROLES.reduce((a, r) => a + r.screens.length, 0)} screen references, all REAL or MIXED). No sample screen is taught. **No trainer, trainee or date is named: who trains whom and when is the owner's to fill in. Nobody has been trained.**`, '',
    'Each role also reads its chapters of the in-product manual (Help, Manual), which now says plainly which chapters describe design samples, and has chapters for finance, purchasing, transfers, work orders, invoices and returns, the administration checks, and "When something goes wrong".', '',
    ...ROLES.flatMap((r) => [`## ${r.role}`, '', `Logins: ${r.logins}. Screens: ${r.screens.map((s) => `\`${s}\``).join(', ')}.`, '',
      '**Required workflows**', '', ...r.workflows.map((w) => `- ${w}`), '', '**Step by step**', '', ...r.steps.map((s, i) => `${i + 1}. ${s}`), '', '**Practice scenarios** (on a practice system, never on live)', '', ...r.practice.map((s) => `- ${s}`), '',
      '**Common mistakes**', '', ...r.mistakes.map((s) => `- ${s}`), '', '**Exceptions and what to do**', '', ...r.exceptions.map((s) => `- ${s}`), '', '**What this login can and cannot do**', '', ...r.boundaries.map((s) => `- ${s}`), '', '**Knowledge check**', '', ...r.check.map((s, i) => `${i + 1}. ${s}`), '', `**Complete when:** ${r.done}`, '',
      ...T(['Trainee', 'Trainer', 'Date', 'Practice scenarios done', 'Knowledge check', 'Signed'], [[BLANK, BLANK, BLANK, '[ ]', '[ ]', NOT_GIVEN]])]),
    '## The manual and contextual help (sections 31 and 32)', '',
    `${MAN ? `The manual check: ${MAN.chapters} chapters, ${MAN.checks} checks, ${MAN.failed} failed (\`qa/results/phase12-manual.json\`). Sample chapters flagged: ${MAN.sampleChapters.join(', ')}. Chapters naming their sample screens: ${(MAN.partSampleChapters || []).join(', ')}.` : '**The manual check was not run: NOT VERIFIED.**'}`, '',
    '- The Help button on a screen opens that screen\'s chapter in a drawer; the manual page lists every chapter the login may read.', '- Field hints, required-field marks and plain error messages were reviewed screen by screen in Phase 9. Guided first-use tours and searchable in-product help beyond the manual are **not built**.', '- The wording of the older chapters was not re-read line by line against every screen in this phase (M-018, S-024 stay in progress).',
  ]);

  // 19 ── user acceptance ─────────────────────────────────────────────────────────────────────
  const UAT = [['Sales', 'WF-01', 'Quote a new customer, accept the quote, see the order'], ['Sales', 'WF-09', 'Enter an order that ships in two parts'], ['Purchasing', 'WF-03', 'Write, approve and receive a purchase order in two parts; receive more than ordered'], ['Warehouse', 'WF-04', 'Send a transfer and receive it at the other branch'], ['Warehouse', 'WF-03', 'Receive material against a purchase order and find it in stock'],
    ['Production', 'WF-05', 'Run a work order to two pieces and scrap'], ['Production', 'WF-02', 'Run a job through its steps on the floor'], ['Quality', 'WF-02', 'Fail an inspection, see the job held, pass it after rework'], ['Shipping', 'WF-01', 'Put a shipment together, dispatch it, confirm delivery'], ['Finance', 'WF-08', 'Return goods, issue the credit, pay the refund'], ['Finance', 'LC-18', 'Read the financial reports and the reconciliation (QA ledger only)'],
    ['Management', 'WF-10', 'Read the branch\'s figures and confirm no other branch is visible'], ['IT administration', 'SC-02', 'Add a user, switch a login off, read the audit log and the Integrations checks'], ['Counter', 'WF-07', 'Make a counter sale and give the receipt'], ['Customer service', 'WF-06', 'Accept a web order and follow it to payment']];
  OUT('user-acceptance', [
    '# Phase 12: user acceptance testing', '', stamp, '',
    '**User acceptance has not been run. No business user has tested anything and no sign-off exists.** What follows is the prepared plan and the record sheet. The column "Engineering result" is what the scripted run of the same workflow did on QA; it is there to help the tester and is **not** an acceptance result.', '',
    '## How to run it', '',
    '1. On an isolated copy (Stage 0 of the rollout plan), never on live. Each tester uses a login of their own role and branch.', '2. The tester follows the steps in their role\'s section of `phase-12-training-plan.md` and the manual, not instructions from engineering.', '3. Every difference between expected and actual is written down as a defect, corrected at its cause, and retested by the same person.', '4. A reviewer who is not the tester signs each case.', '',
    '## Test cases', '',
    ...T(['#', 'Representative of', 'Test case', 'Expected result', 'Engineering result on QA (not acceptance)', 'Actual result', 'Defect', 'Correction', 'Retest', 'Reviewer', 'Approval status'],
      UAT.map(([who, id, what], i) => { const x = CERT.results.find((s) => s.record.workflowId === id); return [i + 1, who, what, esc(x?.record.expectedFinalState || 'as the training plan states'), x ? `${id}: ${x.pass ? 'pass' : 'FAIL'}, ${x.asserts.length} checks` : `${id}: not run`, BLANK, BLANK, BLANK, BLANK, BLANK, NOT_GIVEN]; })),
    '## Representatives', '', ...sign(['Sales', 'Purchasing', 'Warehouse', 'Production', 'Quality', 'Shipping', 'Finance', 'Management', 'IT administration']),
    '## Employee productivity (section 20)', '',
    'Phase 9 counted clicks, keystrokes and screens for the daily workflows with a scripted browser and removed dead ends (`phase-09-*` documents). **No measurement with employees exists**: time per order, error rate and training time for real people can only come from the pilot. No productivity figure is claimed.', '',
  ]);

  // 20 ── financial acceptance ────────────────────────────────────────────────────────────────
  OUT('financial-acceptance', arr(plans.acceptanceForm('financial acceptance',
    `${stamp}\n\n**No financial approval has been given. Engineering verification does not replace accountant acceptance.** The ledger is switched off on the live system. The software refuses to switch it on while any account or mapping is unapproved, and asks for the accountant's name, an approval date, a time zone and a dry run less than seven days old (tested: Ledger 1, Ledger 2 and Phase 9.5). That block stays.`,
    [['Chart of accounts', 'Proposed chart; every account must be approved by name (`phase-09-5-chart-of-accounts.md`)'], ['Posting policies (sixteen decisions)', '`phase-09-5-accounting-policy-decisions.md`; the defaults are listed in `phase-12-ledger-certification.md`'], ['Inventory costing', 'Actual cost per item; items with no cost are held by name, never valued at zero (Ledger 11)'], ['Revenue and COGS recognition', 'Revenue at invoice, cost at shipment; a shipment not yet billed is listed (Ledger 8 to 10, Reconciliation 5)'],
      ['Opening balances', '**None taken for live. None invented.** The dry run on a copy of live has not been run (W-005)'], ['Accounts receivable', `Ledger equals open invoices on QA (Reconciliation 2: ${scen(RE).find((x) => /RC-02/.test(x.record.workflowId))?.pass ? 'pass' : 'not passed'})`], ['Ledger reconciliation', `${groupLine(RE)} on QA; nothing on live`], ['External accounting integration', 'An export file exists and is tested (Ledger 17). **No connection to an accounting system exists**; which system, and its account numbers, are the accountant\'s to give'], ['Financial reports', `Trial balance, revenue by branch and customer, receivables, stock value, gross margin on material: agree with the journal on QA (${groupLine(DA)})`]],
    ['Qualified accountant (external or internal)', 'CFO or owner'])));

  // 21 ── operational acceptance ──────────────────────────────────────────────────────────────
  OUT('operational-acceptance', [
    ...arr(plans.acceptanceForm('security and operational acceptance', `${stamp}\n\n**No approval has been given by any stakeholder.**`,
      [['Security readiness', '`phase-12-security-certification.md`; live database role not yet switched (Y-008)'], ['Backup and recovery', '`phase-12-disaster-recovery.md`; live restore never done (E-015)'], ['Incident response', 'Classes and first responses below; no person named'], ['Operational procedures', 'Support procedures below; the manual chapter "When something goes wrong"'], ['Support readiness', 'No support owner is named'], ['Rollout plan', '`phase-12-rollout-plan.md`; no pilot chosen, no date'], ['Deployment authorization', '`phase-12-deployment-checklist.md`; not authorized'], ['Permissions matrix, line by line', '`permissions-matrix.md`; in particular that sales staff may dispatch a shipment and move a work order (AA-010)']],
      ['Security', 'IT', 'Operations', 'Business', 'Executive'])),
    ...arr(plans.support()), ...arr(plans.incidents()), ...arr(plans.monitoring({ recon })),
    '## Release management (section 36)', '',
    ...T(['Item', 'What exists', 'Open'], [
      ['Release candidate identifier', 'RC-n over a commit id (`phase-12-release-baseline.md`)', 'No version number in the product'], ['Change control', 'One pull request per phase; merged only on the owner\'s word; the candidate is frozen and any change is recorded and regated', ''], ['Database changes', 'Every change ships as a migration and a SQL Editor file run twice on a copy; the owner applies it', 'Live state not known to engineering'],
      ['Quality gate', '`qa/tools/run-gates.sh`: rebuild, every suite of every phase, lint, build, documents', 'About an hour; runs locally, not in CI'], ['Rollback', '`phase-12-rollback-plan.md`', 'Not rehearsed on the host'], ['Release notes', 'The phase report and the pull request description', ''], ['Hotfix path', 'Same gate; a hotfix is a new candidate', 'No on-call person named'], ['Post-release review', 'First-hour checks in the deployment checklist; the pilot exit criteria', 'Nobody named to run it'],
    ]),
  ]);

  // 22 ── release blockers ────────────────────────────────────────────────────────────────────
  OUT('release-blockers', [
    '# Phase 12: release blockers', '', stamp, '',
    `**${blockers.length + HUMAN_BLOCKERS.length} blockers stand** under the policy of section 42: ${blockers.length} open findings and ${HUMAN_BLOCKERS.length} missing approvals or acceptances. None was relabelled as an improvement, and no finding was deleted or downgraded to shorten this list.`, '',
    '## Missing acceptance and authorization', '', ...T(['#', 'Policy clause', 'State'], HUMAN_BLOCKERS),
    '## Open findings that block', '', ...T(['Finding', 'Severity', 'Status', 'Why it blocks (policy clause)', 'What closes it', 'Who'], blockers.map(({ f, why }) => [f.id, f.severity, f.status, esc(why), esc((/Phase 12: /.test(f.statusNote || '') ? String(f.statusNote).split('Phase 12: ').pop() : `Expected: ${f.expected || 'see the register'}`).slice(0, 240)), /BUSINESS DECISION|ACCEPTED/.test(f.status) ? 'Owner' : f.status === 'BLOCKED' ? 'Owner (access or host)' : f.status === 'FIXED — NOT VERIFIED' ? 'Owner applies and confirms on live' : 'Engineering, then owner'])),
    '## The clauses of section 42, one by one', '',
    ...T(['Clause', 'State', 'Evidence'], [
      ['Unresolved confirmed P0 defects', sev(open, 'P0') ? `**${sev(open, 'P0')} open**` : 'none', open.filter((f) => f.severity === 'P0').map((f) => f.id).join(', ') || 'none'],
      ['Unresolved confirmed P1 defects affecting critical workflows', `**${sev(open, 'P1')} P1 open**; those touching order to cash, stock, production, shipping or money are in the table above`, open.filter((f) => f.severity === 'P1').map((f) => f.id).join(', ')],
      ['Material unexplained financial discrepancies', 'None on QA. **Unknown on live**', `${groupLine(RE)}`], ['Material unexplained inventory discrepancies', 'None on QA. **Unknown on live**', 'Reconciliation 3; Phases 3 and 6'], ['Critical authorization failures', 'None found', `${groupLine(SE)}; ${suite('p10').text}`],
      ['Unverified backup recovery', '**Blocks**', 'E-015'], ['Failed critical transaction recovery', 'None failed', 'Phase 11 failure injection; process checks'], ['Unapproved financial posting policies', '**Blocks**', 'W-001'], ['Missing required accounting acceptance', '**Blocks**', 'HB-1'], ['Failed mandatory UAT', '**Blocks: not run**', 'HB-2'], ['Missing deployment authorization', '**Blocks**', 'HB-3'],
    ]),
    '## Every open finding (section 43: nothing silently unfinished)', '', `${openCount}.`, '', ...T(['Finding', 'Severity', 'Status', 'Area', 'What is open', 'Blocks production'], open.map((f) => [f.id, f.severity, f.status, esc(f.module), esc(String(f.actual || '').slice(0, 150)), blockers.some((b) => b.f.id === f.id) ? '**yes**' : 'no'])),
  ]);

  // 23 ── quality scorecard ───────────────────────────────────────────────────────────────────
  OUT('quality-scorecard', [
    '# Phase 12: final quality scorecard', '', stamp, '',
    'Scores are judgements from the evidence named beside each one; they are not measurements. A category with no evidence in this run is NOT ASSESSED and gets no number. **A score does not open a gate: a high number cannot override a financial, security or data blocker, and here the blockers stand whatever the number is.**', '',
    ...T(['Category', 'Weight', 'Score', 'Weighted', 'Evidence and what holds it down'], [...SCORE.map(([name, w, s, why]) => [name, `${w}%`, s == null ? 'NOT ASSESSED' : s, s == null ? '' : (w * s / 100).toFixed(2), esc(why)]), ['**Total**', `${weight}% assessed`, overall == null ? 'NOT ASSESSED' : `**${overall}**`, '', 'Weighted mean of the assessed categories']]),
    '## Reading it', '',
    `- ${overall} of 100 describes a system whose built core is sound on test data and whose surroundings are not ready: approvals, live verification, alerting and unbuilt modules.`, '- Phase 11 scored the same categories for the stress phase only; this card is for the whole product at the end of the program and is lower where the whole product is weaker than the part that phase tested.', '- The largest single drag is not a defect in code: it is that nothing has been confirmed on the live system or by the people who will use it.', '',
    '## The directive\'s gates A to J (Universal Engineering Directive)', '',
    ...T(['Gate', 'Result', 'Evidence'], [['A Requirements traced', 'PASS', 'Every section of the prompt maps to a document here; `ticket-traceability.md`'], ['B Root cause', 'PASS', 'AA-001 to AA-006 and AA-011 fixed at the cause (the sign-in check, the input function, the route), not at the symptom'], ['C Tests fail without the fix', MUT && MUT.held === MUT.mutations ? 'PASS' : 'FAIL', MUT ? `${MUT.held} of ${MUT.mutations}` : 'not run'], ['D Regression', gateOK && suite('p9').ok && suite('p11s').ok ? 'PASS' : 'NOT VERIFIED', `Full gate on RC-2. ${suite('p9').text}. ${suite('p11s').text}`], ['E Security', 'PASS on QA', groupLine(SE)], ['F Data integrity', 'PASS on QA', groupLine(RE)], ['G Performance', 'NOT VERIFIED', 'No approved thresholds'], ['H Observability', 'CONDITIONAL', 'Exists; reaches nobody on live'], ['I Documentation', 'PASS', '24 documents; manual check'], ['J Release readiness', 'FAIL', 'Blockers stand']]),
    `Readiness decision under the directive: **FAIL** for production, for the reasons in \`phase-12-release-blockers.md\`.`,
  ]);

  // 24 ── final report ────────────────────────────────────────────────────────────────────────
  const approvals = T(['Approval', 'Status', 'Evidence on file', 'What the approver is asked to decide'], [['Business', NOT_GIVEN, 'none', 'User acceptance; the sample modules; the permissions matrix'], ['Finance', NOT_GIVEN, 'none', 'The sixteen accounting policies, the chart, opening balances, the cutover date'], ['Operations', NOT_GIVEN, 'none', 'The pilot branch; support and incident owners; the dispatch wait at peak (Z-006)'], ['Security', NOT_GIVEN, 'none', 'Security readiness; the live database role; who receives alerts'], ['IT', NOT_GIVEN, 'none', 'Backups restored; database updates applied; host settings; the scheduled run'], ['Executive', NOT_GIVEN, 'none', 'Authorization to deploy, and to what scope']]);
  OUT('final-report', [
    '# Phase 12 of 12: final execution report', '', stamp, '',
    `## FINAL RECOMMENDATION: ${RECOMMENDATION}`, '',
    '**The application is not approved for production, and this report does not approve it.** On test data the built core of the product is sound: every critical workflow that exists runs end to end, the books balance and reconcile, access holds, and failures recover. Production approval is blocked by things engineering cannot supply: no accountant has approved the financial policies, no user has accepted the system, no backup of the live database has ever been restored, no one has authorized a deployment, and several controls proved here are not yet in force on the live database.', '',
    'A recommendation is not an authorization. Claude prepared this and cannot grant any approval in it.', '',
    '## PROGRAM SUMMARY', '',
    `- Twelve phases. ${CONS.phasesVerifiedComplete} call themselves verified complete; each stopped at an owner decision, an approval or a live-system check (\`phase-12-program-consolidation.md\`).`,
    `- ${REG.length} findings in one register, none deleted. ${REG.filter((f) => f.status === 'VERIFIED FIXED').length} verified fixed; ${openCount}.`,
    `- This phase found ${REG.filter((f) => /^AA-/.test(f.id)).length} more (AA-001 to AA-012): seven product defects, corrected and verified; three for the owner's decision; two faults in the tests themselves. The worst: the executive question box answered with invented analysis and a made-up confidence figure (AA-002), and the assistant accepted messages forged as the system's (AA-003).`,
    `- Release candidate RC-2: RC-1 (\`${RC1}\`) plus ${productFiles.length} product files changed. No database change.`,
    `- Final gate on RC-2: ${gateOK ? 'ran to the end' : '**NOT FINISHED**'}. ${gl(/Phase 12 certification:/).split(';')[0]}. Phase 9 browser suite: ${suite('p9').text}. Phase 11: ${suite('p11s').text}. Unit tests: ${gl(/# pass/).replace(/\D/g, '')} of ${gl(/# tests/).replace(/\D/g, '')} pass. ${MUT ? `${MUT.held} of ${MUT.mutations} corrections are caught by their check when removed.` : ''}`, '',
    '## APPLICATION CERTIFICATION', '',
    `- ${allCaps.length} capabilities the prompt lists were checked against the product: ${Object.entries(capTotals).map(([k, v]) => `${v} ${k}`).join(', ')} (\`phase-12-system-certification.md\`).`,
    `- ${CERT.results.length} workflows and controls certified through the real server: ${CERT.passed} pass, ${CERT.checks} checks. The ten cross-module flows: ${groupLine(FL)}.`,
    `- Screens: ${AUDIT.tally.REAL} real, ${AUDIT.tally.MIXED} mixed, ${AUDIT.tally['SAMPLE, LABELLED']} labelled samples of ${AUDIT.screens}. The samples save nothing and say so; the owner's decision to build them (decision 4) is not carried out.`,
    '- Sales, counter, web store, inventory, purchasing, manufacturing, quality and shipping each have a certification page stating what is verified, what is partial and what is not built.', '',
    '## FINANCIAL CERTIFICATION', '',
    `- Ledger controls on QA: ${groupLine(FI)}. Reconciliation: ${groupLine(RE)}. Dashboards and reports against the records: ${groupLine(DA)}.`,
    ENT ? `- The enterprise day in the gate: debits ${money(ENT.books.totals.debit)} equal credits ${money(ENT.books.totals.credit)}; receivables, inventory, in transit, revenue, tax and payments each agree with the records to the cent.` : '- The enterprise day result is missing.',
    '- **All of it is test data.** The ledger is off on live. Every accounting policy is pending; no opening balance was taken or invented; no cutover date is set. Financial activation stays blocked in the software until an accountant approves (W-001).', '',
    '## SECURITY AND RELIABILITY', '',
    `- Security revalidation: ${groupLine(SE)}; ${suite('p10').text}; assistants: ${groupLine(AI)}.`,
    `- Reliability: Phase 11 failure injection passes in the gate; ${PROC ? `${PROC.checks - PROC.failed} of ${PROC.checks} process checks pass` : 'process checks not run'} (a polite stop loses no request; no database means 503, never invented data).`,
    '- Backup and restore: verified on a local server; **never on the live host (E-015)**. The limited database role that protects financial history is proved on QA and **not yet in force on live (Y-008)**. No outside penetration test was made.', '',
    '## ENTERPRISE PERFORMANCE', '',
    `- ${gl(/transactions: attempted/)}; ${gl(/books: trial balance/)}.`, '- Thresholds were proposed in Phase 11 and never approved. Against the proposal, dispatch at the busiest moment is too slow (Z-006), by a design the owner chose for unbroken invoice numbers.', '- One machine, synthetic volumes. No claim is made about the live host, a year of data, or real users.',
    `- 80 locations: ${groupLine(ML)}. A branch has no time zone of its own (AA-007) and no screen adds a branch (AA-008).`, '',
    '## OPERATIONAL READINESS', '',
    '- Written and ready to use: staged rollout with entry and exit criteria, pilot selection criteria, cutover plan, rollback plan, deployment checklist, twelve-role training plan, support, incident and monitoring procedures, user acceptance scripts, acceptance forms.',
    `- The in-product manual now says which chapters describe samples and has a chapter for every real screen (${MAN ? `${MAN.chapters} chapters, ${MAN.checks} checks, ${MAN.failed} failed` : 'check not run'}).`,
    '- Not done: nobody trained; no pilot chosen; no date set; no support owner named; alerts reach nobody on live; the scheduled run is not configured; none of the plans rehearsed on the host.', '',
    '## APPROVALS', '', 'Actual status. None was received and none is claimed.', '', ...approvals,
    '## The twelve production gates', '', ...T(['Gate', 'Name', 'Result', 'Evidence'], GATES.map((g) => [g[0], g[1], `**${g[2]}**`, esc(g[3])])),
    `${GATES.filter((g) => /^PASS/.test(g[2])).length} pass on QA, ${GATES.filter((g) => g[2] === 'CONDITIONAL').length} conditional, ${GATES.filter((g) => g[2] === 'FAIL').length} fail, ${GATES.filter((g) => g[2] === 'NOT VERIFIED').length} not verified. Quality score ${overall} of 100 (\`phase-12-quality-scorecard.md\`); a score does not open a gate.`, '',
    '## Why NO-GO and not something softer', '',
    '- **Not GO**: mandatory gates fail and no approval exists.', '- **Not CONDITIONAL GO**: that needs conditions that are noncritical and already approved by stakeholders with owners and deadlines. The open conditions are critical (accounting, backups, user acceptance) and nobody has approved anything.', '- **Not INSUFFICIENT EVIDENCE** alone: evidence is indeed missing for the live system, but there are also confirmed blockers that more evidence would not remove. Where evidence is what is missing, the gate says NOT VERIFIED.', '',
    '## The shortest path to a Stage 1 pilot', '',
    '1. Owner: restore one live backup into a scratch project (closes E-015).', '2. Owner: apply the missing database updates in order, then point the server at the limited role (Y-008).', '3. Owner: set the alert receiver and the scheduled run (E-017, B-019).', '4. Owner: decide the sample modules for go-live (labelled, hidden, or wait), and confirm the permissions matrix.', '5. Business: run user acceptance on a copy and sign it.', '6. Executive: authorize Stage 0, then Stage 1 for one branch, **with the ledger off**. The accounting approvals (W-001) are needed only before the ledger is switched on, and can follow the operational pilot.', '',
    'With steps 1 to 6 done and recorded, an operational pilot of one branch with the ledger off would no longer be blocked by anything in this report.', '',
    '## Continuation point', '',
    'Phase 12 is the last phase. Remaining work is the list in `phase-12-release-blockers.md`; the state file `progress.json` holds the same list for a later session. If the candidate changes, it becomes RC-3: record the change in `phase-12-release-baseline.md` and run `qa/tools/run-gates.sh` again.', '',
    '## Documents of this phase', '', ...c.written.concat(['final-report']).map((n) => `- \`qa/enterprise-excellence/phase-12-${n}.md\``),
  ]);
}
