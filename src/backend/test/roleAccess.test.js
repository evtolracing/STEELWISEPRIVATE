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

test('the areas that had no department now have one (B-004)', async () => {
  const { staffWriteDenial } = await import('../src/lib/roleAccess.js');
  const ok = (role, method, path) => assert.equal(staffWriteDenial(role, path, method), null, `${role} ${method} ${path} should be allowed`);
  const no = (role, method, path) => assert.ok(staffWriteDenial(role, path, method), `${role} ${method} ${path} should be refused`);
  // Set-up of the shop is not an operator's or a sales login's to change.
  for (const [method, path] of [['PATCH', '/api/work-centers/1'], ['POST', '/api/v1/work-centers'], ['DELETE', '/api/processing-recipes/1'], ['PUT', '/api/v1/bom/recipes/1'],
    ['DELETE', '/api/v1/dispatch/work-center-types/SAW'], ['DELETE', '/api/staff/operators/1'], ['POST', '/api/staff/shifts'], ['DELETE', '/api/assets/1'], ['DELETE', '/api/maintenance-orders/1'],
    ['POST', '/api/drop-tags/templates'], ['DELETE', '/api/documents/1'], ['PUT', '/api/demand-shaping/config'], ['POST', '/api/ops-cockpit/recommendations/accept']]) {
    no('OPERATOR_SAW', method, path); no('RECEIVING_CLERK', method, path); ok('BRANCH_MANAGER', method, path); ok('COO', method, path); no('AUDITOR', method, path);
  }
  for (const path of ['/api/work-centers/1', '/api/staff/operators/1', '/api/v1/dispatch/work-centers/1']) ok('PRODUCTION_MANAGER', 'PATCH', path);
  ok('SCHEDULER', 'POST', '/api/v1/dispatch/run'); ok('WORKCENTER_LEAD', 'POST', '/api/staff/shifts'); no('WORKCENTER_LEAD', 'PATCH', '/api/work-centers/1');
  ok('MAINTENANCE_MANAGER', 'PATCH', '/api/assets/1'); ok('MAINTENANCE_MANAGER', 'DELETE', '/api/maintenance-orders/1'); ok('OPERATOR_SAW', 'POST', '/api/maintenance-orders'); no('CSR', 'POST', '/api/maintenance-orders');
  // Documents: anyone attaches, a department manager deletes.
  ok('OPERATOR_SAW', 'POST', '/api/documents/upload'); ok('QC_MANAGER', 'DELETE', '/api/documents/1'); no('QC_INSPECTOR', 'DELETE', '/api/documents/1'); no('CSR', 'DELETE', '/api/documents/1');
  // Safety: anyone stops work; a supervisor clears it.
  for (const role of ['OPERATOR_SAW', 'CSR', 'RECEIVING_CLERK', 'QC_INSPECTOR', 'MAINTENANCE_MANAGER']) ok(role, 'POST', '/api/safety/stop-work');
  no('OPERATOR_SAW', 'POST', '/api/safety/stop-work/1/clearance'); no('CSR', 'PATCH', '/api/safety/stop-work/1/status'); ok('WORKCENTER_LEAD', 'POST', '/api/safety/stop-work/1/clearance'); ok('QC_MANAGER', 'POST', '/api/safety/stop-work/1/steps/2/complete');
  // The second stock list, material tracking, tags.
  for (const path of ['/api/v1/inventory/adjust', '/api/material-tracking/custody-log', '/api/drop-tags']) { no('CSR', 'POST', path); ok('RECEIVING_CLERK', 'POST', path); ok('OPERATOR_SAW', 'POST', path); }
  ok('CSR', 'POST', '/api/print-queue/trigger'); no('MAINTENANCE_MANAGER', 'POST', '/api/print-queue/trigger');
  // The order hub and pipeline are sales records; planning an order is also production's.
  for (const path of ['/api/v1/contacts', '/api/v1/rfq', '/api/v1/quotes', '/api/v1/orders', '/api/v1/pipeline', '/api/v1/ingest/email-rfq', '/api/demand-shaping/accept']) { ok('CSR', 'POST', path); no('OPERATOR_SAW', 'POST', path); no('RECEIVING_CLERK', 'POST', path); }
  ok('SCHEDULER', 'POST', '/api/v1/orders/1/plan'); ok('PACKAGING_LEAD', 'POST', '/api/v1/orders/1/mark-packaging'); no('QC_INSPECTOR', 'POST', '/api/v1/orders/1/plan');
  no('CSR', 'PUT', '/api/demand-shaping/config'); ok('SALES_DIRECTOR', 'PUT', '/api/demand-shaping/config');
  // Shop-floor operations and inspections.
  ok('OPERATOR_SAW', 'POST', '/api/v1/operations/1/start'); no('CSR', 'POST', '/api/v1/operations/1/complete'); no('RECEIVING_CLERK', 'POST', '/api/v1/operations/1/start');
  ok('QC_INSPECTOR', 'POST', '/api/qc/inspections/1/pass'); ok('PRODUCTION_MANAGER', 'POST', '/api/qc/inspections'); no('OPERATOR_SAW', 'POST', '/api/qc/inspections/1/pass'); no('CSR', 'POST', '/api/qc/inspections');
  // Asking for an explanation changes nothing.
  ok('OPERATOR_SAW', 'POST', '/api/ops-cockpit/recommendations/explain'); ok('AUDITOR', 'POST', '/api/ops-cockpit/recommendations/explain');
  // Anyone reports an exception.
  ok('OPERATOR_SAW', 'POST', '/api/v1/events/exceptions'); no('DATA_ANALYST', 'POST', '/api/v1/events/exceptions');
});
