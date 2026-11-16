import test from 'node:test';
import assert from 'node:assert/strict';
import { readPieces, ADJUST_REASONS, STOCK_ADJUSTERS } from '../src/lib/stockChanges.js';
import { cutoffs, levelFor, DEFAULT_RETENTION_YEARS } from '../src/lib/retention.js';

const FORMS = ['COIL', 'SHEET', 'PLATE'];
const refusal = (fn) => { try { fn(); } catch (e) { return e; } return null; };

test('a completion with only a weight is one piece of that weight', () => {
  assert.deepEqual(readPieces({ outputWeightLb: 1900 }, FORMS), { out: 1900, pieces: [{ weightLb: 1900 }] });
});

test('a completion that made nothing has no pieces', () => {
  assert.deepEqual(readPieces({ outputWeightLb: 0 }, FORMS), { out: 0, pieces: [] });
});

test('pieces add up to the output weight, to four places', () => {
  const r = readPieces({ outputs: [{ weightLb: 700.25, widthIn: 12 }, { weightLb: 700.25 }, { weightLb: 62.0001, form: 'SHEET' }] }, FORMS);
  assert.equal(r.out, 1462.5001);
  assert.equal(r.pieces.length, 3);
  assert.equal(r.pieces[0].widthIn, 12);
  assert.equal(r.pieces[2].form, 'SHEET');
});

test('pieces that do not add up to the stated output weight are refused', () => {
  const e = refusal(() => readPieces({ outputWeightLb: 1000, outputs: [{ weightLb: 400 }, { weightLb: 400 }] }, FORMS));
  assert.equal(e?.status, 400);
  assert.match(e.message, /800/);
});

test('a piece with no weight, a bad size or an unknown form is refused', () => {
  for (const outputs of [[{ weightLb: 0 }], [{ weightLb: -5 }], [{ weightLb: 'x' }], [{ weightLb: 5, widthIn: -1 }], [{ weightLb: 5, form: 'CUBE' }], 'nope']) {
    assert.equal(refusal(() => readPieces({ outputs }, FORMS))?.status, 400, JSON.stringify(outputs));
  }
});

test('stock corrections: five reasons, and only managers and the inventory manager', () => {
  assert.deepEqual(ADJUST_REASONS, ['COUNT', 'DAMAGE', 'SCRAP', 'FOUND', 'CORRECTION']);
  for (const role of ['SUPER_ADMIN', 'BRANCH_MANAGER', 'INVENTORY_MANAGER', 'COO']) assert.ok(STOCK_ADJUSTERS.has(role), role);
  for (const role of ['CSR', 'RECEIVING_CLERK', 'SHIPPING_COORDINATOR', 'OPERATOR_SAW', 'BUYER', 'AUDITOR', 'CUSTOMER_BUYER']) assert.ok(!STOCK_ADJUSTERS.has(role), role);
});

test('retention: five years by default, with a warning window of about six months', () => {
  assert.equal(DEFAULT_RETENTION_YEARS, 5);
  const { cutoff, soon } = cutoffs(5, new Date('2026-11-13T12:00:00Z'));
  assert.equal(cutoff.toISOString().slice(0, 10), '2021-11-13');
  assert.equal(soon.toISOString().slice(0, 10), '2022-05-15');
});

test('retention level: past the period wins over close to it', () => {
  assert.equal(levelFor(0, 0), 'OK');
  assert.equal(levelFor(0, 3), 'SOON');
  assert.equal(levelFor(1, 0), 'ARCHIVE');
  assert.equal(levelFor(2, 9), 'ARCHIVE');
});
