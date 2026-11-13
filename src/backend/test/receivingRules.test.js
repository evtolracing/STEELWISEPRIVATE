import test from 'node:test';
import assert from 'node:assert/strict';
import { readReceipt } from '../src/lib/receivingRules.js';

const formRow = { coilNumber: 'TAG-1', form: 'COIL', heatNumber: 'HT-1', gradeCode: 'A36', weightLb: 45000, locationId: 'loc-1', thicknessIn: 0.125, widthIn: 48 };
const fileRow = { tag_number: 'TAG-2', heat_number: 'HT-1', material_code: 'HR-COIL', grade: 'A36', thickness: '0.125', width: '48', weight_lbs: '45,000', coil_od: '72', coil_id: '24', location_code: 'DET-A', bay_position: 'A-01', ownership: 'HOUSE_OWNED', po_number: 'PO-1', mill_name: 'Nucor', notes: 'cert attached' };

test('the Receive form and an upload row read into the same receipt', () => {
  const a = readReceipt(formRow).receipt;
  const b = readReceipt(fileRow, 'coils').receipt;
  assert.equal(a.form, 'COIL');
  assert.equal(b.form, 'COIL');
  assert.equal(b.weightLb, 45000);
  assert.equal(b.thicknessIn, 0.125);
  assert.equal(b.odIn, 72);
  assert.equal(b.locationCode, 'DET-A');
  assert.equal(b.binLocation, 'A-01');
  assert.equal(b.productSku, 'HR-COIL');
  assert.equal(b.poReference, 'PO-1');
  assert.match(b.notes, /cert attached/);
  assert.match(b.notes, /Mill Nucor/);
  assert.deepEqual(Object.keys(a).sort(), Object.keys(b).sort());
});

test('a receipt needs an item number, a heat, a grade, a weight and a location', () => {
  assert.match(readReceipt({ ...formRow, coilNumber: '' }).error, /item number/);
  assert.match(readReceipt({ ...formRow, heatNumber: '' }).error, /heat or lot number/);
  assert.match(readReceipt({ ...formRow, gradeCode: '' }).error, /grade is required/);
  assert.match(readReceipt({ ...formRow, weightLb: '' }).error, /Weight is required/);
  assert.match(readReceipt({ ...formRow, locationId: '' }).error, /location is required/);
  assert.match(readReceipt({ ...formRow, form: '' }).error, /form/);
});

test('numbers must be real and more than zero', () => {
  assert.match(readReceipt({ ...formRow, weightLb: 0 }).error, /more than zero/);
  assert.match(readReceipt({ ...formRow, weightLb: -5 }).error, /more than zero/);
  assert.match(readReceipt({ ...formRow, weightLb: 'heavy' }).error, /must be a number/);
  assert.match(readReceipt({ ...formRow, widthIn: 'wide' }).error, /Width must be a number/);
  assert.match(readReceipt({ ...formRow, odIn: 20, idIn: 24 }).error, /inside diameter/);
  assert.match(readReceipt({ ...fileRow, quantity_pcs: '2.5' }, 'sheets').error, /piece count/);
});

test('the form is checked, and an unknown upload type is refused', () => {
  assert.match(readReceipt({ ...formRow, form: 'CLOUD' }).error, /Unknown form/);
  assert.match(readReceipt(fileRow, 'pallets').error, /Unknown upload type/);
});

test('an item number cannot carry markup or control characters', () => {
  assert.match(readReceipt({ ...formRow, coilNumber: '<script>' }).error, /letters, numbers/);
  assert.equal(readReceipt({ ...formRow, coilNumber: 'TAG-10/A #2' }).error, null);
});

test('ownership is house unless it says customer, and customer stock names the customer', () => {
  assert.equal(readReceipt(formRow).receipt.ownership, 'HOUSE_OWNED');
  assert.equal(readReceipt({ ...fileRow, ownership: 'toll', customer_name: 'ABC Steel' }, 'coils').receipt.ownership, 'CUSTOMER_OWNED');
  assert.match(readReceipt({ ...fileRow, ownership: 'CUSTOMER_OWNED', customer_name: '' }, 'coils').error, /needs the customer/);
  assert.match(readReceipt({ ...fileRow, ownership: 'BORROWED' }, 'coils').error, /Ownership must be/);
});

test('a bar length in feet is stored in inches; a plastics lot number is the traceability key', () => {
  const bar = readReceipt({ tag_number: 'BAR-1', heat_number: 'HT-3', grade: '1018', length_ft: '20', quantity_pcs: '25', weight_lbs: '1875', location_code: 'DET-C', size_description: '1.5 Round' }, 'bars').receipt;
  assert.equal(bar.form, 'BAR');
  assert.equal(bar.lengthIn, 240);
  assert.match(bar.notes, /25 pcs/);
  assert.match(bar.notes, /1\.5 Round/);
  const sheet = readReceipt({ tag_number: 'PLS-1', lot_number: 'LOT-1', material_type: 'HDPE', weight_lbs: '640', location_code: 'DET-P' }, 'plastics').receipt;
  assert.equal(sheet.heatNumber, 'LOT-1');
  assert.equal(sheet.gradeCode, 'HDPE');
});

test('a remnant takes its heat, grade and form from the parent item', () => {
  const rem = readReceipt({ tag_number: 'REM-1', parent_tag: 'TAG-1', weight_lbs: '350', location_code: 'DET-REM' }, 'remnants');
  assert.equal(rem.error, null);
  assert.equal(rem.receipt.parentTag, 'TAG-1');
  assert.equal(rem.receipt.form, null);
  assert.match(readReceipt({ tag_number: 'REM-2', weight_lbs: '350', location_code: 'DET-REM' }, 'remnants').error, /form|heat/);
});

test('a row that is not an object is refused, not crashed on', () => {
  assert.match(readReceipt(null).error, /item number/);
  assert.match(readReceipt('TAG-1,HT-1').error, /item number/);
  assert.match(readReceipt([1, 2]).error, /item number/);
});
