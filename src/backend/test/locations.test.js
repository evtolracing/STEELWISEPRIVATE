// Managing locations (owner's request, 2026-11-22): who may add, change and remove one, what a location may
// hold, and when one may be switched off or deleted.
import test from 'node:test';
import assert from 'node:assert/strict';
import { changedFields, deactivationBlocks, everUsed, locationCode, locationInput } from '../src/lib/locationRules.js';
import { permissionFor } from '../src/lib/permissionCatalog.js';
import { BUILTIN_DEFAULTS } from '../src/lib/builtinRoleDefaults.js';
import { topOnlyChange } from '../src/middleware/apiGate.js';
import { addressLine, blankLocation, formFromLocation, locationPayload } from '../../frontend/src/pages/Admin/locationForm.js';

const holders = (p) => Object.keys(BUILTIN_DEFAULTS).filter((r) => BUILTIN_DEFAULTS[r].grants.includes(p) || BUILTIN_DEFAULTS[r].grants.includes('*')).sort();

test('each location request needs its own permission', () => {
  assert.equal(permissionFor('/api/admin/locations', 'POST'), 'locations:add');
  assert.equal(permissionFor('/api/admin/locations/L1', 'PUT'), 'locations:edit');
  assert.equal(permissionFor('/api/admin/locations/L1', 'PATCH'), 'locations:edit');
  assert.equal(permissionFor('/api/admin/locations/L1', 'DELETE'), 'locations:remove');
  assert.equal(permissionFor('/api/admin/locations/L1/deactivate', 'POST'), 'locations:remove');
  assert.equal(permissionFor('/api/admin/locations/L1/reactivate', 'POST'), 'locations:remove');
});

test('adding and removing a location is for the super admin and the tenant owner; the admin may change details', () => {
  assert.deepEqual(holders('locations:add'), ['SUPER_ADMIN', 'TENANT_OWNER']);
  assert.deepEqual(holders('locations:remove'), ['SUPER_ADMIN', 'TENANT_OWNER']);
  assert.deepEqual(holders('locations:edit'), ['ADMIN', 'SUPER_ADMIN', 'TENANT_OWNER']);
  assert.equal(topOnlyChange('/api/admin/locations', 'POST'), true);
  assert.equal(topOnlyChange('/api/admin/locations/L1', 'DELETE'), true);
  assert.equal(topOnlyChange('/api/admin/locations/L1', 'PUT'), false);
  assert.equal(topOnlyChange('/api/admin/users', 'POST'), false);
  // The production roles that could add a location through the dispatch set-up hold none of it.
  for (const r of ['PRODUCTION_MANAGER', 'SCHEDULER', 'WORKCENTER_LEAD', 'BRANCH_MANAGER', 'OPS_MANAGER', 'COO']) {
    for (const p of ['locations:add', 'locations:edit', 'locations:remove']) assert.ok(!BUILTIN_DEFAULTS[r].grants.includes(p), `${r} ${p}`);
  }
});

test('a new location needs a code and a name, and is a branch unless said otherwise', () => {
  assert.equal(locationInput({ name: 'Charlotte' }, { creating: true }).error, 'A location needs a code, for example CT');
  assert.equal(locationInput({ code: 'ct' }, { creating: true }).error, 'A location needs a name');
  const { data } = locationInput({ code: ' ct 1 ', name: ' Alro Steel - Charlotte ', state: 'mi', postalCode: '48813', phone: '(517) 541-2558', squareFeet: '126600', divisions: ['METALS', 'METALS', ' '], processes: 'Saw Cutting, Shearing' }, { creating: true });
  assert.deepEqual(data, { code: 'CT-1', name: 'Alro Steel - Charlotte', type: 'WAREHOUSE', isBranch: true, state: 'MI', postalCode: '48813', phone: '(517) 541-2558', squareFeet: 126600, divisions: ['METALS'], processes: ['Saw Cutting', 'Shearing'] });
  assert.equal(locationCode('  Lansing / West '), 'LANSING-WEST');
});

test('what a location may hold is checked, with a sentence a person can act on', () => {
  const bad = (body) => locationInput({ code: 'X', name: 'X', ...body }, { creating: true }).error;
  assert.match(bad({ state: 'Michigan' }), /two-letter/);
  assert.match(bad({ email: 'not-an-address' }), /email/);
  assert.match(bad({ timezone: 'Mars/Olympus' }), /time zone/);
  assert.match(bad({ lat: '95' }), /latitude/);
  assert.match(bad({ type: 'SHED' }), /type must be one of/);
  assert.match(bad({ isBranch: true, parentId: 'L9' }), /cannot sit inside/);
  assert.equal(bad({ isBranch: false, parentId: 'L9', type: 'RACK' }), undefined);
});

test('an edit saves only what was sent, and an emptied box becomes "none"', () => {
  assert.deepEqual(locationInput({ phone: '' }).data, { phone: null });
  assert.deepEqual(locationInput({ hours: ' Mon-Fri 7AM-5PM ' }).data, { hours: 'Mon-Fri 7AM-5PM' });
  assert.deepEqual(locationInput({ lat: '', managerId: '' }).data, { lat: null, managerId: null });
  assert.equal(locationInput({ name: '  ' }).error, 'A location needs a name');
  assert.deepEqual(locationInput({}).data, {});
});

test('a location is switched off only when nothing is still open there', () => {
  assert.deepEqual(deactivationBlocks({ openOrders: 0, stock: 0, activeUsers: 0 }), []);
  const blocks = deactivationBlocks({ openOrders: 2, openJobs: 1, stock: 3, openShipments: 1, openTransfers: 1, activeMachines: 4, activeUsers: 1, activeChildren: 2 });
  assert.equal(blocks.length, 8);
  assert.match(blocks[0], /^2 open orders/);
  assert.match(blocks[1], /^1 open job planned here/);
  assert.match(blocks[6], /^1 active person has this as their home branch/);
});

test('a location that was ever used is never deleted', () => {
  assert.equal(everUsed({ orders: 0, inventory: 0, users: 0 }), false);
  assert.equal(everUsed({ orders: 0, movements: 1 }), true);
  assert.equal(everUsed({}), false);
});

test('the audit log gets only the fields that really changed', () => {
  const before = { name: 'A', phone: null, lat: '42.5', divisions: ['METALS'], hasCrane: false };
  assert.deepEqual(changedFields(before, { name: 'A', phone: null, lat: 42.5, divisions: ['METALS'], hasCrane: false }), {});
  assert.deepEqual(changedFields(before, { name: 'B', divisions: ['METALS', 'PLASTICS'] }), { name: ['A', 'B'], divisions: [['METALS'], ['METALS', 'PLASTICS']] });
});

test('the form sends what the server expects and reads a location back unchanged', () => {
  const blank = blankLocation();
  assert.equal(blank.isBranch, true);
  assert.equal(blank.timezone, 'America/Detroit');
  const sent = locationPayload({ ...blank, code: ' ct ', name: ' Charlotte ', isBranch: true, parentId: 'L9', lat: ' 42.56 ' });
  assert.equal(sent.code, 'ct'); assert.equal(sent.name, 'Charlotte'); assert.equal(sent.parentId, '', 'a branch is inside nothing'); assert.equal(sent.lat, '42.56');
  const { data, error } = locationInput(sent, { creating: true });
  assert.equal(error, undefined); assert.equal(data.code, 'CT'); assert.equal(data.lat, 42.56); assert.equal(data.phone, null);
  const form = formFromLocation({ id: 'L1', code: 'CT', name: 'Charlotte', lat: 42.56, lng: null, phone: null, divisions: ['METALS'], isBranch: true, sellsFrom: true });
  assert.equal(form.lat, '42.56'); assert.equal(form.lng, ''); assert.equal(form.phone, ''); assert.deepEqual(form.divisions, ['METALS']);
  assert.equal(addressLine({ addressLine1: '1298 Lipsey Dr.', city: 'Charlotte', state: 'MI', postalCode: '48813' }), '1298 Lipsey Dr., Charlotte, MI 48813');
  assert.equal(addressLine({}), '');
});
