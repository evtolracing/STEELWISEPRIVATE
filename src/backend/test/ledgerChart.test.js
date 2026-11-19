// The full proposed chart of accounts and where each account stands on the statements.
import test from 'node:test';
import assert from 'node:assert/strict';
import { PROPOSED_ACCOUNTS, PROPOSED_MAPPING, ACCOUNT_TYPES, SECTIONS, sectionOf, proposedSideOf, normalSideOf, SANDBOX_APPROVER } from '../src/lib/ledgerRules.js';

const byCode = new Map(PROPOSED_ACCOUNTS.map((a) => [a.code, a]));

test('the chart is a full general ledger: every code once, every account described', () => {
  assert.equal(byCode.size, PROPOSED_ACCOUNTS.length, 'a code is used twice');
  assert.ok(PROPOSED_ACCOUNTS.length >= 100, `only ${PROPOSED_ACCOUNTS.length} accounts`);
  for (const a of PROPOSED_ACCOUNTS) {
    assert.match(a.code, /^[0-9]{4}$/, a.code);
    assert.ok(ACCOUNT_TYPES.includes(a.type), `${a.code} ${a.type}`);
    assert.ok(a.name.length >= 3 && a.name.length <= 120 && a.description.length >= 10, a.code);
    assert.equal(typeof a.control, 'boolean', a.code);
  }
});

test('the chart has what a balance sheet and an income statement need', () => {
  for (const code of ['1010', '1100', '1110', '1200', '1400', '1520', '1590', '2010', '2100', '2310', '2320', '2400', '2500', '2600', '3100', '3300', '3900', '4000', '5000', '6000', '6100', '6700', '7000', '7100', '8000']) assert.ok(byCode.has(code), `account ${code} is missing`);
  const sections = new Set(PROPOSED_ACCOUNTS.map(sectionOf));
  for (const key of Object.keys(SECTIONS)) assert.ok(sections.has(key), `no account stands under ${key}`);
});

test('the first digit of a code agrees with the type of the account', () => {
  const allowed = { 1: ['ASSET'], 2: ['LIABILITY'], 3: ['EQUITY'], 4: ['REVENUE', 'CONTRA_REVENUE'], 5: ['EXPENSE'], 6: ['EXPENSE'], 7: ['REVENUE', 'EXPENSE'], 8: ['EXPENSE'] };
  for (const a of PROPOSED_ACCOUNTS) assert.ok(allowed[a.code[0]]?.includes(a.type), `${a.code} ${a.name} is a ${a.type}`);
});

test('every posting rule is mapped to an account of the chart that business events may post to', () => {
  for (const [key, [code]] of Object.entries(PROPOSED_MAPPING)) assert.ok(byCode.has(code), `${key} is mapped to ${code}, which is not in the chart`);
  // No rule posts to the accounts added for the general ledger: they take journal entries, so none is a control account.
  const mapped = new Set(Object.values(PROPOSED_MAPPING).map(([code]) => code));
  for (const a of PROPOSED_ACCOUNTS.filter((x) => Number(x.code) >= 6000)) { assert.equal(a.control, false, a.code); assert.ok(!mapped.has(a.code), a.code); }
});

test('contra accounts carry their balance on the other side', () => {
  for (const code of ['1110', '1230', '1590', '1690']) { assert.equal(byCode.get(code).type, 'ASSET'); assert.equal(proposedSideOf(byCode.get(code)), 'CREDIT', code); }
  assert.equal(proposedSideOf(byCode.get('3300')), 'DEBIT');
  assert.equal(proposedSideOf(byCode.get('4310')), 'DEBIT');
  for (const a of PROPOSED_ACCOUNTS.filter((x) => !x.side)) assert.equal(proposedSideOf(a), normalSideOf(a.type), a.code);
});

test('each account stands under the right heading, and an account added by hand is never left out', () => {
  const at = (code) => sectionOf(byCode.get(code));
  assert.equal(at('1010'), 'CURRENT_ASSETS'); assert.equal(at('1590'), 'FIXED_ASSETS'); assert.equal(at('1700'), 'OTHER_ASSETS');
  assert.equal(at('2010'), 'CURRENT_LIABILITIES'); assert.equal(at('2600'), 'LONG_TERM_LIABILITIES'); assert.equal(at('3900'), 'EQUITY');
  assert.equal(at('4310'), 'REVENUE'); assert.equal(at('5300'), 'COST_OF_SALES'); assert.equal(at('6700'), 'OPERATING_EXPENSES');
  assert.equal(at('7000'), 'OTHER_INCOME'); assert.equal(at('7100'), 'OTHER_EXPENSE'); assert.equal(at('8000'), 'INCOME_TAX');
  for (const type of ACCOUNT_TYPES) for (const code of ['999', '12345678', '9500']) assert.ok(SECTIONS[sectionOf({ code, type })], `${type} ${code}`);
  assert.equal(SECTIONS[sectionOf({ code: '12345678', type: 'EXPENSE' })][0], 'IS');
  assert.equal(SECTIONS[sectionOf({ code: '999', type: 'LIABILITY' })][0], 'BS');
});

test('the sandbox name cannot be mistaken for an accountant', () => { assert.match(SANDBOX_APPROVER, /^SANDBOX/); assert.match(SANDBOX_APPROVER, /not approved by an accountant/); });
