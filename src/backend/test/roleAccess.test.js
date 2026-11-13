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

test('staff can only change records their department owns', async () => {
  const { staffWriteDenial } = await import('../src/lib/roleAccess.js');
  const ok = (role, method, path) => assert.equal(staffWriteDenial(role, path, method), null, `${role} ${method} ${path} should be allowed`);
  const no = (role, method, path) => assert.ok(staffWriteDenial(role, path, method), `${role} ${method} ${path} should be refused`);
  // Reads are never limited here.
  for (const role of ['OPERATOR_SAW', 'DATA_ANALYST', 'AUDITOR', 'MAINTENANCE_MANAGER']) ok(role, 'GET', '/api/orders/abc');
  // Sales records.
  ok('CSR', 'POST', '/api/orders'); ok('SALES_REP', 'PUT', '/api/orders/abc'); ok('CSR', 'POST', '/api/quotes/abc/accept');
  ok('CSR', 'POST', '/api/invoices/abc/payments'); ok('CSR', 'POST', '/api/returns'); ok('CSR', 'POST', '/api/pos/quick-sale/process-payment');
  no('OPERATOR_SAW', 'PUT', '/api/orders/abc'); no('SHIPPING_COORDINATOR', 'POST', '/api/orders'); no('QC_INSPECTOR', 'POST', '/api/customers');
  no('OPERATOR_SAW', 'POST', '/api/invoices/abc/payments'); no('INVENTORY_MANAGER', 'POST', '/api/quotes');
  // Shared steps.
  ok('INVENTORY_MANAGER', 'POST', '/api/orders/abc/allocate'); ok('MATERIAL_HANDLER', 'POST', '/api/returns/abc/receive');
  ok('SHIPPING_COORDINATOR', 'POST', '/api/returns/abc/receive'); no('QC_INSPECTOR', 'POST', '/api/orders/abc/allocate');
  ok('SHIPPING_COORDINATOR', 'POST', '/api/pos/will-call/abc/complete');
  // Stock, shipments, jobs.
  ok('RECEIVING_CLERK', 'POST', '/api/inventory/receive'); ok('OPERATOR_SAW', 'POST', '/api/coils'); ok('QC_MANAGER', 'POST', '/api/coils/abc/hold');
  no('CSR', 'POST', '/api/inventory/transfer'); no('MAINTENANCE_MANAGER', 'POST', '/api/inventory/adjust');
  ok('SHIPPING_COORDINATOR', 'PUT', '/api/shipments/abc/dispatch'); ok('CSR', 'POST', '/api/shipments'); ok('PACKAGING_LEAD', 'POST', '/api/shipments');
  no('OPERATOR_SAW', 'PUT', '/api/shipments/abc/dispatch'); no('QC_INSPECTOR', 'POST', '/api/shipments');
  ok('OPERATOR_SAW', 'POST', '/api/jobs/abc/status'); ok('CSR', 'POST', '/api/jobs'); ok('QC_INSPECTOR', 'PATCH', '/api/jobs/abc/status');
  no('MAINTENANCE_MANAGER', 'POST', '/api/jobs');
  // Money decisions need a manager.
  for (const path of ['/api/invoices/abc/credit', '/api/invoices/abc/refund', '/api/invoices/abc/cancel', '/api/pos/quick-sale/abc/void', '/api/tax-rates/OH']) {
    no('CSR', 'POST', path); no('SALES_REP', 'POST', path); no('OPERATOR_SAW', 'POST', path);
    ok('CREDIT_MANAGER', 'POST', path); ok('SALES_DIRECTOR', 'POST', path); ok('BRANCH_MANAGER', 'POST', path); ok('CFO', 'POST', path);
  }
  // Read-only roles and unknown roles change nothing listed.
  for (const role of ['DATA_ANALYST', 'AUDITOR', 'MADE_UP_ROLE', undefined]) {
    no(role, 'POST', '/api/orders'); no(role, 'POST', '/api/inventory/adjust'); no(role, 'POST', '/api/shipments'); no(role, 'POST', '/api/jobs');
  }
  // Managers and leadership are not limited; areas with no rule are unchanged.
  ok('ADMIN', 'DELETE', '/api/orders/abc'); ok('COO', 'POST', '/api/inventory/adjust'); ok('OPERATOR_SAW', 'POST', '/api/ai/chat');
});

test('the role gate applies the staff rules after the customer rules', () => {
  assert.ok(apiRoleDenial({ role: 'OPERATOR_SAW' }, '/api/orders/abc', 'PUT'));
  assert.equal(apiRoleDenial({ role: 'OPERATOR_SAW' }, '/api/orders/abc', 'GET'), null);
  assert.equal(apiRoleDenial({ role: 'CSR' }, '/api/orders', 'POST'), null);
  assert.match(apiRoleDenial({ role: 'CUSTOMER_BUYER', customerId: 'c1' }, '/api/orders', 'POST'), /online store/);
});

test('read-only roles change nothing, and may still ask questions that change nothing', async () => {
  const { staffWriteDenial, STAFF_GROUPS } = await import('../src/lib/roleAccess.js');
  for (const role of STAFF_GROUPS.readOnly) {
    for (const [method, path] of [['POST', '/api/products'], ['PUT', '/api/grades/x'], ['POST', '/api/work-centers'], ['POST', '/api/staff/operators'], ['POST', '/api/qc/inspections'], ['DELETE', '/api/documents/x'], ['POST', '/api/v1/orders'], ['POST', '/api/drop-tags'], ['PUT', '/api/demand-shaping/config'], ['POST', '/api/orders'], ['POST', '/api/v1/pipeline'], ['POST', '/api/overrides']]) {
      assert.match(staffWriteDenial(role, path, method) || '', /cannot change/, `${role} ${method} ${path}`);
    }
    for (const [method, path] of [['GET', '/api/products'], ['POST', '/api/auth/logout'], ['POST', '/api/ai/assistant'], ['POST', '/api/pricing/calculate'], ['POST', '/api/pos/validation/order'], ['POST', '/api/v1/pipeline/simulate']]) {
      assert.equal(staffWriteDenial(role, path, method), null, `${role} ${method} ${path}`);
    }
  }
  // Other departments are unchanged by this rule.
  assert.equal(staffWriteDenial('QC_INSPECTOR', '/api/qc/inspections', 'POST'), null);
  assert.equal(staffWriteDenial('ADMIN', '/api/products', 'POST'), null);
});

test('the second address for jobs and work centers is judged by the same rule as the first', async () => {
  const { staffWriteDenial, ruledPath } = await import('../src/lib/roleAccess.js');
  assert.equal(ruledPath('/api/v1/jobs/abc/status'), '/api/jobs/abc/status');
  assert.equal(ruledPath('/api/v1/work-centers'), '/api/work-centers');
  assert.equal(ruledPath('/api/v1/jobsheet'), '/api/v1/jobsheet');
  for (const [method, tail] of [['POST', ''], ['PATCH', '/abc'], ['POST', '/abc/status'], ['DELETE', '/abc']]) {
    const first = staffWriteDenial('MAINTENANCE_MANAGER', `/api/jobs${tail}`, method);
    assert.ok(first, 'a maintenance login may not change jobs');
    assert.equal(staffWriteDenial('MAINTENANCE_MANAGER', `/api/v1/jobs${tail}`, method), first);
    assert.equal(staffWriteDenial('OPERATOR_SAW', `/api/v1/jobs${tail}`, method), null);
  }
});
