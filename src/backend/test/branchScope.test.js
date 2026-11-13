import test from 'node:test';
import assert from 'node:assert/strict';
import { branchesOf, scopedArgs, BRANCH_OWNED, OutsideBranch, ALL_BRANCH_ROLES } from '../src/lib/branchScope.js';

const A = 'branch-a', B = 'branch-b';
const held = { branches: [A], home: A, bypass: 0 };
const free = { branches: null, home: A, bypass: 0 };

test('a user is held to the home branch plus assigned branches; head office and customers are not', () => {
  assert.deepEqual(branchesOf({ role: 'CSR', homeLocationId: A, userLocations: [{ locationId: B }, { locationId: A }] }).sort(), [A, B]);
  assert.deepEqual(branchesOf({ role: 'BRANCH_MANAGER', homeLocationId: A }), [A]);
  assert.deepEqual(branchesOf({ role: 'OPERATOR_SAW' }), [], 'no branch assigned means no branch records');
  for (const role of ['SUPER_ADMIN', 'CFO', 'AUDITOR', 'CUSTOMER_BUYER']) assert.equal(branchesOf({ role, homeLocationId: A }), null, role);
  assert.ok(!ALL_BRANCH_ROLES.has('BRANCH_MANAGER') && !ALL_BRANCH_ROLES.has('SALES_REP'));
});

test('every read and change of a branch-owned record carries the branch', () => {
  for (const op of ['findMany', 'findFirst', 'findUnique', 'count', 'aggregate', 'groupBy', 'update', 'updateMany', 'delete', 'deleteMany']) {
    const out = scopedArgs('Order', op, { where: { id: 'x' } }, held);
    assert.deepEqual(out.where, { id: 'x', AND: [{ locationId: { in: [A] } }] }, op);
  }
  assert.deepEqual(scopedArgs('Coil', 'findMany', undefined, held).where, { AND: [{ locationId: { in: [A] } }] });
  const kept = scopedArgs('Invoice', 'findMany', { where: { AND: [{ status: 'SENT' }] } }, held);
  assert.deepEqual(kept.where.AND, [{ status: 'SENT' }, { order: { locationId: { in: [A] } } }], 'an existing AND is kept');
});

test('records reached through a parent are held to the parent\'s branch', () => {
  assert.deepEqual(scopedArgs('Payment', 'findMany', {}, held).where.AND, [{ invoice: { order: { locationId: { in: [A] } } } }]);
  assert.deepEqual(scopedArgs('ShipmentItem', 'findMany', {}, held).where.AND, [{ shipment: { fromLocationId: { in: [A] } } }]);
  assert.equal(scopedArgs('Job', 'findMany', {}, held).where.AND[0].OR.length, 3);
});

test('head office, requests with no user, shared records and other operations are left alone', () => {
  const args = { where: { id: 'x' } };
  assert.equal(scopedArgs('Order', 'findMany', args, free), args);
  assert.equal(scopedArgs('Order', 'findMany', args, undefined), args);
  assert.equal(scopedArgs('Organization', 'findMany', args, held), args);
  assert.equal(scopedArgs('Product', 'update', args, held), args);
  assert.ok(!BRANCH_OWNED.Organization && !BRANCH_OWNED.Product && !BRANCH_OWNED.User);
});

test('a new order takes the home branch of the person entering it unless a branch is named', () => {
  assert.equal(scopedArgs('Order', 'create', { data: { orderNumber: 'SO-1' } }, held).data.locationId, A);
  assert.equal(scopedArgs('Order', 'create', { data: { orderNumber: 'SO-1' } }, free).data.locationId, A, 'head office with a home branch');
  assert.equal(scopedArgs('Order', 'create', { data: { orderNumber: 'SO-1', locationId: B } }, free).data.locationId, B);
  assert.equal(scopedArgs('Order', 'create', { data: { orderNumber: 'SO-1' } }, { branches: null, home: null, bypass: 0 }).data.locationId, undefined);
});

test('creating a record for a branch the user is not in is refused', () => {
  assert.throws(() => scopedArgs('Order', 'create', { data: { locationId: B } }, held), OutsideBranch);
  assert.throws(() => scopedArgs('Shipment', 'create', { data: { fromLocationId: B } }, held), OutsideBranch);
  assert.throws(() => scopedArgs('Inventory', 'createMany', { data: [{ locationId: A }, { locationId: B }] }, held), OutsideBranch);
  assert.throws(() => scopedArgs('Inventory', 'upsert', { where: { coilId: 'c' }, create: { locationId: B }, update: {} }, held), OutsideBranch);
  assert.doesNotThrow(() => scopedArgs('Shipment', 'create', { data: { fromLocationId: A } }, held));
});

test('an order or shipment cannot be handed to another branch, but stock can be transferred out', () => {
  assert.throws(() => scopedArgs('Order', 'update', { where: { id: 'x' }, data: { locationId: B } }, held), OutsideBranch);
  assert.throws(() => scopedArgs('Shipment', 'update', { where: { id: 'x' }, data: { fromLocationId: { set: B } } }, held), OutsideBranch);
  const out = scopedArgs('Coil', 'update', { where: { id: 'c' }, data: { locationId: B } }, held);
  assert.deepEqual(out.where.AND, [{ locationId: { in: [A] } }], 'the sender must hold the item; the destination is free');
});

test('the one deliberate step across branches is not filtered', () => {
  const args = { where: { coilId: 'c' } };
  assert.equal(scopedArgs('Inventory', 'findUnique', args, { ...held, bypass: 1 }), args);
});

test('the arguments passed in are never changed in place', () => {
  const args = { where: { id: 'x' } };
  scopedArgs('Order', 'findMany', args, held);
  assert.deepEqual(args, { where: { id: 'x' } });
});

test('quotes and requests for quotation are held to their branch; one with no branch is seen by all', () => {
  for (const model of ['Quote', 'RFQ']) {
    const out = scopedArgs(model, 'findMany', { where: { status: 'DRAFT' } }, held);
    assert.deepEqual(out.where.AND, [{ OR: [{ locationId: { in: [A] } }, { locationId: null }] }], model);
    assert.throws(() => scopedArgs(model, 'create', { data: { locationId: B } }, held), OutsideBranch, `${model} cannot be filed under another branch`);
    assert.throws(() => scopedArgs(model, 'update', { where: { id: 'x' }, data: { locationId: B } }, held), OutsideBranch, `${model} cannot be handed to another branch`);
    assert.equal(scopedArgs(model, 'findMany', { where: {} }, free).where.AND, undefined, `${model}: head office is not filtered`);
  }
  assert.deepEqual(scopedArgs('QuoteLine', 'findMany', {}, held).where.AND, [{ quote: { OR: [{ locationId: { in: [A] } }, { locationId: null }] } }]);
  assert.deepEqual(scopedArgs('RFQLine', 'findMany', {}, held).where.AND, [{ rfq: { OR: [{ locationId: { in: [A] } }, { locationId: null }] } }]);
});

test('drop tags follow their order; packages follow their order or the branch they stand at', () => {
  const tag = scopedArgs('DropTag', 'findMany', {}, held).where.AND[0];
  assert.ok(tag.order, 'a drop tag is reached through its order');
  const pkg = scopedArgs('Package', 'findMany', {}, held).where.AND[0];
  assert.equal(pkg.OR.length, 3);
  assert.deepEqual(pkg.OR[1], { currentLocationId: { in: [A] } });
  assert.deepEqual(pkg.OR[2], { orderId: null, currentLocationId: null }, 'a package with neither is seen by every branch');
  for (const model of ['DropTag', 'Package', 'Quote', 'RFQ', 'QuoteLine', 'RFQLine']) assert.ok(BRANCH_OWNED[model], `${model} is listed as branch-owned`);
});
