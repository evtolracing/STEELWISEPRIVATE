// Phase 12: the text of the certification documents. Called by qa/tools/phase12-docs.mjs with the results.
import { part2 } from './write2.mjs';
export function writeAll(c) {
  const { CERT, PROC, MUT, CONS, ENT, AUDIT, GATE, GATE1, RC1, HEAD, BRANCH, productFiles, stamp, suite, scen, groupLine, scenTable, open, byId, openIn, findingTable, sev, gateOK, T, NOT_GIVEN, esc, money, OUT, CAPS, STATES, lineOf } = c;
  const FL = 'Cross-module workflows end to end'; const FI = 'Financial ledger certification'; const RE = 'Financial and inventory reconciliation'; const DA = 'Dashboards and reports agree with the records'; const AI = 'AI assistants'; const SE = 'Security and access revalidation'; const ML = 'Multi-location readiness'; const GP = 'Evidence gaps closed';
  const gl = (re) => lineOf(GATE, re).replace(/^[✓✗]\s*/, '') || 'not in the gate log';
  const gateNote = gateOK ? 'the full gate on RC-2 (`qa/results/phase12-gate.txt`)' : '**the full gate on RC-2 has not finished: figures marked "gate" below are NOT VERIFIED until it has**';
  const caps = (name) => { const rows = CAPS[name] || []; return T(['Capability', 'State', 'What the product has', 'Evidence in this run', 'Open findings'], rows.map(([cap, state, note, keys, f]) => { const ev = keys.map((k) => suite(k)); const bad = ev.filter((e) => !e.ok); const st = state === STATES.V && (bad.length || !keys.length) ? 'NOT VERIFIED (its suite did not pass in this run)' : state; return [esc(cap), st, esc(note), esc(ev.map((e) => `${e.ok ? 'pass' : 'FAIL'}: ${e.text}`).join('; ') || 'none'), f || '']; })); };
  const capCount = (name) => { const t = {}; for (const r of CAPS[name] || []) t[r[1]] = (t[r[1]] || 0) + 1; return Object.entries(t).map(([k, v]) => `${v} ${k}`).join(', '); };
  const allCaps = Object.values(CAPS).flat(); const capTotals = {}; for (const r of allCaps) capTotals[r[1]] = (capTotals[r[1]] || 0) + 1;
  const flow = (id) => CERT.results.find((x) => x.record.workflowId === id);
  const checksOf = (id, n = 60) => { const x = flow(id); return x ? x.asserts.slice(0, n).map((a) => `- ${a.ok ? 'pass' : '**FAIL**'}: ${esc(a.what)}${a.measured ? ` (${esc(a.measured).slice(0, 110)})` : ''}`) : ['- not run']; };
  const notes = (id) => (flow(id)?.record.notes || flow(id)?.notes || []).map((n) => `- ${esc(n)}`);
  const openCount = `${open.length} open (${sev(open, 'P0')} P0, ${sev(open, 'P1')} P1, ${sev(open, 'P2')} P2, ${sev(open, 'P3')} P3, ${sev(open, 'P4')} P4)`;

  // 1 ── program consolidation ────────────────────────────────────────────────────────────────
  OUT('program-consolidation', [
    '# Phase 12: the whole program in one register', '', stamp, '',
    'Made by `qa/tools/phase12-consolidate.mjs` from the phase reports, the findings register and the test files on disk. It does not trust a report: a finding marked fixed is classed by whether the test it names exists.', '',
    '## The twelve phases, by their own reports', '',
    ...T(['Phase', 'Name', 'Report on file', 'Status the report gives itself'], CONS.phases.map((p) => [p.phase, esc(p.name), p.reportOnFile ? 'yes' : '**no**', p.reportedStatus])),
    `**${CONS.phasesVerifiedComplete} of ${CONS.phases.length} phases call themselves VERIFIED COMPLETE.** Each stopped short for a stated reason: an owner decision, an approval, or something that can only be done on the live system. Those reasons are the blockers in \`phase-12-release-blockers.md\`; none was closed by rewording.`, '',
    '## Findings', '',
    `${CONS.findings.total} findings in one register, ids and history kept, none deleted. ${openCount}. By status: ${Object.entries(CONS.findings.byStatus).map(([k, v]) => `${k} ${v}`).join('; ')}.`, '',
    `Before this phase ${63} findings carried the status "deferred to a specific phase". There is no later phase, so each was given a status this phase allows (\`phase-12-dispositions.json\`): fixed and verified now, blocked on a named thing, or "requires business decision" where the work is simply not done and nobody has approved leaving it. **None was marked "deferred with approval": no approval to defer is on file.**`, '',
    '## How good is the evidence behind "verified fixed"', '',
    ...T(['Class', 'Findings', 'Meaning'], [['Names a test that exists on disk', CONS.evidence.named, 'Strong: the check can be rerun'], ['Names a suite only', CONS.evidence.suite, 'The suite exists and passes in the gate; the single check is not named'], ['Words only', CONS.evidence.words, 'Mostly the first audit (series D, E, F, I, M, S, U, X): fixed and looked at in a browser at the time, with no automated check named. The later suites cover many of these screens, but the register does not tie them together'], ['No evidence', CONS.evidence.none, '']]),
    `This is a weakness of the record, stated as it is: ${CONS.evidence.words} findings are "verified" by a person's reading, not by a named automated check. They are listed in \`qa/results/phase12-consolidation.json\` (evidence.wordsOnly).`, '',
    '## Notes that contradicted their own status', '',
    `${CONS.contradictions.length} findings were marked VERIFIED FIXED while an earlier note on them said part was not verified. Each was tested now or its limit written plainly:`, '',
    ...T(['Finding', 'The earlier note said', 'Phase 12'], CONS.contradictions.map((x) => [x.id, esc(x.says.slice(0, 150)), esc((x.answeredInPhase12 || '**not answered**').slice(0, 260))])),
    'D-011b was moved from VERIFIED FIXED to FIXED — NOT VERIFIED for the same reason: its remaining part can only be checked on the hosted site.', '',
    '## Documents outside `qa/` that claim more than is built', '',
    `${CONS.documentsThatOverclaim.length} design, sales and set-up documents use words such as "complete" or "production ready". ${CONS.documentsThatOverclaim.filter((d) => d.carriesStatusNotice).length} now open with a status notice that says they are not evidence and points here. Their text was not rewritten.`, '',
    ...T(['Document', 'Claims found', 'Notice added'], CONS.documentsThatOverclaim.map((d) => [`\`${d.file}\``, d.claims, d.carriesStatusNotice ? 'yes' : '**no**'])),
    '## Carried forward unfinished', '', ...CONS.unverifiedAreasCarried.map((x) => `- ${esc(x)}`), '', ...CONS.blockersCarried.map((x) => `- ${esc(x)}`),
  ]);

  // 2 ── release baseline ─────────────────────────────────────────────────────────────────────
  OUT('release-baseline', [
    '# Phase 12: release baseline', '', stamp, '',
    ...T(['Item', 'Value'], [
      ['Release candidate', '**RC-2**'], ['Branch', `\`${BRANCH}\``], ['RC-1 (frozen at the start)', `commit \`${RC1}\`, the merge of Phase 11 into main`], ['RC-2', `RC-1 plus the changes below; the commit is the head of this pull request (working tree at \`${HEAD}\` plus this change when the documents were written)`],
      ['Application version', 'No version number is kept in the product. `/api/health` names the commit; the release is identified by commit'],
      ['Database version', 'PostgreSQL 16 locally. Schema: the migrations in `src/backend/prisma/migrations`; SQL Editor files 1 to 18 for the owner. **No database change in this phase**'],
      ['Infrastructure in this certification', 'One machine: 4 processors, 15.7 GB; database, three server copies behind one address, and the load all on it'],
      ['Deployment environment', 'Vercel (application) and Supabase (database), as before. **Not touched and not read in this phase.** Host settings are the owner\'s'],
      ['Integration configuration', 'Every outside service was a local stand-in with keys that are not real. No real provider was called'],
      ['Outstanding defects', openCount], ['Outstanding approvals', 'All of them: see the final report'],
    ]),
    '## Changes to the candidate during certification', '',
    'The candidate was frozen at RC-1 and the full gate run on it (`qa/results/phase12-gate-run-1.txt`). Certification then found defects; each was corrected at its cause, and the candidate became RC-2. Every product file changed:', '',
    ...T(['File', 'Why', 'Rerun'], productFiles.map((f) => [`\`${f}\``, /aiAssistant|assistantInput/.test(f) ? 'AA-003, AA-004' : /executive|ExecutiveCockpit/.test(f) ? 'AA-002' : /dashboard|auth\.js/.test(f) ? 'AA-001' : /app\.js/.test(f) ? 'AA-005' : /help|Help/.test(f) ? 'AA-006' : 'see the commit', 'The whole gate, on RC-2'])),
    'Because the changes touch the sign-in check and the application entry, the affected area is everything: the whole gate was run again on RC-2, not a part of it.', '',
    '## Results on RC-1 (first gate)', '',
    `- ${lineOf(GATE1, /Phase 9 UI scenarios:/)}. The one failure was a timing fault in the test (AA-009); it passed alone on the same build.`, `- ${lineOf(GATE1, /Phase 11 scenarios:/).split(';')[0]}`, `- ${lineOf(GATE1, /Phase 11 enterprise cycle gate/).slice(0, 120)}: every verdict yes except response times against the proposed limits (Z-006, known).`, '',
    `## Results on RC-2 (${gateOK ? 'final gate' : 'final gate NOT FINISHED'})`, '',
    ...['Phase 2 integrity:', 'Phase 3 database scenarios:', 'Phase 4 integration scenarios:', 'Phase 5 sales scenarios:', 'Phase 6 inventory scenarios:', 'Phase 7 manufacturing scenarios:', 'Phase 8 fulfilment scenarios:', 'Phase 9 UI scenarios:', 'Phase 9\\.5 ledger:', 'Phase 9\\.5 UI:', 'Phase 10 security:', 'Phase 9\\.5 load:', 'Phase 11 enterprise cycle gate', 'Phase 11 scenarios:', 'Phase 12 certification:', 'Phase 12 UI:', '# tests', '# pass', '# fail', 'problems \\(', 'LINT-OK', 'built in'].map((p) => `- ${gl(new RegExp(p)).split(';')[0].slice(0, 200)}`),
    '', `Proof by removal: ${MUT ? `${MUT.held} of ${MUT.mutations} corrections are caught by their check when taken out (\`qa/results/phase12-mutations.json\`)` : 'not run: NOT VERIFIED'}.`,
  ]);

  // 3 ── system certification ─────────────────────────────────────────────────────────────────
  OUT('system-certification', [
    '# Phase 12: what the system has, capability by capability', '', stamp, '',
    'Every capability the Phase 12 prompt lists, with what the product actually has. Nothing was invented to fill a gap. "VERIFIED ON QA" is given only where the suite named passed in this run; the tool that writes this page downgrades a row whose suite did not.', '',
    `**${allCaps.length} capabilities: ${Object.entries(capTotals).map(([k, v]) => `${v} ${k}`).join(', ')}.**`, '',
    `Screens: ${AUDIT.screens} in all; ${AUDIT.tally.REAL} real, ${AUDIT.tally.MIXED} mixed, ${AUDIT.tally['SAMPLE, LABELLED']} labelled samples, ${AUDIT.tally.STATIC} static (\`qa/screen-audit.md\`). ${gl(/"endpoints"|endpoints/).slice(0, 120)}`, '',
    ...Object.keys(CAPS).flatMap((k) => [`## ${k}`, '', `${capCount(k)}.`, '', ...caps(k)]),
  ]);

  // 4 ── workflow certification ───────────────────────────────────────────────────────────────
  OUT('workflow-certification', [
    '# Phase 12: workflow certification matrix', '', stamp, '',
    `${CERT.results.length} workflows and controls were run through the real server on three copies, and the database read back after each: ${CERT.passed} pass, ${CERT.results.length - CERT.passed} fail, ${CERT.checks} checks (\`qa/results/phase12-certification.json\`, from ${gateNote}).`, '',
    ...T(['Workflow ID', 'Purpose', 'Starting event', 'Responsible role', 'Required permissions', 'UI entry point', 'API or service path', 'Database changes', 'Events and integrations', 'Financial consequences', 'Expected final state', 'Evidence', 'Result'],
      CERT.results.map((x) => { const r = x.record; return [r.workflowId, esc(r.purpose), esc(r.startingEvent), esc(r.responsibleRole), esc(r.requiredPermissions), esc(r.uiEntryPoint), esc(r.apiPath), esc(r.databaseChanges), esc(r.eventsAndIntegrations), esc(r.financialConsequences), esc(r.expectedFinalState), esc(r.evidence), x.pass ? 'PASS' : '**FAIL**']; })),
    '## The ten cross-module flows, check by check', '',
    ...scen(FL).flatMap((x) => [`### ${x.record.workflowId}: ${esc(x.name)}`, '', ...checksOf(x.record.workflowId), '', ...(notes(x.record.workflowId).length ? ['Observed:', ...notes(x.record.workflowId), ''] : [])]),
    '## What these flows do not prove', '',
    '- They were run by a script through the API, with the screens covered separately by the browser suites. No employee ran them: that is user acceptance (`phase-12-user-acceptance.md`).',
    '- Labels, packing slips and certificates were checked as data and files, not on a printer or scanner (K-013).',
    '- Email and text notices do not exist in the product (D-034), so no flow sends one.',
  ]);

  // 5 to 8 ── module certifications ───────────────────────────────────────────────────────────
  const moduleDoc = (file, title, sections, flows, re, extra = []) => OUT(file, [
    `# Phase 12: ${title}`, '', stamp, '',
    ...sections.flatMap((s) => [`## ${s}`, '', `${capCount(s)}.`, '', ...caps(s)]),
    '## End-to-end evidence from this phase', '',
    ...flows.flatMap((id) => [`### ${id}: ${esc(flow(id)?.name || 'not run')}`, '', `${flow(id)?.pass ? 'PASS' : '**FAIL or not run**'}, ${flow(id)?.asserts.length || 0} checks.`, '', ...checksOf(id, 40), '', ...(notes(id).length ? ['Observed:', ...notes(id), ''] : [])]),
    ...extra,
    '## Open findings in this area', '', ...findingTable(openIn(re)),
    '## Certification', '',
    'Engineering statement only: on the release candidate, on synthetic data, the capabilities marked VERIFIED ON QA above work as described. This is not business acceptance, and it is not a statement about the live system.',
  ]);
  moduleDoc('sales-certification', 'sales, customer lifecycle, counter and web store certification', ['Sales and customer lifecycle (section 7)', 'POS and ecommerce (section 8)'], ['WF-01', 'WF-06', 'WF-07', 'WF-08', 'WF-09'], /sales|quote|order|customer|pricing|counter|pos|checkout|web|crm|rfq|credit|invoice|return/i,
    ['## Earlier suites, rerun in the gate', '', `- ${suite('p5').text}`, `- ${suite('shop').text}`, `- ${suite('sweep').text}`, '']);
  moduleDoc('inventory-certification', 'inventory and purchasing certification', ['Inventory (section 9)', 'Purchasing (section 10)'], ['WF-03', 'WF-04', 'WF-05'], /inventor|stock|receiv|purchas|transfer|heat|coil|remnant|scrap|valuation|scan/i,
    ['## Earlier suites, rerun in the gate', '', `- ${suite('p6').text}`, `- ${suite('p3').text}`, '', '## Purchasing: how the product behaves, as observed', '', '- A purchase order must be approved (confirmed) before anything can be received against it.', '- More than was ordered is **received on hold** with the reason, not refused: the material is on the dock. It is on the books and cannot be reserved until released.', '- A fully received purchase order stays open until the buyer closes it ("nothing more to come"); after that a receipt against it is refused.', '- Supplier invoices and payables are not in the product (K-012, W-009): goods received and not invoiced accumulate in one account that nothing relieves.', '']);
  moduleDoc('manufacturing-certification', 'manufacturing, MES and quality control certification', ['Manufacturing and MES (section 11)', 'Quality control (section 12)'], ['WF-02', 'WF-05'], /manufactur|job|work order|work center|schedul|dispatch board|shop|quality|inspection|qc|production|operator|time track|equipment|maintenance/i,
    ['## Earlier suites, rerun in the gate', '', `- ${suite('p7').text}`, `- Phase 11 "Manufacturing, scheduling and quality": ${(c.P11S?.groups?.['Manufacturing, scheduling and quality']?.passed) ?? 'see the gate log'} scenarios pass`, '', '## Not built, stated plainly', '', '- No production cost: labor and machine time are recorded but not costed, and overhead has no rate (L-026; accounting policy 8).', '- No bill of materials behind the BOM screen, no supplier quality, no gauge calibration, no sampling plans (samples: M-011, I-011, L-028).', '- Schedule times are a queue order with estimates where they exist, not finite-capacity scheduling (L-025).', '']);
  moduleDoc('shipping-certification', 'shipping and logistics certification', ['Shipping and logistics (section 13)'], ['WF-01', 'WF-02', 'WF-09'], /ship|deliver|freight|carrier|packag|pack|label|tag|dock|logistic|bill of lading|proof/i,
    ['## Earlier suites, rerun in the gate', '', `- ${suite('p8').text}`, `- Phase 11 "Shipping, logistics and invoicing": ${(c.P11S?.groups?.['Shipping, logistics and invoicing']?.passed) ?? 'see the gate log'} scenarios pass`, '', '## Not built, stated plainly', '', '- No carrier is connected: no rates, no bookings, no tracking from a carrier (N-026). The freight planning screens are labelled samples.', '- Freight charged to a customer is in the invoice total and posts to freight revenue. No freight cost exists to post.', '- Dispatch at the very busiest moment waits for its invoice number (Z-006): measured, and the owner\'s decision.', '']);

  // 9 ── ledger certification ─────────────────────────────────────────────────────────────────
  OUT('ledger-certification', [
    '# Phase 12: financial ledger certification', '', stamp, '',
    '**What this certifies and what it does not.** On the release candidate, on the QA database, with a QA chart of accounts approved by a test user and synthetic transactions, the ledger does what its rules say. It does **not** certify that the rules are the right accounting: no accountant has reviewed them (W-001), the ledger is switched off on the live system, and the software refuses to switch it on without the approvals. Engineering judgement is not a substitute for that review and is not offered as one.', '',
    `## Result: ${groupLine(FI)}`, '', ...scenTable(FI),
    '## Section 14, item by item', '',
    ...T(['Requirement', 'Scenario', 'Result'], scen(FI).map((x) => [esc(x.record.purpose), x.record.workflowId, x.pass ? `pass (${x.asserts.length} checks)` : '**FAIL**'])),
    '## Section 15: accounting policies. Status of each', '',
    'The sixteen decisions and what the software does by default are in `phase-09-5-accounting-policy-decisions.md`. **Every one is PENDING: none has been reviewed or approved by a qualified accountant.**', '',
    ...T(['Policy', 'What the ledger does today (a default, not an approval)', 'Approval'], [
      ['Chart of accounts', 'A proposed chart ships unapproved; each account must be approved by name before activation', NOT_GIVEN], ['Revenue recognition', 'At invoice, which is raised at dispatch', NOT_GIVEN], ['COGS recognition', 'At shipment, at the item\'s actual cost', NOT_GIVEN],
      ['Inventory costing method', 'Actual cost of each item (specific identification); an item with no cost is held, never valued at zero', NOT_GIVEN], ['Work-in-progress valuation', 'None carried by default; a setting exists and only the owner or CFO can change it', NOT_GIVEN], ['Scrap and remnant valuation', 'Scrap written off at cost; a remnant keeps cost by weight', NOT_GIVEN],
      ['Customer deposits', 'Not in the product: a payment needs an invoice', NOT_GIVEN], ['Partial shipments', 'Each shipment is billed for what left', NOT_GIVEN], ['Partial invoicing', 'One invoice per shipment', NOT_GIVEN], ['Sales tax treatment', 'A liability at invoice, by the state rate on file', NOT_GIVEN],
      ['Freight accounting', 'Freight billed posts to freight revenue; no freight cost exists', NOT_GIVEN], ['Accounting periods', 'Calendar months; closing and reopening controlled', NOT_GIVEN], ['Opening balances', 'Taken inside activation from the business records; **none has been taken for the live system and none was invented**', NOT_GIVEN], ['Cutover date', '**Not set. No date is proposed here**', NOT_GIVEN],
    ]),
    'Missing approvals: all fourteen rows above, the account mappings, the posting rules, the time zone for the business day (W-003, AA-007), and whether branches are one legal entity or several (W-002).', '',
    '## Earlier suites, rerun in the gate', '', `- ${suite('p95').text}`, `- ${gl(/Phase 9\.5 load:/)}`, `- Phase 11 "Ledger posting and reconciliation": ${(c.P11S?.groups?.['Ledger posting and reconciliation']?.passed) ?? 'see the gate log'} scenarios pass`, '',
    '## Open findings', '', ...findingTable(openIn(/ledger|financ|accounting|valuation|costing/i)),
  ]);

  // 10 ── financial reconciliation ────────────────────────────────────────────────────────────
  const recNotes = scen(RE).flatMap((x) => (x.record.notes || x.notes || []).map((n) => `- ${x.record.workflowId}: ${esc(n)}`));
  OUT('financial-reconciliation', [
    '# Phase 12: financial reconciliation certification', '', stamp, '',
    '**Real reconciliation evidence, of test data.** Every figure below was read from the QA database after the certification run, by the product\'s own reconciliation and independently by SQL. No adjustment was made to make anything agree, and none was fabricated. There is **no reconciliation of live data**: this session has no access to it, and the ledger is not running there.', '',
    `## Result: ${groupLine(RE)}`, '', ...scenTable(RE),
    '## Figures', '', ...(recNotes.length ? recNotes : ['- no figures were recorded by the run']), '',
    '## Checks, with what was measured', '', ...scen(RE).flatMap((x) => [`### ${x.record.workflowId}: ${esc(x.name)}`, '', ...checksOf(x.record.workflowId), '']),
    '## The enterprise day (Phase 11 run in the gate)', '',
    ...(ENT ? [`Trial balance: debits ${money(ENT.books.totals.debit)}, credits ${money(ENT.books.totals.credit)}. Reconciliation ${ENT.books.reconciliation.clean ? 'clean' : '**NOT clean**'}:`, '', ...T(['Check', 'Books', 'Records', 'Difference'], ENT.books.reconciliation.checks.filter((k) => k.books != null).map((k) => [k.key, money(k.books), money(k.records), money(k.difference)]))] : ['**The enterprise run result is missing: NOT VERIFIED.**', '']),
    '## Unexplained discrepancies', '',
    'None on the QA data: every check is zero or every difference is an item held by name with its reason (a transfer of an item with no cost, a receipt with no purchase order), which the product lists and an accountant settles. A deliberately planted 100 lb difference was found, named by item, and removed.', '',
    'Material discrepancies on live data: **unknown**. It cannot be certified and is not.', '',
    '## Dashboards and reports against the records (section 17)', '', `${groupLine(DA)}.`, '', ...scenTable(DA),
  ]);

  // 11 ── security certification ──────────────────────────────────────────────────────────────
  OUT('security-certification', [
    '# Phase 12: security and AI assistant certification', '', stamp, '',
    `## Revalidation in this phase: ${groupLine(SE)}`, '', ...scenTable(SE),
    ...scen(SE).flatMap((x) => [`### ${x.record.workflowId}: ${esc(x.name)}`, '', ...checksOf(x.record.workflowId, 30), '']),
    `## AI assistants (section 18): ${groupLine(AI)}`, '',
    'The assistant was tested, not assumed: what it is given by role and branch, forged roles, injected instructions, invented figures, the audit trail, failures of the AI service, and the streaming route. **The AI service itself was a stand-in**: what a real model answers to a hostile prompt was not and cannot be tested here. What was tested is what the server sends to the model and what it will accept, which is where the control lies: the model is given only data the person may already see, and it has no ability to change anything.', '',
    ...scenTable(AI), ...scen(AI).flatMap((x) => [`### ${x.record.workflowId}: ${esc(x.name)}`, '', ...checksOf(x.record.workflowId, 30), '']),
    '## Defects found and corrected in this phase', '', ...findingTable(['AA-001', 'AA-002', 'AA-003', 'AA-004', 'AA-005'].map((id) => byId[id]).filter(Boolean)).map((l) => l),
    `Process-level checks: ${PROC ? `${PROC.checks - PROC.failed} of ${PROC.checks} pass (\`qa/results/phase12-process.json\`): in production mode another website is given no permission to read answers; with no database every signed-in route answers 503; a polite stop loses no request.` : '**not run: NOT VERIFIED**'}`, '',
    '## Earlier suites, rerun in the gate', '', `- ${suite('p10').text}`, `- ${suite('sweep').text}`, `- ${suite('branch').text}`, `- Phase 11 "Tenant, branch, RBAC and AI security": ${(c.P11S?.groups?.['Tenant, branch, RBAC and AI security']?.passed) ?? 'see the gate log'} scenarios pass`, '',
    '## Not done, and not claimed', '',
    '- No outside penetration test and no dependency audit by a third party.', '- On the live database the application still connects as the owner of the tables until update 17 is applied and the server is pointed at the limited role (Y-008, W-014): the protection of financial history proved here is **NOT VERIFIED on live**.', '- No table-by-table audit of tenant id columns (E-019).', '- Secrets on the host are the owner\'s and were not read.', '',
    '## Open findings', '', ...findingTable(openIn(/secur|access|auth|tenant|isolation|audit|permission|database|platform/i).filter((f) => ['P0', 'P1', 'P2'].includes(f.severity))),
  ]);
  part2(c, { FL, FI, RE, DA, AI, SE, ML, GP, gl, gateNote, caps, capCount, flow, checksOf, notes, openCount, capTotals, allCaps });
}
