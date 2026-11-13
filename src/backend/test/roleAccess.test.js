import test from 'node:test';
import assert from 'node:assert/strict';
import { apiRoleDenial, EXTERNAL_ROLES } from '../src/lib/roleAccess.js';
import { isCustomerLogin, scopedCustomerId } from '../src/lib/customerScope.js';

test('customer and partner logins reach only the store APIs', () => {
  for (const role of EXTERNAL_ROLES) {
    const user = { role, customerId: 'cust-1' };
    assert.equal(apiRoleDenial(user, '/api/ecom/catalog', 'GET'), null, role);
    assert.equal(apiRoleDenial(user, '/api/auth/me', 'GET'), null, role);
    for (const path of ['/api/orders', '/api/users', '/api/inventory', '/api/jobs/1', '/api/admin/pricing', '/api/executive/summary', '/api/ecommerce', '/api/customers', '/api/customers/cust-2/preferences']) {
      assert.ok(apiRoleDenial(user, path, 'GET'), `${role} must not reach ${path}`);
    }
  }
});

test('a customer may read only its own saved preferences, and never change them here', () => {
  const user = { role: 'CUSTOMER_BUYER', customerId: 'cust-1' };
  assert.equal(apiRoleDenial(user, '/api/customers/cust-1/preferences', 'GET'), null);
  assert.ok(apiRoleDenial(user, '/api/customers/cust-1/preferences', 'PUT'));
  assert.ok(apiRoleDenial(user, '/api/customers/cust-1', 'GET'));
  assert.ok(apiRoleDenial({ role: 'CUSTOMER_BUYER' }, '/api/customers/undefined/preferences', 'GET'));
});

test('executive data is for leadership roles', () => {
  assert.ok(apiRoleDenial({ role: 'OPERATOR_SAW' }, '/api/executive/summary'));
  assert.ok(apiRoleDenial({ role: 'CSR' }, '/api/metrics/compression/x'));
  assert.equal(apiRoleDenial({ role: 'CFO' }, '/api/executive/summary'), null);
  assert.equal(apiRoleDenial({ role: 'SUPER_ADMIN' }, '/api/executive/summary'), null);
  assert.equal(apiRoleDenial({ role: 'OPERATOR_SAW' }, '/api/jobs'), null);
});

test('customer scope helpers', () => {
  assert.equal(isCustomerLogin({ role: 'CUSTOMER_BUYER' }), true);
  assert.equal(isCustomerLogin({ role: 'CSR' }), false);
  // A customer login is always pinned to its own account, whatever it asks for.
  assert.equal(scopedCustomerId({ user: { role: 'CUSTOMER_ADMIN', customerId: 'c1' } }, 'c2'), 'c1');
  assert.equal(scopedCustomerId({ user: { role: 'CSR' } }, 'c2'), 'c2');
});
