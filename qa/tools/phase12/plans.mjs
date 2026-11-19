// Phase 12: the plans and forms that do not depend on a test result: staged rollout, pilot criteria, data
// cutover, rollback, deployment checklist, support, incidents, monitoring, release management and the
// acceptance forms. No date, no person and no approval is invented here: every such field is a blank
// for the business to fill, and every approval is printed as NOT GIVEN until evidence of it is on file.
const T = (head, rows) => [`| ${head.join(' | ')} |`, `|${head.map(() => '---').join('|')}|`, ...rows.map((r) => `| ${r.join(' | ')} |`), ''];
const BLANK = '________________';
export const NOT_GIVEN = 'NOT GIVEN';
const sign = (who) => T(['Approver (role)', 'Name', 'Decision', 'Date', 'Evidence on file'], who.map((w) => [w, BLANK, NOT_GIVEN, BLANK, 'none']));

export function rollout(c) {
  return [
    '# Phase 12: staged rollout plan', '', c.stamp, '',
    'A recommendation. Nothing here is scheduled and nothing is activated by it. **No date is proposed**: each stage begins when its entry criteria are met and the named approver says so. **No location is named**: the pilot is chosen by the owner against the criteria below.', '',
    '## Why staged', '',
    'Every measurement in this program was taken on synthetic data on one machine. A staged rollout is how the things that could not be measured here (real volumes, real users, real printers and scanners, the live database, the host\'s backups) are learned at the scale of one branch before they can hurt eighty.', '',
    '## Stages', '',
    ...T(['Stage', 'What happens', 'Entry criteria', 'Exit (acceptance) criteria', 'Who authorises'], [
      ['0. Internal validation', 'The release candidate on an isolated copy of the live database (name contains `qa`), with internal test users. The ledger dry run on that copy.', 'Database updates 17 and 18 applied to the copy; the full gate green on the candidate (this phase).', 'Every item of `phase-12-deployment-checklist.md` section A done; the ten cross-module flows repeated by hand by a business user on the copy; the dry run figures signed by the accountant; a host backup restored once (E-015).', 'Owner'],
      ['1. Pilot location', 'One branch works live in the system for its real orders, stock, production and shipping. The ledger stays off unless the accountant has approved it.', 'Stage 0 accepted; pilot chosen against the criteria below; its people trained (`phase-12-training-plan.md`) and signed off; its stock counted and its costs entered; support cover named.', 'Ten consecutive working days with: no P0 or P1 incident open; stock count sample agrees with the system within the tolerance the owner sets; every shipment invoiced (Integrations screen shows none uninvoiced); the pilot manager\'s sign-off.', 'Owner, with the pilot branch manager'],
      ['2. Expanded pilot', 'Several branches of different kinds: at least one with processing, one warehouse-only, one sales office, and two that transfer stock to each other.', 'Stage 1 accepted; every Stage 1 defect of P0 to P2 closed or approved as deferred; measured live response times reviewed against approved thresholds.', 'Fifteen working days meeting the Stage 1 criteria at every branch; a transfer sent and received between pilot branches with a shortage decided; month-end reconciliation clean if the ledger is on.', 'Owner, operations and finance leads'],
      ['3. Regional rollout', 'Controlled groups of branches, one group at a time.', 'Stage 2 accepted; capacity reviewed against the Phase 11 projection with real figures; the Z-006 decision (dispatch wait at peak) made.', 'Each group meets the Stage 1 criteria for ten working days before the next group starts.', 'Owner'],
      ['4. Enterprise rollout', 'The remaining approved branches.', 'Stage 3 accepted for every group; support load per branch known from Stages 1 to 3.', 'All approved branches live; the program\'s open findings re-reviewed.', 'Owner, executive'],
    ]),
    'A stage is stopped, and the group returns to its previous way of working, when a P0 incident is open, when stock or money cannot be reconciled, or when the approver says so. Stopping a stage is not a failure of the program; continuing past one of those is.', '',
    '## Pilot selection criteria', '',
    'The pilot should be **representative with manageable risk**, not the quietest branch: a branch with the fewest transactions proves the least.', '',
    ...T(['Criterion', 'What to look for', 'Evidence the owner should have before choosing'], [
      ['Operational complexity', 'Does the branch sell from stock, process (cut, slit), ship by its own truck and by carrier, and take counter sales? A pilot that does most of these exercises most of the product.', 'The branch\'s own description of a normal week'],
      ['Employee readiness', 'People willing to work in two systems for a short overlap, and a manager who will insist the system is used.', 'Training sign-offs for every role at the branch'],
      ['Inventory accuracy', 'A recent count that agrees with the current records. A pilot that starts from wrong stock will blame the software for old errors.', 'A count dated shortly before cutover, with variances resolved'],
      ['Manufacturing requirements', 'Processing that the product models: work orders with pieces and scrap, jobs through work centers with a QC gate. Requirements outside that (see the manufacturing certification) should not be in the pilot.', 'The list of processing the branch does'],
      ['Financial readiness', 'Costs on file for its stock; its open invoices known; the accountant available for the dry run.', 'The dry run on a copy: items with no cost listed'],
      ['Management support', 'A branch manager and a head-office sponsor who will decide quickly.', 'Named by the owner'],
      ['Integration dependencies', 'Few. No carrier, card, email or accounting integration is connected in the product; a branch that depends on one today needs a manual step.', '`phase-04-external-integrations.md` read against how the branch works'],
      ['Ability to recover', 'The branch can fall back to its present way of working for a day without harm, and its data can be re-entered.', 'A written fallback for the branch'],
    ]),
    '## What a stage does not change', '',
    '- The ledger is started once for the company, not per branch, and only after the accountant\'s approval (W-001). It can stay off through every stage.',
    '- The sample screens stay labelled as samples. They are not part of any stage until built (owner decision 4).',
    '- Database updates are applied by the owner, before the code that needs them.', '',
  ].join('\n');
}

export function cutover(c) {
  return [
    '# Phase 12: data migration and cutover plan', '', c.stamp, '',
    'A plan for the owner to execute. **Nothing was migrated in this phase**: there is no access to the existing system\'s data, so no mapping has been run on real records and none is claimed. The ledger part of the cutover is `phase-09-5-cutover-plan.md`, which this plan uses and does not repeat.', '',
    '## What has to exist before a branch works live', '',
    ...T(['Data', 'Where it lands', 'How it gets there today', 'Check after loading', 'Known gap'], [
      ['Customers', '`Organization` (type customer), contacts, price tier, credit settings', 'Entered on Customers, or loaded by a script written against the export of the present system', 'Count equals the source; no two customers share a code; every open order\'s customer exists', 'No import tool is built. A load script must be written and tested on a copy'],
      ['Suppliers', '`Organization` (type supplier)', 'As customers', 'Every open purchase order\'s supplier exists', 'As customers'],
      ['Products and grades', '`Product`, `Grade`, price book', 'Admin, Catalog; Pricing', 'Every product on an open order exists with a list price', 'Customer-specific discounts are stored and applied nowhere (J-008, S-020)'],
      ['Heats and certificates', '`Heat`, documents', 'Heats screen, one at a time; certificate upload', 'Every stock item\'s heat is on file', 'Heats are added one at a time (I-017)'],
      ['Inventory', '`Coil` and `Inventory`, each with heat, dimensions, weight, branch and **unit cost**', 'Receiving, or a load script', 'Pounds by branch and grade equal the count; no negative figure; **items with no cost are listed** by the ledger dry run', 'An item with no cost cannot be valued and is left out of the opening books, by name'],
      ['Open sales orders', '`Order`, `OrderLine`', 'Re-entered through Order entry at their agreed prices', 'Count and value equal the source list', 'No bulk order import'],
      ['Open purchase orders', '`PurchaseOrder` and lines', 'Purchase orders screen', 'Quantity still to come equals the source', 'None'],
      ['Work orders and jobs in progress', '`WorkOrder`, `Job`', 'Finish in the present system before cutover where possible; otherwise re-enter', 'No job is in both systems', 'Work in progress at cutover has no opening value in the books'],
      ['Shipments on the road', '`Shipment`', 'Complete in the present system; do not migrate', 'None open in the present system for the branch', 'None'],
      ['Open invoices and receivables', '`Invoice`, `Payment`', 'A load script that writes invoices as already issued, with what has been paid', 'Total owed per customer equals the receivables ledger of the present system on the cutover date', 'No import tool is built; this is the most sensitive load and must be reconciled to the cent'],
      ['Financial opening balances', 'The ledger\'s opening entries', 'Computed by the product from the records above at activation (`phase-09-5-cutover-plan.md`); everything else is entered by the accountant', 'The dry run, signed by the accountant; reconciliation immediately after activation', '**No opening balance is invented.** Sales tax owed, bank, supplier bills and any balance of the present accounting system are the accountant\'s manual entries'],
    ]),
    '## Order of work for one branch', '',
    '1. Freeze: agree the cutover moment with the branch. After it, nothing is entered in the present system for that branch.',
    '2. Count stock, or accept the last count, and resolve variances.',
    '3. Load reference data (customers, suppliers, products, heats) on a copy first; check; then live.',
    '4. Load stock with costs. Run the supply position and compare pounds by grade with the count.',
    '5. Enter open orders and purchase orders. Compare counts and values with the source lists.',
    '6. Load open invoices. Compare what each customer owes with the present receivables ledger.',
    '7. If the ledger is to start: follow `phase-09-5-cutover-plan.md` steps 2 to 11. Otherwise leave it off.',
    '8. First day: the branch manager checks the order board, stock and shipping against the floor before the first shipment.', '',
    '## What stops a cutover', '',
    '- A count that does not agree with the load and cannot be explained.',
    '- Receivables that differ from the present ledger by any amount.',
    '- Stock with no cost that the owner has not accepted leaving out.',
    '- The accountant\'s approval missing, if the ledger was to start.', '',
    '## Not verified', '',
    '- No load script exists or was run. Mapping from the present system is unknown here.',
    '- W-005: the ledger dry run has not been run on a copy of the live database.',
    '- The size and quality of the real data.', '',
  ].join('\n');
}

export function rollback(c) {
  return [
    '# Phase 12: rollback and recovery plan', '', c.stamp, '',
    '## What can be rolled back, how, and what was tested', '',
    ...T(['What', 'How', 'Data effect', 'Tested'], [
      ['A deployment of code', 'In the Vercel dashboard, promote the previous deployment. The build never changes the database, so the previous code meets the database it left, plus any update applied since.', 'None', 'The rule that makes it safe is tested (Phase 10 group 8). **The promote itself is NOT VERIFIED**: it is an action in the owner\'s host account'],
      ['Database update 17 (least-privilege role)', 'Its rollback file, then the previous deployment', 'None', 'Run twice on a copy in Phase 10; 17 reapplied; schema diff clean'],
      ['Database update 18 (shared request limits)', 'The code falls back to counting in memory when the table is missing; the table can be dropped', 'Request counters only', 'Fallback covered by the unit tests of Phase 11'],
      ['Database updates 1 to 16', 'No rollback files. The way back is a restore to a point before the update', 'Everything entered after that point is lost unless re-entered', 'Restore procedure proven on QA only (W-020); **host backup never restored (E-015)**'],
      ['Starting the books', 'Stop posting on Finance, Start and stop. Business carries on. Entries already posted stay: they are never deleted', 'None; events meanwhile are found and posted when posting resumes', 'Phase 9.5 and 10 scenarios; again in this phase (LC-20)'],
      ['A branch going live', 'The branch returns to its present way of working. Records it entered stay in the system and are completed or cancelled by the ordinary screens', 'Orders and stock entered during the pilot must be reconciled by hand with the present system', 'Not testable here: it is a business procedure'],
      ['A wrong business record', 'Never by editing the database. A wrong invoice is cancelled or credited; a wrong entry is reversed; a wrong stock figure is corrected with a reason', 'A trail of the correction', 'Every one of these has scenarios in Phases 5 to 9.5'],
    ]),
    '## Order of decisions when a release goes wrong', '',
    '1. Is money or stock being recorded wrongly? If yes, stop the affected step for everyone (tell the branches), then go to 3.',
    '2. Is it only one screen or one role? Leave the release in place, work around, fix forward.',
    '3. Promote the previous deployment. Check `/api/health` names the previous commit.',
    '4. If a database update was applied with the release and the previous code cannot run with it: for 17 use its rollback file; for anything else, do not improvise SQL. Decide between fixing forward and a restore.',
    '5. Run Finance, "Check now", and the stock checks, before telling the branches to carry on.',
    '6. Record what happened under the incident procedure.', '',
    '## What must be true before go-live for this plan to be real', '',
    '- The owner has promoted a previous deployment once, on purpose, and seen it work (NOT VERIFIED).',
    '- A host backup has been restored into a separate project and the checks in `phase-10-restore-test.md` run against it (E-015, NOT VERIFIED).',
    '- Recovery time and recovery point objectives are approved. Those in `phase-12-disaster-recovery.md` are proposals.', '',
  ].join('\n');
}

export function support() {
  return [
    '## Support procedures', '',
    'First line is the branch manager or the administrator; second line is whoever the owner names for the system; third line is engineering. **No person is named here and no authority is assigned**: the owner fills the last column.', '',
    ...T(['Issue', 'First check', 'Usual cause and fix', 'Escalate when', 'Owner of the escalation (role, to be named)'], [
      ['Login issues', 'Is the login switched off? Is sign-in paused after wrong passwords? Does the answer say "database update required"?', 'Switched off: an administrator switches it on. Paused: wait, or an administrator resets. Update required: the owner applies the file named', 'Many people at once cannot sign in', 'System administrator, then engineering'],
      ['Permission issues', 'Which role and home branch does the person have (Admin, Users)?', 'Wrong role or wrong branch. Change it; do not lend a login', 'The role is right and the step is still refused', 'System administrator'],
      ['Incorrect pricing', 'Pricing: the product\'s list price and the customer\'s tier. Was there an override (audit log)?', 'A tier or list price set wrongly; an override. Correct the source; credit the difference on the invoice if billed', 'The price differs from Pricing with no override', 'Sales lead, then engineering'],
      ['Inventory discrepancies', 'The item\'s movements; open transfers; reservations', 'Unreceived transfer, shipment not dispatched, receipt against the wrong line. Finish the step; correct with a reason only for a real count difference', 'The system figure cannot be explained from its movements', 'Inventory lead, then engineering (P1 if widespread)'],
      ['Failed receiving', 'The message: heat not on file, over-receipt held, certificate missing', 'Add the heat; decide the over-receipt; upload the certificate', 'Receiving is refused with none of those', 'Purchasing lead'],
      ['Production exceptions', 'The job page: its step, who holds it, QC state', 'Step out of order, another operator has it, waiting for inspection', 'A job cannot move and no reason is shown', 'Production lead'],
      ['Shipping failures', 'Is the order on credit hold? Is the stock reserved? Was "busy, try again" shown?', 'Release the hold; reserve; press again', 'A shipment left and no invoice exists (Integrations screen lists it): tell finance the same day', 'Shipping lead, then finance; P1'],
      ['Invoice discrepancies', 'The invoice against its shipment and order lines; payments and credits on it', 'Price or tax at the time of shipment; a credit not issued. Credit or cancel with a reason; never edit', 'Totals do not follow from the lines', 'Finance lead; P1'],
      ['Financial reconciliation errors', 'Finance, "Not posted"; then which check differs', 'An event waiting for a cost, an account approval or an open month', 'A difference remains with nothing waiting: runbook 2 of `phase-10-incident-runbooks.md`', 'CFO; P0 if the books are in use'],
      ['Integration outages', 'Admin, Integrations: the service\'s state and "If it is not available"', 'The outside service is down; the product degrades as written there. Events are sent again', 'Events fail after the service is back', 'Integration administrator'],
      ['Performance issues', 'One person or everyone? One screen or all? `/api/health/ready`', 'A large list with no filter; a busy moment at dispatch', 'Everyone, for more than a few minutes: runbook 1', 'System administrator, then engineering'],
    ]),
  ];
}

export function incidents() {
  return [
    '## Incident classes', '',
    ...T(['Class', 'Meaning', 'Examples in this product', 'First response', 'Who is told'], [
      ['P0', 'Critical outage across the company, a security compromise, or material corruption of money or data', 'Nobody can sign in; one branch sees another\'s records; posted entries differ from the records with nothing waiting; a leaked secret', 'Immediately. Contain first: stop the affected step, promote the previous deployment or stop posting. Preserve evidence', 'Owner, executive, and finance or security as it applies'],
      ['P1', 'A major business-critical failure with no acceptable workaround', 'Shipments cannot be dispatched; invoices not written for goods that left; receiving refused everywhere', 'Within the hour. Workaround or rollback the same day', 'Owner and the affected leads'],
      ['P2', 'Significant degradation with a manageable workaround', 'A report wrong while its source records are right; one screen failing for one role; slow dispatch at peak', 'Next working day. Fix in the next release', 'System administrator and the affected lead'],
      ['P3', 'A minor defect or an improvement', 'Wording, layout, a missing convenience', 'Recorded and scheduled', 'Product owner'],
    ]),
    '## Handling', '',
    '1. **Detect and record**: who saw what, where, when; the request reference if shown. One record per incident.',
    '2. **Classify** by the table. When unsure between two classes, take the more severe.',
    '3. **Contain**: stop the harm before finding the cause. The runbooks in `phase-10-incident-runbooks.md` cover the site not answering, the books disagreeing, a failed posting, goods shipped without an invoice, a suspected break-in, paused logins, undelivered partner events and a restore.',
    '4. **Recover**: fix forward or roll back (`phase-12-rollback-plan.md`). Verify with the reconciliation and the stock checks, not by eye.',
    '5. **Communicate**: one person speaks for the incident; branches are told what to stop and when to start again. Customers are told by the business, not by the system. The product sends no customer notifications (D-034).',
    '6. **Review** within five working days for P0 and P1: what happened, why it was not caught, what test or alert now catches it. A fix is not finished until an automated check fails without it.', '',
    'Where the company already has an incident procedure, that procedure governs and this table is mapped onto it. None was provided to this program.', '',
  ];
}

export function monitoring(m) {
  return [
    '## Monitoring: what exists and what does not', '',
    'An alert that reaches nobody is not monitoring. In this product alerts are raised and can be sent to one address (`ALERT_WEBHOOK_URL`); **no live receiver is set and no recipient has been approved (E-017)**, and the scheduled run that raises time-based alerts is not configured on the host (B-019). No production notification was sent in this phase.', '',
    ...T(['What', 'How it is seen today', 'Tested', 'Alert reaches a person on live'], [
      ['Application health', '`/api/health`, `/api/health/live`, `/api/health/ready` (names the commit and the database state)', 'Phase 10 and this phase', 'No: nothing polls it unless the host or an outside monitor is set up'],
      ['Database health', '`/api/health/ready` answers 503 when the database is unreachable; requests answer "try again"', 'Phase 11 failure injection', 'No'],
      ['API errors', 'Structured log lines with a request reference; Admin, Integrations for outside calls', 'Phase 4 and 10', 'No error-tracking service (E-017)'],
      ['Queue failures (partner events)', 'Admin, Integrations: "Events that could not be delivered"', 'Phase 4 and 11', 'Raised to the alert address if set'],
      ['Integration failures', 'Admin, Integrations: calls, failures, time-outs, breaker state', 'Phase 4, 10, 11', 'As above'],
      ['Inventory reconciliation', 'Finance, "Check now" (inventory and in-transit checks); `qa/tools/db-facts.mjs` on QA', m.recon, 'Only when someone presses the button, until the scheduled run is set'],
      ['Financial reconciliation', 'Finance, Overview', m.recon, 'As above'],
      ['Failed ledger postings', 'Finance, "Not posted"; a warning on the Overview', 'Phase 9.5, 10, 11 and this phase', 'As above'],
      ['Authentication abuse', 'Sign-in pauses after repeated failures; paused logins listed; audit rows', 'Phase 10', 'Raised to the alert address if set'],
      ['Backup failures', 'The host\'s dashboard', 'NOT VERIFIED: outside this environment', 'Owner must confirm with the host'],
      ['Deployment health', '`/api/health` names the commit; sign-in says which database update is missing', 'Phase 10', 'No'],
    ]),
    'Before Stage 1: the owner chooses where alerts go and who reads them, sets the scheduled run, and an outside monitor polls `/api/health/ready`. Until then the Integrations screen and Finance Overview must be opened by a named person every working day.', '',
  ];
}

export function acceptanceForm(title, intro, rows, approvers) {
  return [
    `# Phase 12: ${title}`, '', intro, '',
    ...T(['#', 'Item', 'Evidence prepared by engineering', 'Accepted by the business'], rows.map((r, i) => [i + 1, r[0], r[1], NOT_GIVEN])),
    '## Sign-off', '',
    'No sign-off has been given. Claude prepares this form and cannot fill the last three columns.', '',
    ...sign(approvers),
  ];
}
export { T, BLANK, sign };
