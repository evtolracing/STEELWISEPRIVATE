/**
 * Posting rules of the financial ledger (Phase 9.5), kept free of the database so that every rule
 * can be unit tested.
 *
 * A rule takes the facts of one business event and returns the lines of its journal entry. A line
 * names a PURPOSE (`key`: receivables, tax payable, ...), not an account. Which account serves each
 * purpose is the mapping, stored in the database and approved by an accountant. A purpose with no
 * account is never replaced by another: the event fails with that reason.
 *
 * Everything here is PROPOSED until approved (qa/enterprise-excellence/phase-09-5-accounting-policy-decisions.md).
 * Money is exact decimal arithmetic to the cent, rounded half up.
 */
import { Prisma } from '@prisma/client';

const D = Prisma.Decimal;
export const RULE_VERSION = 1;
export const ZERO = new D(0);

export const dec = (v) => (v == null || v === '' ? ZERO : new D(v));
/** To the cent, half up. */
export const cents = (v) => dec(v).toDecimalPlaces(2, D.ROUND_HALF_UP);
/** Quantity times a unit cost, to the cent. */
export const valueOf = (qty, unitCost) => cents(dec(qty).mul(dec(unitCost)));
export const isZero = (v) => cents(v).isZero();

/** The proposed chart. `control`: takes entries from business events only. */
export const PROPOSED_ACCOUNTS = [
  { code: '1000', name: 'Cash / Payment Clearing', type: 'ASSET', control: true, description: 'Payments recorded as received and refunds recorded as paid. Not a bank balance: nothing here is reconciled to a bank.' },
  { code: '1100', name: 'Accounts Receivable', type: 'ASSET', control: true, description: 'Invoices less payments and credits. A customer with credit not yet applied or refunded shows a credit balance here.' },
  { code: '1200', name: 'Raw Material Inventory', type: 'ASSET', control: true, description: 'Stock as received, at each item\'s own cost.' },
  { code: '1210', name: 'Finished Goods Inventory', type: 'ASSET', control: true, description: 'Pieces made by a work order, at the cost of the item they were cut from.' },
  { code: '1220', name: 'Work in Progress', type: 'ASSET', control: true, description: 'Used only if the accountant asks for work order material to pass through it. Carries no balance.' },
  { code: '1300', name: 'Inventory in Transit', type: 'ASSET', control: true, description: 'Stock shipped to another branch and not yet received.' },
  { code: '2000', name: 'Accounts Payable Clearing', type: 'LIABILITY', control: true, description: 'Goods received against a purchase order and not yet matched to a supplier invoice. Supplier invoices are not in this product.' },
  { code: '2100', name: 'Sales Tax Payable', type: 'LIABILITY', control: true, description: 'Tax on invoices less tax on credit memos, by ship-to state.' },
  { code: '2200', name: 'Customer Deposits / Deferred Revenue', type: 'LIABILITY', control: false, description: 'No rule posts here: the product has no deposit record.' },
  { code: '2250', name: 'Customer Credits Owed', type: 'LIABILITY', control: false, description: 'No rule posts here unless the accountant chooses to carry unapplied customer credit as a liability.' },
  { code: '3000', name: 'Opening Balance Equity / Clearing', type: 'EQUITY', control: false, description: 'The other side of the opening balances at cutover.' },
  { code: '4000', name: 'Product Sales Revenue', type: 'REVENUE', control: true, description: 'Invoice lines.' },
  { code: '4100', name: 'Processing Revenue', type: 'REVENUE', control: true, description: 'No rule posts here until order lines mark processing separately from material.' },
  { code: '4200', name: 'Freight Revenue', type: 'REVENUE', control: true, description: 'Freight billed to customers.' },
  { code: '4300', name: 'Sales Returns and Allowances', type: 'CONTRA_REVENUE', control: true, description: 'Credit memos.' },
  { code: '5000', name: 'Material Cost of Goods Sold', type: 'EXPENSE', control: true, description: 'The cost of material shipped, less the cost of material returned to stock.' },
  { code: '5100', name: 'Processing Cost of Goods Sold', type: 'EXPENSE', control: false, description: 'No rule posts here: labor and machine cost are not posted (policy decision 8).' },
  { code: '5200', name: 'Freight Expense', type: 'EXPENSE', control: false, description: 'No rule posts here: no carrier cost is recorded in the product.' },
  { code: '5300', name: 'Scrap and Inventory Write-offs', type: 'EXPENSE', control: true, description: 'Scrap on work orders, scrapped returns, damage, transfer shortages written off.' },
  { code: '5310', name: 'Inventory Count Variance', type: 'EXPENSE', control: true, description: 'Count corrections up and down. Proposed in Phase 9.5; not in the starting list.' },
  { code: '5320', name: 'Inventory Cost Adjustments', type: 'EXPENSE', control: true, description: 'A change to the cost of stock already on hand. Proposed in Phase 9.5.' },
  { code: '5390', name: 'Rounding', type: 'EXPENSE', control: true, description: 'Cent differences when an item is relieved in parts. Proposed in Phase 9.5.' },
  // ── The full chart (Phase 12 follow-up, sandbox). The accounts above are posted by business events. The accounts
  // below are the rest of a general ledger for a metals service center: no rule posts to them; a finance person
  // posts to them by journal entry. A standard template, PROPOSED like the rest: an accountant has not reviewed it.
  { code: '1010', name: 'Operating Bank Account', type: 'ASSET', control: false, description: 'The main bank account. Deposits are moved here from Cash / Payment Clearing by journal entry.' },
  { code: '1020', name: 'Payroll Bank Account', type: 'ASSET', control: false, description: 'The bank account payroll is paid from.' },
  { code: '1030', name: 'Petty Cash', type: 'ASSET', control: false, description: 'Cash kept on site.' },
  { code: '1110', name: 'Allowance for Doubtful Accounts', type: 'ASSET', side: 'CREDIT', control: false, description: 'Contra asset: the part of receivables not expected to be collected.' },
  { code: '1150', name: 'Other Receivables', type: 'ASSET', control: false, description: 'Amounts owed that are not customer invoices: supplier rebates, claims, employee advances.' },
  { code: '1230', name: 'Inventory Reserve', type: 'ASSET', side: 'CREDIT', control: false, description: 'Contra asset: allowance for slow-moving, obsolete or damaged stock.' },
  { code: '1240', name: 'Supplies and Consumables Inventory', type: 'ASSET', control: false, description: 'Blades, gas, packaging and other supplies kept as stock.' },
  { code: '1400', name: 'Prepaid Expenses', type: 'ASSET', control: false, description: 'Paid in advance and expensed over time.' },
  { code: '1410', name: 'Prepaid Insurance', type: 'ASSET', control: false, description: 'Insurance premiums paid in advance.' },
  { code: '1420', name: 'Deposits Paid', type: 'ASSET', control: false, description: 'Security and utility deposits paid to others.' },
  { code: '1500', name: 'Land', type: 'ASSET', control: false, description: 'Land, at cost. Not depreciated.' },
  { code: '1510', name: 'Buildings and Leasehold Improvements', type: 'ASSET', control: false, description: 'Buildings owned and improvements to leased buildings, at cost.' },
  { code: '1520', name: 'Machinery and Equipment', type: 'ASSET', control: false, description: 'Saws, shears, slitters, cranes, forklifts and other equipment, at cost.' },
  { code: '1530', name: 'Vehicles', type: 'ASSET', control: false, description: 'Trucks and other vehicles, at cost.' },
  { code: '1540', name: 'Furniture, Fixtures and Computer Equipment', type: 'ASSET', control: false, description: 'Office and computer equipment, at cost.' },
  { code: '1590', name: 'Accumulated Depreciation', type: 'ASSET', side: 'CREDIT', control: false, description: 'Contra asset: depreciation taken to date on property and equipment.' },
  { code: '1600', name: 'Intangible Assets and Software', type: 'ASSET', control: false, description: 'Purchased software, licenses and other intangibles, at cost.' },
  { code: '1690', name: 'Accumulated Amortization', type: 'ASSET', side: 'CREDIT', control: false, description: 'Contra asset: amortization taken to date on intangibles.' },
  { code: '1700', name: 'Right-of-Use Assets', type: 'ASSET', control: false, description: 'Leased assets carried on the balance sheet.' },
  { code: '1800', name: 'Other Long-Term Assets', type: 'ASSET', control: false, description: 'Long-term assets with no account of their own.' },
  { code: '2010', name: 'Accounts Payable', type: 'LIABILITY', control: false, description: 'Supplier invoices entered and not yet paid. A supplier invoice for goods clears Accounts Payable Clearing (2000) to here by journal entry.' },
  { code: '2110', name: 'Use Tax Payable', type: 'LIABILITY', control: false, description: 'Use tax owed on purchases where the seller charged none.' },
  { code: '2300', name: 'Accrued Expenses', type: 'LIABILITY', control: false, description: 'Costs incurred and not yet invoiced.' },
  { code: '2310', name: 'Accrued Payroll and Wages', type: 'LIABILITY', control: false, description: 'Wages earned and not yet paid.' },
  { code: '2320', name: 'Payroll Taxes and Withholdings Payable', type: 'LIABILITY', control: false, description: 'Tax withheld from pay and the employer\'s payroll taxes, not yet remitted.' },
  { code: '2330', name: 'Accrued Benefits', type: 'LIABILITY', control: false, description: 'Vacation, health and retirement contributions owed.' },
  { code: '2340', name: 'Accrued Interest', type: 'LIABILITY', control: false, description: 'Interest owed and not yet paid.' },
  { code: '2400', name: 'Income Taxes Payable', type: 'LIABILITY', control: false, description: 'Income tax owed for the period.' },
  { code: '2500', name: 'Line of Credit', type: 'LIABILITY', control: false, description: 'The balance drawn on the revolving credit line.' },
  { code: '2510', name: 'Current Portion of Long-Term Debt', type: 'LIABILITY', control: false, description: 'Loan principal due within twelve months.' },
  { code: '2520', name: 'Current Lease Liabilities', type: 'LIABILITY', control: false, description: 'Lease payments due within twelve months.' },
  { code: '2600', name: 'Long-Term Debt', type: 'LIABILITY', control: false, description: 'Loan principal due after twelve months.' },
  { code: '2610', name: 'Long-Term Lease Liabilities', type: 'LIABILITY', control: false, description: 'Lease payments due after twelve months.' },
  { code: '2700', name: 'Deferred Income Taxes', type: 'LIABILITY', control: false, description: 'Income tax that falls due in later periods.' },
  { code: '2800', name: 'Other Long-Term Liabilities', type: 'LIABILITY', control: false, description: 'Long-term obligations with no account of their own.' },
  { code: '3100', name: 'Common Stock / Owner\'s Capital', type: 'EQUITY', control: false, description: 'What the owners paid in.' },
  { code: '3200', name: 'Additional Paid-In Capital', type: 'EQUITY', control: false, description: 'Paid in above the par value of stock.' },
  { code: '3300', name: 'Owner Distributions / Dividends', type: 'EQUITY', side: 'DEBIT', control: false, description: 'Contra equity: paid out to the owners.' },
  { code: '3900', name: 'Retained Earnings', type: 'EQUITY', control: false, description: 'Earnings of earlier years kept in the business, when the accountant closes a year here by journal entry. The balance sheet works out earnings not yet closed by itself.' },
  { code: '4310', name: 'Sales Discounts', type: 'CONTRA_REVENUE', control: false, description: 'Early-payment and other discounts allowed to customers.' },
  { code: '4400', name: 'Scrap Sales Revenue', type: 'REVENUE', control: false, description: 'Scrap metal sold to a recycler.' },
  { code: '4900', name: 'Other Operating Revenue', type: 'REVENUE', control: false, description: 'Operating revenue with no account of its own.' },
  { code: '5110', name: 'Direct Labor', type: 'EXPENSE', control: false, description: 'Wages of the people who cut and process material, when the accountant carries them in cost of goods sold.' },
  { code: '5120', name: 'Manufacturing Overhead', type: 'EXPENSE', control: false, description: 'Shop costs carried in cost of goods sold.' },
  { code: '5210', name: 'Freight In', type: 'EXPENSE', control: false, description: 'Freight paid to bring material in, when it is not put into the cost of the stock.' },
  { code: '5400', name: 'Outside Processing', type: 'EXPENSE', control: false, description: 'Work on customer orders done by another shop.' },
  { code: '5500', name: 'Purchase Price Variance', type: 'EXPENSE', control: false, description: 'The difference between the cost booked at receipt and the supplier\'s invoice.' },
  { code: '6000', name: 'Salaries and Wages', type: 'EXPENSE', control: false, description: 'Pay of office, sales and management staff.' },
  { code: '6010', name: 'Payroll Taxes', type: 'EXPENSE', control: false, description: 'The employer\'s payroll taxes.' },
  { code: '6020', name: 'Employee Benefits', type: 'EXPENSE', control: false, description: 'Health, retirement and other benefits.' },
  { code: '6030', name: 'Workers\' Compensation Insurance', type: 'EXPENSE', control: false, description: 'Workers\' compensation premiums.' },
  { code: '6100', name: 'Rent and Lease Expense', type: 'EXPENSE', control: false, description: 'Rent of buildings and yards.' },
  { code: '6110', name: 'Utilities', type: 'EXPENSE', control: false, description: 'Electricity, gas, water and waste.' },
  { code: '6120', name: 'Repairs and Maintenance', type: 'EXPENSE', control: false, description: 'Repair and upkeep of buildings and equipment.' },
  { code: '6130', name: 'Shop Supplies and Consumables', type: 'EXPENSE', control: false, description: 'Blades, gas, abrasives and packaging used.' },
  { code: '6140', name: 'Equipment Rental', type: 'EXPENSE', control: false, description: 'Short-term rental of equipment.' },
  { code: '6200', name: 'Vehicle and Fuel Expense', type: 'EXPENSE', control: false, description: 'Fuel, tires, repairs and registration of vehicles.' },
  { code: '6210', name: 'Delivery and Freight Out', type: 'EXPENSE', control: false, description: 'Carrier cost of deliveries to customers.' },
  { code: '6300', name: 'Insurance', type: 'EXPENSE', control: false, description: 'Property, liability and vehicle insurance.' },
  { code: '6310', name: 'Property Taxes', type: 'EXPENSE', control: false, description: 'Taxes on property and equipment.' },
  { code: '6400', name: 'Professional Fees', type: 'EXPENSE', control: false, description: 'Accounting, legal and consulting fees.' },
  { code: '6410', name: 'Software and IT', type: 'EXPENSE', control: false, description: 'Software subscriptions, hosting and IT services.' },
  { code: '6420', name: 'Telephone and Internet', type: 'EXPENSE', control: false, description: 'Phone and internet service.' },
  { code: '6430', name: 'Office Supplies', type: 'EXPENSE', control: false, description: 'Office supplies and postage.' },
  { code: '6500', name: 'Advertising and Marketing', type: 'EXPENSE', control: false, description: 'Advertising, shows and promotion.' },
  { code: '6510', name: 'Travel, Meals and Entertainment', type: 'EXPENSE', control: false, description: 'Business travel and meals.' },
  { code: '6520', name: 'Sales Commissions', type: 'EXPENSE', control: false, description: 'Commissions paid on sales.' },
  { code: '6600', name: 'Bank and Merchant Fees', type: 'EXPENSE', control: false, description: 'Bank charges and card processing fees.' },
  { code: '6610', name: 'Bad Debt Expense', type: 'EXPENSE', control: false, description: 'Receivables written off or provided for.' },
  { code: '6700', name: 'Depreciation Expense', type: 'EXPENSE', control: false, description: 'Depreciation of property and equipment for the period.' },
  { code: '6710', name: 'Amortization Expense', type: 'EXPENSE', control: false, description: 'Amortization of intangibles for the period.' },
  { code: '6800', name: 'Licenses, Permits and Dues', type: 'EXPENSE', control: false, description: 'Business licenses, permits and memberships.' },
  { code: '6810', name: 'Safety and Training', type: 'EXPENSE', control: false, description: 'Safety equipment and staff training.' },
  { code: '6900', name: 'Miscellaneous Expense', type: 'EXPENSE', control: false, description: 'Small costs with no account of their own.' },
  { code: '7000', name: 'Interest Income', type: 'REVENUE', control: false, description: 'Interest earned.' },
  { code: '7010', name: 'Gain on Sale of Assets', type: 'REVENUE', control: false, description: 'Gain when equipment is sold for more than its book value.' },
  { code: '7090', name: 'Other Income', type: 'REVENUE', control: false, description: 'Income outside normal operations.' },
  { code: '7100', name: 'Interest Expense', type: 'EXPENSE', control: false, description: 'Interest on loans, the credit line and leases.' },
  { code: '7110', name: 'Loss on Sale of Assets', type: 'EXPENSE', control: false, description: 'Loss when equipment is sold for less than its book value.' },
  { code: '7190', name: 'Other Expense', type: 'EXPENSE', control: false, description: 'Costs outside normal operations.' },
  { code: '8000', name: 'Income Tax Expense', type: 'EXPENSE', control: false, description: 'Income tax for the period.' },
];
export const normalSideOf = (type) => (['ASSET', 'EXPENSE', 'CONTRA_REVENUE'].includes(type) ? 'DEBIT' : 'CREDIT');
/** The side a proposed account carries its balance on: its own `side` when it is a contra account, else by type. */
export const proposedSideOf = (a) => a.side || normalSideOf(a.type);

/**
 * Where an account stands on the financial statements. The section comes from the code range of the proposed
 * chart; an account outside those ranges falls back on its type, so an account added by hand is never left out.
 *   statement  'BS' balance sheet or 'IS' income statement
 *   section    the heading it is listed under
 *   order      the order of the headings
 */
export const SECTIONS = {
  CURRENT_ASSETS: ['BS', 'Current assets', 10], FIXED_ASSETS: ['BS', 'Property and equipment', 20], OTHER_ASSETS: ['BS', 'Other assets', 30],
  CURRENT_LIABILITIES: ['BS', 'Current liabilities', 40], LONG_TERM_LIABILITIES: ['BS', 'Long-term liabilities', 50], EQUITY: ['BS', 'Equity', 60],
  REVENUE: ['IS', 'Revenue', 10], COST_OF_SALES: ['IS', 'Cost of goods sold', 20], OPERATING_EXPENSES: ['IS', 'Operating expenses', 30],
  OTHER_INCOME: ['IS', 'Other income', 40], OTHER_EXPENSE: ['IS', 'Other expense', 50], INCOME_TAX: ['IS', 'Income tax', 60],
};
export function sectionOf({ code, type }) {
  const n = /^[0-9]{4}$/.test(String(code)) ? Number(code) : null;
  if (type === 'ASSET') return n !== null && n >= 1500 && n < 1600 ? 'FIXED_ASSETS' : n !== null && n >= 1600 && n < 2000 ? 'OTHER_ASSETS' : 'CURRENT_ASSETS';
  if (type === 'LIABILITY') return n !== null && n >= 2600 && n < 3000 ? 'LONG_TERM_LIABILITIES' : 'CURRENT_LIABILITIES';
  if (type === 'EQUITY') return 'EQUITY';
  if (type === 'REVENUE') return n !== null && n >= 7000 && n < 8000 ? 'OTHER_INCOME' : 'REVENUE';
  if (type === 'CONTRA_REVENUE') return 'REVENUE';
  if (n !== null && n >= 5000 && n < 6000) return 'COST_OF_SALES';
  if (n !== null && n >= 7000 && n < 8000) return 'OTHER_EXPENSE';
  if (n !== null && n >= 8000 && n < 9000) return 'INCOME_TAX';
  return 'OPERATING_EXPENSES';
}
/** The name books carry when they were started as a demonstration, with no accountant. It is shown on every finance screen. */
export const SANDBOX_APPROVER = 'SANDBOX: demonstration books, not approved by an accountant';
export const ACCOUNT_TYPES = ['ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'CONTRA_REVENUE', 'EXPENSE'];

/** Each purpose a rule can post to, and the account proposed for it. */
export const PROPOSED_MAPPING = {
  CASH_CLEARING: ['1000', 'Payments received and refunds paid'],
  RECEIVABLES: ['1100', 'What customers owe'],
  INVENTORY_RAW: ['1200', 'Stock as received'],
  INVENTORY_FINISHED: ['1210', 'Pieces made by a work order'],
  WORK_IN_PROGRESS: ['1220', 'Work order material in passing, when that setting is on'],
  INVENTORY_IN_TRANSIT: ['1300', 'Stock between two branches'],
  PAYABLES_CLEARING: ['2000', 'Goods received, not invoiced by the supplier'],
  SALES_TAX_PAYABLE: ['2100', 'Sales tax billed'],
  OPENING_EQUITY: ['3000', 'Opening balances'],
  REVENUE_PRODUCT: ['4000', 'Invoice lines'],
  REVENUE_FREIGHT: ['4200', 'Freight billed'],
  SALES_RETURNS: ['4300', 'Credit memos'],
  COGS_MATERIAL: ['5000', 'Cost of material shipped'],
  SCRAP_WRITEOFF: ['5300', 'Scrap, damage and write-offs'],
  COUNT_VARIANCE: ['5310', 'Count corrections'],
  COST_ADJUSTMENT: ['5320', 'Cost changed on stock on hand'],
  ROUNDING: ['5390', 'Cent differences'],
};

/** A fact is missing or wrong: the event is not posted and says why. */
export class LedgerRuleError extends Error {
  constructor(message, { hold = false } = {}) { super(message); this.hold = hold; }
}
const fail = (message) => { throw new LedgerRuleError(message); };
/** The event is real but has no approved rule, or needs a person: RECONCILIATION_REQUIRED. */
const hold = (message) => { throw new LedgerRuleError(message, { hold: true }); };
/** Nothing to post, and that is correct. */
export const nothing = (reason) => ({ nothing: reason });

const dr = (key, amount, dims = {}) => ({ key, side: 'D', amount: cents(amount), ...dims });
const cr = (key, amount, dims = {}) => ({ key, side: 'C', amount: cents(amount), ...dims });
const keep = (lines) => lines.filter((l) => !l.amount.isZero());

/** Totals of a set of lines. `ok` only when both sides are equal and more than zero. */
export function totals(lines) {
  let debit = ZERO; let credit = ZERO;
  for (const l of lines) {
    if (l.amount.isNegative()) return { debit, credit, ok: false, why: 'a line has a negative amount' };
    if (l.side === 'D') debit = debit.plus(l.amount); else if (l.side === 'C') credit = credit.plus(l.amount); else return { debit, credit, ok: false, why: 'a line has no side' };
  }
  const ok = debit.equals(credit) && debit.greaterThan(0) && lines.length >= 2;
  return { debit, credit, ok, why: ok ? null : lines.length < 2 ? 'fewer than two lines' : debit.isZero() && credit.isZero() ? 'nothing to post' : `debits ${debit.toFixed(2)} do not equal credits ${credit.toFixed(2)}` };
}

/** A number as typed, or not-a-number: text that is not a number never throws from here. */
const parse = (v) => { try { return new D(typeof v === 'number' || v instanceof D ? v : String(v).trim()); } catch { return new D(NaN); } };

/** A cost that can be used: a number of zero or more. null and empty are "no cost on file". */
export function usableCost(unitCost) {
  if (unitCost == null || unitCost === '') return null;
  const c = parse(unitCost);
  return c.isNaN() || !c.isFinite() || c.isNegative() ? null : c;
}
const needCost = (unitCost, what) => usableCost(unitCost) ?? hold(`No cost is on file for ${what}. It is not valued at zero: enter the cost and post it again.`);

// ── Sales ────────────────────────────────────────────────────────────────────────────────────

/**
 * An invoice is issued (policy 1, 5, 10, 11).
 * invoice: { number, subtotal, tax, freight, total, lines: [{ amount, productId, division }] }
 */
export function invoiceIssued({ invoice, customerId, locationId, state }) {
  const total = cents(invoice.total);
  if (total.isNegative()) fail(`Invoice ${invoice.number} has a negative total`);
  if (total.isZero()) return nothing('The invoice total is zero');
  const lineSum = invoice.lines.reduce((s, l) => s.plus(cents(l.amount)), ZERO);
  if (!lineSum.equals(cents(invoice.subtotal))) fail(`Invoice ${invoice.number}: its lines add up to ${lineSum.toFixed(2)} and its subtotal is ${cents(invoice.subtotal).toFixed(2)}`);
  const at = { locationId, customerId };
  return {
    memo: `Invoice ${invoice.number}`,
    lines: keep([
      dr('RECEIVABLES', total, at),
      ...invoice.lines.map((l) => cr('REVENUE_PRODUCT', l.amount, { ...at, productId: l.productId || null, division: l.division || null })),
      cr('REVENUE_FREIGHT', invoice.freight, at),
      cr('SALES_TAX_PAYABLE', invoice.tax, { ...at, jurisdiction: state || null }),
    ]),
  };
}

/** A credit memo is issued (policy 12). Amounts are given as positive figures. */
export function creditIssued({ credit, customerId, locationId, state }) {
  const total = cents(credit.total);
  if (total.isNegative()) fail(`Credit memo ${credit.number} has the wrong sign`);
  if (total.isZero()) return nothing('The credit memo total is zero');
  const lineSum = credit.lines.reduce((s, l) => s.plus(cents(l.amount)), ZERO);
  if (!lineSum.equals(cents(credit.subtotal))) fail(`Credit memo ${credit.number}: its lines add up to ${lineSum.toFixed(2)} and its subtotal is ${cents(credit.subtotal).toFixed(2)}`);
  const at = { locationId, customerId };
  return {
    memo: `Credit memo ${credit.number}${credit.ofInvoice ? ` against ${credit.ofInvoice}` : ''}`,
    lines: keep([
      ...credit.lines.map((l) => dr('SALES_RETURNS', l.amount, { ...at, productId: l.productId || null, division: l.division || null })),
      dr('REVENUE_FREIGHT', credit.freight, at),
      dr('SALES_TAX_PAYABLE', credit.tax, { ...at, jurisdiction: state || null }),
      cr('RECEIVABLES', total, at),
    ]),
  };
}

/** Money received against an invoice. A credit memo applied to an invoice is not a payment and posts nothing. */
export function paymentReceived({ amount, method, invoiceNumber, customerId, locationId }) {
  if (String(method || '').toUpperCase() === 'CREDIT') return nothing('A credit applied to an invoice is in the credit memo\'s own entry');
  const a = cents(amount);
  if (!a.greaterThan(0)) fail('A payment must be more than zero');
  const at = { locationId, customerId };
  return { memo: `Payment on ${invoiceNumber}${method ? ` (${method})` : ''}`, lines: [dr('CASH_CLEARING', a, at), cr('RECEIVABLES', a, at)] };
}

/** Money handed back on a credit memo. */
export function refundPaid({ amount, method, creditNumber, customerId, locationId }) {
  const a = cents(amount);
  if (!a.greaterThan(0)) fail('A refund must be more than zero');
  const at = { locationId, customerId };
  return { memo: `Refund on ${creditNumber}${method ? ` (${method})` : ''}`, lines: [dr('RECEIVABLES', a, at), cr('CASH_CLEARING', a, at)] };
}

// ── Stock ────────────────────────────────────────────────────────────────────────────────────

/** The inventory purpose an item belongs to: a piece made by a work order is finished goods. */
export const inventoryKey = (item) => (item?.isWorkOrderOutput ? 'INVENTORY_FINISHED' : 'INVENTORY_RAW');
const itemDims = (item, locationId) => ({ locationId, coilId: item.coilId || null, productId: item.productId || null, division: item.division || null });

/**
 * What a movement takes off an item, in money. When the movement empties the item, what is left of
 * the item in the books is taken with it (cents only), so that an item relieved in parts ends at zero.
 * booked: what the ledger holds for the item now, or null when unknown.
 */
export function reliefValue({ qty, unitCost, onHandAfter, booked }) {
  const v = valueOf(qty, unitCost);
  if (booked == null || onHandAfter == null) return { value: v, rounding: ZERO };
  if (!dec(onHandAfter).abs().lessThanOrEqualTo('0.0001')) return { value: v, rounding: ZERO };
  const diff = cents(booked).minus(v);
  // More than a few cents is not rounding: it is left for the reconciliation to show.
  return diff.abs().lessThanOrEqualTo('0.05') ? { value: v, rounding: diff } : { value: v, rounding: ZERO };
}
const withRounding = (lines, rounding, key, dims) => {
  // rounding > 0: the books hold a little more than was relieved; take it off inventory into Rounding.
  if (rounding.isZero()) return lines;
  return rounding.isPositive() ? [...lines, dr('ROUNDING', rounding, dims), cr(key, rounding, dims)] : [...lines, dr(key, rounding.abs(), dims), cr('ROUNDING', rounding.abs(), dims)];
};

/** Stock received against a purchase order (policy 6). */
export function stockReceived({ item, qty, unitCost, locationId, supplierId, purchaseOrder, offsetCode = null }) {
  // With no purchase order there is no approved rule for the other side. An accountant may post it
  // again naming the account (offsetCode); the rule itself never picks one.
  if (!purchaseOrder && !offsetCode) hold(`Item ${item.number} was received with no purchase order. There is no approved rule for what it is owed to. An accountant can post it again, naming the account for the other side.`);
  const cost = needCost(unitCost, `item ${item.number}`);
  const v = valueOf(qty, cost);
  if (v.isZero()) return nothing('The value received is zero');
  const dims = itemDims(item, locationId);
  if (!purchaseOrder) return { memo: `Receipt of ${item.number} with no purchase order, against account ${offsetCode} by an accountant's choice`, lines: [dr(inventoryKey(item), v, dims), { code: String(offsetCode), side: 'C', amount: v, ...dims }] };
  return { memo: `Receipt of ${item.number} against ${purchaseOrder}`, lines: [dr(inventoryKey(item), v, dims), cr('PAYABLES_CLEARING', v, { ...dims, supplierId: supplierId || null })] };
}

/** Material leaves on a shipment or a counter sale (policy 2). */
export function stockShipped({ item, qty, unitCost, locationId, customerId, reference, onHandAfter = null, booked = null }) {
  const cost = needCost(unitCost, `item ${item.number}`);
  const { value, rounding } = reliefValue({ qty, unitCost: cost, onHandAfter, booked });
  if (value.isZero() && rounding.isZero()) return nothing('The value shipped is zero');
  const dims = itemDims(item, locationId); const key = inventoryKey(item);
  return { memo: `Cost of ${item.number} shipped${reference ? ` on ${reference}` : ''}`, lines: withRounding(keep([dr('COGS_MATERIAL', value, { ...dims, customerId: customerId || null }), cr(key, value, dims)]), rounding, key, dims) };
}

/** Material comes back from a customer into stock (policy 12). */
export function returnRestocked({ item, qty, unitCost, locationId, customerId, reference }) {
  const cost = needCost(unitCost, `item ${item.number}`);
  const v = valueOf(qty, cost);
  if (v.isZero()) return nothing('The value returned is zero');
  const dims = itemDims(item, locationId);
  return { memo: `Return of ${item.number}${reference ? ` on ${reference}` : ''}`, lines: [dr(inventoryKey(item), v, dims), cr('COGS_MATERIAL', v, { ...dims, customerId: customerId || null })] };
}

/** Scrap that is not part of a work order: a scrapped return, a scrap adjustment (policy 9). */
export function stockScrapped({ item, qty, unitCost, locationId, reference, onHandAfter = null, booked = null }) {
  const cost = needCost(unitCost, `item ${item.number}`);
  const { value, rounding } = reliefValue({ qty, unitCost: cost, onHandAfter, booked });
  if (value.isZero() && rounding.isZero()) return nothing('The value scrapped is zero');
  const dims = itemDims(item, locationId); const key = inventoryKey(item);
  return { memo: `Scrap of ${item.number}${reference ? ` (${reference})` : ''}`, lines: withRounding(keep([dr('SCRAP_WRITEOFF', value, dims), cr(key, value, dims)]), rounding, key, dims) };
}

/** Which purpose takes the other side of a stock correction, by its reason. */
export function adjustmentKey(reason) {
  const r = String(reason || '').toUpperCase();
  if (r.startsWith('DAMAGE') || r.startsWith('SCRAP') || r.startsWith('TRANSFER_SHORT')) return 'SCRAP_WRITEOFF';
  if (r.startsWith('COUNT') || r.startsWith('FOUND') || r.startsWith('CORRECTION')) return 'COUNT_VARIANCE';
  return null;
}
/** A balance corrected up or down. */
export function stockAdjusted({ item, qty, unitCost, up, reason, locationId, onHandAfter = null, booked = null }) {
  const other = adjustmentKey(reason) ?? hold(`Item ${item.number} was corrected with the reason "${reason || 'none'}", which has no approved rule.`);
  const cost = needCost(unitCost, `item ${item.number}`);
  const dims = itemDims(item, locationId); const key = inventoryKey(item);
  if (up) {
    const v = valueOf(qty, cost);
    if (v.isZero()) return nothing('The value corrected is zero');
    return { memo: `Stock correction up on ${item.number} (${reason})`, lines: [dr(key, v, dims), cr(other, v, dims)] };
  }
  const { value, rounding } = reliefValue({ qty, unitCost: cost, onHandAfter, booked });
  if (value.isZero() && rounding.isZero()) return nothing('The value corrected is zero');
  return { memo: `Stock correction down on ${item.number} (${reason})`, lines: withRounding(keep([dr(other, value, dims), cr(key, value, dims)]), rounding, key, dims) };
}

/** A piece recorded against the item it was cut from, outside a work order. Value moves from one item to the other. */
export function pieceCut({ parent, child, qty, unitCost, locationId }) {
  const cost = needCost(unitCost, `item ${parent.number}`);
  const v = valueOf(qty, cost);
  if (v.isZero()) return nothing('The value moved is zero');
  return { memo: `Piece ${child.number} cut from ${parent.number}`, lines: [dr(inventoryKey(child), v, itemDims(child, locationId)), cr(inventoryKey(parent), v, itemDims(parent, locationId))] };
}

/**
 * A coil work order is completed (policy 7, 9). The source item gives up the weight of the pieces
 * and the scrap; each piece comes on at the same cost per unit; scrap is expensed.
 * throughWip: pass the material through Work in Progress in the same entry.
 */
export function workOrderCompleted({ number, source, pieces, scrapQty, unitCost, locationId, throughWip = false, onHandAfter = null, booked = null }) {
  const cost = needCost(unitCost, `item ${source.number}, used on ${number}`);
  const srcKey = inventoryKey(source); const srcDims = itemDims(source, locationId);
  // A piece costs per unit what its source cost (owner decision 9). Posted later, a piece whose own cost is missing or different is not guessed at.
  for (const p of pieces) {
    if (p.unitCost === undefined) continue;
    const own = usableCost(p.unitCost);
    if (own == null) hold(`Piece ${p.number} made on ${number} has no cost on file. Enter its cost (the same per unit as ${source.number}) and post this again.`);
    if (!own.equals(cost)) hold(`Piece ${p.number} made on ${number} carries a cost of ${own} and the item it was cut from ${cost}. A person has to decide which is right.`);
  }
  const made = pieces.map((p) => ({ p, v: valueOf(p.qty, cost) }));
  const scrap = valueOf(scrapQty, cost);
  const outValue = made.reduce((s, m) => s.plus(m.v), ZERO);
  // Pieces and scrap are each rounded to the cent; the source is relieved for exactly their sum, so the entry balances by construction.
  const taken = outValue.plus(scrap);
  if (taken.isZero()) return nothing('The value used is zero');
  const lines = [];
  if (throughWip) lines.push(dr('WORK_IN_PROGRESS', taken, srcDims), cr(srcKey, taken, srcDims));
  for (const m of made) lines.push(dr(inventoryKey({ isWorkOrderOutput: true }), m.v, itemDims(m.p, locationId)));
  lines.push(dr('SCRAP_WRITEOFF', scrap, srcDims));
  lines.push(cr(throughWip ? 'WORK_IN_PROGRESS' : srcKey, taken, srcDims));
  // When the source is used up, the cents that rounding piece by piece left on it go to Rounding.
  let rounding = ZERO;
  if (booked != null && onHandAfter != null && dec(onHandAfter).abs().lessThanOrEqualTo('0.0001')) { const left = cents(booked).minus(taken); if (left.abs().lessThanOrEqualTo('0.05')) rounding = left; }
  return { memo: `Work order ${number}: ${source.number} made into ${pieces.length} piece${pieces.length === 1 ? '' : 's'}`, lines: withRounding(keep(lines), rounding, srcKey, srcDims) };
}

/** Stock leaves one branch for another of the same owner (policy 13, 14). */
export function transferShipped({ item, qty, unitCost, fromLocationId, sameOwner, number }) {
  if (!sameOwner) hold(`Transfer ${number} is between branches of different owning organisations. There is no approved intercompany rule.`);
  const cost = needCost(unitCost, `item ${item.number}`);
  const v = valueOf(qty, cost);
  if (v.isZero()) return nothing('The value transferred is zero');
  const dims = itemDims(item, fromLocationId);
  return { memo: `Transfer ${number}: ${item.number} shipped`, lines: [dr('INVENTORY_IN_TRANSIT', v, dims), cr(inventoryKey(item), v, dims)] };
}
/** The receiving branch takes it in. In transit stays with the sending branch until then. */
export function transferReceived({ item, qty, unitCost, fromLocationId, toLocationId, sameOwner, number }) {
  if (!sameOwner) hold(`Transfer ${number} is between branches of different owning organisations. There is no approved intercompany rule.`);
  const cost = needCost(unitCost, `item ${item.number}`);
  const v = valueOf(qty, cost);
  if (v.isZero()) return nothing('The value transferred is zero');
  return { memo: `Transfer ${number}: ${item.number} received`, lines: [dr(inventoryKey(item), v, itemDims(item, toLocationId)), cr('INVENTORY_IN_TRANSIT', v, itemDims(item, fromLocationId))] };
}

/** The cost of an item on hand is changed. */
export function costChanged({ item, qtyOnHand, oldCost, newCost, locationId, neverValued = false }) {
  const to = usableCost(newCost);
  const from = usableCost(oldCost);
  if (to == null) hold(`The cost of item ${item.number} was removed. What is in the books for it stays until a cost is entered.`);
  // A first cost on an item that came in after the books began: its own receipt carries the value, and is posted again now that there is a cost.
  if (from == null && !neverValued) return nothing('A first cost was entered. The item\'s own events carry its value and are posted again.');
  const diff = valueOf(qtyOnHand, to).minus(valueOf(qtyOnHand, from ?? 0));
  if (diff.isZero()) return nothing('The value on hand did not change');
  const dims = itemDims(item, locationId); const key = inventoryKey(item);
  // An item that was left out of the opening balance for want of a cost comes on against opening equity.
  const other = neverValued ? 'OPENING_EQUITY' : 'COST_ADJUSTMENT';
  const memo = neverValued ? `Cost entered for ${item.number}, which had none at the opening balance` : `Cost of ${item.number} changed from ${from ?? 'none'} to ${to}`;
  return { memo, lines: diff.isPositive() ? [dr(key, diff, dims), cr(other, diff, dims)] : [dr(other, diff.abs(), dims), cr(key, diff.abs(), dims)] };
}

/** The mirror image of an entry's lines, for a reversal. */
export const reversedLines = (lines) => lines.map((l) => ({ ...l, side: l.side === 'D' ? 'C' : 'D' }));

/** The largest amount one line can carry (the column holds 16 digits before the point). */
const MAX_LINE = new D('999999999999.99');
/** Checks a manual entry as typed. Returns lines in rule form (by account code), or throws with what is wrong. */
export function manualLines(raw) {
  if (!Array.isArray(raw) || raw.length < 2) fail('A journal entry needs at least two lines');
  if (raw.length > 200) fail('A journal entry can have at most 200 lines');
  const lines = raw.map((l, i) => {
    const debit = l?.debit == null || l.debit === '' ? ZERO : parse(l.debit);
    const credit = l?.credit == null || l.credit === '' ? ZERO : parse(l.credit);
    if (debit.isNaN() || credit.isNaN() || debit.isNegative() || credit.isNegative()) fail(`Line ${i + 1}: debit and credit must be zero or more`);
    if (!debit.isFinite() || !credit.isFinite() || debit.gt(MAX_LINE) || credit.gt(MAX_LINE)) fail(`Line ${i + 1}: the amount is too large`);
    if (!debit.equals(cents(debit)) || !credit.equals(cents(credit))) fail(`Line ${i + 1}: amounts cannot have fractions of a cent`);
    if (debit.isZero() === credit.isZero()) fail(`Line ${i + 1}: give a debit or a credit, not both and not neither`);
    const code = typeof l.accountCode === 'string' || typeof l.accountCode === 'number' ? String(l.accountCode).trim() : '';
    if (!code) fail(`Line ${i + 1}: an account is required`);
    return { accountCode: code, side: debit.isZero() ? 'C' : 'D', amount: debit.isZero() ? credit : debit, locationId: l.locationId || null, customerId: l.customerId || null, supplierId: l.supplierId || null, productId: l.productId || null, coilId: l.coilId || null, division: l.division || null, jurisdiction: l.jurisdiction ? String(l.jurisdiction).slice(0, 8).toUpperCase() : null, memo: l.memo ? String(l.memo).slice(0, 300) : null };
  });
  const t = totals(lines);
  if (!t.ok) fail(`The entry does not balance: ${t.why}`);
  return lines;
}

/** The first and last day of the month a date falls in (UTC calendar). */
export function periodOf(date) {
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) fail('The date is not valid');
  const year = d.getUTCFullYear(); const month = d.getUTCMonth() + 1;
  return { year, month, startsOn: new Date(Date.UTC(year, month - 1, 1)), endsOn: new Date(Date.UTC(year, month, 0)) };
}
/** The calendar day of a moment, as a date at midnight UTC. */
export const dayOf = (date) => { const d = new Date(date); return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())); };

/** The calendar day of a moment in a named time zone, as a date at midnight UTC (how the books store a day). */
export function dayIn(date, timeZone = 'UTC') {
  const d = new Date(date);
  if (!timeZone || timeZone === 'UTC') return dayOf(d);
  const parts = Object.fromEntries(new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(d).map((x) => [x.type, x.value]));
  return new Date(Date.UTC(Number(parts.year), Number(parts.month) - 1, Number(parts.day)));
}
/** true when the name is a time zone this server knows. */
export function isTimeZone(name) {
  try { new Intl.DateTimeFormat('en-US', { timeZone: String(name) }); return Boolean(name); } catch { return false; }
}
export const isoDay = (d) => new Date(d).toISOString().slice(0, 10);

/** true when a database error says a ledger table is not there: the code was deployed before the database update that adds the ledger. */
export function tablesMissing(error) {
  if (!error) return false;
  if (error.code === 'P2021') return true;
  if (error.code === 'P2010' && String(error.meta?.code) === '42P01') return true;
  return /relation "[^"]*(Ledger|Journal)[^"]*" does not exist/.test(String(error.message || ''));
}
