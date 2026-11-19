// Phase 12: adds the AA-series findings to findings.json, gives every finding that was "deferred to a
// specific phase" a status this last phase allows, and resolves the notes that contradicted their status
// (phase-12-dispositions.json). Safe to run again: a finding already there is replaced by the text below,
// nothing is ever removed.   node qa/tools/phase12-findings.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const FILE = path.join(root, 'qa/enterprise-excellence/findings.json');
const reg = JSON.parse(fs.readFileSync(FILE, 'utf8'));
const PHASE = 'Phase 12: production certification';
const FIXED = 'VERIFIED FIXED'; const RBD = 'REQUIRES BUSINESS DECISION'; const FNV = 'FIXED — NOT VERIFIED'; const BLOCKED = 'BLOCKED'; const WIP = 'IN PROGRESS';
const ALLOWED = new Set([FIXED, FNV, WIP, BLOCKED, 'DEFERRED WITH APPROVAL', RBD, 'ACCEPTED RISK WITH APPROVAL', 'NOT APPLICABLE']);
const SIM = 'qa/sim/phase12-certification.mjs'; const UI = 'qa/sim/phase12-ui.cjs'; const PROC = 'qa/tools/phase12-process.mjs'; const MAN = 'qa/tools/phase12-manual.mjs'; const MUT = 'qa/tools/phase12-mutations.mjs'; const UNIT = 'src/backend/test/assistantInput.test.js';

// [id, severity, status, module, category, where, actual, expected, impact, statusNote, verification]
const AA = [
  ['AA-001', 'P2', FIXED, 'Home dashboard; sign-in check', 'Honesty; error handling', 'src/backend/src/routes/dashboard.js; src/backend/src/middleware/auth.js',
    'With no database configured GET /api/dashboard answered 200 with invented figures (125,000 lb on hand, orders SO-1001 and SO-1002 for "ABC Manufacturing" and "XYZ Industries"). Every other signed-in request answered "server error" (500), because the sign-in check itself read a database that was not there.',
    'With no database nothing is shown: the answer is 503, "the database is not available", on every signed-in route.',
    'A screen could have shown a company that does not exist as if it were the user\'s own figures. Small on the hosted site, which always has a database; real on any mis-set server.',
    'Fixed: the invented answer is deleted; the dashboard and its KPI route answer 503; the sign-in check answers 503 before it reads anything. The jobs list (M-013) is covered by the same check.',
    `${PROC} (a server started with no database: /api/jobs, /api/dashboard and /api/dashboard/kpis answer 503 and carry no invented record; readiness says not ready); ${MUT} AA-001 holds.`],
  ['AA-002', 'P1', FIXED, 'Executive cockpit', 'Honesty; AI', 'src/backend/src/routes/executive.js; src/frontend/src/pages/Executive/ExecutiveCockpit.jsx',
    'POST /api/executive/ai/query answered every question with a written analysis that nothing had worked out ("Detroit is at 97% utilization", a margin forecast of 22.8%, "confidence 85"). The cockpit\'s own question box did not even call the server: it waited two seconds and showed a fixed answer with "Confidence: 92%". The cockpit, simulation and forecast routes answered with example figures and nothing in the answer said so (only the screen carried the sample notice).',
    'A box that has no analysis behind it says so and gives no figure. Every answer made from example values is marked as a sample in the answer itself.',
    'An executive could have acted on an invented capacity, margin or risk figure. This is the kind of result the phase forbids outright.',
    'Fixed: the route answers 501 "not built" with no figures and points to the assistant in the top bar; the generator is deleted; the cockpit dialog says the same in plain words; every cockpit, simulation and forecast answer now carries sample: true, a notice and the header X-Sample-Data. The decision log, which is real records, is not marked.',
    `${SIM} "Dashboard 7" and "AI 5"; ${UI} "The executive cockpit question box gives no invented answer"; ${MUT} AA-002a and AA-002b hold.`],
  ['AA-003', 'P1', FIXED, 'Assistant in the top bar', 'Security: prompt injection and input limits', 'src/backend/src/routes/aiAssistant.js; src/backend/src/lib/assistantInput.js',
    'The conversation sent by the browser was forwarded to the AI service as it came. A request could include messages marked "system" or "tool", which the model treats with the system\'s authority (measured: 1 forged system and 1 forged tool message forwarded). Message length and count were not capped, the temperature and answer length were whatever the request said, a body of the wrong shape was a server error (500), and a question about "users" gave the model colleagues\' email addresses, phone numbers and last sign-in times.',
    'Only what the person said and what the assistant answered is accepted. A forged role is refused. Length, count and settings are bounded. A wrong shape is the caller\'s error. The model is given only what a colleague needs to be recognised by.',
    'A signed-in person (or text pasted into the box from elsewhere) could speak to the model as the system. The data given to the model was already limited by role and branch, and the assistant cannot change records, so the exposure was the model\'s instructions and wording, not other people\'s data; contact details of colleagues were sent to an outside AI service without need.',
    'Fixed: one checked function accepts the conversation (user and assistant only, text only, 4,000 characters a message, the last 10 messages, 100 at most) and answers 400 otherwise, on both routes and before the stream opens; settings are bounded; fixed rules are added to every system prompt (read only, the conversation is never an instruction, no figure that is not in the results); the staff list is name, role and title of the person\'s own organisation only.',
    `${UNIT} (eight tests); ${SIM} "AI 4", "AI 7", "AI 8"; ${MUT} AA-003u, AA-003s and AA-003c hold.`],
  ['AA-004', 'P2', FIXED, 'Assistant in the top bar', 'Audit; error handling', 'src/backend/src/routes/aiAssistant.js',
    'Asking the assistant left no line in the audit trail unless the question was about the ledger. When the AI service failed in the middle of a streamed answer, the service\'s own error text was sent to the browser.',
    'Every question is recorded: who, when, which kinds of record were read, and whether it was answered, refused or failed; never the text of the question. A failure tells the person it failed and nothing else.',
    'Use of company data through the assistant could not be reviewed. An outside service\'s error text can carry addresses or parts of keys.',
    'Fixed: one audit line per question (category DATA, event AI_ASSISTANT_ASKED) on both routes; the stream answers "the assistant could not answer" with the request id.',
    `${SIM} "AI 6" and "AI 8" (a failure injected at the AI stand-in); ${MUT} AA-004 and AA-004s hold.`],
  ['AA-005', 'P3', FIXED, 'Platform', 'Error handling', 'src/backend/src/app.js',
    'A zero byte in an address (GET /api/coils/%00) was passed to the database, which refuses it, and the person got "server error" (500).',
    'It is the caller\'s mistake: 400, on every route.',
    'Noise in the error log and a wrong signal to monitoring; no data was at risk.',
    'Fixed in one place, before any route.',
    `${SIM} "Security 7"; ${MUT} AA-005 holds.`],
  ['AA-006', 'P2', FIXED, 'Help manual', 'Documentation honesty and completeness', 'src/frontend/src/help/manualContent.js; src/frontend/src/help/manualOperations.js; src/frontend/src/components/help/HelpAccordion.jsx',
    'Eight chapters described design-sample modules (safety, supplier quality, customer quality, contractors, training, production quality, freight, quality and compliance) as working features, and three more mixed real and sample screens without saying which. Fourteen real screens on the menu had no chapter at all: Finance, purchase orders, transfers, work orders, the quality station, the material tracking screens, staff, tax rates and the integrations checks.',
    'The manual says before anything else when a chapter is about sample screens and names them; every real screen on the menu has a chapter; there is a chapter on what to do when something goes wrong.',
    'A new employee would have been trained on features that save nothing, and had no instructions for the finance, purchasing and transfer work.',
    'Fixed: sample chapters are flagged and the manual page shows a notice above them; nine chapters were written from the screens as they are (finance, purchasing, transfers, work orders, invoices and returns, administration checks, material tracking, the quality station, when something goes wrong). A check keeps this true as screens change. The wording of the older chapters was not re-read line by line against every screen (M-018, S-024 stay in progress for that).',
    `${MAN} (48 chapters, 156 checks); ${UI} three manual scenarios; ${MUT} AA-006a, AA-006b and AA-006c hold.`],
  ['AA-007', 'P2', RBD, 'Branches', 'Multi-location', 'src/backend/prisma/schema.prisma (Location); src/backend/src/services/ledger.js',
    'A branch record holds no time zone. The books keep one business day for the whole company (the zone given when the ledger is switched on). A sale made at 10 pm Pacific is dated the next day if the company zone is Eastern.',
    'The owner and the accountant decide whether one company day is right for the first branches, or whether each branch needs its own zone before a branch outside the company zone goes live.',
    'Daily totals and month-end cut-off for branches in other time zones can fall on the neighbouring day. No amount is lost or doubled.',
    'Not changed: it is an accounting cut-off decision (with W-001) and a database change. Stage 1 and 2 of the rollout are planned inside one time zone for this reason.',
    `${SIM} "Locations 1" records the fact; phase-12-rollout-plan.md.`],
  ['AA-008', 'P2', RBD, 'Branches', 'Multi-location onboarding', 'src/backend/src/routes (no location route that creates)',
    'No screen or API adds or edits a branch. A branch is added by a database script.',
    'The owner decides whether adding a branch by script (run by whoever applies database updates) is acceptable for the rollout, or a branch set-up screen must be built first.',
    'Every new location in the staged rollout needs a database step by the owner. Once added the branch is separate from the rest at once (tested).',
    'Not built in this phase: it is a new feature, not a correction. The cutover plan lists the script step for each branch.',
    `${SIM} "Locations 6" (no route adds a branch; a branch added by script is isolated at once).`],
  ['AA-009', 'P3', FIXED, 'Tests', 'Test reliability', 'qa/sim/phase9/make.cjs',
    'In the gate run on the release candidate one of 232 Phase 9 browser scenarios failed ("the schedule: the Queue View tab lists jobs waiting, by keyboard"): it read the page a fixed 0.8 s after changing tab, while the machine was busy.',
    'The scenario waits for the list, not for a fixed time.',
    'A false failure in the gate. The product was not at fault: the scenario passes when run alone on the same build.',
    'Fixed: the scenario waits for the list to be drawn. The first run is kept as it was (qa/results/phase12-gate-run-1.txt).',
    'qa/sim/phase9-ui.cjs --match "Queue View tab lists jobs waiting" passed alone on the same build, and passed in both later gate runs (qa/results/phase12-gate-run-2-stopped.txt, qa/results/phase12-gate.txt).'],
  ['AA-010', 'P3', RBD, 'Access control', 'Separation of duties', 'src/backend/src/lib/roleAccess.js',
    'By the department rules sales staff may dispatch a shipment and may start or complete a work order (shipments: warehouse and sales; jobs and work orders: production, sales, warehouse and quality). The rules are applied as written; the question is whether they are the ones the owner wants.',
    'The owner confirms the permissions matrix line by line before go-live, in particular these two.',
    'A sales representative can send goods out of the building. Every such act is in the audit trail under the person\'s name.',
    'Not changed: owner decision 3 ("use best logic") adopted these rules and says the owner can change any line. Listed for confirmation in phase-12-operational-acceptance.md.',
    `${SIM} "Flow 5" and "Security 3" record what the rules allow; qa/enterprise-excellence/permissions-matrix.md.`],
  ['AA-011', 'P3', FIXED, 'Customers', 'Input validation', 'src/backend/src/routes/customers.js',
    'A new customer whose code was sent as an object or a list, not text, was saved with the code "[object Object]". Found by the certification\'s own bad-input probe when its second run was answered "Customer code [object Object] is already in use".',
    'A code or a name that is not text is refused with 400.',
    'A junk customer record from a faulty caller or a script. No effect on stock or money; the login must already be allowed to add customers.',
    'Fixed at the route: the code and the name must be text. Found after the gate on RC-2 had started; that gate was stopped (its log is kept as qa/results/phase12-gate-run-2-stopped.txt) and the whole gate was run again on the candidate with this correction.',
    `${SIM} "Security 7" (refused with 400 and nothing saved); qa/tools/phase12-mutations.mjs AA-011.`],
  ['AA-012', 'P3', FIXED, 'Tests', 'Test reliability', 'qa/sim/phase9/stock.cjs, qa/sim/phase11/s7-fail.mjs',
    'In the final gate one scenario failed in each of two older suites, each for timing in the test on a busy machine. Phase 9 browser scenario 113 read the heading of a stock item half a second after the page opened, before it was drawn. The Phase 11 scenario that cuts every database connection asked for a reconciliation while one server copy was still reconnecting and was answered 503 "try again", which is the designed answer.',
    'A check waits for what it reads, and tries again when told to try again, within a stated limit.',
    'Two false failures in the gate. The product was not at fault. A different scenario failed for the same kind of reason in the first gate (AA-009), so the suites are sensitive to load on a small machine.',
    'Fixed in the tests: the heading is waited for (5 s at most); the reconciliation is asked again for at most ten seconds, and a copy that stays down still fails. The gate log is kept with its two failures (qa/results/phase12-gate.txt). A timing fault cannot be made to fail on demand, so there is no proof by removal for this one.',
    'The stock scenario passed three times alone; both whole suites were run again on the same build and database (qa/results/phase12-gate-reruns.txt).'],
];

const today = '2026-11-19';
for (const [id, severity, status, module, category, where, actual, expected, impact, statusNote, verification] of AA) {
  const row = { id, discovered: today, source: 'Phase 12 certification: the cross-module flows, the revalidation suites and the document checks, on three server copies', module, workflow: module, severity, category, where, evidence: verification, expected, actual, cause: '', impact, dependencies: '', correction: statusNote, requiredTests: verification, phase: PHASE, status, statusNote, verification };
  const i = reg.findings.findIndex((f) => f.id === id);
  if (i > -1) reg.findings[i] = row; else reg.findings.push(row);
}

// ── every finding that was "deferred to a specific phase" gets a status this phase allows ────────────
const SAMPLES = 'Phase 12: not built. Owner decision 4 (2026-11-13) says build it; no approval to defer it past go-live is on file. The screens are labelled as samples, save nothing, and the manual now says so (AA-006). For go-live the owner chooses: go live with them labelled, hide them from the menu, or wait until they are built.';
const DEBT = 'Phase 12: not done, and no approval to defer it past go-live is on file. The owner either approves the deferral in writing (it then becomes DEFERRED WITH APPROVAL) or schedules the work. It does not stop the work the pilot covers.';
const group = (ids, status, note) => Object.fromEntries(ids.map((id) => [id, { status, statusNote: note }]));
const dispositions = {
  ...group(['X-001', 'X-002', 'X-008', 'X-009', 'I-011', 'M-011', 'U-019', 'U-029', 'U-035', 'U-037', 'U-040', 'U-004', 'V-011', 'B-017', 'G-003', 'D-020', 'D-036', 'L-023', 'L-027', 'L-030', 'N-026', 'N-028', 'H-014', 'K-012'], RBD, SAMPLES),
  ...group(['B-012', 'B-013', 'B-014', 'B-016', 'B-022', 'B-024', 'C-009', 'C-013', 'D-023', 'D-024', 'I-012 (D-024)', 'E-018', 'E-021', 'G-013', 'G-018', 'G-020', 'I-017', 'U-022', 'L-025', 'L-029', 'V-018', 'V-027', 'V-029', 'V-035', 'V-036', 'D-034'], RBD, DEBT),
  'E-019': { status: RBD, statusNote: `Phase 12: isolation was tested again by behaviour (customer accounts, branches of four kinds, a new branch, partners, documents, the assistant) and holds. The table-by-table audit of every tenant id column is still not made. ${DEBT}`, verification: `${SIM} "Security 4 and 5", "Security 6", "Security 9", "Locations 2", "Locations 6".` },
  'E-023': { status: FIXED, statusNote: 'Phase 12: measured at the volume of the 80-branch QA data after the enterprise day: the cockpit answers in 61 ms at the median and 70 ms at the slowest of the reads, 76 KB. The earlier target (under 500 ms on the scaled database) is met. How many hot jobs the screen lists is a screen choice, not a defect.', verification: `${SIM} "Gap E-023".` },
  'V-028': { status: FIXED, statusNote: 'Phase 12: the dispatch board lists were tested across branches: a person of another branch is given none of the first branch\'s dispatch jobs or operations by asking for them, with or without a branch in the address.', verification: `${SIM} "Security 6".` },
  'V-037': { status: FIXED, statusNote: 'Phase 12: the home dashboard, the branch dashboard, the operations cockpit summary, the sales dashboard, the material tracking counts and the finance reports were each compared figure by figure with the database (and revenue with the journal by SQL).', verification: `${SIM} group "Dashboards and reports agree with the records" (7 scenarios).` },
  'X-010': { status: FIXED, statusNote: 'Phase 12: every chapter about sample screens is flagged and the page says so; chapters that mix real and sample screens name the sample ones; every real screen on the menu has a chapter (AA-006).', verification: `${MAN}; ${UI}.` },
  'G-011': { status: FNV, statusNote: 'Phase 12: on the QA database the application connects as a role that cannot change or delete history, switch off the guards, or change the schema (tested again). On the live database this holds only after the owner applies database update 17 and points the server at that role (Y-008): NOT VERIFIED there.', verification: `${SIM} "Security 8", "Ledger 4".` },
  'D-027': { status: RBD, statusNote: 'Phase 12: the sign-in and partner limits are one limit for all server copies (E-014, Z-007, after database update 18). The general ceiling per address still counts per copy by design; whether that is acceptable is Z-010, the owner\'s decision.' },
  'H-012': { status: RBD, statusNote: 'Phase 12: same as D-027: the limits that protect sign-in and partners are shared; the general ceiling is per copy (Z-010, owner\'s decision).' },
  'W-005': { status: BLOCKED, statusNote: 'Phase 12: still not run on a copy of the live database: no copy was provided, and this session has no access to live data by rule. Blocked on the owner making the copy. It is step 2 of phase-12-cutover-plan.md and a condition of financial acceptance.' },
  'W-015': { status: RBD, statusNote: 'Phase 12: unchanged. Whether a second finance person is always required to reopen a month is the accountant\'s decision, with W-001.' },
  'W-023': { status: BLOCKED, statusNote: 'Phase 12: the ledger was certified again at the volume of the QA enterprise day. A year\'s volume and the live host are not measured: that needs the live host or a copy of it (owner). No capacity claim is made beyond what was measured.' },
  'Z-012': { status: RBD, statusNote: 'Phase 12: unchanged. Whether a repeated dispatch should bill a shipment left without an invoice by a crash is the owner\'s choice; until then the Integrations screen lists such shipments and billing them closes each one (tested in Phase 11).' },
  'Z-014': { status: RBD, statusNote: 'Phase 12: unchanged (60 seconds). Production timings are needed to choose a shorter wait safely; the figure is the owner\'s to confirm after the pilot.' },
  // ── notes that contradicted their status ──
  'B-007': { statusNote: 'Phase 12: the executive decision line is now tested: a decision is recorded under the signed-in person and role whatever the request claims, and a sales representative is refused.', verification: `${SIM} "Gap B-007".` },
  'B-021': { statusNote: 'Phase 12: tested again: an uploaded file is not served by its address; it is read only through the signed-in download; a customer login of another account is refused.', verification: `${SIM} "Security 9".` },
  'C-006': { statusNote: 'Phase 12: the web checkout was run with a request key (the same order sent twice saves one order). Order intake uses the same middleware and was not run separately: NOT VERIFIED for that one route.', verification: `${SIM} "Flow 6".` },
  'D-011b': { status: FNV, statusNote: 'Phase 12: on a self-hosted server a file over the limit is refused with 413 and a stored file downloads byte for byte (tested). On the hosted site, with its 4 MB limit and its own file store, neither was exercised: NOT VERIFIED there. On the deployment checklist as a first-day check.', verification: `${SIM} "Gap: a document over the upload size limit".` },
  'E-009': { statusNote: 'Phase 12: confirmed by reading the code: demo companies are loaded only with SEED_ON_START=true. The deployment checklist says to confirm the setting is absent on the host. No automated test starts a server against an empty non-local database, by rule.' },
  'E-010': { statusNote: 'Phase 12: now exercised by a test: a server asked to stop finishes the requests it has begun, exits by itself with code 0 in under five seconds, closes its database connections and takes no new request.', verification: `${PROC} (E-010, nine checks).` },
  'M-009': { statusNote: 'Phase 12: the error path is now triggered in a browser: with the time records failing to load, the screen says so and shows no hours and no "demo data".', verification: `${UI} "When time records cannot be loaded the screen says so and shows no hours".` },
  'M-013': { statusNote: 'Phase 12: now checked on a server started with no database: the jobs list answers 503 and no sample job.', verification: `${PROC} (M-013).` },
  'H-005': { statusNote: 'Phase 12: unchanged and stated plainly: the fix is verified against stand-ins for the outside services. No real provider was called in any test; the first real call is a first-day check on the deployment checklist.' },
  'H-006': { statusNote: 'Phase 12: the fix is verified on QA. How many live orders are in this state is unknown until the report is read on the live system: a first-day check on the deployment checklist.' },
  'H-018': { statusNote: 'Phase 12: verified on QA; the count on live data is a first-day check on the deployment checklist.' },
  'L-031': { statusNote: 'Phase 12: verified on QA; whether any exist on live data is a first-day check on the deployment checklist.' },
  'N-004': { statusNote: 'Phase 12: verified on QA; the count on live data is a first-day check on the deployment checklist.' },
  'N-014': { statusNote: 'Phase 12: the documents are verified as files. What a paper looks like on a branch\'s own printer is not, and no claim is made (K-013): a pilot-branch check in the rollout plan.' },
  'W-020': { statusNote: 'Phase 12: the words "NOT VERIFIED" at the start of this finding\'s verification were left from before Phase 10 and are removed: the restore was run in Phase 10 (qa/results/phase10-restore.json). Live backups remain E-015.', verification: 'qa/sim/phase10-security.mjs group 8 (25 scenarios); qa/results/phase10-restore.json.', replaceVerification: true },
  'W-022': { statusNote: 'Phase 12: the words "NOT VERIFIED with more than one server process" are out of date: Phase 11 ran it on three and four server copies (Z-002).' },
};
const NOTE = 'Phase 12 dispositions of findings raised in earlier phases. Applied to findings.json by qa/tools/phase12-findings.mjs. A status is changed only where one is given. No finding is removed.';
fs.writeFileSync(path.join(root, 'qa/enterprise-excellence/phase-12-dispositions.json'), `${JSON.stringify({ note: NOTE, dispositions }, null, 1)}\n`);
for (const [id, d] of Object.entries(dispositions)) {
  const f = reg.findings.find((x) => x.id === id);
  if (!f) { console.error(`missing ${id}`); process.exit(1); }
  const mark = d.statusNote.slice(0, 60);
  if (!String(f.statusNote || '').includes(mark)) f.statusNote = [f.statusNote, d.statusNote].filter(Boolean).join(' ');
  if (d.status) f.status = d.status;
  if (d.replaceVerification) f.verification = d.verification;
  else if (d.verification && !String(f.verification || '').includes(d.verification.slice(0, 30))) f.verification = [f.verification, d.verification].filter(Boolean).join(' ');
}
const notAllowed = reg.findings.filter((f) => !ALLOWED.has(f.status));
fs.writeFileSync(FILE, `${JSON.stringify(reg, null, 1)}\n`);
const by = {}; for (const f of reg.findings) by[f.status] = (by[f.status] || 0) + 1;
console.log(`${AA.length} AA findings written; ${Object.keys(dispositions).length} earlier findings dispositioned; ${reg.findings.length} findings in all`);
console.log(JSON.stringify(by));
if (notAllowed.length) { console.error(`status not allowed in Phase 12: ${notAllowed.map((f) => `${f.id} (${f.status})`).join(', ')}`); process.exit(1); }
