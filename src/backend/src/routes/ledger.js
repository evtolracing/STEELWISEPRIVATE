/**
 * The financial ledger (Phase 9.5).
 *
 * Who may do what, decided here on the server:
 *   read reports        the finance roles and the auditor, for every branch; a branch manager for
 *                       their own branches only (lines of other branches are not sent)
 *   exceptions, reconciliation, cutover, exports, the chart
 *                       the finance roles and the auditor (read); the finance roles (change)
 *   draft an entry, post, reverse, close or reopen a period, retry or settle an event
 *                       the finance roles. The person who posts a draft is not the person who wrote it.
 *   activate, stop or resume posting
 *                       the owner's login, a super administrator or the CFO
 * Every change is written to the audit log by the service. Report reads are logged here.
 *
 *   GET  /api/ledger/status
 *   GET  /api/ledger/chart                     POST /api/ledger/chart/load-proposed
 *   PUT  /api/ledger/accounts/:code            PUT  /api/ledger/mappings/:key        POST /api/ledger/approvals
 *   GET  /api/ledger/reports/:name             trial-balance, account, revenue, gross-margin, receivables,
 *                                              sales-tax, inventory, scrap, monthly, exceptions
 *   GET  /api/ledger/entries                   GET  /api/ledger/entries/:id
 *   POST /api/ledger/entries                   draft      POST /api/ledger/entries/:id/post | /reverse     DELETE /api/ledger/entries/:id
 *   GET  /api/ledger/periods                   POST /api/ledger/periods/:year/:month/close | /reopen
 *   POST /api/ledger/events/:id/retry | /resolve          POST /api/ledger/events/record-missing
 *   POST /api/ledger/reconciliations           GET  /api/ledger/reconciliations[/:id]
 *   POST /api/ledger/cutover/dry-run           POST /api/ledger/activate | /deactivate | /resume
 *   GET  /api/ledger/external-accounts/:provider          PUT /api/ledger/external-accounts/:provider/:code
 *   GET  /api/ledger/exports                   POST /api/ledger/exports      GET /api/ledger/exports/:id/file     POST /api/ledger/exports/:id/settle
 */
import { Router } from 'express';
import prisma from '../lib/db.js';
import { currentScope } from '../lib/branchScope.js';
import * as ledger from '../services/ledger.js';
import * as reports from '../services/ledgerReports.js';
import * as cutover from '../services/ledgerCutover.js';
import { tablesMissing } from '../lib/ledgerRules.js';

const router = Router();

export const FINANCE_ROLES = ['SUPER_ADMIN', 'TENANT_OWNER', 'ADMIN', 'CFO'];
export const ACTIVATION_ROLES = ['SUPER_ADMIN', 'TENANT_OWNER', 'CFO'];
export const LEDGER_READERS = [...FINANCE_ROLES, 'EXECUTIVE', 'AUDITOR'];
export const BRANCH_READERS = ['BRANCH_MANAGER'];
/** Reports a branch manager may read, for their own branches. */
const BRANCH_REPORTS = new Set(['trial-balance', 'account', 'revenue', 'gross-margin', 'inventory', 'scrap', 'monthly']);

const deny = (res, message) => res.status(403).json({ error: message });
const only = (roles, message) => (req, res, next) => (roles.includes(req.user?.role) ? next() : deny(res, message));
const finance = only(FINANCE_ROLES, 'This needs the CFO or an administrator.');
const activator = only(ACTIVATION_ROLES, 'Starting or stopping the books needs the owner, a super administrator or the CFO.');
const reader = only(LEDGER_READERS, 'The ledger can be read by finance, the executive role and the auditor.');

/** null for a company-wide reader, a list of branch ids for a branch manager, or a refusal. */
function readScope(req, res, report = null) {
  const role = req.user?.role;
  if (LEDGER_READERS.includes(role)) return { branches: null };
  if (BRANCH_READERS.includes(role) && (report === null || BRANCH_REPORTS.has(report))) {
    const scope = currentScope();
    return { branches: scope?.branches ?? [] };
  }
  deny(res, 'The ledger can be read by finance, the executive role and the auditor. A branch manager reads the reports of their own branch.');
  return null;
}

const handle = (label, fn) => async (req, res) => {
  try {
    await fn(req, res);
  } catch (error) {
    if (error instanceof ledger.LedgerError) return res.status(error.status).json({ error: error.message, ...(error.code && { code: error.code }) });
    if (error?.name === 'PrismaClientValidationError' || error?.code === 'P2023') return res.status(400).json({ error: 'The request has a field that is not valid' });
    // The code can be deployed before the owner has applied the database update that adds the ledger tables.
    if (tablesMissing(error)) return res.status(503).json({ error: 'The ledger\'s tables are not in this database yet. Database update 16 (financial ledger) has to be applied first. Nothing else in the system is affected.', code: 'LEDGER_NOT_INSTALLED' });
    console.error(`Ledger: ${label} failed:`, error);
    res.status(500).json({ error: `Failed to ${label}` });
  }
};
const logRead = (req, what, details = {}) => prisma.auditLog.create({ data: { category: 'FINANCIAL', eventType: 'LEDGER_REPORT_READ', severity: 'INFO', action: 'READ', userId: req.user?.id || null, resourceType: 'LedgerReport', resourceId: what, details: { ...details, role: req.user?.role } } }).catch(() => {});

router.get('/status', handle('read the ledger status', async (req, res) => {
  if (!readScope(req, res)) return;
  const act = await ledger.activation();
  const finance = LEDGER_READERS.includes(req.user.role);
  res.json({
    active: act.active, effectiveDate: act.effectiveDate, timeZone: act.timeZone, stopped: Boolean(act.effectiveDate) && !act.active,
    ...(finance && { policiesApprovedBy: act.policiesApprovedBy || null, policiesApprovedOn: act.policiesApprovedOn || null, activatedAt: act.activatedAt || null, blockers: act.active ? [] : await ledger.activationBlockers(), openExceptions: (await reports.exceptions({ limit: 1 })).open }),
    can: { read: true, company: finance, change: FINANCE_ROLES.includes(req.user.role), activate: ACTIVATION_ROLES.includes(req.user.role) },
    message: act.active ? `Posting since ${act.effectiveDate}.` : act.effectiveDate ? 'Posting is stopped. What is posted stays.' : 'Not active. Nothing posts until an accountant has approved the chart of accounts and the accounting policies, and the books are started.',
  });
}));

// ── Chart ────────────────────────────────────────────────────────────────────────────────────
router.get('/chart', reader, handle('read the chart of accounts', async (req, res) => { res.json(await ledger.chart()); }));
router.post('/chart/load-proposed', finance, handle('load the proposed chart', async (req, res) => { res.status(201).json(await ledger.loadProposedChart(prisma, req.user.id)); }));
router.put('/accounts/:code', finance, handle('save the account', async (req, res) => { res.json(await ledger.saveAccount({ ...(req.body || {}), code: req.params.code }, req.user.id)); }));
router.put('/mappings/:key', finance, handle('save the mapping', async (req, res) => { res.json(await ledger.saveMapping({ key: req.params.key, accountCode: req.body?.accountCode }, req.user.id)); }));
router.post('/approvals', finance, handle('record the approval', async (req, res) => { res.json(await ledger.approve(req.body || {}, req.user.id)); }));

// ── Reports ──────────────────────────────────────────────────────────────────────────────────
const REPORTS = {
  'trial-balance': (q, s) => reports.trialBalance({ ...q, ...s }),
  account: (q, s) => reports.accountActivity({ ...q, ...s }),
  revenue: (q, s) => reports.revenue({ ...q, ...s }),
  'gross-margin': (q, s) => reports.grossMargin({ ...q, ...s }),
  receivables: (q, s) => reports.receivables(s),
  'sales-tax': (q, s) => reports.salesTax({ ...q, ...s }),
  inventory: (q, s) => reports.inventoryValuation(s),
  scrap: (q, s) => reports.scrap({ ...q, ...s }),
  monthly: (q, s) => reports.monthlyStatement({ ...q, ...s }),
  exceptions: (q) => reports.exceptions(q),
};
router.get('/reports/:name', handle('read the report', async (req, res) => {
  const run = Object.hasOwn(REPORTS, req.params.name) ? REPORTS[req.params.name] : null;
  if (!run) return res.status(404).json({ error: 'There is no such report' });
  const scope = readScope(req, res, req.params.name);
  if (!scope) return;
  const { from, to, asOf, by, code, year, month, status, limit, offset } = req.query;
  const out = await run({ from, to, asOf, by, code, year, month, status, limit, offset }, scope);
  await logRead(req, req.params.name, { from, to, by, code, year, month, scope: scope.branches == null ? 'all' : 'own branches' });
  res.json(out);
}));

// ── Entries ──────────────────────────────────────────────────────────────────────────────────
router.get('/entries', handle('list the entries', async (req, res) => {
  const scope = readScope(req, res);
  if (!scope) return;
  const { from, to, status, kind, eventKind, sourceId, q, limit, offset } = req.query;
  const list = await reports.listEntries({ from, to, status, kind, eventKind, sourceId, q, limit, offset, ...scope });
  // Who read the journal, and with what filter, is recorded like a report read (W-019).
  await logRead(req, 'journal', { from, to, status, kind, eventKind, sourceId, q: q ? String(q).slice(0, 80) : undefined, scope: scope.branches == null ? 'all' : 'own branches' });
  res.json(list);
}));
router.get('/entries/:id', handle('read the entry', async (req, res) => {
  const scope = readScope(req, res);
  if (!scope) return;
  const entry = await reports.getEntry(req.params.id, scope);
  await logRead(req, 'journal-entry', { entryId: req.params.id, entryNumber: entry?.entryNumber, scope: scope.branches == null ? 'all' : 'own branches' });
  res.json(entry);
}));
router.post('/entries', finance, handle('save the draft entry', async (req, res) => {
  const b = req.body || {};
  // Adjusting a control account by hand is a second, named permission: the owner, a super administrator or the CFO.
  const allowControl = b.adjustControlAccount === true && ACTIVATION_ROLES.includes(req.user.role);
  if (b.adjustControlAccount === true && !allowControl) return deny(res, 'Adjusting a control account by hand needs the owner, a super administrator or the CFO.');
  const entry = await ledger.draftEntry({ entryDate: b.entryDate, memo: b.memo, lines: b.lines, locationId: b.locationId || null, allowControl }, req.user.id);
  res.status(201).json(await reports.getEntry(entry.id));
}));
router.post('/entries/:id/post', finance, handle('post the entry', async (req, res) => { const e = await ledger.postDraft(req.params.id, req.user.id); res.json(await reports.getEntry(e.id)); }));
router.post('/entries/:id/reverse', finance, handle('reverse the entry', async (req, res) => { const e = await ledger.reverseByHand(req.params.id, req.body || {}, req.user.id); res.status(201).json(await reports.getEntry(e.id)); }));
router.delete('/entries/:id', finance, handle('delete the draft', async (req, res) => { await ledger.deleteDraft(req.params.id, req.user.id); res.json({ success: true }); }));
// A posted entry has no edit address at all. These answer so that nobody mistakes a 404 for "try another way".
router.put('/entries/:id', finance, (req, res) => res.status(405).json({ error: 'A journal entry is never edited. Delete the draft and write it again, or reverse the posted entry.' }));
router.patch('/entries/:id', finance, (req, res) => res.status(405).json({ error: 'A journal entry is never edited. Delete the draft and write it again, or reverse the posted entry.' }));

// ── Periods ──────────────────────────────────────────────────────────────────────────────────
router.get('/periods', reader, handle('list the periods', async (req, res) => {
  const periods = await prisma.ledgerPeriod.findMany({ orderBy: [{ year: 'desc' }, { month: 'desc' }], take: 60 });
  const counts = await prisma.journalEntry.groupBy({ by: ['periodId', 'status'], _count: { _all: true } });
  res.json({ periods: periods.map((p) => ({ ...p, startsOn: p.startsOn.toISOString().slice(0, 10), endsOn: p.endsOn.toISOString().slice(0, 10), posted: counts.find((c) => c.periodId === p.id && c.status === 'POSTED')?._count._all || 0, drafts: counts.find((c) => c.periodId === p.id && c.status === 'DRAFT')?._count._all || 0 })) });
}));
const ym = (req) => ({ year: parseInt(req.params.year, 10), month: parseInt(req.params.month, 10) });
const validYm = ({ year, month }) => year >= 2000 && year <= 2200 && month >= 1 && month <= 12;
router.post('/periods/:year/:month/close', finance, handle('close the period', async (req, res) => { const p = ym(req); if (!validYm(p)) return res.status(400).json({ error: 'Give a year and a month' }); res.json(await ledger.closePeriod(p.year, p.month, req.user.id)); }));
router.post('/periods/:year/:month/reopen', finance, handle('reopen the period', async (req, res) => { const p = ym(req); if (!validYm(p)) return res.status(400).json({ error: 'Give a year and a month' }); res.json(await ledger.reopenPeriod(p.year, p.month, req.body?.reason, req.user.id)); }));

// ── Events ───────────────────────────────────────────────────────────────────────────────────
router.post('/events/record-missing', finance, handle('record what is missing', async (req, res) => { res.json(await reports.recordMissing({ limit: req.body?.limit }, req.user.id)); }));
router.post('/events/:id/retry', finance, handle('post the event again', async (req, res) => { res.json(await ledger.retryEvent(req.params.id, { userId: req.user.id, postingDate: req.body?.postingDate || null, offsetAccountCode: req.body?.offsetAccountCode || null })); }));
router.post('/events/:id/resolve', finance, handle('settle the event', async (req, res) => { res.json(await ledger.resolveEvent(req.params.id, req.body || {}, req.user.id)); }));

// ── Reconciliation ───────────────────────────────────────────────────────────────────────────
router.post('/reconciliations', finance, handle('reconcile', async (req, res) => { res.status(201).json(await reports.reconcile(req.user.id)); }));
router.get('/reconciliations', reader, handle('list the reconciliations', async (req, res) => { res.json({ reconciliations: await reports.lastReconciliations(req.query.limit) }); }));
router.get('/reconciliations/:id', reader, handle('read the reconciliation', async (req, res) => { res.json(await reports.getReconciliation(req.params.id)); }));

// ── Cutover and activation ───────────────────────────────────────────────────────────────────
router.post('/cutover/dry-run', finance, handle('run the cutover dry run', async (req, res) => { res.json(await cutover.dryRun(req.user.id)); }));
router.post('/activate', activator, handle('activate the ledger', async (req, res) => { res.json(await cutover.activate(req.body || {}, req.user.id)); }));
router.put('/settings', activator, handle('save the ledger setting', async (req, res) => { res.json(await ledger.saveSettings(req.body || {}, req.user.id)); }));
router.post('/deactivate', activator, handle('stop posting', async (req, res) => { res.json(await ledger.deactivate(req.body?.reason, req.user.id)); }));
router.post('/resume', activator, handle('start posting again', async (req, res) => { res.json(await cutover.resume(req.body?.reason, req.user.id)); }));

// ── Export ───────────────────────────────────────────────────────────────────────────────────
router.get('/external-accounts/:provider', reader, handle('read the external accounts', async (req, res) => { res.json(await reports.externalAccounts(req.params.provider)); }));
router.put('/external-accounts/:provider/:code', finance, handle('save the external account', async (req, res) => { res.json(await reports.setExternalAccount({ provider: req.params.provider, accountCode: req.params.code, externalAccount: req.body?.externalAccount }, req.user.id)); }));
router.get('/exports', reader, handle('list the export batches', async (req, res) => { res.json({ batches: await reports.listExports(), providers: reports.PROVIDERS, connected: [], note: 'No accounting system is connected. A batch is a file for the accountant; nothing is sent anywhere.' }); }));
router.post('/exports', finance, handle('create the export batch', async (req, res) => { res.status(201).json(await reports.createExport(req.body || {}, req.user.id)); }));
router.get('/exports/:id/file', reader, handle('read the export file', async (req, res) => {
  const b = await reports.exportFile(req.params.id, req.user.id);
  if (req.query.download === '1') { res.setHeader('Content-Type', 'text/csv; charset=utf-8'); res.setHeader('Content-Disposition', `attachment; filename="${b.batchNumber}.csv"`); return res.send(b.content); }
  res.json(b);
}));
router.post('/exports/:id/settle', finance, handle('settle the export batch', async (req, res) => { res.json(await reports.settleExport(req.params.id, req.body || {}, req.user.id)); }));

export default router;
