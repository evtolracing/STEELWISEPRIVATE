/**
 * What the assistant may be told about the financial ledger (Phase 9.5).
 *
 * The assistant has no way to change the books: this module only calls the report functions, the same
 * ones the Finance screen reads, with the same limits. The finance roles, the executive role and the
 * auditor get company figures; a branch manager gets the figures of their own branches; everyone else
 * gets none, and the assistant is told to say so. Every read, and every refusal, is in the audit log.
 */
import prisma from '../lib/db.js';
import { currentScope } from '../lib/branchScope.js';
import { activation } from './ledger.js';
import * as reports from './ledgerReports.js';

const COMPANY_READERS = ['SUPER_ADMIN', 'TENANT_OWNER', 'ADMIN', 'CFO', 'EXECUTIVE', 'AUDITOR'];
const BRANCH_READERS = ['BRANCH_MANAGER'];

/** Words that mean the question is about the books. */
export const LEDGER_QUESTION = /\b(ledger|trial balance|journal entr(?:y|ies)|accounts? receivable|receivables?|gross margin|revenue|sales tax|cost of goods|the books)\b/i;

const RULES = [
  'These figures are read from the financial ledger. You can read them; you cannot post, change, approve, reverse or export anything. If asked to, say it is done on the Finance screen by the finance team.',
  'Quote figures exactly as given. Do not estimate, round up, or fill in a figure that is not here.',
  'This ledger is a subledger kept from invoices, payments, stock and work orders. It is not the company\'s full accounts: payroll, rent, supplier bills and bank balances are not in it.',
  'Never call "gross margin on material" profit, net income or a P&L. Labor, machine time, freight cost and overhead are not in it.',
];

const log = (user, outcome, details = {}) => prisma.auditLog.create({
  data: { category: 'FINANCIAL', eventType: 'LEDGER_AI_READ', severity: outcome === 'REFUSED' ? 'WARNING' : 'INFO', action: 'READ', userId: user?.id || null, resourceType: 'LedgerReport', resourceId: 'assistant', details: { outcome, role: user?.role || null, ...details } },
}).catch(() => {});

export async function ledgerForAssistant(user) {
  const role = user?.role;
  const company = COMPANY_READERS.includes(role);
  if (!company && !BRANCH_READERS.includes(role)) {
    await log(user, 'REFUSED');
    return { access: 'none', instruction: 'This person is not allowed to read the financial ledger. Give no ledger figure of any kind. Say that ledger reports are for the finance team, and that a branch manager can read their own branch reports.' };
  }
  const act = await activation();
  if (!act.effectiveDate) {
    await log(user, 'READ', { scope: company ? 'all' : 'own branches', active: false });
    return { access: company ? 'company' : 'own branches', active: false, instruction: 'The books have not been started, so there are no ledger figures. Nothing posts until an accountant approves the chart of accounts and the accounting policies.' };
  }
  const scope = company ? { branches: null } : { branches: currentScope()?.branches ?? [] };
  const [tb, revenue, margin] = await Promise.all([reports.trialBalance(scope), reports.revenue({ by: 'branch', ...scope }), reports.grossMargin({ by: 'branch', ...scope })]);
  const out = {
    access: company ? 'company' : 'own branches', active: act.active, postingSince: act.effectiveDate, rules: RULES,
    accountBalances: tb.accounts.filter((a) => a.debit !== '0.00' || a.credit !== '0.00').map((a) => ({ code: a.code, name: a.name, balance: a.balance, side: a.balanceSide === 'DEBIT' ? 'debit' : 'credit' })),
    netSalesByBranch: revenue.rows.slice(0, 40).map((r) => ({ branch: r.name, net: r.net })), netSales: revenue.total,
    grossMarginOnMaterialByBranch: margin.rows.slice(0, 40).map((r) => ({ branch: r.name, netSales: r.netSales, materialCost: r.materialCost, grossMarginOnMaterial: r.grossMarginOnMaterial })),
  };
  if (company) {
    const [ar, tax, ex, last] = await Promise.all([reports.receivables(), reports.salesTax(), reports.exceptions({ limit: 1 }), reports.lastReconciliations(1)]);
    Object.assign(out, {
      trialBalanceBalances: tb.balanced,
      receivables: { owed: ar.totals.owed, creditOwedBackToCustomers: ar.totals.creditOwedBack, inTheBooks: ar.totals.ledger, differenceFromInvoices: ar.totals.difference },
      salesTaxPayableByState: tax.rows.slice(0, 60), eventsNotPosted: ex.open,
      lastReconciliation: last[0] ? { ranAt: last[0].ranAt, everythingAgreed: last[0].passed, checksThatDidNot: last[0].exceptions } : null,
    });
  } else {
    out.note = 'These are the figures of this person\'s own branches only. A branch view of the trial balance need not balance. Receivables, sales tax and company totals are not available to a branch manager.';
  }
  await log(user, 'READ', { scope: company ? 'all' : 'own branches', active: act.active });
  return out;
}
