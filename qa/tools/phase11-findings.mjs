// Phase 11: adds the Z-series findings to findings.json and applies the Phase 11 notes to earlier
// findings (phase-11-dispositions.json). Safe to run again: a finding already there is replaced by
// the text below, nothing is ever removed.   node qa/tools/phase11-findings.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const FILE = path.join(root, 'qa/enterprise-excellence/findings.json');
const reg = JSON.parse(fs.readFileSync(FILE, 'utf8'));
const PHASE = 'Phase 11: 80-location enterprise stress simulation';
const FIXED = 'VERIFIED FIXED'; const RBD = 'REQUIRES BUSINESS DECISION'; const LATER = 'DEFERRED TO SPECIFIC PHASE';
const DAY = 'qa/sim/phase11-enterprise.mjs'; const SIM = 'qa/sim/phase11-scenarios.mjs'; const UNIT = 'src/backend/test/enterpriseScale.test.js'; const MUT = 'qa/tools/phase11-mutations.mjs';
const FILE18 = 'database update 18 (src/backend/prisma/upgrades/sql-editor/20261118150000_shared_rate_limits.sql)';

// [id, severity, status, module, category, where, actual, expected, impact, statusNote, verification]
const Z = [
  ['Z-001', 'P1', FIXED, 'Invoices', 'Performance under load', 'src/backend/src/services/billing.js (takeNumber)',
    'Every invoice number was taken by reading the highest number in the whole invoice table inside the serializable save. Each invoice cost more as the table grew, and every other invoice written meanwhile counted as an overlap and was run again. Baseline day on three server copies: 3,269 database transactions rolled back, a dispatch took 7.2 s at the 95th percentile.',
    'A number is one statement on the counter row. The invoice table is read only for the very first invoice of a series.',
    'Dispatch slowed with every invoice ever written; under load most of the database work was thrown away and repeated.',
    'Fixed: the number comes from DocumentCounter in one UPDATE; the first invoice of a series starts after the highest number already written. Same day after the fixes Z-001 to Z-003: 220 to 230 transactions rolled back, invoice numbers still unbroken and never repeated.',
    `${UNIT} "Z-001" (two tests); ${SIM} groups 1 and 3 (numbers unbroken across server copies); ${DAY} cycles 2 to 5; ${MUT} Z-001 holds.`],
  ['Z-002', 'P1', FIXED, 'Invoices', 'Concurrency across server copies', 'src/backend/src/services/billing.js (waitForSeries, inSeries)',
    'W-021 made invoices take turns inside one server process. With several server copies the only guard between copies was the database retry: on three copies invoices overlapped, were retried up to 25 times, and at the baseline that was most of the 3,269 rolled back transactions (W-022).',
    'Invoices take turns in the database itself, so the order holds whichever server copy each request reaches, and a save waits its turn before it has read anything.',
    'On a host that runs several copies (every hosted function instance is one) invoices were slow and could run out of retries.',
    'Fixed: a numbered save first takes a short table lock on DocumentCounter (SHARE UPDATE EXCLUSIVE, which does not block reads or ordinary row changes), then reads and writes. A wait longer than the request limit answers "busy, try again" (409), never a server error.',
    `${UNIT} "Z-002"; ${SIM} group 1 and group 7 ("Eight shipments are dispatched while the invoice numbers are held for three seconds", "The invoice numbers stay held for longer than a request may wait", "Twelve invoices are being numbered when a server copy is killed"); ${MUT} Z-002 holds.`],
  ['Z-003', 'P1', FIXED, 'Orders, quotes, shipments, work orders, purchase orders, transfers', 'Performance under load', 'src/backend/src/lib/numbering.js (createNumbered, createFromCounter)',
    'Every other numbered document counted its table to find the next number and retried on a clash. Eighty branches saving at once clashed repeatedly; some saves used up their retries.',
    'A document number is handed out by its counter row; the table is counted once, the first time a series is used.',
    'Order entry and receiving slowed and occasionally failed at the busiest moments.',
    'Fixed: one counter per kind of document (and per year for dated series), stepping past numbers already on older documents. If the counter cannot be read the save is numbered the old way and not lost.',
    `${UNIT} "Z-003" (six tests, including eighty saves at the same moment); ${SIM} group 1; ${MUT} Z-003 holds.`],
  ['Z-004', 'P1', FIXED, 'Authentication', 'Availability under load', 'src/backend/src/lib/passwords.js; src/backend/src/routes/auth.js; src/backend/src/middleware/partnerAuth.js',
    'A password check is deliberately slow processor work and ran on the thread that answers everything else. Twenty-four people signing in at the same moment on one server process left the health check unanswered for over 1.5 seconds, and 768 requests were turned away as "no server".',
    'A morning burst of sign-ins does not stop the server answering everyone else.',
    'At shift start every screen and every save on that server copy stalled; a host that checks health could have restarted a healthy copy.',
    'Fixed: password and key checks take turns, two at a time (PASSWORD_CHECKS_AT_ONCE). Nobody is refused; a sign-in in a burst waits a little longer.',
    `${UNIT} "Z-004" (four tests); ${SIM} group 7 "Sixty people sign in at once right after every copy has restarted"; ${DAY} sign-in of every employee; ${MUT} Z-004 holds.`],
  ['Z-005', 'P1', FIXED, 'Orders, returns, invoices', 'Error handling under load', 'src/backend/src/lib/numbering.js (retryOverlap, Busy); src/backend/src/routes/returns.js',
    'A save that overlapped others on every retry ended as a server error (500). In the correction cycle 2 of 545 customer jobs failed this way on "return received and credited".',
    'A save that could not get its turn answers "busy, try again" (409), which the screens already resend; it is never a server error.',
    'A customer return appeared to fail with an unexplained error at the busiest moment.',
    'Fixed: an overlap that survives every retry is answered 409 with code BUSY; receiving a return retries 12 times. After the fix: 545 of 545 jobs and 0 failed transactions in cycles 2, 3 and 5.',
    `${UNIT} "Z-005"; ${DAY} cycles 2 to 5 (returns 60 of 60); ${MUT} Z-005 holds.`],
  ['Z-006', 'P2', RBD, 'Shipping and invoicing', 'Capacity', 'src/backend/src/services/billing.js; qa/enterprise-excellence/phase-11-capacity-recommendations.md',
    'Invoices are written one at a time for the whole company, because invoice numbers must never be skipped or repeated (owner decision of 2026-11-13). Measured on a 4-processor machine that also ran the database and the load: an invoice alone takes about 92 ms, the ceiling is 21 to 28 invoices a second, and in the full mixed day a dispatch met the proposed limit (2 s at the 95th percentile) with 8 and 16 jobs in flight and missed it with 32 (about 3.5 s) and 48 (about 5 s). One, three and four server copies gave the same figures: more server copies do not help.',
    'The owner approves a limit for dispatch at peak, and if the measured figure is not enough chooses between a number series per branch, a shorter invoice save, or a larger database server.',
    'At the very busiest moment (dozens of trucks dispatched in the same second across the company) a dock waits several seconds for its paperwork. Nothing is lost or numbered wrongly.',
    'Not changed: every option that raises the ceiling changes either how invoices are numbered (the owner\'s and the accountant\'s decision) or the hardware (the owner\'s). The measurements and the options are in phase-11-capacity-recommendations.md.',
    `${DAY} cycles 1 to 5 and the one-copy and four-copy runs (qa/results/phase11-capacity-*.json); qa/results/phase11-invoice-capacity-3.json.`],
  ['Z-007', 'P1', FIXED, 'Partner API', 'Rate limiting across server copies', 'src/backend/src/middleware/partnerRateLimit.js; src/backend/src/lib/rateWindow.js',
    'A partner\'s request limits (per second, minute and hour) were counted in the memory of each server copy, so a partner got its limit once per copy.',
    'One limit per partner, whichever copies answer.',
    'A partner allowed five requests a minute could make five per server copy; on a host with many instances the limit meant little.',
    `Fixed: the counts are kept in the RateWindow table (${FILE18}), one statement per request for all three windows. If the table cannot be reached the limit still holds per copy and no request fails; the server says so once in its log.`,
    `${UNIT} "Z-007" (three tests); ${SIM} group 6 "A partner's request limit is one limit across all server copies"; ${MUT} Z-007 and Z-007s hold.`],
  ['Z-008', 'P2', FIXED, 'Deployment', 'Graceful shutdown', 'src/backend/src/server.js',
    'A server copy asked to stop politely (as every deployment does) waited for idle keep-alive connections to close by themselves: under load it took about 6 seconds to leave.',
    'A stopped copy finishes the requests it has and leaves within three seconds.',
    'Slow rolling restarts; a host that waits only a few seconds would have killed the copy with work in hand.',
    'Fixed: idle connections are closed while the copy drains. Measured exit under thirty payments in flight: under 3 seconds, every payment the client was told about saved once.',
    `${SIM} group 7 "A server copy is stopped politely (SIGTERM) while thirty payments arrive" and the rolling restart scenario; ${MUT} Z-008 holds.`],
  ['Z-009', 'P1', FIXED, 'Platform', 'Error handling when the database is unreachable', 'src/backend/src/lib/requestContext.js (isNoConnection); src/backend/src/middleware/safeErrors.js (busyDatabase); src/backend/src/lib/db.js',
    'When no database connection was free, or the connection was cut, routes answered "server error" (500) with no hint that sending again would work.',
    'A request that failed only for want of a database connection answers 503 with code DATABASE_BUSY and a time to retry; a caller\'s own mistake and a real fault are left as they are.',
    'During a database restart or connection exhaustion every screen showed unexplained errors, and monitoring could not tell an outage from a defect.',
    'Fixed for queries. The same case inside a transaction is Z-011.',
    `${UNIT} "Z-009" (two tests); ${SIM} group 7 "Almost every database connection is taken by something else", "Every database connection of the servers is cut while thirty requests are in flight"; ${MUT} Z-009 and Z-009s hold.`],
  ['Z-010', 'P3', RBD, 'Platform', 'Rate limiting across server copies', 'src/backend/src/app.js (general /api limiter)',
    'The general ceiling on requests per address still counts per server copy. Counting it in the database would add a write to every request of every user.',
    'The owner accepts the per-copy general ceiling (the sign-in and partner limits, which are the security limits, are shared), or asks for a shared one with its cost.',
    'An address sending a very large number of ordinary requests gets the general ceiling once per server copy. Sign-in guessing and partner limits are not affected.',
    'Left as it is, with the reason written in the code. Recorded for the owner\'s decision.',
    'Read from the code; the shared limits are verified under E-014 and Z-007.'],
  ['Z-011', 'P1', FIXED, 'Platform', 'Error handling when the database is unreachable', 'src/backend/src/lib/db.js (withTransactionNote, noteLostConnection)',
    'A transaction that failed when it was opened or committed on a connection the database had closed was still answered 500: the note that turns the reply into "try again" was taken only on single queries. Found in the first failure-and-recovery run: with every server connection cut, one "order confirmed" answered 500.',
    'A transaction that lost its connection answers 503 with a time to retry, like a query.',
    'One unexplained server error per request caught in the middle of a database restart.',
    'Fixed: transactions are noted too. The failure-and-recovery run after the fix had no 500.',
    `${UNIT} "Z-011"; ${DAY} cycle 4 (qa/results/phase11-cycle-4-first-run.json shows the 500, phase11-cycle-4.json none); ${MUT} Z-011 holds.`],
  ['Z-012', 'P3', LATER, 'Shipping and invoicing', 'Recovery', 'src/backend/src/routes/shipments.js (dispatch)',
    'When the answer to a dispatch is lost because its server copy died after saving the dispatch and before billing, sending the dispatch again answers "already IN_TRANSIT" (409). The truck left once and nothing is wrong in the records, but the invoice is raised only when the office bills the shipment from the list of shipments without an invoice (H-006, Y-021). In the failure-and-recovery run this happened to 2 to 4 of 480 dispatches and each was closed by that path.',
    'A dispatch sent again for a shipment that left without its invoice raises the invoice and answers with it, so the dock needs no second step.',
    'A few minutes of delay on a handful of invoices after a server crash; the gap is listed and alerted (Y-021), never silent.',
    'Not changed in Phase 11. Phase 12: decide with the owner whether a repeated dispatch should bill.',
    `${DAY} cycle 4 (recoveredByBillingAgain); ${SIM} group 7 "A server copy is killed in the middle of twenty dispatches".`],
  ['Z-013', 'P1', FIXED, 'Platform', 'Duplicate-request protection', 'src/backend/src/middleware/requestKeys.js',
    'When the request key of a changing request could not be claimed (no database connection at that instant) the request was run anyway, without its protection. If its answer was then lost, the retry claimed the key afresh and ran a second time. Found in the failure group run straight after the failure-and-recovery day: of eight payments sent with keys through a dropped network right after every server connection had been cut, one invoice received two payments.',
    'A request that carries a key is never run unless the key is claimed. If the key cannot be claimed nothing is done and the caller is told to send it again (503, DATABASE_BUSY).',
    'A payment, receipt or dispatch could be taken twice in the seconds after a database interruption, exactly when clients retry most.',
    'Fixed: the request is refused with 503 and a time to retry; nothing is done. The failure group then passed 36 of 36 on the same database.',
    `${UNIT} "Z-013"; ${SIM} group 7 "The network drops after eight payments were sent, and the same payments are sent again"; ${MUT} Z-013 holds.`],
  ['Z-014', 'P3', LATER, 'Platform', 'Duplicate-request protection', 'src/backend/src/middleware/requestKeys.js (STALE_MS)',
    'A request key claimed by a server copy that then died blocks the repeat of that request for 60 seconds ("still being processed"), after which the repeat takes the claim over and runs.',
    'The wait is as short as is safe.',
    'A clerk whose save was lost in a server crash waits up to a minute before the same save goes through. Nothing is saved twice.',
    'Not changed: a shorter wait risks running a slow first attempt twice. Phase 12: review the figure with production timings.',
    `${SIM} group 6 and group 7 (a keyed request whose copy was killed is answered once after the claim runs out).`],
];

const today = '2026-11-18';
for (const [id, severity, status, module, category, where, actual, expected, impact, statusNote, verification] of Z) {
  const row = { id, discovered: today, source: 'Phase 11 enterprise day, scenarios and failure injection on three server copies', module, workflow: module, severity, category, where, evidence: verification, expected, actual, cause: '', impact, dependencies: '', correction: statusNote, requiredTests: verification, phase: PHASE, status, statusNote, verification };
  const i = reg.findings.findIndex((f) => f.id === id);
  if (i > -1) reg.findings[i] = row; else reg.findings.push(row);
}

// Notes on earlier findings. Status is changed only where stated.
const dispositions = {
  'E-014': { status: FIXED, statusNote: `Phase 11: the sign-in limit per address and the partner limits are now counted in the database, one limit for all server copies (${FILE18}). Measured on three copies with a limit of ten: before, 30 of 60 wrong sign-ins from one address reached the password check; after, 10 of 60. The general ceiling per address still counts per copy by decision (Z-010). Live only after the owner applies update 18; until then the server counts per copy as before and says so in its log.`, verification: `${UNIT} "E-014" (two tests); qa/sim/phase11/rate-limit-copies.mjs with qa/results/phase11-rate-limit-before.json and -after.json; ${MUT} E-014 holds.` },
  'W-022': { status: FIXED, statusNote: 'Phase 11: invoices now take turns in the database, across server copies (Z-002). Five enterprise days on three copies and one on four: every dispatch raised its invoice or was closed by billing after an injected crash; invoice numbers unbroken and never repeated.', verification: `${DAY} cycles 1 to 5; ${SIM} groups 1, 3 and 7.` },
  'W-023': { statusNote: 'Phase 11: measured at the volume of the enterprise day (about 2,700 journal entries, 5,500 lines, 80 branches): reconciliation run p95 under 0.4 s, trial balance and branch reports within the proposed limit of 800 ms while the day\'s work ran. A year\'s volume (hundreds of thousands of entries) and the live host are still not measured: Phase 12.' },
  'E-019': { statusNote: 'Phase 11: 41 isolation scenarios under load pass (branches of four sizes, customer accounts, partners, the assistant, with other branches working at the same moment). A table-by-table audit of every tenant id column is still not made: Phase 12.' },
  'V-027': { statusNote: 'Phase 11: the lists were read at the volume of the enterprise day while it ran and stayed within the proposed limit; GET /api/jobs is still unbounded and grows with the data. Unchanged: Phase 12.' },
  'V-037': { statusNote: 'Phase 11: revenue by branch against revenue by customer, the stock value report against the books, and the receivables report read by twelve people at once were compared under load (group 8). The five dashboards named are still not compared figure by figure: Phase 12.' },
  'Y-021': { statusNote: 'Phase 11: seen again across server copies. A copy killed during dispatches left 2 to 4 of 480 shipments without an invoice in the failure-and-recovery day; each was listed and closed by billing the shipment (Z-012 proposes that a repeated dispatch bills).' },
  'B-019': { statusNote: 'Phase 11: the scheduled run was exercised on several server copies at once and while a copy was killed; six runs started at the same moment on different copies sent each waiting event once, and the run now also removes old request-limit windows. It still needs a scheduler on the host (owner).' },
};
const NOTE = 'Phase 11 notes on findings raised in earlier phases. Applied to findings.json by qa/tools/phase11-findings.mjs. A status is changed only where one is given.';
fs.writeFileSync(path.join(root, 'qa/enterprise-excellence/phase-11-dispositions.json'), `${JSON.stringify({ note: NOTE, dispositions }, null, 1)}\n`);
for (const [id, d] of Object.entries(dispositions)) {
  const f = reg.findings.find((x) => x.id === id);
  if (!f) { console.error(`missing ${id}`); process.exit(1); }
  const mark = d.statusNote.slice(0, 40);
  if (!String(f.statusNote || '').includes(mark)) f.statusNote = [f.statusNote, d.statusNote].filter(Boolean).join(' ');
  if (d.status) f.status = d.status;
  if (d.verification && !String(f.verification || '').includes(d.verification.slice(0, 30))) f.verification = [f.verification, d.verification].filter(Boolean).join(' ');
}
fs.writeFileSync(FILE, `${JSON.stringify(reg, null, 1)}\n`);
console.log(`${Z.length} Z findings written; ${Object.keys(dispositions).length} earlier findings noted; ${reg.findings.length} findings in all`);
