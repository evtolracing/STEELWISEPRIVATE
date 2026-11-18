// Phase 10: adds the Y-series findings to findings.json and applies the Phase 10 notes to earlier
// findings (phase-10-dispositions.json). Safe to run again: a finding already there is replaced by
// the text below, nothing is ever removed.   node qa/tools/phase10-findings.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const FILE = path.join(root, 'qa/enterprise-excellence/findings.json');
const reg = JSON.parse(fs.readFileSync(FILE, 'utf8'));
const PHASE = 'Phase 10: security, financial integrity, reliability and recovery';
const FIXED = 'VERIFIED FIXED'; const FNV = 'FIXED — NOT VERIFIED'; const RBD = 'REQUIRES BUSINESS DECISION'; const LATER = 'DEFERRED TO SPECIFIC PHASE';
const SIM = 'qa/sim/phase10-security.mjs'; const UNIT = 'src/backend/test/securityRules.test.js'; const MUT = 'qa/tools/phase10-mutations.mjs';
const FILE17 = 'database update 17 (src/backend/prisma/upgrades/sql-editor/20261118090000_security_hardening.sql)';

// [id, severity, status, module, category, where, actual, expected, impact, statusNote, verification]
const Y = [
  ['Y-001', 'P1', FIXED, 'Authentication', 'Session security', 'src/backend/src/middleware/auth.js; src/backend/src/routes/auth.js; src/backend/src/routes/users.js',
    'A sign-in token kept working for its full life after the password was changed, after an administrator reset it, after the login was switched off and after sign-out. Measured at the baseline: the old token answered 200 after a password change and after a reset.',
    'Changing or resetting a password, switching a login off and "sign out everywhere" end every earlier sign-in at once.',
    'A stolen or shared token could not be cut off; a leaver kept access until the token expired.',
    'Fixed: each user has tokensValidAfter (file 17); a token carries a session mark and is refused once the mark moves. A password change answers a fresh token for the device that made it. A new route POST /api/auth/logout-all, and the profile menu calls it.',
    `${UNIT} "Y-001"; ${SIM} group 1 (seven session scenarios); ${MUT} Y-001 and Y-001s hold.`],
  ['Y-002', 'P1', FIXED, 'Authentication', 'Brute force', 'src/backend/src/routes/auth.js',
    'Nothing limited wrong passwords for one login: 30 wrong passwords from 30 addresses all answered 401 and the next right one would have worked. The per-address limit does not stop guesses spread over addresses.',
    'Ten wrong passwords in a row pause the login for 15 minutes whatever address they come from, the pause is recorded and raises an alert, and a burst at the same moment records one pause.',
    'Password guessing against one known address.',
    'Fixed: failedLoginCount and lockedUntil (file 17). The pause is taken with a conditional update so twenty wrong passwords at once record one pause and one alert (first version recorded several). The answer during a pause is the same sentence as a wrong password. An administrator can lift a pause.',
    `${UNIT} "Y-002"; ${SIM} "Ten wrong passwords in a row pause the login", "Twenty wrong passwords at once pause the login and none gets through"; ${MUT} Y-002 and Y-002s hold.`],
  ['Y-003', 'P2', FIXED, 'Authentication', 'Account enumeration', 'src/backend/src/routes/auth.js',
    'A wrong password for an address with no login answered in about 4 ms and for an address with a login in about 91 ms, so timing told which addresses have logins.',
    'Every refusal takes about the same time and says the same sentence.',
    'An attacker could list which email addresses have logins before guessing passwords.',
    'Fixed: an address with no login is compared against a hash nobody has, and every refusal answers one sentence.',
    `${SIM} "A wrong password for an address with no login takes about as long as for one with a login"; ${MUT} Y-003 holds.`],
  ['Y-004', 'P1', FIXED, 'Documents', 'Path traversal', 'src/backend/src/routes/documents.js',
    'An upload whose entity type was "../../../qa-p10-escape" was written outside the uploads folder (measured: a file appeared in the repository root).',
    'An upload is always written inside the uploads folder.',
    'A signed-in user could write files anywhere the server process may write.',
    'Fixed: the folder is plain letters and underscores only, anything else is "general".',
    `${UNIT} "Y-004"; ${SIM} "An upload that names a folder outside the uploads folder is written inside it"; ${MUT} Y-004 holds.`],
  ['Y-005', 'P1', FIXED, 'Documents', 'Stored script', 'src/backend/src/app.js; src/backend/src/routes/documents.js',
    'A file stored under the name the sender chose (.html) was served by its address with no sign-in, as text/html, on a disk host. Measured: 200 text/html for /uploads/general/...html.',
    'A stored file keeps the extension of its accepted type and is read only through the signed-in download.',
    'Anyone with the address could read a document, and an uploaded page could run script in the site\'s origin.',
    'Fixed: the static /uploads route is removed; the stored name takes the extension of the accepted type. Closes B-021.',
    `${UNIT} "Y-005"; ${SIM} "A stored file keeps the extension of its accepted type", "An uploaded file cannot be fetched by its address"; ${MUT} Y-005 holds.`],
  ['Y-006', 'P2', FIXED, 'Documents', 'Content validation', 'src/backend/src/routes/documents.js',
    'A file declared as a PDF whose bytes were a Windows program was accepted (201).',
    'The first bytes must match the declared type for PDF, images, Office files and text.',
    'Disguised files in the document store.',
    'Fixed: contentMismatch() checks the signature of each accepted type before anything is stored.',
    `${UNIT} "Y-006"; ${SIM} group 3 "An upload of ... is refused" scenarios; ${MUT} Y-006 holds.`],
  ['Y-007', 'P2', FIXED, 'Authentication', 'Token verification', 'src/backend/src/middleware/auth.js',
    'Token verification did not name the accepted algorithm.',
    'Only HS256 is accepted; an unsigned token or one signed another way is refused.',
    'Defence in depth against algorithm confusion.',
    'Fixed: verifyUserToken pins HS256.',
    `${UNIT} "Y-007"; ${SIM} "The server refuses ..." forged-token scenarios; ${MUT} Y-007 holds.`],
  ['Y-008', 'P1', FNV, 'Database', 'Least privilege', 'src/backend/prisma/migrations/20261118090000_security_hardening/migration.sql',
    'The application connects as the database owner (a superuser on QA, the table owner on the host). That role can switch off the journal guards for a session, drop them, rewrite history and rewrite the record of applied updates (W-014).',
    'The application runs as a role that can read and write business rows only: no owner rights, no trigger control, history insert-only, the update record read-only.',
    'Anyone who took over the server process could change posted books and erase the trace.',
    `${FILE17} adds steelwise_runtime (NOLOGIN until the owner gives it a password), grants it business rows, takes UPDATE, DELETE and TRUNCATE on AuditLog and writes on _prisma_migrations away. Verified on QA: every suite ran with the server as steelwise_runtime. On the live database it takes effect only after the owner applies file 17 and points DATABASE_URL at the role: until then NOT VERIFIED there.`,
    `${SIM} group 3 "The application's database role cannot ..." (14 scenarios); restore test "The application role has the same rights in the restored database"; ${MUT} Y-008, Y-009, Y-011 hold.`],
  ['Y-009', 'P2', FNV, 'Database', 'Least privilege', 'file 17',
    'The application\'s connection could create and drop tables and functions in the public schema.',
    'Schema changes come only from the owner applying a database update.',
    'A compromised server could plant a function or drop a table.',
    'Fixed in file 17 with Y-008: the runtime role has no CREATE on the schema and owns nothing. Same live condition as Y-008.',
    `${SIM} "The application's database role cannot make a table / make a function / drop a table / change a column"; ${MUT} Y-009 holds.`],
  ['Y-010', 'P2', FIXED, 'Operations', 'Alerting', 'src/backend/src/lib/alerts.js; src/backend/src/lib/opsChecks.js; src/backend/src/routes/integrations.js; src/backend/src/app.js',
    'Nothing raised an alert: a failed ledger posting, an unbalanced attempt, a reconciliation difference, a broken stock balance, dead partner events, a late scheduled run and paused logins were visible only to someone who looked. Readiness said only whether the process answered (E-017).',
    'Each condition has a named check; the scheduled run raises an alert for each failing check, stored once per 15 minutes and sent to an alert address when one is set; readiness says which checks fail by name.',
    'Money and stock problems could sit unseen.',
    'Fixed: eleven checks (with Y-021), alert kinds with a severity, GET /api/admin/integrations/checks for administrators, /api/health/live and /api/health/ready. The alert address (ALERT_WEBHOOK_URL) is the owner\'s to set; with none set alerts are logged and listed only.',
    `${UNIT} "Y-010"; ${SIM} group 9 (21 scenarios) and the alert scenarios of group 6; ${MUT} Y-010 holds.`],
  ['Y-011', 'P1', FIXED, 'Audit', 'History integrity', 'src/backend/src/routes/overrides.js; src/backend/src/routes/quickSale.js; file 17',
    'Two places changed history rows: revoking an order override rewrote the override\'s own history line, and dropping a duplicate counter sale deleted the financial history of the dropped invoice.',
    'A history line is never changed or deleted; a later event is a new line.',
    'The audit trail could not be trusted to show what was first recorded.',
    'Fixed: a revoke is its own line and the override reads as revoked from it; a dropped duplicate sale writes a DUPLICATE_SALE_DROPPED line and deletes nothing. File 17 makes AuditLog insert-only for the application role.',
    `${SIM} "The audit trail of overrides keeps the original row when an override is revoked"; "The application's database role cannot change a history row / delete history / empty the history"; ${MUT} Y-011 holds.`],
  ['Y-012', 'P3', FIXED, 'Test suite', 'Test order dependence', 'qa/sim/phase95/g6-books.mjs',
    'The Phase 9.5 scenario "credit owed back is shown apart" relied on credit owed back left by an earlier scenario, and failed when run alone or after a different order (also failing on main).',
    'A scenario sets up what it checks.',
    'A false failure in the gate.',
    'Fixed: it raises its own paid invoice with a 25.00 credit and checks the change.',
    'qa/sim/phase95-ledger.mjs 158 of 158 with the server as steelwise_runtime; the scenario passes alone.'],
  ['Y-013', 'P1', FIXED, 'Authentication', 'Privilege escalation', 'src/backend/src/routes/auth.js',
    'POST /api/auth/register, used by a signed-in administrator, skipped the Users screen\'s rules: it took the organization from the request body, could make customer roles without their account and roles the caller may not grant, and wrote no audit line.',
    'Register by a signed-in person follows the same rules as the Users screen: the caller\'s own organization, no customer roles, no role above what the caller may grant; first and last name required; an audit line.',
    'An administrator could make a login in another company, or a login of a higher role.',
    'Fixed in createUser.',
    `${SIM} "Registering a login is closed once the first login exists ...", "The owner registering a login cannot place it in another organization ..."; ${MUT} Y-013 and Y-013b hold.`],
  ['Y-014', 'P2', FIXED, 'Operations', 'Denial of service', 'src/backend/src/app.js',
    'The public readiness address ran the full system checks (whole-table reads) on every call, with no sign-in.',
    'The answer is kept for 30 seconds; a flood of calls is not a flood of database work.',
    'Anyone could load the database by calling one address.',
    'Fixed: readiness() keeps its answer for READY_CACHE_MS (30 s by default).',
    `${SIM} "The public readiness answer is kept for 30 seconds"; ${MUT} Y-014 holds.`],
  ['Y-015', 'P3', FIXED, 'Users', 'Information exposure', 'src/backend/src/routes/users.js',
    'The new guard fields (failed count, pause time, session mark) were in the user list answer for every colleague.',
    'Only those who manage logins, and the person themselves, see them.',
    'A colleague could see who is being guessed at.',
    'Fixed: forViewer() strips them for others.',
    `${SIM} "A colleague looking up logins sees names and roles, not who is being guessed at"; ${MUT} Y-015 holds.`],
  ['Y-016', 'P2', FIXED, 'Documents', 'Branch isolation', 'src/backend/src/routes/documents.js',
    'Documents ignored the branch boundary: a manager of another branch could list, open, download, delete and attach documents on records of a branch they do not hold.',
    'A document linked to a branch record is visible only where that record is.',
    'Order papers, certificates and invoices of one branch readable at every branch.',
    'Fixed: each document route checks the linked record through the branch-scoped client; uploads against a record outside the caller\'s branches are refused 404.',
    `${SIM} group 2 document scenarios (list, download, attach, delete); ${MUT} Y-016 and Y-016b hold.`],
  ['Y-017', 'P3', FIXED, 'Partner API', 'Audit attribution', 'src/backend/src/routes/partner/adminRoutes.js',
    'A revoked partner key recorded "revoked by" from a request header the caller writes.',
    'It records the signed-in person.',
    'The record of who revoked a key could be forged.',
    'Fixed.',
    `${SIM} "A revoked partner key stops working at once"; ${MUT} Y-017 holds.`],
  ['Y-018', 'P3', FIXED, 'Authentication', 'Error handling', 'src/backend/src/middleware/auth.js',
    'A validly signed token with no user id in it caused a server error (500).',
    '401.',
    'A crafted token produced a server error and a stack trace in the log.',
    'Fixed: a token without a text userId is refused.',
    `${SIM} "The server refuses a token with no user in it"; ${MUT} Y-018 holds.`],
  ['Y-019', 'P2', FIXED, 'Partner API', 'Authorization', 'src/backend/src/routes/partner/adminRoutes.js',
    'Reads under /api/v1/admin/partners (partners, keys, webhooks, deliveries) were open to any signed-in staff login; only writes needed an administrator.',
    'Partner administration, reads included, is for administrators.',
    'Any staff login could see every partner and its key names and delivery history.',
    'Fixed: the router requires an administrator role.',
    `${SIM} "A sales rep is refused the administration, the books and the system checks"; ${MUT} Y-019 holds.`],
  ['Y-020', 'P2', FIXED, 'Billing', 'Concurrency', 'src/backend/src/services/billing.js; src/backend/src/routes/invoices.js',
    'Twenty payments on one invoice at the same moment: some used up every retry of the serializable transaction and answered 500 (seen in the Phase 10 SIGTERM scenario: 500,201,201,201,500,...). Nothing was half-saved; the caller was shown a server error.',
    'Money recorded on one invoice takes turns; if two server processes still overlap after every retry, the caller is told "busy, try again" (409), never 500.',
    'Busy counters and partner integrations saw server errors on payments.',
    'Fixed: payments, refunds, credits and cancels on one invoice take turns inside a process (moneyTurn), with 12 attempts; an overlap that survives them answers 409 BUSY. Several server processes are not tested (Phase 11).',
    `${UNIT} "Y-020", "Y-020b"; ${SIM} "Twenty payments of 5.00 at once on one invoice are all recorded"; ${MUT} Y-020, Y-020s (the defect as it was: no turns, 6 attempts), Y-020b hold.`],
  ['Y-021', 'P2', FIXED, 'Shipping and billing', 'Failure recovery', 'src/backend/src/lib/opsChecks.js; src/backend/src/lib/alerts.js',
    'Dispatch and billing are two saves by design (H-006). A server killed between them (kill -9 during twenty dispatches) left 9 shipments dispatched, with stock and movement saved, and no invoice. The integrations report listed them, but no check failed and no alert was raised.',
    'No dispatch is ever half saved; a shipment left without its invoice is listed at once, fails a check after 15 minutes and raises an alert, and its invoice can be raised once from the shipment.',
    'Revenue not billed until someone happened to open the report.',
    'Fixed: the check "shipped goods invoiced" (alert SHIPPED_NOT_INVOICED, after SHIPPED_NOT_INVOICED_MINUTES, 15 by default). The two-save design is unchanged: making billing part of the dispatch save would change what happens when billing is refused, which is a business decision (H-006).',
    `${SIM} "The server killed in the middle of twenty dispatches leaves no half-saved sale ..." (each one listed, raised once, books agree), "Goods shipped and left without an invoice for more than fifteen minutes fail the checks and raise an alert"; ${MUT} Y-021 holds.`],
  ['Y-022', 'P2', FIXED, 'Authentication; deployment', 'Deployment order', 'src/backend/src/middleware/auth.js; src/backend/src/routes/auth.js',
    'The finished Phase 10 code reads three sign-in columns that database update 17 adds. Run on a database without update 17 (a copy of the restore with 17 rolled back), every sign-in answered a bare 500 "Login failed".',
    'If the code reaches the host before the owner applies update 17, the answer says which update is missing, as Phase 9.5 did for the ledger (W-026); health keeps answering.',
    'A deployment in the wrong order would have looked like an outage with no explanation.',
    'Fixed: sign-in and every signed-in request answer 503 DATABASE_UPDATE_REQUIRED "Database update 17 (security hardening) has to be applied first." The order to follow is in phase-10-deployment-safety.md: apply file 17 first.',
    `${UNIT} "Y-022"; ${SIM} "The finished code on a database without update 17 says which update is missing ..."; ${MUT} Y-022 holds.`],
];

const today = '2026-11-18';
for (const [id, severity, status, module, category, where, actual, expected, impact, statusNote, verification] of Y) {
  const row = { id, discovered: today, source: 'Phase 10 baseline probe, threat model and scenarios', module, workflow: module, severity, category, where, evidence: verification, expected, actual, cause: '', impact, dependencies: '', correction: statusNote, requiredTests: verification, phase: PHASE, status, statusNote, verification };
  const i = reg.findings.findIndex((f) => f.id === id);
  if (i > -1) reg.findings[i] = row; else reg.findings.push(row);
}

// Notes on earlier findings. Status is changed only where stated.
const dispositions = {
  'W-014': { status: FNV, statusNote: 'Phase 10: the application now runs as steelwise_runtime in every QA suite; that role cannot switch off or drop the journal guards, set session_replication_role, or change history (Y-008). Live: after the owner applies file 17 and points DATABASE_URL at the role.' },
  'W-015': { statusNote: 'Phase 10: reviewed, unchanged. Reopening a month still yields when only one finance user exists; manual entries never yield. Whether a second person is always required is the accountant\'s decision with W-001.' },
  'W-019': { status: FIXED, statusNote: 'Phase 10: reading the journal list and opening an entry are now logged with the reader, the filter and the scope.', verification: `${SIM} "Journal reads by an auditor are in the audit trail with the reader and what was read".` },
  'W-020': { status: FIXED, statusNote: 'Phase 10: an actual backup and restore into a separate PostgreSQL server: the journal balances, keeps its four guards and its numbering, and the restored application signs in and reconciles with no difference. Live backups (the host\'s) are not exercised: E-015.', verification: `${SIM} group 8 (25 scenarios); qa/results/phase10-restore.json.` },
  'B-021': { status: FIXED, statusNote: 'Phase 10 (Y-005): the static /uploads route is removed; files are read through the signed-in download only.', verification: `${SIM} "An uploaded file cannot be fetched by its address, only through the signed-in download".` },
  'E-011': { statusNote: 'Phase 10: no critical vulnerability in production dependencies (npm audit --omit=dev --audit-level=critical exits 0 for backend and frontend), and CI now fails on a critical one. Production dependencies have no high either: 1 moderate in the backend (uuid) and 2 in the frontend (react-router). With build tools counted the frontend adds 1 high and 1 moderate (vite, used only to build). Each needs a major upgrade, which was not made: the owner decides when.' },
  'E-014': { statusNote: 'Phase 10: the per-address limit still counts per server instance. Password guessing is now stopped per login in the database (Y-002), which holds across instances. Several instances are measured in Phase 11.' },
  'E-015': { status: FNV, statusNote: 'Phase 10: a backup of the QA database was restored into a separate server and verified (W-020). The live host\'s backups have still never been restored; the procedure is in phase-10-restore-test.md and phase-10-disaster-recovery.md for the owner.' },
  'E-017': { statusNote: 'Phase 10: alerts now exist (Y-010) and are sent to ALERT_WEBHOOK_URL when set. Which service receives them (email, chat, paging) is the owner\'s choice; none is set on the host.' },
  'E-019': { statusNote: 'Phase 10: 31 isolation scenarios (customer accounts, divisions, branches, partners, the assistant) pass. A table-by-table audit of every tenant id column was not made: Phase 11.' },
  'C-009': { statusNote: 'Phase 10: documents now follow the branch of the record they belong to (Y-016).' },
  'V-028': { statusNote: 'Phase 10: unchanged. The dispatch board lists are not in the Phase 10 isolation scenarios.' },
  'B-019': { statusNote: 'Phase 10: the scheduled run now also runs the system checks and raises their alerts, and a late run is itself a failing check. It still needs a scheduler on the host (owner).' },
};
const NOTE = 'Phase 10 notes on findings raised in earlier phases. Applied to findings.json by qa/tools/phase10-findings.mjs. A status is changed only where one is given.';
fs.writeFileSync(path.join(root, 'qa/enterprise-excellence/phase-10-dispositions.json'), `${JSON.stringify({ note: NOTE, dispositions }, null, 1)}\n`);
for (const [id, d] of Object.entries(dispositions)) {
  const f = reg.findings.find((x) => x.id === id);
  if (!f) { console.error(`missing ${id}`); process.exit(1); }
  const mark = d.statusNote.slice(0, 40);
  if (!String(f.statusNote || '').includes(mark)) f.statusNote = [f.statusNote, d.statusNote].filter(Boolean).join(' ');
  if (d.status) f.status = d.status;
  if (d.verification && !String(f.verification || '').includes(d.verification.slice(0, 30))) f.verification = [f.verification, d.verification].filter(Boolean).join(' ');
}
fs.writeFileSync(FILE, `${JSON.stringify(reg, null, 1)}\n`);
console.log(`${Y.length} Y findings written; ${Object.keys(dispositions).length} earlier findings noted; ${reg.findings.length} findings in all`);
