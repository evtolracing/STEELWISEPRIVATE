#!/usr/bin/env node
// Security and robustness sweep against the QA server. Reads the endpoint list
// produced by qa/tools/inventory.mjs so every route the app mounts is covered.
//   node qa/sim/security.mjs --base http://localhost:3011 --out qa/results/security.json
import fs from 'node:fs';
import path from 'node:path';
import { api, prismaClient, QA_USERS } from './lib.mjs';

const arg = (n, d) => { const i = process.argv.indexOf(`--${n}`); return i > -1 ? process.argv[i + 1] : d; };
const BASE = arg('base', 'http://localhost:3011');
const OUT = arg('out', 'qa/results/security.json');
const here = path.dirname(new URL(import.meta.url).pathname);
const inventory = JSON.parse(fs.readFileSync(path.join(here, '../.inventory.json'), 'utf8'));
const prisma = prismaClient();
const A = api(BASE);

const FAKE_ID = '00000000-0000-4000-8000-000000000000';
const PUBLIC = new Set(['POST /api/auth/login', 'POST /api/auth/register', 'GET /api/health']);
const PARTNER = ['/api/v1/partner/auth', '/api/v1/partner/customer', '/api/v1/partner/supplier', '/api/v1/partner/carrier', '/api/v1/partner/webhooks'];
const EXTERNAL_OK = ['/api/auth', '/api/ecom', '/api/enterprise', '/api/remnants', '/api/promise', '/api/v1/fulfillment'];
const LEAK = /prisma|Invalid `|Unique constraint|Foreign key constraint|node_modules|\\n\s+at |Cannot read properties|is not a function/i;
const leaks = new Set();
const under = (p, list) => list.some((x) => p === x || p.startsWith(`${x}/`));

const endpoints = inventory.endpoints.map((e) => {
  const [method, raw] = e.ep.split(' ');
  return { method, raw, url: raw.replace(/:[A-Za-z_]+\??/g, FAKE_ID), file: e.file };
}).filter((e) => !e.raw.includes('*'));

async function raw(method, url, { token, body } = {}) {
  try {
    const res = await fetch(BASE + url, {
      method,
      headers: { 'content-type': 'application/json', ...(token ? { authorization: `Bearer ${token}` } : {}) },
      body: ['GET', 'HEAD'].includes(method) ? undefined : JSON.stringify(body ?? {}),
      signal: AbortSignal.timeout(20000),
    });
    const text = await res.text();
    if (res.status >= 400 && LEAK.test(text)) leaks.add(`${method} ${url.split('?')[0].replaceAll(FAKE_ID, ':id')} → ${res.status} ${text.slice(0, 90).replace(/\s+/g, ' ')}`);
    return { status: res.status, text: text.slice(0, 200), full: text };
  } catch (e) { return { status: 0, text: String(e.message) }; }
}
async function tokenFor(who) {
  const r = await fetch(`${BASE}/api/auth/login`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email: QA_USERS[who], password: (await import('./lib.mjs')).QA_PASSWORD }) });
  return (await r.json()).token;
}

const report = { base: BASE, at: new Date().toISOString(), endpointsInInventory: inventory.endpoints.length, endpointsSwept: endpoints.length, sections: {} };
const section = (name, data) => { report.sections[name] = data; console.log(`${data.pass ? '✓' : '✗'} ${name}: ${data.summary}`); for (const f of (data.findings || []).slice(0, 8)) console.log('    ', f); };

// 1. No token: every route must refuse, except the documented public ones.
{
  const findings = []; let tested = 0; let skippedPublic = 0;
  for (const e of endpoints) {
    if (PUBLIC.has(`${e.method} ${e.raw}`) || under(e.raw, PARTNER)) { skippedPublic++; continue; }
    const r = await raw(e.method, e.url);
    tested++;
    if (r.status !== 401) findings.push(`${e.method} ${e.raw} → ${r.status} without signing in`);
  }
  section('No access without signing in', { pass: findings.length === 0, summary: `${tested} routes tried with no token, ${findings.length} did not refuse (${skippedPublic} documented public or partner routes skipped)`, tested, findings });
}

// 2. Partner routes use their own tokens: a missing or staff token must not work.
{
  const findings = []; let tested = 0;
  const staff = await tokenFor('admin');
  for (const e of endpoints.filter((x) => under(x.raw, PARTNER) && !x.raw.startsWith('/api/v1/partner/auth') && !x.raw.startsWith('/api/v1/partner/webhooks'))) {
    for (const token of [undefined, staff]) {
      const r = await raw(e.method, e.url, { token });
      tested++;
      if (r.status >= 200 && r.status < 300) findings.push(`${e.method} ${e.raw} → ${r.status} with ${token ? 'a staff token' : 'no token'}`);
    }
  }
  section('Partner API needs a partner token', { pass: findings.length === 0, summary: `${tested} calls, ${findings.length} let in`, tested, findings });
}

// 3. Bad tokens.
{
  const good = await tokenFor('csr');
  const parts = good.split('.');
  const forgedPayload = Buffer.from(JSON.stringify({ ...JSON.parse(Buffer.from(parts[1], 'base64url').toString()), role: 'SUPER_ADMIN' })).toString('base64url');
  const cases = {
    'garbage token': 'not-a-token',
    'token with the role changed to SUPER_ADMIN (signature no longer matches)': `${parts[0]}.${forgedPayload}.${parts[2]}`,
    'unsigned token (alg none)': `${Buffer.from('{"alg":"none","typ":"JWT"}').toString('base64url')}.${forgedPayload}.`,
  };
  const findings = [];
  for (const [name, token] of Object.entries(cases)) {
    const r = await raw('GET', '/api/orders', { token });
    if (r.status !== 401) findings.push(`${name} → ${r.status}`);
  }
  const wrong = await raw('POST', '/api/auth/login', { body: { email: QA_USERS.csr, password: 'wrong-password' } });
  if (wrong.status !== 401) findings.push(`wrong password → ${wrong.status}`);
  const unknown = await raw('POST', '/api/auth/login', { body: { email: 'nobody@qa.test', password: 'x' } });
  if (unknown.status !== 401) findings.push(`unknown user → ${unknown.status}`);
  if (unknown.text !== wrong.text) findings.push('login reveals whether an email exists (different messages)');
  section('Forged and invalid sign-ins are refused', { pass: findings.length === 0, summary: `${Object.keys(cases).length + 2} cases, ${findings.length} problems`, findings });
}

// 4. A customer login can reach only the store.
{
  const token = await tokenFor('custA');
  const findings = []; let tested = 0;
  for (const e of endpoints) {
    if (under(e.raw, EXTERNAL_OK) || under(e.raw, PARTNER) || PUBLIC.has(`${e.method} ${e.raw}`)) continue;
    const r = await raw(e.method, e.url, { token });
    tested++;
    if (r.status !== 403) findings.push(`${e.method} ${e.raw} → ${r.status} for a customer login`);
  }
  section('Customer logins are held to the store', { pass: findings.length === 0, summary: `${tested} staff routes tried as a customer, ${findings.length} not refused`, tested, findings });
}

// 5. One customer cannot see another customer's records.
{
  const [a, b] = [await tokenFor('custA'), await tokenFor('custB')];
  const orgB = await prisma.organization.findFirst({ where: { code: 'QA-C02' } });
  const orgA = await prisma.organization.findFirst({ where: { code: 'QA-C01' } });
  const findings = [];
  const mine = await fetch(`${BASE}/api/ecom/my-orders`, { headers: { authorization: `Bearer ${a}` } }).then((r) => r.json()).catch(() => null);
  const list = mine?.data || mine?.orders || (Array.isArray(mine) ? mine : []);
  const foreign = list.filter((o) => o.customerId && o.customerId !== orgA.id);
  if (foreign.length) findings.push(`customer A's order list contains ${foreign.length} order(s) of another account`);
  const tries = [
    ['GET', `/api/ecom/my-orders?customerId=${orgB.id}`],
    ['GET', `/api/enterprise/accounts/${orgB.id}`],
    ['GET', `/api/enterprise/accounts/${orgB.id}/documents`],
    ['GET', `/api/enterprise/accounts/${orgB.id}/orders`],
    ['GET', `/api/customers/${orgB.id}/preferences`],
  ];
  for (const [m, u] of tries) {
    const r = await raw(m, u, { token: a });
    const leaked = r.status >= 200 && r.status < 300 && r.text.includes(orgB.id);
    if (leaked) findings.push(`${m} ${u.replace(orgB.id, '<other account>')} → ${r.status} and returned the other account's data`);
  }
  // B places an order; A must not be able to open it.
  const prod = await prisma.product.findFirst({ where: { isActive: true, storeListing: { isNot: null } } }).catch(() => null) || await prisma.product.findFirst({ where: { isActive: true } });
  const placed = await fetch(`${BASE}/api/ecom/checkout/submit`, { method: 'POST', headers: { 'content-type': 'application/json', authorization: `Bearer ${b}` }, body: JSON.stringify({ items: [{ productId: prod.id, quantity: 1, extended: 10, sku: prod.sku }], deliveryMethod: 'PICKUP' }) }).then((r) => r.json()).catch(() => null);
  const id = placed?.data?.id;
  if (id) {
    const r = await raw('GET', `/api/ecom/my-orders/${id}`, { token: a });
    if (r.status !== 404 && r.status !== 403) findings.push(`customer A opened customer B's web order → ${r.status}`);
  } else findings.push(`could not place a test web order as customer B: ${JSON.stringify(placed).slice(0, 120)}`);
  // Divisions: a login on one division sees that division, not its sister division or the parent company.
  const [d1, d2] = await Promise.all(['QA-C01-D1', 'QA-C01-D2'].map((code) => prisma.organization.findUnique({ where: { code } })));
  const adminUser = await prisma.user.findUnique({ where: { email: QA_USERS.admin } });
  if (!d1 || !d2) findings.push('division fixtures missing: run qa/sim/fixtures.mjs');
  else {
    const mk = (org, tag) => prisma.order.upsert({
      where: { orderNumber: `QA-DIV-${tag}` }, update: {},
      create: { orderNumber: `QA-DIV-${tag}`, orderType: 'SO', status: 'CONFIRMED', buyerId: org.id, subtotal: 10, totalAmount: 10, createdById: adminUser.id },
    });
    const [own, sister, parent] = await Promise.all([mk(d1, 'OWN'), mk(d2, 'SISTER'), mk(orgA, 'PARENT')]);
    const div = await tokenFor('custDiv');
    for (const u of [`/api/enterprise/orders?accountId=${d1.id}`, `/api/enterprise/orders?accountId=${orgA.id}`, `/api/enterprise/orders?accountId=${d2.id}`, `/api/enterprise/accounts/${orgA.id}`, `/api/enterprise/accounts/${d2.id}`, '/api/enterprise/orders']) {
      const r = await raw('GET', u, { token: div });
      if (r.full.includes(sister.id) || r.full.includes('QA-DIV-SISTER')) findings.push(`division login saw its sister division's order at ${u.replace(/[0-9a-f-]{36}/g, '<id>')}`);
      if (r.full.includes(parent.id) || r.full.includes('QA-DIV-PARENT')) findings.push(`division login saw the parent company's order at ${u.replace(/[0-9a-f-]{36}/g, '<id>')}`);
      if (r.status === 200 && (r.full.includes(`"${d2.id}"`) || r.full.includes('QA-C01-D2'))) findings.push(`division login was shown its sister division at ${u.replace(/[0-9a-f-]{36}/g, '<id>')}`);
    }
    const mine = await raw('GET', `/api/enterprise/orders?accountId=${d1.id}`, { token: div });
    if (!mine.full.includes('QA-DIV-OWN')) findings.push(`division login could not see its own order (${mine.status})`);
    for (const id of [sister.id, parent.id]) {
      const r = await raw('GET', `/api/enterprise/orders/${id}`, { token: div });
      if (r.status >= 200 && r.status < 300 && r.full.includes(id)) findings.push(`division login opened another division's order → ${r.status}`);
    }
    const whole = await raw('GET', `/api/enterprise/orders?accountId=${orgA.id}`, { token: a });
    for (const tag of ['OWN', 'SISTER', 'PARENT']) if (!whole.full.includes(`QA-DIV-${tag}`)) findings.push(`parent-company login could not see QA-DIV-${tag}`);
  }
  section('Customers and divisions cannot see each other', { pass: findings.length === 0, summary: `${tries.length + 2 + 24} checks, ${findings.length} problems`, findings });
}

// 6. Staff roles: who can change users, and can a shop-floor login change sales orders?
{
  const op = await tokenFor('operator');
  const findings = []; const observations = [];
  const mk = await raw('POST', '/api/users', { token: op, body: { email: 'qa-escalate@qa.test', password: 'x12345678', firstName: 'Q', lastName: 'A', role: 'SUPER_ADMIN' } });
  if (mk.status !== 403) findings.push(`a saw operator created a user → ${mk.status}`);
  const admin = await prisma.user.findUnique({ where: { email: QA_USERS.admin } });
  const up = await raw('PUT', `/api/users/${admin.id}`, { token: op, body: { role: 'VIEWER' } });
  if (up.status !== 403) findings.push(`a saw operator edited an admin → ${up.status}`);
  const del = await raw('DELETE', `/api/users/${FAKE_ID}`, { token: op });
  if (del.status !== 403) findings.push(`a saw operator reached user delete → ${del.status}`);
  const adminWrite = await raw('POST', '/api/admin/pricing/levels', { token: op, body: {} });
  if (adminWrite.status !== 403) observations.push(`operator POST /api/admin/pricing/levels → ${adminWrite.status}`);
  const exec = await raw('GET', '/api/executive/summary', { token: op });
  if (exec.status !== 403) findings.push(`a saw operator opened executive data → ${exec.status}`);
  // Departments: staff can only change the records their department owns.
  const adminToken = await tokenFor('admin'); const csr = await tokenFor('csr'); const shipping = await tokenFor('shipping');
  const buyer = await prisma.organization.findFirst({ where: { code: 'QA-C05' } });
  const made = await fetch(`${BASE}/api/orders`, { method: 'POST', headers: { 'content-type': 'application/json', authorization: `Bearer ${adminToken}` }, body: JSON.stringify({ buyerId: buyer.id, poReference: 'QA-SECURITY', lines: [{ qtyOrdered: 10, description: 'security probe' }] }) }).then((r) => r.json());
  const expect = async (who, token, m, u, body, want, what) => {
    const r = await raw(m, u, { token, body });
    const okay = want === 403 ? r.status === 403 : r.status !== 403 && r.status !== 401;
    if (!okay) findings.push(`${who}: ${what} → ${r.status} (expected ${want === 403 ? 'refused' : 'allowed'})`);
  };
  if (!made?.id) findings.push('could not create the probe order');
  else {
    await expect('saw operator', op, 'PUT', `/api/orders/${made.id}`, { notes: 'edited by operator (QA probe)' }, 403, 'edit a sales order');
    await expect('saw operator', op, 'POST', '/api/orders', { buyerId: buyer.id, lines: [] }, 403, 'create a sales order');
    await expect('saw operator', op, 'POST', '/api/shipments', { orderId: made.id }, 403, 'create a shipment');
    await expect('saw operator', op, 'POST', `/api/invoices/${FAKE_ID}/payments`, { amount: 1, paymentMethod: 'CASH' }, 403, 'record a payment');
    await expect('saw operator', op, 'POST', `/api/jobs/${FAKE_ID}/status`, { status: 'IN_PROCESS' }, 200, 'move a job');
    await expect('shipping', shipping, 'PUT', `/api/orders/${made.id}`, { notes: 'x' }, 403, 'edit a sales order');
    await expect('shipping', shipping, 'POST', '/api/shipments', { orderId: made.id }, 200, 'create a shipment');
    await expect('CSR', csr, 'PUT', `/api/orders/${made.id}`, { notes: 'edited by CSR (QA probe)' }, 200, 'edit a sales order');
    await expect('CSR', csr, 'POST', '/api/inventory/adjust', {}, 403, 'adjust stock');
    await expect('CSR', csr, 'POST', `/api/invoices/${FAKE_ID}/credit`, { reason: 'x', amount: 1 }, 403, 'issue a credit');
    await expect('CSR', csr, 'POST', `/api/invoices/${FAKE_ID}/cancel`, {}, 403, 'cancel an invoice');
    await expect('CSR', csr, 'POST', `/api/pos/quick-sale/${FAKE_ID}/void`, { reason: 'x' }, 403, 'void a counter sale');
    await expect('admin', adminToken, 'POST', `/api/invoices/${FAKE_ID}/credit`, { reason: 'x', amount: 1 }, 200, 'issue a credit');
  }
  section('Staff roles and departments', { pass: findings.length === 0, summary: `18 checks, ${findings.length} problems`, findings, observations });
  for (const o of observations) console.log('     note:', o);
}

// 7. Robustness: read routes must not crash on an id that does not exist or a hostile query.
{
  const token = await tokenFor('admin');
  const crashes = []; let tested = 0;
  for (const e of endpoints.filter((x) => x.method === 'GET' && !under(x.raw, PARTNER))) {
    const variants = { '': e.url, ' (bad paging)': `${e.url}?limit=abc&page=-1`, ' (hostile filter)': `${e.url}?status=%27%3B--&type=%27%3B--&search=%25%27%22%3Cscript%3E&q=%25%27%22` };
    for (const [label, url] of Object.entries(variants)) {
      const r = await raw('GET', url, { token });
      tested++;
      if (r.status >= 500 || r.status === 0) crashes.push(`${e.raw}${label} → ${r.status} ${r.text.slice(0, 80)} [${e.file.split('/').pop()}]`);
    }
  }
  const byFile = {};
  for (const c of crashes) { const f = c.match(/\[(.+)\]$/)[1]; byFile[f] = (byFile[f] || 0) + 1; }
  section('Read routes do not crash on bad input', { pass: crashes.length === 0, summary: `${tested} reads, ${crashes.length} server errors`, tested, byFile, findings: crashes });
}

// 8. Core write routes answer bad input with a 4xx, never a 5xx.
{
  const token = await tokenFor('admin');
  const order = await prisma.order.findFirst({ where: { poReference: { startsWith: 'QA-' }, status: 'CONFIRMED' }, include: { lines: true } });
  const bad = [
    ['POST', '/api/orders', {}], ['POST', '/api/orders', { lines: 'x' }], ['POST', '/api/orders', { lines: [{ qtyOrdered: -5 }] }],
    ['POST', '/api/orders', { buyerId: FAKE_ID, lines: [{ qtyOrdered: 5, unitPrice: 'abc' }] }], ['POST', '/api/orders', { orderType: 'NOPE' }],
    ['POST', '/api/orders', { lines: [{ qtyOrdered: 10, unit: 'LB', priceUnit: 'LB', unitPrice: 1, extendedPrice: 999 }] }],
    ['POST', '/api/orders', { requiredDate: 'not a date' }], ['POST', '/api/orders', { lines: [{ qtyOrdered: 1, productId: FAKE_ID }] }],
    ['PUT', `/api/orders/${FAKE_ID}`, { status: 'CONFIRMED' }], ['PUT', `/api/orders/${order.id}`, { status: 'COMPLETE' }], ['PUT', `/api/orders/${order.id}`, { status: 'BANANA' }],
    ['PUT', `/api/orders/${order.id}`, {}], ['POST', `/api/orders/${order.id}/allocate`, {}], ['POST', `/api/orders/${order.id}/allocate`, { lineId: order.lines[0].id, coilId: FAKE_ID, qty: 1 }],
    ['POST', `/api/orders/${order.id}/allocate`, { lineId: FAKE_ID, coilId: FAKE_ID, qty: 1 }], ['POST', `/api/orders/${order.id}/allocate`, { lineId: order.lines[0].id, coilId: FAKE_ID, qty: -1 }],
    ['POST', '/api/shipments', {}], ['POST', '/api/shipments', { orderId: FAKE_ID, fromLocationId: FAKE_ID }], ['POST', '/api/shipments', { orderId: order.id, fromLocationId: FAKE_ID }],
    ['PUT', `/api/shipments/${FAKE_ID}/dispatch`, {}], ['PUT', `/api/shipments/${FAKE_ID}/deliver`, {}], ['PATCH', `/api/shipments/${FAKE_ID}/status`, { status: 'X' }],
    ['POST', '/api/inventory/receive', {}], ['POST', '/api/inventory/receive', { coilId: FAKE_ID, locationId: FAKE_ID, qty: 5 }], ['POST', '/api/inventory/receive', { coilId: FAKE_ID, locationId: FAKE_ID, qty: 'NaN' }],
    ['POST', '/api/inventory/transfer', {}], ['POST', '/api/inventory/transfer', { coilId: FAKE_ID, toLocationId: FAKE_ID }],
    ['POST', '/api/jobs', { status: 'BANANA' }], ['POST', '/api/jobs', { orderId: FAKE_ID }], ['POST', '/api/jobs', { scheduledStart: 'never' }],
    ['POST', `/api/jobs/${FAKE_ID}/status`, { status: 'IN_PROCESS' }], ['PATCH', `/api/jobs/${FAKE_ID}/status`, {}], ['PATCH', `/api/jobs/${FAKE_ID}`, { priority: 'HOT' }], ['PUT', `/api/jobs/${FAKE_ID}`, {}],
    ['POST', '/api/ecom/checkout/submit', {}], ['POST', '/api/ecom/checkout/submit', { items: [{ productId: FAKE_ID, quantity: 1 }] }],
    ['POST', '/api/pos/sessions/nope/submit', {}], ['POST', '/api/pos/sessions/nope/products/add', { productId: FAKE_ID }],
  ];
  const findings = [];
  for (const [m, u, body] of bad) {
    const r = await raw(m, u, { token, body });
    if (!(r.status >= 400 && r.status < 500)) findings.push(`${m} ${u.replace(order.id, '<order>').replace(FAKE_ID, '<missing>')} ${JSON.stringify(body).slice(0, 60)} → ${r.status} ${r.text.slice(0, 80)}`);
  }
  section('Core write routes reject bad input cleanly', { pass: findings.length === 0, summary: `${bad.length} bad requests, ${findings.length} not answered with a 4xx`, tested: bad.length, findings });
}

// 10. Documents: upload a cert to a heat, list it, download it, refuse a program file, delete it.
{
  const token = await tokenFor('admin'); const H = { authorization: `Bearer ${token}` };
  const heat = await prisma.heat.findFirst();
  const findings = [];
  const fd = new FormData(); fd.append('file', new Blob(['%PDF-1.4 qa test cert'], { type: 'application/pdf' }), 'qa-cert.pdf'); fd.append('entityType', 'HEAT'); fd.append('entityId', heat.id); fd.append('type', 'MTC');
  const up = await fetch(`${BASE}/api/documents/upload`, { method: 'POST', headers: H, body: fd }); const doc = await up.json().catch(() => ({}));
  if (up.status !== 201) findings.push(`upload → ${up.status} ${JSON.stringify(doc).slice(0, 100)}`);
  else {
    if ('storagePath' in doc) findings.push('upload reply exposes the server file path');
    if (doc.type !== 'MTR') findings.push(`type saved as ${doc.type}`);
    const ent = await (await fetch(`${BASE}/api/documents/entity/HEAT/${heat.id}`, { headers: H })).json();
    if (!ent.data?.some((d) => d.id === doc.id)) findings.push('uploaded cert is not listed on the heat');
    if ((await prisma.heat.findUnique({ where: { id: heat.id } })).mtrDocumentId !== doc.id) findings.push('heat cert of record not set');
    const dl = await fetch(`${BASE}/api/documents/${doc.id}/download`, { headers: H });
    if (dl.status !== 200 || (await dl.text()) !== '%PDF-1.4 qa test cert') findings.push(`download → ${dl.status} or wrong content`);
    const noAuth = await fetch(`${BASE}/api/documents/${doc.id}/download`);
    if (noAuth.status !== 401) findings.push(`download without signing in → ${noAuth.status}`);
    const cust = await fetch(`${BASE}/api/documents/${doc.id}/download`, { headers: { authorization: `Bearer ${await tokenFor('custA')}` } });
    if (cust.status !== 403) findings.push(`download as a customer login → ${cust.status}`);
    const del = await fetch(`${BASE}/api/documents/${doc.id}`, { method: 'DELETE', headers: H });
    if (del.status !== 200) findings.push(`delete → ${del.status}`);
    if ((await fetch(`${BASE}/api/documents/${doc.id}`, { headers: H })).status !== 404) findings.push('document still there after delete');
  }
  const bad = new FormData(); bad.append('file', new Blob(['MZ'], { type: 'application/x-msdownload' }), 'x.exe');
  const rej = await fetch(`${BASE}/api/documents/upload`, { method: 'POST', headers: H, body: bad });
  if (rej.status !== 400) findings.push(`program file upload → ${rej.status}`);
  const path_ = await raw('POST', '/api/documents', { token, body: { fileName: 'x', storagePath: '/etc/passwd', type: 'OTHER' } });
  if (path_.status !== 404) findings.push(`registering a document by server file path → ${path_.status}`);
  section('Documents: upload, list, download, delete', { pass: findings.length === 0, summary: `11 checks, ${findings.length} problems`, findings });
}

// 11. Web checkout: the system's price is saved whatever price or price level the browser sends.
{
  const token = await tokenFor('custB'); const H = { 'content-type': 'application/json', authorization: `Bearer ${token}` };
  const findings = [];
  const prod = await prisma.product.findFirst({ where: { isActive: true, priceUnit: 'EACH', basePriceCwt: { gt: 0 } } }) || await prisma.product.findFirst({ where: { isActive: true, form: 'SUPPLY' } });
  if (!prod) findings.push('no each-priced product to test with');
  else {
    const quote = await fetch(`${BASE}/api/ecom/pricing/config`, { method: 'POST', headers: H, body: JSON.stringify({ productId: prod.id, quantity: 3 }) }).then((r) => r.json()).catch(() => null);
    const fair = quote?.extended ?? quote?.data?.extended;
    if (!(fair > 0)) findings.push(`could not get a system price: ${JSON.stringify(quote).slice(0, 120)}`);
    else {
      const place = async (extended) => { const r = await fetch(`${BASE}/api/ecom/checkout/submit`, { method: 'POST', headers: H, body: JSON.stringify({ items: [{ productId: prod.id, quantity: 3, extended, sku: prod.sku }], deliveryMethod: 'PICKUP' }) }).then((x) => x.json()); return r?.data?.id ? prisma.onlineOrder.findUnique({ where: { id: r.data.id } }) : null; };
      const cheap = await place(0.03); const honest = await place(fair);
      const total = (o) => Number(o?.subtotal ?? o?.totalAmount ?? o?.total ?? NaN);
      if (!cheap || !/PRICE CORRECTED/.test(cheap.notes || '')) findings.push(`a 3-cent order for a ${fair} item was not corrected (notes: ${cheap?.notes})`);
      if (!(total(cheap) > 1) || Math.abs(total(cheap) - total(honest)) > 0.01) findings.push(`the 3-cent order was saved at ${total(cheap)}, an honest one at ${total(honest)}`);
      const claimed = await fetch(`${BASE}/api/ecom/checkout/submit`, { method: 'POST', headers: H, body: JSON.stringify({ priceLevel: 'CONTRACT_B', items: [{ productId: prod.id, quantity: 3, extended: +(fair * 0.85).toFixed(2), priceLevel: 'CONTRACT_B', sku: prod.sku }], deliveryMethod: 'PICKUP' }) }).then((x) => x.json());
      const claimedOrder = claimed?.data?.id ? await prisma.onlineOrder.findUnique({ where: { id: claimed.data.id } }) : null;
      if (!claimedOrder || Math.abs(total(claimedOrder) - total(honest)) > 0.01) findings.push(`claiming a contract price level in the request changed the price: ${total(claimedOrder)} vs ${total(honest)}`);
      const neg = await fetch(`${BASE}/api/ecom/checkout/submit`, { method: 'POST', headers: H, body: JSON.stringify({ items: [{ productId: prod.id, quantity: 3, extended: -5 }] }) });
      if (neg.status !== 400) findings.push(`negative price → ${neg.status}`);
    }
  }
  section('Web checkout uses the system price, not the browser\'s', { pass: findings.length === 0, summary: `4 checks, ${findings.length} problems`, findings });
}

// 10. Platform safeguards (Phase 2 findings E-001 to E-011, E-023). Each check fails if its fix is undone.
{
  const token = await tokenFor('admin');
  const findings = [];
  let checks = 0;
  const check = (name, ok, detail) => { checks++; if (!ok) findings.push(`${name}: ${detail}`); };
  const call = async (url, headers = {}) => {
    const res = await fetch(BASE + url, { headers: { authorization: `Bearer ${token}`, ...headers }, signal: AbortSignal.timeout(20000) });
    let body = null;
    try { body = await res.json(); } catch { /* not JSON */ }
    return { status: res.status, headers: res.headers, body };
  };

  // E-008 request tracing
  const traced = await call('/api/grades');
  check('E-008 every reply carries a request id', /^[0-9a-f-]{36}$/.test(traced.headers.get('x-request-id') || ''), traced.headers.get('x-request-id'));
  const echoed = await call('/api/grades', { 'x-request-id': 'qa-trace-12345678' });
  check('E-008 a well-formed incoming id is kept', echoed.headers.get('x-request-id') === 'qa-trace-12345678', echoed.headers.get('x-request-id'));
  const hostile = await call('/api/grades', { 'x-request-id': 'bad id <script>' });
  check('E-008 a malformed incoming id is replaced', /^[0-9a-f-]{36}$/.test(hostile.headers.get('x-request-id') || ''), hostile.headers.get('x-request-id'));

  // E-001, E-002 job list is bounded, counted, and honours filters
  const [jobTotal, openTotal] = await Promise.all([prisma.job.count(), prisma.job.count({ where: { status: { notIn: ['SHIPPED', 'COMPLETED', 'CANCELLED'] } } })]);
  const jobs = await call('/api/jobs');
  check('E-001 job list answers with a list', jobs.status === 200 && Array.isArray(jobs.body), `status ${jobs.status}`);
  check('E-001 job list is capped', (jobs.body?.length ?? 1e9) <= 1000, `${jobs.body?.length} rows`);
  check('E-001 job list reports the true total', Number(jobs.headers.get('x-total-count')) === jobTotal, `header ${jobs.headers.get('x-total-count')} vs ${jobTotal} in the database`);
  check('E-001 every open job is in the default list (when under the cap)', openTotal > 1000 || (jobs.body || []).filter((j) => !['SHIPPED', 'COMPLETED', 'CANCELLED'].includes(j.status)).length === openTotal, `${openTotal} open in the database`);
  const two = await call('/api/jobs?status=SHIPPED&limit=2');
  check('E-001 limit is honoured', Array.isArray(two.body) && two.body.length <= 2, `${two.body?.length} rows for limit=2`);
  const withOrder = await prisma.job.findFirst({ where: { orderId: { not: null } }, select: { orderId: true } });
  if (withOrder) {
    const forOrder = await call(`/api/jobs?orderId=${withOrder.orderId}`);
    const want = await prisma.job.count({ where: { orderId: withOrder.orderId } });
    check('E-002 the order filter returns only that order\'s jobs', Array.isArray(forOrder.body) && forOrder.body.length === want && forOrder.body.every((j) => (j.orderId || j.order?.id) === withOrder.orderId), `${forOrder.body?.length} rows, ${want} in the database`);
    check('E-002 jobs come back with their order detail', forOrder.body?.[0]?.order !== undefined, 'no order on the job');
  }

  // E-005 staging list is bounded
  const staging = await call('/api/material-tracking/staging');
  check('E-005 staging list is capped', staging.status === 200 && Array.isArray(staging.body) && staging.body.length <= 1200, `status ${staging.status}, ${staging.body?.length} rows`);

  // E-006 analytics report measured figures or say "not available"
  const margin = await call('/api/v1/analytics/margin');
  check('E-006 margin is reported as not available, not invented', margin.status === 200 && margin.body?.marginAvailable === false && margin.body?.avgMargin === null && margin.body?.topMarginCustomer === null && (margin.body?.byDivision || []).length === 0, JSON.stringify(margin.body).slice(0, 160));
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const revenue = await prisma.order.aggregate({ where: { orderType: 'SO', status: { not: 'CANCELLED' }, createdAt: { gte: today } }, _sum: { subtotal: true } });
  check('E-006 revenue today matches the database', Math.abs((margin.body?.revenueToday ?? -1) - Math.round(Number(revenue._sum.subtotal || 0))) <= 1, `${margin.body?.revenueToday} vs ${Math.round(Number(revenue._sum.subtotal || 0))}`);
  const funnel = await call('/api/v1/analytics/rfq-funnel');
  const since = new Date(); since.setDate(since.getDate() - 30);
  const rfqs = await prisma.rFQ.count({ where: { createdAt: { gte: since } } });
  check('E-006 RFQ funnel count matches the database', funnel.status === 200 && Math.abs(funnel.body?.rfqCount - rfqs) <= 1, `${funnel.body?.rfqCount} vs ${rfqs}`);
  check('E-006 response time is not invented', funnel.body?.avgResponseTime === null, String(funnel.body?.avgResponseTime));

  // E-007 shipping summary counts real statuses
  const ship = await call('/api/v1/shipping/summary');
  const [waiting, loading] = await Promise.all(['PENDING', 'LOADING'].map((status) => prisma.shipment.count({ where: { status, createdAt: { gte: today } } })));
  check('E-007 shipping summary matches the database', ship.status === 200 && Math.abs(ship.body.staged - waiting) <= 1 && Math.abs(ship.body.readyToShip - loading) <= 1, `staged ${ship.body?.staged} vs ${waiting}, ready ${ship.body?.readyToShip} vs ${loading}`);

  // E-023 operations cockpit totals come from the database
  // Make sure the QA data has a completed job, so the check below means something.
  if (!(await prisma.job.count({ where: { status: 'COMPLETED' } }))) {
    const done = await prisma.job.findFirst({ where: { status: 'SHIPPED' }, select: { id: true } });
    if (done) await prisma.job.update({ where: { id: done.id }, data: { status: 'COMPLETED' } });
  }
  const completedJobs = await prisma.job.count({ where: { status: 'COMPLETED' } });
  const cockpit = await call('/api/ops-cockpit');
  const [orders, coils, shipments, finished] = await Promise.all([prisma.order.count(), prisma.coil.count(), prisma.shipment.count(), prisma.job.count({ where: { status: { in: ['SHIPPED', 'COMPLETED'] } } })]);
  const sum = cockpit.body?.summary || {};
  check('E-023 cockpit answers', cockpit.status === 200, `status ${cockpit.status}`);
  check('E-023 cockpit totals match the database', Math.abs(sum.totalJobs - jobTotal) <= 2 && Math.abs(sum.totalOrders - orders) <= 2 && sum.totalCoils === coils && Math.abs(sum.totalShipments - shipments) <= 2, `jobs ${sum.totalJobs}/${jobTotal} orders ${sum.totalOrders}/${orders} stock ${sum.totalCoils}/${coils} shipments ${sum.totalShipments}/${shipments}`);
  check('E-023 completed jobs count as finished', Math.abs((cockpit.body?.flowState?.shipped ?? -1) - finished) <= 2, `${cockpit.body?.flowState?.shipped} vs ${finished}`);
  check('E-023 the QA data has a completed job to test with', completedJobs > 0, 'none');
  check('E-023 cockpit lists only open jobs as active', Math.abs(sum.activeJobs - openTotal) <= 2, `${sum.activeJobs} vs ${openTotal}`);

  // E-003, E-004 database structure
  const [{ n: unindexed }] = await prisma.$queryRawUnsafe(`select count(*)::int n from pg_constraint c where c.contype = 'f' and c.connamespace = 'public'::regnamespace and not exists (select 1 from pg_index i where i.indrelid = c.conrelid and (i.indkey::int2[])[0:array_length(c.conkey, 1) - 1] = c.conkey)`);
  check('E-003 every foreign key has an index', unindexed === 0, `${unindexed} without`);
  const rules = (await prisma.$queryRawUnsafe(`select conname from pg_constraint where contype = 'c' and connamespace = 'public'::regnamespace`)).map((r) => r.conname);
  for (const name of ['Inventory_qtyOnHand_not_negative', 'Inventory_qtyAvailable_not_negative', 'Inventory_qtyAllocated_not_negative', 'Inventory_qtyOnHold_not_negative', 'OrderLine_qtyOrdered_positive', 'OrderLine_qtyShipped_not_negative', 'ShipmentItem_qtyShipped_positive', 'Invoice_paid_within_total']) {
    check(`E-004 database check ${name} exists`, rules.includes(name), 'missing');
  }
  const anyStock = await prisma.inventory.findFirst({ select: { id: true } });
  if (anyStock) {
    // Tried inside a transaction that is always rolled back, so no data changes.
    let refused = false;
    try {
      await prisma.$transaction(async (tx) => {
        await tx.$executeRawUnsafe(`update "Inventory" set "qtyAvailable" = -1 where id = $1`, anyStock.id);
        throw new Error('ROLLBACK_PROBE');
      });
    } catch (e) { refused = !String(e.message).includes('ROLLBACK_PROBE'); }
    check('E-004 the database refuses negative stock', refused, 'the update was accepted');
    // E-020: on hand = available + reserved + on hold, enforced by the database.
    check('E-020 database check Inventory_balance_identity exists', rules.includes('Inventory_balance_identity'), 'missing');
    let unbalanced = false;
    try {
      await prisma.$transaction(async (tx) => {
        await tx.$executeRawUnsafe(`update "Inventory" set "qtyAvailable" = "qtyAvailable" + 1 where id = $1`, anyStock.id);
        throw new Error('ROLLBACK_PROBE');
      });
    } catch (e) { unbalanced = !String(e.message).includes('ROLLBACK_PROBE'); }
    check('E-020 the database refuses a stock balance that does not add up', unbalanced, 'the update was accepted');
  }

  section('Platform safeguards: bounded lists, tracing, real figures, database rules', { pass: findings.length === 0, summary: `${checks} checks, ${findings.length} problems`, findings });
}

// 9. Nothing above may have answered with database or server internals.
section('Error replies do not expose internals', { pass: leaks.size === 0, summary: `${leaks.size} replies exposed internal detail`, findings: [...leaks] });

// 13. One customer, one price (Phase 2 findings S-001 to S-004). The same customer and item
// must be priced the same in the web store, at order intake, in a quick sale and in a counter session.
{
  const findings = []; let checks = 0;
  const check = (name, ok, detail) => { checks++; if (!ok) findings.push(`${name}: ${detail}`); };
  const [admin, csrT, custA, custDiv] = await Promise.all(['admin', 'csr', 'custA', 'custDiv'].map(tokenFor));
  const call = async (method, url, token, body) => {
    const res = await fetch(BASE + url, { method, headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` }, body: body ? JSON.stringify(body) : undefined, signal: AbortSignal.timeout(20000) });
    let json = null; try { json = await res.json(); } catch { /* not JSON */ }
    return { status: res.status, body: json };
  };
  const company = await prisma.organization.findUnique({ where: { code: 'QA-C01' } });
  const division = await prisma.organization.findUnique({ where: { code: 'QA-C01-D1' } });
  const retailCustomer = await prisma.organization.findUnique({ where: { code: 'QA-C05' } });
  const csrUser = await prisma.user.findUnique({ where: { email: QA_USERS.csr } });
  const each = await prisma.product.findFirst({ where: { isActive: true, priceUnit: 'EACH', basePriceCwt: { gt: 0 } }, orderBy: { sku: 'asc' } });
  const cwt = await prisma.product.findFirst({ where: { isActive: true, priceUnit: 'CWT', basePriceCwt: { gt: 0 } }, orderBy: { sku: 'asc' } });
  const level = await prisma.priceLevel.findUnique({ where: { code: 'CONTRACT_B' } });
  const before = await prisma.customerPricingTier.findUnique({ where: { customerId: company.id } });
  if (!each || !cwt || !level) findings.push('needs an each-priced product, a weight-priced product and the CONTRACT_B price level');
  else {
    const mult = Number(level.multiplier); const list = Number(each.basePriceCwt); const listCwt = Number(cwt.basePriceCwt);
    const near = (a, b, tol = 0.006) => Number.isFinite(Number(a)) && Math.abs(Number(a) - b) <= tol;
    const setTier = (data) => prisma.customerPricingTier.upsert({ where: { customerId: company.id }, update: data, create: { customerId: company.id, tierCode: 'A', marginFloor: 10, marginTarget: 18, ...data } });
    // A counter session with one each-priced and one weight-priced line for the given customer.
    const counter = async (customerId) => {
      const s = await call('POST', '/api/pos/sessions', csrT, { userId: csrUser.id, entryPoint: 'counter', terminalId: `QA-PRICE-${Date.now()}` });
      const sid = s.body?.sessionId; const go = (trigger, payload) => call('POST', `/api/pos/sessions/${sid}/transition`, csrT, { trigger, payload });
      await go('start_order'); await call('POST', `/api/pos/sessions/${sid}/customers/select`, csrT, { customerId }); await go('continue');
      let last = null;
      for (const [p, unit, quantity] of [[each, 'EA', 3], [cwt, 'LB', 250]]) { await go('search_product'); await go('product_selected', { productId: p.id }); last = await call('POST', `/api/pos/sessions/${sid}/products/add`, csrT, { productId: p.id, quantity, unit, description: p.name, unitPrice: 0.01, priceUnit: 'CWT' }); }
      return { sid, lines: last?.body?.context?.lines || [] };
    };
    try {
      await setTier({ tierCode: 'A', isActive: true, effectiveFrom: new Date(Date.now() - 86400000), effectiveUntil: null });
      const want = +(list * mult).toFixed(4); const wantTotal = Math.round(want * 3 * 100) / 100;

      // Web store, as the company login and as a login on one of its divisions.
      for (const [who, token] of [['company login', custA], ['division login', custDiv]]) {
        const web = await call('POST', '/api/ecom/pricing/config', token, { productId: each.id, quantity: 3, priceLevel: 'RETAIL' });
        check(`web store, ${who}: contract price`, near(web.body?.unitPrice, want) && near(web.body?.extended, wantTotal), `${web.body?.unitPrice} / ${web.body?.extended}, want ${want} / ${wantTotal}`);
      }
      const other = await tokenFor('custB');
      const lied = await call('POST', '/api/ecom/pricing/config', other, { productId: each.id, quantity: 3, priceLevel: 'CONTRACT_B', customerId: company.id });
      check('web store: another customer cannot ask for this customer\'s level', near(lied.body?.unitPrice, list), `${lied.body?.unitPrice}, want list ${list}`);

      // Order intake: the level lookup and the line calculator, for the company and for its division.
      for (const [who, id] of [['company', company.id], ['division', division.id]]) {
        const c = await call('GET', `/api/pricing/contracts?customerId=${id}`, csrT);
        check(`order intake, ${who}: level found`, c.body?.priceLevel === 'CONTRACT_B' && near(c.body?.data?.contracts?.[0]?.multiplier, mult, 1e-9), `${c.body?.priceLevel} ${JSON.stringify(c.body?.data)}`);
        const calc = await call('POST', '/api/pricing/calculate', csrT, { productId: each.id, customerId: id, priceLevel: 'RETAIL', qty: 3 });
        check(`order intake, ${who}: contract price`, near(calc.body?.unitPrice, want) && near(calc.body?.materialTotal, wantTotal), `${calc.body?.unitPrice} / ${calc.body?.materialTotal}`);
      }
      const noTier = await call('POST', '/api/pricing/calculate', csrT, { productId: each.id, customerId: retailCustomer.id, priceLevel: 'CONTRACT_B', qty: 3 });
      check('order intake: a customer with no tier pays list whatever level is sent', near(noTier.body?.unitPrice, list), `${noTier.body?.unitPrice}, want ${list}`);

      // Quick sale.
      const qs = await call('POST', '/api/pos/quick-sale/price', csrT, { sale: { customerId: company.id, items: [{ productId: each.id, quantity: 3, unitPrice: 0.01 }] } });
      check('quick sale: contract price', near(qs.body?.subtotal, Math.round(Math.round(want * 100) / 100 * 3 * 100) / 100, 0.011), `${qs.body?.subtotal}, want about ${wantTotal}`);
      const qsWalkIn = await call('POST', '/api/pos/quick-sale/price', csrT, { sale: { items: [{ productId: each.id, quantity: 3 }] } });
      check('quick sale: a walk-in pays list', near(qsWalkIn.body?.subtotal, Math.round(list * 3 * 100) / 100), `${qsWalkIn.body?.subtotal}`);

      // Counter session: catalog price at the customer's level, in the product's own unit.
      const tiered = await counter(company.id);
      check('counter session: each-priced line at the contract price', near(tiered.lines[0]?.unitPrice, want) && near(tiered.lines[0]?.extendedPrice, wantTotal) && tiered.lines[0]?.priceUnit === 'EACH', JSON.stringify(tiered.lines[0])?.slice(0, 200));
      check('counter session: weight-priced line at the contract price', near(tiered.lines[1]?.unitPrice, +(listCwt * mult).toFixed(4)) && near(tiered.lines[1]?.extendedPrice, Math.round(listCwt * mult * 2.5 * 100) / 100) && tiered.lines[1]?.priceUnit === 'CWT', JSON.stringify(tiered.lines[1])?.slice(0, 200));
      const retail = await counter(retailCustomer.id);
      check('counter session: a customer with no tier pays the catalog list price', near(retail.lines[0]?.unitPrice, list) && near(retail.lines[1]?.unitPrice, listCwt) && near(retail.lines[1]?.extendedPrice, Math.round(listCwt * 2.5 * 100) / 100), `each ${retail.lines[0]?.unitPrice} (list ${list}), cwt ${retail.lines[1]?.unitPrice} (list ${listCwt})`);

      // Counter discounts stay within the sale and only a manager approves.
      const d = (body, token = csrT) => call('POST', `/api/pos/sessions/${retail.sid}/pricing/discount`, token, body);
      check('counter discount: more than 100 percent is refused', (await d({ type: 'PERCENTAGE', value: 150 })).status === 400, 'accepted');
      check('counter discount: a negative amount is refused', (await d({ type: 'FIXED', value: -50, amount: -50 })).status === 400, 'accepted');
      check('counter discount: more than the sale is refused', (await d({ type: 'FIXED', value: 1e6, amount: 1e6 })).status === 400, 'accepted');
      const ok = await d({ type: 'PERCENTAGE', value: 5 });
      check('counter discount: 5 percent is accepted', ok.status === 200 && ok.body?.discount?.id, `status ${ok.status}`);
      const approve = await call('POST', `/api/pos/sessions/${retail.sid}/pricing/discount/${ok.body?.discount?.id}/approve`, csrT, { approverId: 'anyone', approverPin: '0000' });
      check('counter discount: a clerk cannot approve by typing a PIN', approve.status === 403, `status ${approve.status}`);

      // An expired or switched-off tier pays list in every channel.
      for (const [what, data] of [['expired', { effectiveUntil: new Date(Date.now() - 3600000) }], ['not yet started', { effectiveUntil: null, effectiveFrom: new Date(Date.now() + 86400000) }], ['switched off', { effectiveFrom: new Date(Date.now() - 86400000), isActive: false }]]) {
        await setTier(data);
        const web = await call('POST', '/api/ecom/pricing/config', custA, { productId: each.id, quantity: 3 });
        const calc = await call('POST', '/api/pricing/calculate', csrT, { productId: each.id, customerId: company.id, qty: 3 });
        const quick = await call('POST', '/api/pos/quick-sale/price', csrT, { sale: { customerId: company.id, items: [{ productId: each.id, quantity: 1 }] } });
        check(`a tier that is ${what} pays list everywhere`, near(web.body?.unitPrice, list) && near(calc.body?.unitPrice, list) && near(quick.body?.subtotal, Math.round(list * 100) / 100), `web ${web.body?.unitPrice}, intake ${calc.body?.unitPrice}, quick sale ${quick.body?.subtotal}, list ${list}`);
      }
      void admin;
    } finally {
      // Leave the customer as it was found.
      if (before) { const { id, createdAt, updatedAt, ...rest } = before; void id; void createdAt; void updatedAt; await prisma.customerPricingTier.update({ where: { customerId: company.id }, data: rest }); }
      else await prisma.customerPricingTier.deleteMany({ where: { customerId: company.id } });
    }
  }
  // The pricing tier chosen on the customer screen is the one prices use (finding S-013).
  {
    const target = await prisma.organization.findUnique({ where: { code: 'QA-C08' } });
    const item = await prisma.product.findFirst({ where: { isActive: true, priceUnit: 'EACH', basePriceCwt: { gt: 0 } }, orderBy: { sku: 'asc' } });
    const [adminT2, csrT2] = await Promise.all(['admin', 'csr'].map(tokenFor));
    const put = (token, body) => fetch(`${BASE}/api/customers/${target.id}/preferences`, { method: 'PUT', headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` }, body: JSON.stringify(body) }).then(async (r) => ({ status: r.status, body: await r.json().catch(() => null) }));
    const price = async () => (await fetch(`${BASE}/api/pricing/calculate`, { method: 'POST', headers: { 'content-type': 'application/json', authorization: `Bearer ${csrT2}` }, body: JSON.stringify({ productId: item.id, customerId: target.id, qty: 1 }) }).then((r) => r.json())).unitPrice;
    const listPrice = Number(item.basePriceCwt);
    try {
      const clerk = await put(csrT2, { pricingTier: 'A', creditLimit: 999999 });
      check('customer screen: a clerk cannot give a customer a pricing tier or credit limit', clerk.status === 403 && Math.abs(await price() - listPrice) < 0.006, `status ${clerk.status}, price ${await price()}`);
      const mgr = await put(adminT2, { pricingTier: 'A', creditLimit: 50000 });
      const levelB = Number((await prisma.priceLevel.findUnique({ where: { code: 'CONTRACT_B' } })).multiplier);
      check('customer screen: a manager sets the tier and the price follows at once', mgr.status === 200 && Math.abs(await price() - +(listPrice * levelB).toFixed(4)) < 0.006, `status ${mgr.status}, price ${await price()}, want ${+(listPrice * levelB).toFixed(4)}`);
      const logged = await prisma.auditLog.count({ where: { eventType: 'CUSTOMER_PRICING_CHANGED', resourceId: target.id } });
      check('customer screen: the tier change is in the audit log', logged >= 1, `${logged} entries`);
      const other = await put(csrT2, { pricingTier: 'A', creditLimit: 50000, preferredCarrier: 'XPO' });
      check('customer screen: a clerk can still save other preferences', other.status === 200, `status ${other.status}`);
      // S-014: the save used two field names the database does not have, so it always failed.
      const tolSave = await put(csrT2, { pricingTier: 'A', creditLimit: 50000, preferredCarrier: 'XPO', thkTolerancePlus: 0.02, lenToleranceMinus: 0.05, internalNotes: 'staff only note' });
      const kept = await prisma.customerPreference.findUnique({ where: { customerId: target.id } });
      check('customer screen: tolerances are saved', tolSave.status === 200 && Number(kept?.thkTolerancePlus) === 0.02 && Number(kept?.lenToleranceMinus) === 0.05 && Number(kept?.widTolerancePlus) === 0.063, `status ${tolSave.status}, thk+ ${kept?.thkTolerancePlus}, len- ${kept?.lenToleranceMinus}, wid+ ${kept?.widTolerancePlus}`);
      check('customer screen: an unknown tier is refused', (await put(adminT2, { pricingTier: 'Z' })).status === 400, 'accepted');
      const off = await put(adminT2, { pricingTier: '', creditLimit: 50000 });
      check('customer screen: removing the tier returns the customer to list price', off.status === 200 && Math.abs(await price() - listPrice) < 0.006, `status ${off.status}, price ${await price()}`);
    } finally {
      await prisma.customerPricingTier.deleteMany({ where: { customerId: target.id } });
      await prisma.customerPreference.deleteMany({ where: { customerId: target.id } });
    }
  }
  // S-015, S-016: the customer record itself.
  {
    const adminT3 = await tokenFor('admin');
    const acct = await prisma.organization.findUnique({ where: { code: 'QA-C01' } });
    const send = (method, url, token, body) => fetch(BASE + url, { method, headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` }, body: body ? JSON.stringify(body) : undefined }).then(async (r) => ({ status: r.status, body: await r.json().catch(() => null) }));
    await prisma.customerPreference.upsert({ where: { customerId: acct.id }, update: { internalNotes: 'QA staff only note', contractNotes: 'QA terms note', creditLimit: 12345 }, create: { customerId: acct.id, internalNotes: 'QA staff only note', contractNotes: 'QA terms note', creditLimit: 12345, preferredCarrier: 'XPO' } });
    try {
      const own = await send('GET', `/api/customers/${acct.id}/preferences`, await tokenFor('custA'));
      const text = JSON.stringify(own.body || {});
      check('a customer login reads its store defaults without the staff-only notes and terms', own.status === 200 && own.body?.data?.preferredCarrier === 'XPO' && !/QA staff only note|QA terms note|12345|internalNotes|creditLimit|pricingTier|discountPct/.test(text), `status ${own.status}, ${text.slice(0, 160)}`);
      const staff = await send('GET', `/api/customers/${acct.id}/preferences`, adminT3);
      check('staff still see the notes', staff.body?.data?.internalNotes === 'QA staff only note', JSON.stringify(staff.body?.data?.internalNotes));
      const edit = await send('PATCH', `/api/customers/${acct.id}`, adminT3, { code: 'HACKED', id: 'x', createdAt: '2000-01-01', phone: '555-0100' });
      const after = await prisma.organization.findUnique({ where: { id: acct.id } });
      check('editing a customer changes only the editable fields', edit.status === 200 && after.code === 'QA-C01' && after.phone === '555-0100' && after.createdAt.getFullYear() > 2000, `status ${edit.status}, code ${after?.code}, phone ${after?.phone}`);
      check('a customer cannot be its own parent account', (await send('PATCH', `/api/customers/${acct.id}`, adminT3, { parentId: acct.id })).status === 400, 'accepted');
      check('an unknown customer answers not found', (await send('PATCH', '/api/customers/no-such-id', adminT3, { phone: '1' })).status === 404, 'not a 404');
      const before = await prisma.auditLog.count({ where: { eventType: 'CUSTOMER_TAX_STATUS_CHANGED', resourceId: acct.id } });
      await send('PATCH', `/api/customers/${acct.id}`, adminT3, { taxExempt: !acct.taxExempt });
      const logged = await prisma.auditLog.count({ where: { eventType: 'CUSTOMER_TAX_STATUS_CHANGED', resourceId: acct.id } });
      check('a change of tax-exempt status is in the audit log', logged === before + 1, `${logged - before} new entries`);
      check('a new customer needs a code and a name', (await send('POST', '/api/customers', adminT3, { code: 'QA-NONAME' })).status === 400, 'accepted');
      check('a customer code cannot be used twice', (await send('POST', '/api/customers', adminT3, { code: 'QA-C01', name: 'Duplicate' })).status === 409, 'accepted');
    } finally {
      await prisma.organization.update({ where: { id: acct.id }, data: { taxExempt: acct.taxExempt, phone: acct.phone, parentId: acct.parentId } });
      await prisma.customerPreference.deleteMany({ where: { customerId: acct.id } });
    }
  }
  // S-017, S-018: the price book and list-price changes.
  {
    const [mgrT, clerkT] = await Promise.all(['admin', 'csr'].map(tokenFor));
    const send = (method, url, token, body) => fetch(BASE + url, { method, headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` }, body: body ? JSON.stringify(body) : undefined }).then(async (r) => ({ status: r.status, body: await r.json().catch(() => null) }));
    const item = await prisma.product.findFirst({ where: { isActive: true, priceUnit: 'EACH', basePriceCwt: { gt: 0 } }, orderBy: { sku: 'desc' } });
    const was = Number(item.basePriceCwt);
    const lvl = Object.fromEntries((await prisma.priceLevel.findMany({ where: { isActive: true } })).map((l) => [l.code, Number(l.multiplier)]));
    const book = await send('GET', `/api/pricing/price-list?search=${encodeURIComponent(item.sku)}&limit=5`, clerkT);
    const row = (book.body?.data || []).find((r) => r.id === item.id);
    check('price book: shows the list price and each level\'s price from the database', book.status === 200 && row && Math.abs(row.listPrice - was) < 0.00005 && Object.keys(lvl).every((c) => Math.abs(row.prices[c] - +(was * lvl[c]).toFixed(4)) < 0.00005), JSON.stringify(row ?? null).slice(0, 200));
    check('price book: the list is capped', (await send('GET', '/api/pricing/price-list?limit=99999', clerkT)).body?.data?.length <= 200, 'more than 200 rows');
    const over = await send('GET', '/api/pricing/overview', clerkT);
    const tierRows = await prisma.customerPricingTier.count();
    check('price book: tier accounts and product counts match the database', over.status === 200 && over.body?.accounts?.length === Math.min(tierRows, 1000) && over.body?.products?.withListPrice === await prisma.product.count({ where: { isActive: true, basePriceCwt: { gt: 0 } } }), `status ${over.status}, ${over.body?.accounts?.length} accounts vs ${tierRows}`);
    try {
      const clerk = await send('PUT', `/api/pricing/list-price/${item.id}`, clerkT, { listPrice: was + 1 });
      check('list price: a clerk cannot change it', clerk.status === 403 && Math.abs(Number((await prisma.product.findUnique({ where: { id: item.id } })).basePriceCwt) - was) < 0.00005, `status ${clerk.status}`);
      for (const bad of [0, -5, 'abc', null]) {
        check(`list price: ${JSON.stringify(bad)} is refused`, (await send('PUT', `/api/pricing/list-price/${item.id}`, mgrT, { listPrice: bad })).status === 400, 'accepted');
      }
      check('list price: an unknown product answers not found', (await send('PUT', '/api/pricing/list-price/no-such-product', mgrT, { listPrice: 5 })).status === 404, 'not a 404');
      const before = await prisma.auditLog.count({ where: { eventType: 'LIST_PRICE_CHANGED', resourceId: item.id } });
      const mgr = await send('PUT', `/api/pricing/list-price/${item.id}`, mgrT, { listPrice: was + 1 });
      const quoted = await send('POST', '/api/pricing/calculate', clerkT, { productId: item.id, qty: 1 });
      check('list price: a manager changes it and the next price uses it', mgr.status === 200 && Math.abs(Number(quoted.body?.unitPrice ?? quoted.body?.data?.unitPrice) - (was + 1)) < 0.006, `status ${mgr.status}, next price ${JSON.stringify(quoted.body).slice(0, 120)}`);
      const logs = await prisma.auditLog.findMany({ where: { eventType: 'LIST_PRICE_CHANGED', resourceId: item.id }, orderBy: { timestamp: 'desc' } });
      check('list price: the change is in the audit log with the old and new price', logs.length === before + 1 && Math.abs(logs[0]?.details?.from - was) < 0.00005 && Math.abs(logs[0]?.details?.to - (was + 1)) < 0.00005, `${logs.length - before} new entries, ${JSON.stringify(logs[0]?.details)}`);
    } finally {
      await prisma.product.update({ where: { id: item.id }, data: { basePriceCwt: item.basePriceCwt } });
    }
  }
  section('One customer, one price in every sales channel', { pass: findings.length === 0, summary: `${checks} checks, ${findings.length} problems`, findings });
}

// 14. Order entry screen API (Phase 2 finding S-006). /api/orders/intake is what the CSR
// order-entry screen calls. It must follow the same rules as the rest of the order system.
{
  const findings = []; let checks = 0;
  const check = (name, ok, detail) => { checks++; if (!ok) findings.push(`${name}: ${detail}`); };
  const csrT = await tokenFor('csr');
  const call = async (method, url, body) => {
    const res = await fetch(BASE + url, { method, headers: { 'content-type': 'application/json', authorization: `Bearer ${csrT}` }, body: body ? JSON.stringify(body) : undefined, signal: AbortSignal.timeout(20000) });
    const text = await res.text(); let json = null; try { json = JSON.parse(text); } catch { /* not JSON */ }
    return { status: res.status, body: json, text };
  };
  const csrUser = await prisma.user.findUnique({ where: { email: QA_USERS.csr } });
  const customer = await prisma.organization.findUnique({ where: { code: 'QA-C06' } });
  const product = await prisma.product.findFirst({ where: { isActive: true, priceUnit: 'CWT', basePriceCwt: { gt: 0 } }, orderBy: { sku: 'asc' } });
  const line = (over = {}) => ({ productId: product.id, description: 'QA intake line', qty: 200, uom: 'LB', unitPrice: 0.5, extPrice: 100, ...over });
  const miBranch = await prisma.location.findFirst({ where: { state: 'MI' }, orderBy: { code: 'asc' } });
  const create = (over = {}) => call('POST', '/api/orders/intake', { source: 'PHONE', division: 'METALS', location: miBranch.code, priority: 'STANDARD', customerId: customer.id, customerName: customer.name, lines: [line(), line({ qty: 100, extPrice: 50 })], status: 'DRAFT', ...over });
  const row = (id) => prisma.order.findUnique({ where: { id }, include: { lines: { orderBy: { lineNumber: 'asc' } } } });

  const made = await create();
  const id = made.body?.data?.id;
  check('a draft order is created', made.status === 201 && id, `status ${made.status}`);
  if (id) {
    let saved = await row(id);
    check('the order is recorded under the person who entered it', saved.createdById === csrUser.id, `createdById ${saved.createdById}, signed in as ${csrUser.id}`);
    const rateFor = async (state) => Number((state ? await prisma.salesTaxRate.findUnique({ where: { state } }) : null)?.rate || 0);
    const cents = (n) => Math.round(n * 100) / 100;
    // Rule 27: tax follows the selling branch. This customer is in another state, with no rate of its own.
    const wantTax = cents(150 * await rateFor('MI'));
    check('order totals are saved from the lines, with sales tax for the selling branch state', Math.abs(Number(saved.subtotal) - 150) < 0.005 && Math.abs(Number(saved.taxAmount) - wantTax) < 0.005 && Math.abs(Number(saved.totalAmount) - (150 + wantTax)) < 0.005, `subtotal ${saved.subtotal}, tax ${saved.taxAmount} (want ${wantTax} for the MI branch; customer is in ${customer.state}), total ${saved.totalAmount}`);
    const estimate = await call('POST', '/api/pricing/tax-estimate', { subtotal: 150, customerId: customer.id, location: miBranch.code });
    check('the tax shown on the screen is the tax saved on the order', Math.abs(Number(estimate.body?.taxAmount) - wantTax) < 0.005, `screen ${estimate.body?.taxAmount}, order ${wantTax}`);
    // Shipping to another state does not change the tax; an exempt customer pays none.
    const shipped = await create({ shipToState: 'IN' });
    const shippedRow = await row(shipped.body?.data?.id);
    check('an order shipped to another state is still taxed at the selling branch state rate', wantTax > 0 && Math.abs(Number(shippedRow?.taxAmount) - wantTax) < 0.005, `tax ${shippedRow?.taxAmount}, want ${wantTax}`);
    const ohBranch = await prisma.location.findFirst({ where: { state: 'OH' }, orderBy: { code: 'asc' } });
    const fromOhio = await create({ location: ohBranch.code });
    const ohioRow = await row(fromOhio.body?.data?.id);
    check('the same order sold from a branch in another state is taxed at that branch state rate', Math.abs(Number(ohioRow?.taxAmount) - cents(150 * await rateFor('OH'))) < 0.005, `tax ${ohioRow?.taxAmount}, want ${cents(150 * await rateFor('OH'))}`);
    const exemptCustomer = await prisma.organization.findUnique({ where: { code: 'QA-C07' } });
    await prisma.organization.update({ where: { id: exemptCustomer.id }, data: { taxExempt: true } });
    try {
      const ex = await create({ customerId: exemptCustomer.id });
      const exRow = await row(ex.body?.data?.id);
      check('a tax-exempt customer is charged no tax', Number(exRow?.taxAmount) === 0 && Math.abs(Number(exRow?.totalAmount) - 150) < 0.005, `tax ${exRow?.taxAmount}, total ${exRow?.totalAmount}`);
    } finally { await prisma.organization.update({ where: { id: exemptCustomer.id }, data: { taxExempt: exemptCustomer.taxExempt } }); }
    const branch = await prisma.location.findFirst({ where: { state: 'OH' }, orderBy: { code: 'asc' } });
    const retail = await create({ source: 'RETAIL', customerId: undefined, customerName: 'Walk-In', location: branch.code, status: 'SUBMITTED' });
    const retailRow = await prisma.order.findUnique({ where: { id: retail.body?.data?.id || FAKE_ID }, include: { buyer: true } });
    check('a Retail POS sale with no account is sold to the walk-in account and taxed at the branch', retail.status === 201 && retailRow?.buyer?.code === 'WALK-IN' && retailRow?.status === 'PENDING' && Math.abs(Number(retailRow?.taxAmount) - cents(150 * await rateFor('OH'))) < 0.005, `status ${retail.status}, buyer ${retailRow?.buyer?.code}, tax ${retailRow?.taxAmount}, want ${cents(150 * await rateFor('OH'))}`);
    check('line prices are saved in the unit they were entered in', saved.lines[0].priceUnit === 'LB' && Math.abs(Number(saved.lines[0].extendedPrice) - 100) < 0.005, `${saved.lines[0].priceUnit} ${saved.lines[0].extendedPrice}`);

    // Bad input is refused with a clear message.
    for (const [what, over] of [
      ['a negative quantity', { lines: [line({ qty: -5 })] }],
      ['a zero quantity', { lines: [line({ qty: 0 })] }],
      ['a negative price', { lines: [line({ unitPrice: -1, extPrice: -200 })] }],
      ['a customer that does not exist', { customerId: FAKE_ID }],
      ['a starting status other than draft or submitted', { status: 'COMPLETE' }],
    ]) {
      const r = await create(over);
      check(`${what} is refused`, r.status === 400, `status ${r.status} ${r.text.slice(0, 100)}`);
      check(`${what}: the reply does not expose internals`, !LEAK.test(r.text), r.text.slice(0, 120));
    }

    // Editing a draft replaces the lines and keeps the totals right.
    const edited = await call('PATCH', `/api/orders/intake/${id}`, { lines: [line({ qty: 300, extPrice: 150 })] });
    saved = await row(id);
    check('editing a draft updates lines and totals together', edited.status === 200 && saved.lines.length === 1 && Math.abs(Number(saved.subtotal) - 150) < 0.005 && Math.abs(Number(saved.totalAmount) - (150 + wantTax)) < 0.005 && Math.abs(Number(saved.lines[0].qtyOrdered) - 300) < 1e-9, `status ${edited.status}, ${saved.lines.length} lines, subtotal ${saved.subtotal}`);
    const badEdit = await call('PATCH', `/api/orders/intake/${id}`, { lines: [line({ qty: -1 })] });
    saved = await row(id);
    check('a bad edit is refused and the lines are left alone', badEdit.status === 400 && saved.lines.length === 1, `status ${badEdit.status}, ${saved.lines.length} lines`);
    for (const status of ['COMPLETE', 'PARTIAL', 'SHIPPED', 'CONFIRMED']) {
      const r = await call('PATCH', `/api/orders/intake/${id}`, { status });
      check(`the status cannot be set to ${status} from the entry screen`, r.status >= 400 && r.status < 500 && (await row(id)).status === 'DRAFT', `status ${r.status}, order is ${(await row(id)).status}`);
    }

    // Stock reserved for a line is given back when the lines are replaced.
    const stock = await prisma.inventory.findFirst({ where: { qtyAvailable: { gte: 500 }, coil: { status: 'AVAILABLE', qcStatus: { notIn: ['FAILED', 'HOLD'] } } }, orderBy: { coilId: 'asc' } });
    saved = await row(id);
    if (!saved.lines[0]) findings.push('the order has no lines left to reserve stock against');
    else if (stock) {
      const reserve = await call('POST', `/api/orders/${id}/allocate`, { lineId: saved.lines[0].id, coilId: stock.coilId, qty: 100 });
      const during = await prisma.inventory.findUnique({ where: { coilId: stock.coilId } });
      await call('PATCH', `/api/orders/intake/${id}`, { lines: [line({ qty: 250, extPrice: 125 })] });
      const after = await prisma.inventory.findUnique({ where: { coilId: stock.coilId } });
      check('stock reserved for a replaced line goes back on the shelf', reserve.status === 201 && Number(during.qtyAllocated) === Number(stock.qtyAllocated) + 100 && Number(after.qtyAllocated) === Number(stock.qtyAllocated) && Number(after.qtyAvailable) === Number(stock.qtyAvailable), `reserve ${reserve.status}; allocated ${stock.qtyAllocated} → ${during.qtyAllocated} → ${after.qtyAllocated}; available ${stock.qtyAvailable} → ${after.qtyAvailable}`);
    }

    // Submit, then work orders, exactly once.
    const empty = await create({ lines: [] });
    const emptySubmit = await call('POST', `/api/orders/intake/${empty.body?.data?.id}/submit`);
    check('an order with no lines cannot be submitted', emptySubmit.status === 400 || emptySubmit.status === 409, `status ${emptySubmit.status}`);
    const submit = await call('POST', `/api/orders/intake/${id}/submit`);
    check('a draft is submitted', submit.status === 200 && (await row(id)).status === 'PENDING', `status ${submit.status}`);
    const jobs1 = await call('POST', `/api/orders/intake/${id}/create-work-orders`);
    const jobs2 = await call('POST', `/api/orders/intake/${id}/create-work-orders`);
    const jobCount = await prisma.job.count({ where: { orderId: id } });
    const lineCount = (await row(id)).lines.length;
    check('work orders are created once per line, however many times the button is pressed', jobs1.status === 200 && jobCount === lineCount, `${jobCount} jobs for ${lineCount} lines (second call status ${jobs2.status})`);
    const job = await prisma.job.findFirst({ where: { orderId: id } });
    check('work orders are recorded under the person who made them', job?.createdById === csrUser.id, `createdById ${job?.createdById}`);
    check('the order is confirmed once it has work orders', (await row(id)).status === 'CONFIRMED', (await row(id)).status);
    const lateEdit = await call('PATCH', `/api/orders/intake/${id}`, { lines: [line({ qty: 1, extPrice: 0.5 })] });
    check('lines cannot be replaced once the order is confirmed', lateEdit.status === 409 && (await prisma.job.count({ where: { orderId: id } })) === lineCount, `status ${lateEdit.status}`);

    // A cancelled or finished order stays that way.
    const dead = await create();
    const deadId = dead.body?.data?.id;
    await prisma.order.update({ where: { id: deadId }, data: { status: 'CANCELLED' } });
    const revive = await call('POST', `/api/orders/intake/${deadId}/submit`);
    const reviveJobs = await call('POST', `/api/orders/intake/${deadId}/create-work-orders`);
    const reviveEdit = await call('PATCH', `/api/orders/intake/${deadId}`, { status: 'DRAFT' });
    check('a cancelled order cannot be submitted, given work orders or reopened', revive.status === 409 && reviveJobs.status === 409 && reviveEdit.status === 409 && (await row(deadId)).status === 'CANCELLED' && (await prisma.job.count({ where: { orderId: deadId } })) === 0, `submit ${revive.status}, work orders ${reviveJobs.status}, edit ${reviveEdit.status}, now ${(await row(deadId)).status}`);
    const huge = await call('GET', '/api/orders/intake?limit=1000000');
    check('the order list is capped', huge.status === 200 && (huge.body?.data?.length ?? 1e9) <= 200, `${huge.body?.data?.length} rows`);
  }
  // Overrides at order entry are kept on the server (finding S-011), not in the browser.
  {
    const adminT = await tokenFor('admin');
    const as = async (token, method, url, body) => { const res = await fetch(BASE + url, { method, headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` }, body: body ? JSON.stringify(body) : undefined }); let json = null; try { json = await res.json(); } catch { /* not JSON */ } return { status: res.status, body: json }; };
    const ref = `QA-OVR-${Date.now()}`;
    const made2 = await as(csrT, 'POST', '/api/overrides', { type: 'CUTOFF_VIOLATION', reasonCode: 'CUSTOMER_EMERGENCY', notes: 'QA sweep', orderId: ref, orderNumber: ref, user: 'someone-else', userName: 'Someone Else' });
    const stored = made2.body?.data?.id ? await prisma.auditLog.findUnique({ where: { id: made2.body.data.id } }) : null;
    check('an override is saved in the audit log under the signed-in user', made2.status === 201 && stored?.userId === csrUser.id && stored?.eventType === 'ORDER_OVERRIDE' && made2.body.data.user === QA_USERS.csr, `status ${made2.status}, userId ${stored?.userId}`);
    check('an override needs a known type and a reason', (await as(csrT, 'POST', '/api/overrides', { type: 'ANYTHING', reasonCode: 'X' })).status === 400 && (await as(csrT, 'POST', '/api/overrides', { type: 'PRICING_OVERRIDE' })).status === 400, 'accepted');
    const forOrder = await as(csrT, 'GET', `/api/overrides?orderId=${ref}`);
    check('the override is listed on its order', forOrder.body?.data?.length === 1 && forOrder.body.data[0].status === 'ACTIVE', JSON.stringify(forOrder.body).slice(0, 120));
    check('a clerk cannot read the override log or revoke', (await as(csrT, 'GET', '/api/overrides/audit')).status === 403 && (await as(csrT, 'POST', `/api/overrides/${made2.body?.data?.id}/revoke`, { reason: 'x' })).status === 403, 'allowed');
    const log = await as(adminT, 'GET', `/api/overrides/audit?orderId=${ref}`);
    check('a manager sees it in the override log', log.status === 200 && log.body?.meta?.total === 1, `status ${log.status}, total ${log.body?.meta?.total}`);
    const revoked = await as(adminT, 'POST', `/api/overrides/${made2.body?.data?.id}/revoke`, { reason: 'QA revoke' });
    const again = await as(adminT, 'POST', `/api/overrides/${made2.body?.data?.id}/revoke`, { reason: 'QA revoke' });
    const history = await prisma.auditLog.count({ where: { resourceId: ref } });
    check('a manager revokes once, and the original entry is kept', revoked.status === 200 && revoked.body?.data?.status === 'REVOKED' && again.status === 409 && history === 2, `revoke ${revoked.status}, again ${again.status}, ${history} log rows`);
  }
  // Sales figures on the dashboards are counted from the database (findings S-012, D-036).
  {
    const dash = await call('GET', '/api/sales-dashboard?range=month');
    const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const [rfqs, sent, wonQuotes, openSum] = await Promise.all([
      prisma.rFQ.count({ where: { createdAt: { gte: monthStart } } }),
      prisma.quote.count({ where: { status: { in: ['SENT', 'COUNTERED'] } } }),
      prisma.quote.count({ where: { status: 'ACCEPTED', updatedAt: { gte: monthStart } } }),
      prisma.quote.aggregate({ where: { status: { in: ['DRAFT', 'PENDING_APPROVAL', 'SENT', 'COUNTERED'] } }, _sum: { totalAmount: true } }),
    ]);
    const d = dash.body || {};
    check('sales dashboard counts match the database', dash.status === 200 && Math.abs(d.pipeline?.newRfqs - rfqs) <= 1 && d.pipeline?.awaitingCustomer === sent && Math.abs(d.pipeline?.won - wonQuotes) <= 1 && Math.abs(d.pipeline?.openValue - Number(openSum._sum.totalAmount || 0)) < 0.01, `rfqs ${d.pipeline?.newRfqs}/${rfqs}, sent ${d.pipeline?.awaitingCustomer}/${sent}, won ${d.pipeline?.won}/${wonQuotes}, open ${d.pipeline?.openValue}/${Number(openSum._sum.totalAmount || 0)}`);
    check('sales dashboard rates are real percentages or blank', [d.performance?.winRate, d.performance?.conversionRate].every((v) => v === null || (v >= 0 && v <= 100)) && d.performance?.avgMargin === null, JSON.stringify(d.performance));
    const mine = await call('GET', '/api/orders/intake/summary');
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const myToday = await prisma.order.count({ where: { orderType: 'SO', createdById: csrUser.id, status: { notIn: ['CANCELLED', 'DRAFT'] }, createdAt: { gte: today } } });
    check('a rep\'s own figures match the database', mine.status === 200 && Math.abs(mine.body?.data?.ordersToday - myToday) <= 1, `${mine.body?.data?.ordersToday} vs ${myToday}`);
  }
  section('Order entry screen follows the order rules', { pass: findings.length === 0, summary: `${checks} checks, ${findings.length} problems`, findings });
}

// 15. Stock items (Phase 2 Workstream 3, findings I-001 to I-006). /api/coils is what the
// Units screens and the order screen's stock picker call.
{
  const findings = []; let checks = 0;
  const check = (name, ok, detail) => { checks++; if (!ok) findings.push(`${name}: ${detail}`); };
  const [adminT, csrT, shipT] = await Promise.all(['admin', 'csr', 'shipping'].map(tokenFor));
  const send = async (method, url, token, body) => {
    const res = await fetch(BASE + url, { method, headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` }, body: body ? JSON.stringify(body) : undefined, signal: AbortSignal.timeout(20000) });
    return { status: res.status, headers: res.headers, body: await res.json().catch(() => null) };
  };
  const adminUser = await prisma.user.findUnique({ where: { email: QA_USERS.admin } });
  const csrUser = await prisma.user.findUnique({ where: { email: QA_USERS.csr } });
  // Two QA items with stock and nothing reserved: one for the hold checks, one to ship.
  const free = await prisma.inventory.findMany({ where: { coil: { coilNumber: { startsWith: 'QA-' }, status: 'AVAILABLE' }, qtyAllocated: 0, qtyOnHold: 0, qtyAvailable: { gte: 500 } }, include: { coil: true }, orderBy: { coil: { coilNumber: 'desc' } }, take: 2 });
  if (free.length < 2) findings.push('fewer than two free QA stock items: rebuild the QA database');
  else {
    const [a, b] = free;
    const original = await prisma.coil.findUnique({ where: { id: a.coilId } });
    await prisma.coil.update({ where: { id: a.coilId }, data: { unitCost: 0.4321, landedCost: 0.4567 } });
    try {
      // I-001 list: bounded, counted, searched on the server
      // The sales login is assigned to the QA branches, so that is what it lists (lib/branchScope.js).
      const total = await prisma.coil.count({ where: { location: { code: { startsWith: 'QA-L' } } } });
      const list = await send('GET', '/api/coils?limit=5', csrT);
      check('list is a capped list with the true total', list.status === 200 && Array.isArray(list.body) && list.body.length <= 5 && Number(list.headers.get('x-total-count')) === total, `status ${list.status}, ${list.body?.length} rows, total header ${list.headers.get('x-total-count')} vs ${total}`);
      check('list limit has a ceiling', ((await send('GET', '/api/coils?limit=99999', csrT)).body?.length ?? 1e9) <= 500, 'more than 500 rows');
      const found = await send('GET', `/api/coils?search=${encodeURIComponent(a.coil.coilNumber)}`, csrT);
      check('search by item number runs on the server', found.status === 200 && found.body?.length === 1 && found.body[0].id === a.coilId, `${found.body?.length} rows`);
      check('an unknown status filter is refused', (await send('GET', '/api/coils?status=NOPE', csrT)).status === 400, 'accepted');

      // I-002 cost stays with the roles that manage it
      const asClerk = JSON.stringify([(await send('GET', `/api/coils/${a.coilId}`, csrT)).body, found.body, (await send('GET', '/api/inventory', csrT)).body, (await send('GET', `/api/inventory/search?search=${encodeURIComponent(a.coil.coilNumber)}`, csrT)).body]);
      check('a sales login is never sent cost', !/unitCost|landedCost|0\.4321|0\.4567/.test(asClerk), asClerk.match(/.{0,40}(unitCost|landedCost|0\.4321|0\.4567).{0,20}/)?.[0]);
      const asManager = (await send('GET', `/api/coils/${a.coilId}`, adminT)).body;
      check('a manager still sees cost', Number(asManager?.unitCost) === 0.4321 && Number(asManager?.landedCost) === 0.4567, `${asManager?.unitCost}, ${asManager?.landedCost}`);
      const priced = await prisma.coil.findFirst({ where: { product: { basePriceCwt: { gt: 0 }, priceUnit: 'CWT' } }, include: { product: true } });
      if (priced) {
        // The priced items are demo stock at a branch the sales login is not in, so it is assigned to that branch for this read.
        const csrSeat = await prisma.userLocation.create({ data: { userId: csrUser.id, locationId: priced.locationId } }).catch(() => null);
        const got = (await send('GET', `/api/coils/${priced.id}`, csrT)).body;
        if (csrSeat) await prisma.userLocation.delete({ where: { id: csrSeat.id } });
        check('the item carries its product list price per pound', Math.abs(got?.listPrice - Number(priced.product.basePriceCwt) / 100) < 0.00006 && got?.listPriceUnit === 'LB', `${got?.listPrice} ${got?.listPriceUnit} vs ${Number(priced.product.basePriceCwt) / 100}`);
      }

      // I-003 edits and new items take only their own fields
      const edit = await send('PUT', `/api/coils/${a.coilId}`, adminT, { status: 'SHIPPED', qcStatus: 'FAILED', coilNumber: 'HACKED', netWeightLb: 1, locationId: 'x', finish: 'QA finish' });
      const afterEdit = await prisma.coil.findUnique({ where: { id: a.coilId } });
      check('editing an item changes descriptive fields only', edit.status === 200 && afterEdit.finish === 'QA finish' && afterEdit.status === 'AVAILABLE' && afterEdit.coilNumber === a.coil.coilNumber && Number(afterEdit.netWeightLb) === Number(original.netWeightLb) && afterEdit.locationId === original.locationId, `status ${edit.status}, item status ${afterEdit.status}, number ${afterEdit.coilNumber}`);
      check('an edit with nothing editable is refused', (await send('PUT', `/api/coils/${a.coilId}`, adminT, { status: 'SHIPPED' })).status === 400, 'accepted');
      check('a negative size is refused', (await send('PUT', `/api/coils/${a.coilId}`, adminT, { widthIn: -4 })).status === 400, 'accepted');
      check('an unknown item answers not found', (await send('PUT', '/api/coils/no-such-item', adminT, { finish: 'x' })).status === 404, 'not a 404');
      const shipUser = await send('PUT', `/api/coils/${a.coilId}`, shipT, { unitCost: 9 });
      check('cost cannot be changed by a role that cannot see it', shipUser.status === 403 && Number((await prisma.coil.findUnique({ where: { id: a.coilId } })).unitCost) === 0.4321, `status ${shipUser.status}`);
      check('a new item needs a number, heat, grade, form and weight', (await send('POST', '/api/coils', adminT, { coilNumber: 'QA-SWEEP-NEW' })).status === 400, 'accepted');
      check('an item number cannot be used twice', (await send('POST', '/api/coils', adminT, { coilNumber: a.coil.coilNumber, heatId: original.heatId, gradeId: original.gradeId, form: 'COIL', netWeightLb: 100 })).status === 409, 'accepted');

      // I-004 holds
      const before = await prisma.inventory.findUnique({ where: { coilId: a.coilId } });
      check('a hold needs a known type', (await send('POST', `/api/coils/${a.coilId}/hold`, adminT, { holdType: 'NOPE', holdReason: 'x' })).status === 400, 'accepted');
      check('a hold needs a reason', (await send('POST', `/api/coils/${a.coilId}/hold`, adminT, { holdType: 'QUALITY', holdReason: ' ' })).status === 400, 'accepted');
      check('a hold on an unknown item answers not found', (await send('POST', '/api/coils/no-such-item/hold', adminT, { holdType: 'QUALITY', holdReason: 'x' })).status === 404, 'not a 404');
      const hold = await send('POST', `/api/coils/${a.coilId}/hold`, adminT, { holdType: 'QUALITY', holdReason: 'QA sweep hold', holdById: csrUser.id });
      const held = await prisma.inventory.findUnique({ where: { coilId: a.coilId }, include: { coil: { include: { qcHolds: true } } } });
      check('a hold takes the available quantity out of sale', hold.status === 201 && held.coil.status === 'HOLD' && Number(held.qtyAvailable) === 0 && Number(held.qtyOnHold) === Number(before.qtyAvailable) && Number(held.qtyOnHand) === Number(before.qtyOnHand), `status ${hold.status}, available ${held.qtyAvailable}, on hold ${held.qtyOnHold}, was available ${before.qtyAvailable}`);
      check('the hold is recorded under the signed-in person, not a name sent by the browser', held.coil.qcHolds.some((h) => h.status === 'ACTIVE' && h.holdById === adminUser.id), JSON.stringify(held.coil.qcHolds.map((h) => h.holdById)));
      check('an item cannot be put on hold twice', (await send('POST', `/api/coils/${a.coilId}/hold`, adminT, { holdType: 'QUALITY', holdReason: 'again' })).status === 409, 'accepted');
      const sum = await send('GET', '/api/inventory/summary', csrT);
      check('held stock shows in the stock summary', Number(sum.body?.totalOnHold) >= Number(before.qtyAvailable), `totalOnHold ${sum.body?.totalOnHold}`);
      const release = await send('POST', `/api/coils/${a.coilId}/release`, adminT, { notes: 'QA sweep release' });
      const freed = await prisma.inventory.findUnique({ where: { coilId: a.coilId }, include: { coil: { include: { qcHolds: true } } } });
      check('a release puts the held quantity back on sale', release.status === 200 && freed.coil.status === 'AVAILABLE' && Number(freed.qtyOnHold) === 0 && Number(freed.qtyAvailable) === Number(before.qtyAvailable), `status ${release.status}, item ${freed.coil.status}, available ${freed.qtyAvailable}, on hold ${freed.qtyOnHold}`);
      check('the release is recorded with who released it', freed.coil.qcHolds.every((h) => h.status === 'RELEASED' && h.resolvedById === adminUser.id), JSON.stringify(freed.coil.qcHolds.map((h) => [h.status, h.resolvedById])));
      check('an item that is not on hold cannot be released', (await send('POST', `/api/coils/${a.coilId}/release`, adminT, {})).status === 409, 'accepted');
      const history = await send('GET', `/api/coils/${a.coilId}/history`, csrT);
      check('the item history lists the hold and the release', history.status === 200 && ['HOLD', 'RELEASE', 'CREATED'].every((t) => history.body?.events?.some((e) => e.type === t)), `status ${history.status}, ${(history.body?.events || []).map((e) => e.type).join(',')}`);

      // I-005 stock on hold cannot be shipped, even when it is already reserved for the order
      const customer = await prisma.organization.findFirst({ where: { code: 'QA-C03' } });
      const order = (await send('POST', '/api/orders', adminT, { orderType: 'SO', buyerId: customer.id, status: 'DRAFT', subtotal: 100, taxAmount: 0, freightAmount: 0, totalAmount: 100, poReference: 'QA-SWEEP-HOLD', lines: [{ lineNumber: 1, description: 'QA hold check', qtyOrdered: 200, unit: 'LB', unitPrice: 0.5, priceUnit: 'LB', extendedPrice: 100, gradeId: b.coil.gradeId }] })).body;
      const line = order?.lines?.[0] || (order?.id ? await prisma.orderLine.findFirst({ where: { orderId: order.id } }) : null);
      if (!order?.id || !line) findings.push(`could not create the test order: ${JSON.stringify(order).slice(0, 120)}`);
      else {
        await send('PUT', `/api/orders/${order.id}`, adminT, { status: 'CONFIRMED' });
        const reserved = await send('POST', `/api/orders/${order.id}/allocate`, adminT, { lineId: line.id, coilId: b.coilId, qty: 200 });
        const shipment = await send('POST', '/api/shipments', shipT, { orderId: order.id, fromLocationId: b.locationId, carrierName: 'Own Truck', items: [{ orderLineId: line.id, qtyShipped: 200, weightLb: 200 }] });
        const bHold = await send('POST', `/api/coils/${b.coilId}/hold`, adminT, { holdType: 'DAMAGE', holdReason: 'QA sweep: damaged after it was reserved' });
        const bHeld = await prisma.inventory.findUnique({ where: { coilId: b.coilId } });
        check('holding a reserved item keeps the reservation and holds the rest', reserved.status < 300 && bHold.status === 201 && Number(bHeld.qtyAllocated) === 200 && Number(bHeld.qtyAvailable) === 0 && Math.abs(Number(bHeld.qtyOnHand) - (200 + Number(bHeld.qtyOnHold))) < 0.001, `reserve ${reserved.status}, hold ${bHold.status}, reserved ${bHeld.qtyAllocated}, on hold ${bHeld.qtyOnHold}, on hand ${bHeld.qtyOnHand}`);
        const blocked = await send('PUT', `/api/shipments/${shipment.body?.id}/dispatch`, shipT, {});
        const still = await prisma.inventory.findUnique({ where: { coilId: b.coilId } });
        check('a shipment of stock that is on hold is refused and nothing moves', blocked.status === 409 && Number(still.qtyOnHand) === Number(bHeld.qtyOnHand) && (await prisma.shipment.findUnique({ where: { id: shipment.body?.id } }))?.status === 'PENDING', `status ${blocked.status}, on hand ${still.qtyOnHand}`);
        const bRelease = await send('POST', `/api/coils/${b.coilId}/release`, adminT, {});
        check('releasing a reserved item returns it to reserved, not available', bRelease.status === 200 && (await prisma.coil.findUnique({ where: { id: b.coilId } })).status === 'ALLOCATED', `status ${bRelease.status}`);
        const sent = await send('PUT', `/api/shipments/${shipment.body?.id}/dispatch`, shipT, {});
        check('once released, the shipment goes out', sent.status === 200, `status ${sent.status} ${JSON.stringify(sent.body).slice(0, 100)}`);
      }
    } finally {
      await prisma.coil.update({ where: { id: a.coilId }, data: { unitCost: original.unitCost, landedCost: original.landedCost, finish: original.finish } });
    }
  }
  section('Stock items: lists, cost, edits, holds', { pass: findings.length === 0, summary: `${checks} checks, ${findings.length} problems`, findings });
}

// 16. Credit hold (rule 32, the owner's decision on finding S-019): an order that would put a
// customer over their credit limit is saved on hold with a warning, and a manager releases it.
{
  const findings = []; let checks = 0;
  const check = (name, ok, detail) => { checks++; if (!ok) findings.push(`${name}: ${detail}`); };
  const [adminT, csrT] = await Promise.all(['admin', 'csr'].map(tokenFor));
  const send = async (method, url, token, body) => {
    const res = await fetch(BASE + url, { method, headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` }, body: body ? JSON.stringify(body) : undefined, signal: AbortSignal.timeout(20000) });
    return { status: res.status, body: await res.json().catch(() => null) };
  };
  const adminUser = await prisma.user.findUnique({ where: { email: QA_USERS.admin } });
  // QA-C09 with a division of its own, so the shared limit can be checked. Nothing else uses this account.
  const account = await prisma.organization.findUnique({ where: { code: 'QA-C09' } });
  const division = await prisma.organization.upsert({ where: { code: 'QA-C09-D1' }, update: { parentId: account.id }, create: { code: 'QA-C09-D1', name: 'QA Customer 09 Division 1', type: account.type, parentId: account.id, state: account.state } });
  const family = [account.id, division.id];
  const setLimit = (creditLimit) => prisma.customerPricingTier.upsert({ where: { customerId: account.id }, update: { creditLimit }, create: { customerId: account.id, tierCode: 'D', marginFloor: 0, marginTarget: 0, creditLimit } });
  const owedNow = async () => {
    const [inv, open] = await Promise.all([
      prisma.invoice.findMany({ where: { status: { not: 'CANCELLED' }, order: { buyerId: { in: family } } } }),
      prisma.order.findMany({ where: { orderType: 'SO', buyerId: { in: family }, status: { in: ['PENDING', 'CONFIRMED', 'PARTIAL'] } }, include: { invoices: { where: { status: { not: 'CANCELLED' }, kind: 'INVOICE' } } } }),
    ]);
    return inv.reduce((n, i) => n + Number(i.totalAmount) - Number(i.paidAmount), 0) + open.reduce((n, o) => n + Math.max(Number(o.totalAmount || 0) - o.invoices.reduce((m, i) => m + Number(i.totalAmount), 0), 0), 0);
  };
  const base = Math.round(await owedNow() * 100) / 100;
  const plain = (buyerId, amount, status = 'CONFIRMED') => send('POST', '/api/orders', csrT, { orderType: 'SO', buyerId, status, subtotal: amount, taxAmount: 0, freightAmount: 0, totalAmount: amount, poReference: 'QA-SWEEP-CREDIT', lines: [{ lineNumber: 1, description: 'QA credit check', qtyOrdered: 100, unit: 'LB', unitPrice: amount / 100, priceUnit: 'LB', extendedPrice: amount }] });
  const row = (id) => prisma.order.findUnique({ where: { id } });
  const made = [];
  try {
    // No limit set: nothing is held.
    await prisma.customerPricingTier.deleteMany({ where: { customerId: account.id } });
    const free = await plain(account.id, 5000);
    made.push(free.body?.id);
    check('a customer with no credit limit is never held', free.status === 201 && free.body?.status === 'CONFIRMED' && !free.body?.creditHold, `status ${free.status}, order ${free.body?.status}`);

    // Limit leaves room for 1,000 more.
    await setLimit(base + 5000 + 1000);
    const within = await plain(account.id, 1000);
    made.push(within.body?.id);
    check('an order that lands exactly on the limit goes through', within.status === 201 && within.body?.status === 'CONFIRMED', `order ${within.body?.status}`);
    const draft = await plain(account.id, 800, 'DRAFT');
    made.push(draft.body?.id);
    check('a draft is not held: nothing is committed yet', draft.body?.status === 'DRAFT' && !draft.body?.creditHold, `order ${draft.body?.status}`);

    const over = await plain(account.id, 250);
    made.push(over.body?.id);
    const hold = over.body?.creditHold;
    check('an order that would pass the limit is saved on hold with a warning', over.status === 201 && over.body?.status === 'HOLD' && /credit hold/i.test(over.body?.warning || '') && (await row(over.body.id)).status === 'HOLD', `status ${over.status}, order ${over.body?.status}, warning ${over.body?.warning}`);
    check('the warning carries the limit, the exposure and the amount over', hold && Math.abs(hold.limit - (base + 6000)) < 0.01 && Math.abs(hold.exposure - (base + 6250)) < 0.01 && Math.abs(hold.overBy - 250) < 0.01, JSON.stringify(hold ?? null));
    const placed = await prisma.auditLog.findFirst({ where: { eventType: 'CREDIT_HOLD_PLACED', resourceId: over.body.id } });
    check('the hold is in the audit log', Boolean(placed) && placed.details?.wantedStatus === 'CONFIRMED', JSON.stringify(placed?.details ?? null));

    // A division shares its parent's limit.
    const div = await plain(division.id, 10);
    made.push(div.body?.id);
    check('a division shares the limit of its parent account', div.body?.status === 'HOLD', `order ${div.body?.status}`);

    // Confirming a draft is the same decision.
    const confirmDraft = await send('PUT', `/api/orders/${draft.body.id}`, csrT, { status: 'CONFIRMED' });
    check('confirming a draft that would pass the limit puts it on hold', confirmDraft.status === 200 && confirmDraft.body?.status === 'HOLD' && Boolean(confirmDraft.body?.creditHold), `status ${confirmDraft.status}, order ${confirmDraft.body?.status}`);

    // Nobody but a manager moves a held order on.
    const sneak = await send('PUT', `/api/orders/${over.body.id}`, csrT, { status: 'CONFIRMED' });
    check('a held order cannot be confirmed around the hold', sneak.status === 409 && (await row(over.body.id)).status === 'HOLD', `status ${sneak.status}`);
    const clerk = await send('POST', `/api/orders/${over.body.id}/credit-release`, csrT, {});
    check('a clerk cannot release a credit hold', clerk.status === 403 && (await row(over.body.id)).status === 'HOLD', `status ${clerk.status}`);
    const queue = await send('GET', '/api/orders/credit-holds', csrT);
    check('held orders are listed for managers', queue.status === 200 && queue.body?.canRelease === false && [over.body.id, div.body.id, draft.body.id].every((id) => queue.body?.data?.some?.((r) => r.id === id)), `status ${queue.status}, ${queue.body?.data?.length} rows`);
    const detail = await send('GET', `/api/orders/${over.body.id}`, csrT);
    check('the order itself says it is on credit hold', /credit hold/i.test(detail.body?.creditHold?.message || ''), JSON.stringify(detail.body?.creditHold ?? null).slice(0, 120));

    const release = await send('POST', `/api/orders/${over.body.id}/credit-release`, adminT, { note: 'QA sweep: approved by the credit manager' });
    check('a manager releases the hold and the order goes ahead', release.status === 200 && release.body?.status === 'CONFIRMED' && (await row(over.body.id)).status === 'CONFIRMED', `status ${release.status}, order ${release.body?.status}`);
    const released = await prisma.auditLog.findFirst({ where: { eventType: 'CREDIT_HOLD_RELEASED', resourceId: over.body.id } });
    check('the release is recorded with who released it and their note', released?.userId === adminUser.id && released?.details?.note === 'QA sweep: approved by the credit manager', JSON.stringify([released?.userId, released?.details?.note]));
    check('an order cannot be released twice', (await send('POST', `/api/orders/${over.body.id}/credit-release`, adminT, {})).status === 409, 'accepted');
    check('an unknown order answers not found', (await send('POST', '/api/orders/no-such-order/credit-release', adminT, {})).status === 404, 'not a 404');
    const after = await send('GET', '/api/orders/credit-holds', adminT);
    check('a released order leaves the list', after.body?.canRelease === true && Array.isArray(after.body?.data) && !after.body.data.some((r) => r.id === over.body.id), 'still listed');

    // The order entry screen's own API.
    const entry = await send('POST', '/api/orders/intake', csrT, { source: 'PHONE', division: 'METALS', priority: 'STANDARD', customerId: account.id, customerName: account.name, status: 'SUBMITTED', lines: [{ description: 'QA credit check', qty: 100, uom: 'LB', unitPrice: 1, extPrice: 100, lineType: 'MATERIAL' }] });
    made.push(entry.body?.data?.id);
    check('the order entry screen saves an over-limit order on hold and says why', entry.status === 201 && entry.body?.data?.status === 'HOLD' && /credit hold/i.test(entry.body?.warning || ''), `status ${entry.status}, order ${entry.body?.data?.status}`);
    const wo = await send('POST', `/api/orders/intake/${entry.body?.data?.id}/create-work-orders`, csrT, {});
    check('work orders cannot be started for an order on credit hold', wo.status === 409 && /credit hold/i.test(wo.body?.error || '') && (await prisma.job.count({ where: { orderId: entry.body?.data?.id } })) === 0, `status ${wo.status} ${wo.body?.error}`);
    const entryDraft = await send('POST', '/api/orders/intake', csrT, { source: 'PHONE', division: 'METALS', priority: 'STANDARD', customerId: account.id, customerName: account.name, status: 'DRAFT', lines: [{ description: 'QA credit check', qty: 100, uom: 'LB', unitPrice: 1, extPrice: 100, lineType: 'MATERIAL' }] });
    made.push(entryDraft.body?.data?.id);
    const submit = await send('POST', `/api/orders/intake/${entryDraft.body?.data?.id}/submit`, csrT, {});
    check('submitting a draft from the entry screen is held the same way', submit.status === 200 && submit.body?.data?.status === 'HOLD' && Boolean(submit.body?.creditHold), `status ${submit.status}, order ${submit.body?.data?.status}`);

    // Raising the limit lets new orders through; it does not release what is already held.
    await setLimit(base + 1000000);
    const roomy = await plain(account.id, 250);
    made.push(roomy.body?.id);
    check('after the limit is raised a new order goes through', roomy.body?.status === 'CONFIRMED', `order ${roomy.body?.status}`);
    check('an order already on hold still waits for a manager', (await row(div.body.id)).status === 'HOLD', 'released by itself');
  } finally {
    // Leave the account as it was found: no limit, no test orders counted against it.
    await prisma.order.updateMany({ where: { id: { in: made.filter(Boolean) } }, data: { status: 'CANCELLED' } });
    await prisma.customerPricingTier.deleteMany({ where: { customerId: account.id } });
  }
  section('Credit hold: over the limit waits for a manager', { pass: findings.length === 0, summary: `${checks} checks, ${findings.length} problems`, findings });
}

// 17. Heats, products and grades: the catalog behind every stock item. Writes used to store
// whatever the browser sent (findings I-004, S-025) and anyone could change a list price through
// the product record, around rule 30.
{
  const findings = []; let checks = 0;
  const check = (name, ok, detail) => { checks++; if (!ok) findings.push(`${name}: ${detail}`); };
  const [adminT, csrT, operatorT] = await Promise.all(['admin', 'csr', 'operator'].map(tokenFor));
  const send = async (method, url, token, body) => {
    const res = await fetch(BASE + url, { method, headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` }, body: body ? JSON.stringify(body) : undefined, signal: AbortSignal.timeout(20000) });
    return { status: res.status, body: await res.json().catch(() => null), total: res.headers.get('x-total-count') };
  };
  const tag = `QA17-${Date.now().toString(36).toUpperCase()}`;
  const adminUser = await prisma.user.findUnique({ where: { email: QA_USERS.admin } });
  const shipper = await prisma.user.findUnique({ where: { email: QA_USERS.shipping } });
  const mill = await prisma.organization.findFirst({ where: { type: 'MILL' } });
  const grade = await prisma.grade.findFirst({ orderBy: { code: 'asc' } });
  const made = { heats: [], products: [], grades: [] };
  try {
    // ── Heats ──
    const list = await send('GET', '/api/heats?limit=5', csrT);
    check('heats list is capped and says how many there are', list.status === 200 && Array.isArray(list.body) && list.body.length <= 5 && Number(list.total) >= list.body.length && list.body.every((h) => typeof h.unitCount === 'number' && h.mill?.name && h.grade?.code), `status ${list.status}, total ${list.total}`);
    const some = list.body?.[0];
    const found = some ? await send('GET', `/api/heats?search=${encodeURIComponent(some.heatNumber)}`, csrT) : { body: [] };
    check('heats can be searched by number', Array.isArray(found.body) && found.body.some((h) => h.id === some?.id), `${found.body?.length} rows`);
    check('an unknown heat status is refused', (await send('GET', '/api/heats?status=NOPE', csrT)).status === 400, 'not a 400');
    const mills = await send('GET', '/api/heats/mills', csrT);
    check('the mills a heat can be recorded against are listed', mills.status === 200 && Array.isArray(mills.body) && mills.body.some((m) => m.id === mill.id), `status ${mills.status}`);

    const good = { heatNumber: `${tag}-H1`, millId: mill.id, gradeId: grade.id, castDate: '2026-03-01', meltType: 'EAF', totalWeightLb: 42000, chemistry: { C: 0.2, Mn: 0.85 } };
    const forged = await send('POST', '/api/heats', operatorT, { ...good, id: 'forged-id', createdById: adminUser.id, createdAt: '2001-01-01T00:00:00Z', mtrDocumentId: 'nope' });
    made.heats.push(forged.body?.id);
    const operatorUser = await prisma.user.findUnique({ where: { email: QA_USERS.operator } });
    const saved = forged.body?.id ? await prisma.heat.findUnique({ where: { id: forged.body.id } }) : null;
    check('a heat is saved with the listed fields only, and who created it comes from the sign-in', forged.status === 201 && saved && saved.id !== 'forged-id' && saved.createdById === operatorUser.id && saved.mtrDocumentId === null && saved.createdAt.getFullYear() > 2020, `status ${forged.status} ${JSON.stringify(forged.body).slice(0, 160)}`);
    check('the same heat number cannot be entered twice', (await send('POST', '/api/heats', operatorT, good)).status === 409, 'accepted');
    for (const [why, body] of [
      ['no heat number', { ...good, heatNumber: '' }], ['no mill', { ...good, heatNumber: `${tag}-H2`, millId: undefined }],
      ['a mill that does not exist', { ...good, heatNumber: `${tag}-H2`, millId: 'no-such-mill' }], ['a grade that does not exist', { ...good, heatNumber: `${tag}-H2`, gradeId: 'no-such-grade' }],
      ['a cast date that is not a date', { ...good, heatNumber: `${tag}-H2`, castDate: 'yesterday' }], ['a negative weight', { ...good, heatNumber: `${tag}-H2`, totalWeightLb: -5 }],
      ['an unknown melt type', { ...good, heatNumber: `${tag}-H2`, meltType: 'MAGIC' }], ['chemistry that is a list', { ...good, heatNumber: `${tag}-H2`, chemistry: [1, 2] }],
    ]) {
      const r = await send('POST', '/api/heats', operatorT, body);
      if (r.body?.id) made.heats.push(r.body.id);
      check(`a heat with ${why} is refused with a reason`, r.status === 400 && typeof r.body?.error === 'string' && r.body.error.length > 5, `status ${r.status}`);
    }
    check('sales staff cannot add a heat', (await send('POST', '/api/heats', csrT, { ...good, heatNumber: `${tag}-H3` })).status === 403, 'accepted');
    const edit = saved ? await send('PUT', `/api/heats/${saved.id}`, operatorT, { status: 'ARCHIVED', totalWeightLb: 41000, createdById: adminUser.id }) : { status: 0 };
    const edited = saved ? await prisma.heat.findUnique({ where: { id: saved.id } }) : null;
    check('a heat can be edited, and only its listed fields change', edit.status === 200 && edited?.status === 'ARCHIVED' && Number(edited.totalWeightLb) === 41000 && edited.createdById === operatorUser.id, `status ${edit.status}`);
    check('editing a heat that does not exist answers not found', (await send('PUT', '/api/heats/no-such-heat', operatorT, { status: 'ACTIVE' })).status === 404, 'not a 404');
    const withStock = await prisma.heat.findFirst({ where: { coils: { some: {} } } });
    if (withStock) {
      const rename = await send('PUT', `/api/heats/${withStock.id}`, adminT, { heatNumber: `${tag}-RENAMED` });
      check('a heat with stock on it keeps its number', rename.status === 409 && (await prisma.heat.findUnique({ where: { id: withStock.id } })).heatNumber === withStock.heatNumber, `status ${rename.status}`);
      const one = await send('GET', `/api/heats/${withStock.id}`, csrT);
      check('a heat shows its stock items without their cost', one.status === 200 && one.body.coils.length > 0 && one.body.coils.every((c) => !('unitCost' in c) && !('landedCost' in c)), JSON.stringify(Object.keys(one.body?.coils?.[0] || {})).slice(0, 200));
      const trace = await send('GET', `/api/heats/${encodeURIComponent(withStock.heatNumber)}/trace`, csrT);
      check('the heat trace does not send cost to sales staff', trace.status === 200 && trace.body.coils.length > 0 && trace.body.coils.every((c) => !('unitCost' in c) && !('landedCost' in c)), 'cost present');
      const bossTrace = await send('GET', `/api/heats/${encodeURIComponent(withStock.heatNumber)}/trace`, adminT);
      check('a manager still sees cost on the heat trace', bossTrace.body?.coils?.every((c) => 'unitCost' in c), 'cost missing for a manager');
    }

    // ── Products ──
    const product = { sku: `${tag}-P1`, name: 'QA sweep product', productType: 'FLAT', form: 'PLATE', division: 'METALS', thicknessMin: 0.25, thicknessMax: 0.5 };
    check('a clerk cannot add a product', (await send('POST', '/api/products', csrT, product)).status === 403, 'accepted');
    check('a machine operator cannot add a product', (await send('POST', '/api/products', operatorT, product)).status === 403, 'accepted');
    const p1 = await send('POST', '/api/products', adminT, { ...product, id: 'forged', createdAt: '2001-01-01T00:00:00Z', basePriceCwt: 55 });
    made.products.push(p1.body?.id);
    check('a manager adds a product; fields that are not on the form are ignored', p1.status === 201 && p1.body.id !== 'forged' && Number(p1.body.basePriceCwt) === 55 && new Date(p1.body.createdAt).getFullYear() > 2020, `status ${p1.status} ${JSON.stringify(p1.body).slice(0, 160)}`);
    check('the same SKU cannot be added twice', (await send('POST', '/api/products', adminT, product)).status === 409, 'accepted');
    for (const [why, body] of [
      ['no name', { ...product, sku: `${tag}-P2`, name: '' }], ['an unknown form', { ...product, sku: `${tag}-P2`, form: 'CLOUD' }],
      ['a price of zero', { ...product, sku: `${tag}-P2`, basePriceCwt: 0 }], ['a price that is text', { ...product, sku: `${tag}-P2`, basePriceCwt: 'cheap' }],
      ['a minimum thickness above the maximum', { ...product, sku: `${tag}-P2`, thicknessMin: 2, thicknessMax: 1 }], ['a grade that does not exist', { ...product, sku: `${tag}-P2`, gradeId: 'no-such-grade' }],
    ]) {
      const r = await send('POST', '/api/products', adminT, body);
      if (r.body?.id) made.products.push(r.body.id);
      check(`a product with ${why} is refused with a reason`, r.status === 400 && typeof r.body?.error === 'string', `status ${r.status}`);
    }
    if (p1.body?.id) {
      const sneak = await send('PUT', `/api/products/${p1.body.id}`, csrT, { basePriceCwt: 1 });
      check('a clerk cannot change a list price through the product record', sneak.status === 403 && Number((await prisma.product.findUnique({ where: { id: p1.body.id } })).basePriceCwt) === 55, `status ${sneak.status}`);
      // A buyer keeps the catalog but does not set prices.
      await prisma.user.update({ where: { id: shipper.id }, data: { role: 'BUYER' } });
      const buyer = await fetch(`${BASE}/api/auth/login`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email: QA_USERS.shipping, password: 'qa-password-1' }) }).then((r) => r.json());
      const rename = await send('PUT', `/api/products/${p1.body.id}`, buyer.token, { name: 'QA sweep product, renamed', basePriceCwt: 55 });
      check('a buyer can change a product description', rename.status === 200 && rename.body?.name === 'QA sweep product, renamed', `status ${rename.status} ${rename.body?.error || ''}`);
      const reprice = await send('PUT', `/api/products/${p1.body.id}`, buyer.token, { basePriceCwt: 60 });
      check('a buyer cannot change the list price', reprice.status === 403 && Number((await prisma.product.findUnique({ where: { id: p1.body.id } })).basePriceCwt) === 55, `status ${reprice.status}`);
      const priced = await send('POST', '/api/products', buyer.token, { ...product, sku: `${tag}-P3`, basePriceCwt: 10 });
      if (priced.body?.id) made.products.push(priced.body.id);
      check('a buyer cannot add a product with a price', priced.status === 403, `status ${priced.status}`);
      const unpriced = await send('POST', '/api/products', buyer.token, { ...product, sku: `${tag}-P3` });
      made.products.push(unpriced.body?.id);
      check('a buyer can add a product without a price', unpriced.status === 201 && unpriced.body?.basePriceCwt === null, `status ${unpriced.status}`);
      const boss = await send('PUT', `/api/products/${p1.body.id}`, adminT, { basePriceCwt: 61.5 });
      const audit = await prisma.auditLog.findFirst({ where: { eventType: 'LIST_PRICE_CHANGED', resourceId: p1.body.id, userId: adminUser.id }, orderBy: { timestamp: 'desc' } });
      check('a manager changes the price and the change is recorded', boss.status === 200 && Number(boss.body.basePriceCwt) === 61.5 && audit?.details?.from === 55 && audit?.details?.to === 61.5, `status ${boss.status} ${JSON.stringify(audit?.details ?? null)}`);
      check('an empty change is refused', (await send('PUT', `/api/products/${p1.body.id}`, adminT, { nonsense: true })).status === 400, 'accepted');
    }
    check('changing a product that does not exist answers not found', (await send('PUT', '/api/products/no-such-product', adminT, { name: 'x' })).status === 404, 'not a 404');

    // ── Grades ──
    const g = { code: `${tag}-G1`, name: 'QA sweep grade', family: 'CARBON', tensileMin: 58000, tensileMax: 80000 };
    check('a clerk cannot add a grade', (await send('POST', '/api/grades', csrT, g)).status === 403, 'accepted');
    const g1 = await send('POST', '/api/grades', adminT, { ...g, id: 'forged' });
    made.grades.push(g1.body?.id);
    check('a manager adds a grade', g1.status === 201 && g1.body.id !== 'forged' && g1.body.code === g.code, `status ${g1.status}`);
    check('the same grade code cannot be added twice', (await send('POST', '/api/grades', adminT, g)).status === 409, 'accepted');
    check('a grade with an unknown family is refused', (await send('POST', '/api/grades', adminT, { ...g, code: `${tag}-G2`, family: 'WOOD' })).status === 400, 'accepted');
    check('a grade whose minimum strength is above its maximum is refused', (await send('POST', '/api/grades', adminT, { ...g, code: `${tag}-G2`, tensileMin: 9, tensileMax: 1 })).status === 400, 'accepted');
    if (g1.body?.id) {
      check('a clerk cannot change a grade', (await send('PUT', `/api/grades/${g1.body.id}`, csrT, { name: 'hacked' })).status === 403, 'accepted');
      const upd = await send('PUT', `/api/grades/${g1.body.id}`, adminT, { yieldMin: 36000, createdAt: '2001-01-01T00:00:00Z' });
      check('a manager changes a grade, and only its listed fields', upd.status === 200 && Number(upd.body.yieldMin) === 36000 && new Date(upd.body.createdAt).getFullYear() > 2020, `status ${upd.status}`);
      check('a grade range that ends up upside down is refused', (await send('PUT', `/api/grades/${g1.body.id}`, adminT, { tensileMax: 100 })).status === 400, 'accepted');
    }
  } finally {
    await prisma.user.update({ where: { id: shipper.id }, data: { role: shipper.role } });
    await prisma.heat.deleteMany({ where: { OR: [{ id: { in: made.heats.filter(Boolean) } }, { heatNumber: { startsWith: tag } }], coils: { none: {} } } });
    await prisma.product.deleteMany({ where: { OR: [{ id: { in: made.products.filter(Boolean) } }, { sku: { startsWith: tag } }] } });
    await prisma.grade.deleteMany({ where: { OR: [{ id: { in: made.grades.filter(Boolean) } }, { code: { startsWith: tag } }] } });
  }
  section('Heats, products and grades: checked input, right people, prices recorded', { pass: findings.length === 0, summary: `${checks} checks, ${findings.length} problems`, findings });
}

// 18. Receiving stock (findings I-005, I-006): the upload used to answer "imported" and save
// nothing, and the Receiving screen showed sample deliveries. A receipt now makes a real stock
// item, its balance and a movement in one step, by one rule for the form and the upload file.
{
  const findings = []; let checks = 0;
  const check = (name, ok, detail) => { checks++; if (!ok) findings.push(`${name}: ${detail}`); };
  const [adminT, csrT, shippingT] = await Promise.all(['admin', 'csr', 'shipping'].map(tokenFor));
  const send = async (method, url, token, body) => {
    const res = await fetch(BASE + url, { method, headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` }, body: body ? JSON.stringify(body) : undefined, signal: AbortSignal.timeout(30000) });
    return { status: res.status, body: await res.json().catch(() => null) };
  };
  const tag = `QA18-${Date.now().toString(36).toUpperCase()}`;
  const heat = await prisma.heat.findFirst({ where: { coils: { some: {} } }, include: { grade: true } });
  const otherGrade = await prisma.grade.findFirst({ where: { id: { not: heat.gradeId } } });
  const location = await prisma.location.findFirst({ where: { isActive: true, code: { startsWith: 'QA-L' } }, orderBy: { code: 'asc' } }); // a branch the QA logins belong to
  const customer = await prisma.organization.findUnique({ where: { code: 'QA-C09' } });
  const shipper = await prisma.user.findUnique({ where: { email: QA_USERS.shipping } });
  const good = { coilNumber: `${tag}-1`, form: 'PLATE', heatNumber: heat.heatNumber, gradeCode: heat.grade.code, thicknessIn: 0.5, widthIn: 96, lengthIn: 240, weightLb: 3267, locationId: location.id, binLocation: 'B-02', poReference: 'QA-PO-18', notes: 'QA sweep' };
  try {
    check('sales staff cannot receive stock', (await send('POST', '/api/inventory/receipts', csrT, good)).status === 403, 'accepted');
    const r1 = await send('POST', '/api/inventory/receipts', shippingT, { ...good, id: 'forged', status: 'SHIPPED', qcStatus: 'PASSED', createdById: 'someone', unitCost: 1 });
    const coil = await prisma.coil.findUnique({ where: { coilNumber: good.coilNumber }, include: { inventory: true } });
    const moves = coil ? await prisma.materialMovement.findMany({ where: { coilId: coil.id } }) : [];
    check('a receipt makes the stock item, with fields the form does not have ignored', r1.status === 201 && coil && coil.id !== 'forged' && coil.status === 'AVAILABLE' && coil.qcStatus === 'PENDING' && coil.createdById === shipper.id && coil.unitCost === null && coil.heatId === heat.id && coil.gradeId === heat.gradeId && coil.locationId === location.id, `status ${r1.status} ${JSON.stringify(r1.body).slice(0, 200)}`);
    check('the item has a stock balance equal to what was received', Number(coil?.inventory?.qtyOnHand) === 3267 && Number(coil?.inventory?.qtyAvailable) === 3267 && Number(coil?.inventory?.qtyAllocated) === 0 && coil?.inventory?.locationId === location.id, JSON.stringify(coil?.inventory ?? null).slice(0, 200));
    check('one RECEIVE movement records who received it, where, and the reference', moves.length === 1 && moves[0].movementType === 'RECEIVE' && Number(moves[0].qtyMoved) === 3267 && moves[0].createdById === shipper.id && moves[0].toLocationId === location.id && /QA-PO-18/.test(moves[0].notes || ''), JSON.stringify(moves).slice(0, 200));
    check('the same item number cannot be received twice', (await send('POST', '/api/inventory/receipts', shippingT, good)).status === 409 && (await prisma.coil.count({ where: { coilNumber: good.coilNumber } })) === 1, 'accepted');
    for (const [why, body] of [
      ['no item number', { ...good, coilNumber: '' }], ['no weight', { ...good, coilNumber: `${tag}-X`, weightLb: '' }], ['a weight of zero', { ...good, coilNumber: `${tag}-X`, weightLb: 0 }],
      ['a heat that is not on file', { ...good, coilNumber: `${tag}-X`, heatNumber: 'NO-SUCH-HEAT' }], ['a grade that is not on file', { ...good, coilNumber: `${tag}-X`, gradeCode: 'NO-SUCH-GRADE' }],
      ['a grade that is not the heat\'s grade', { ...good, coilNumber: `${tag}-X`, gradeCode: otherGrade.code }], ['a location that is not on file', { ...good, coilNumber: `${tag}-X`, locationId: 'no-such-location' }],
      ['no location', { ...good, coilNumber: `${tag}-X`, locationId: '' }], ['an unknown form', { ...good, coilNumber: `${tag}-X`, form: 'CLOUD' }],
      ['customer-owned stock with no customer', { ...good, coilNumber: `${tag}-X`, ownership: 'CUSTOMER_OWNED' }], ['a customer that is not on file', { ...good, coilNumber: `${tag}-X`, ownership: 'CUSTOMER_OWNED', customerName: 'No Such Customer Inc' }],
    ]) {
      const r = await send('POST', '/api/inventory/receipts', shippingT, body);
      check(`a receipt with ${why} is refused with a reason`, r.status === 400 && typeof r.body?.error === 'string' && r.body.error.length > 8, `status ${r.status} ${r.body?.error || ''}`);
    }
    check('a refused receipt leaves nothing behind', (await prisma.coil.count({ where: { coilNumber: `${tag}-X` } })) === 0, 'a stock item was created');
    const toll = await send('POST', '/api/inventory/receipts', shippingT, { ...good, coilNumber: `${tag}-2`, ownership: 'CUSTOMER_OWNED', customerName: customer.code, productSku: 'NO-SUCH-SKU' });
    const tollCoil = await prisma.coil.findUnique({ where: { coilNumber: `${tag}-2` } });
    check('customer-owned stock is received under the customer', toll.status === 201 && tollCoil?.ownerId === customer.id, `status ${toll.status} ${toll.body?.error || ''}`);
    check('a product that is not in the catalog is said, not silently dropped', /not in the catalog/.test(toll.body?.warning || '') && tollCoil?.productId === null, JSON.stringify(toll.body?.warning ?? null));
    const clerkView = await send('GET', '/api/inventory/receipts?limit=20', csrT);
    const mine = clerkView.body?.data?.find((r) => r.item?.coilNumber === good.coilNumber);
    check('the receipts list shows what was really received', clerkView.status === 200 && mine && mine.qty === 3267 && mine.item.heatNumber === heat.heatNumber && mine.location?.id === location.id && /QA-PO-18/.test(mine.notes || ''), `status ${clerkView.status} ${JSON.stringify(mine ?? null).slice(0, 160)}`);
    check('the receipts list carries no cost', !/unitCost|landedCost|avgCost/.test(JSON.stringify(clerkView.body)), 'cost present');
    const listed = await send('GET', `/api/coils?search=${encodeURIComponent(good.coilNumber)}`, csrT);
    check('a received item is on the stock list straight away', Array.isArray(listed.body) && listed.body.some((c) => c.coilNumber === good.coilNumber), 'not listed');

    // The upload file follows the same rule, row by row, and says what it really did.
    const rows = [
      { tag_number: `${tag}-U1`, heat_number: heat.heatNumber, grade: heat.grade.code, thickness: '0.125', width: '48', weight_lbs: '45,000', coil_od: '72', coil_id: '24', location_code: location.code, bay_position: 'A-01', ownership: 'HOUSE_OWNED', po_number: 'QA-PO-19' },
      { tag_number: `${tag}-U2`, heat_number: 'NO-SUCH-HEAT', grade: heat.grade.code, weight_lbs: '100', location_code: location.code },
      { tag_number: `${tag}-U1`, heat_number: heat.heatNumber, grade: heat.grade.code, weight_lbs: '100', location_code: location.code },
      { tag_number: `${tag}-U3`, heat_number: heat.heatNumber, grade: heat.grade.code, weight_lbs: 'heavy', location_code: location.code },
      { tag_number: `${tag}-U4`, heat_number: heat.heatNumber.toLowerCase(), grade: heat.grade.code.toLowerCase(), weight_lbs: '500', location_code: location.code.toLowerCase() },
    ];
    const up = await send('POST', '/api/inventory/bulk-upload', shippingT, { templateType: 'coils', items: rows });
    const saved = await prisma.coil.findMany({ where: { coilNumber: { startsWith: `${tag}-U` } }, include: { inventory: true } });
    check('an upload saves the good rows as real stock', up.status === 201 && up.body?.imported === 2 && saved.length === 2 && saved.every((c) => c.inventory && Number(c.inventory.qtyOnHand) === Number(c.netWeightLb)) && saved.some((c) => Number(c.netWeightLb) === 45000 && c.form === 'COIL'), `status ${up.status}, said ${up.body?.imported}, saved ${saved.length}`);
    check('the count the upload reports is the count that was saved', up.body?.imported === saved.length && up.body?.skipped === 3, `said ${up.body?.imported} imported and ${up.body?.skipped} skipped; ${saved.length} saved`);
    check('each row that was not received comes back with its row number and reason', Array.isArray(up.body?.errors) && up.body.errors.length === 3 && [2, 3, 4].every((n) => up.body.errors.some((e) => e.row === n && e.error?.length > 8)) && /not on file/.test(up.body.errors.find((e) => e.row === 2)?.error || '') && /already in use/.test(up.body.errors.find((e) => e.row === 3)?.error || ''), JSON.stringify(up.body?.errors ?? null).slice(0, 300));
    const none = await send('POST', '/api/inventory/bulk-upload', shippingT, { templateType: 'coils', items: [rows[1]] });
    check('an upload that saves nothing is an error, not a success', none.status === 400 && none.body?.imported === 0 && none.body?.success === false && /None of the 1 items/.test(none.body?.error || ''), `status ${none.status} ${JSON.stringify(none.body).slice(0, 160)}`);
    check('an upload of an unknown type is refused', (await send('POST', '/api/inventory/bulk-upload', shippingT, { templateType: 'pallets', items: [rows[0]] })).status === 400, 'accepted');
    check('an upload with no rows is refused', (await send('POST', '/api/inventory/bulk-upload', shippingT, { templateType: 'coils', items: [] })).status === 400, 'accepted');
    check('an upload over the row limit is refused before anything is saved', (await send('POST', '/api/inventory/bulk-upload', shippingT, { templateType: 'coils', items: Array.from({ length: 2001 }, (_, i) => ({ tag_number: `${tag}-BIG${i}` })) })).status === 400 && (await prisma.coil.count({ where: { coilNumber: { startsWith: `${tag}-BIG` } } })) === 0, 'accepted');
    check('sales staff cannot upload stock', (await send('POST', '/api/inventory/bulk-upload', csrT, { templateType: 'coils', items: [rows[0]] })).status === 403, 'accepted');
    const rem = await send('POST', '/api/inventory/bulk-upload', shippingT, { templateType: 'remnants', items: [{ tag_number: `${tag}-U5`, parent_tag: good.coilNumber, thickness: '0.5', width: '36', length: '48', weight_lbs: '350', location_code: location.code, condition: 'GOOD' }] });
    const remCoil = await prisma.coil.findUnique({ where: { coilNumber: `${tag}-U5` } });
    check('a remnant takes its heat, grade and form from its parent item', rem.status === 201 && remCoil && coil && remCoil.parentCoilId === coil.id && remCoil.heatId === heat.id && remCoil.gradeId === heat.gradeId && remCoil.form === 'PLATE', `status ${rem.status} ${JSON.stringify(rem.body?.errors ?? null).slice(0, 160)}`);
    const template = await fetch(`${BASE}/api/inventory/templates/plates`, { headers: { authorization: `Bearer ${adminT}` } });
    check('every upload type has a template to download', template.status === 200 && /tag_number,heat_number/.test(await template.text()), `status ${template.status}`);
  } finally {
    const mine = await prisma.coil.findMany({ where: { coilNumber: { startsWith: tag } }, select: { id: true } });
    const ids = mine.map((c) => c.id);
    await prisma.materialMovement.deleteMany({ where: { coilId: { in: ids } } });
    await prisma.inventory.deleteMany({ where: { coilId: { in: ids } } });
    await prisma.coil.deleteMany({ where: { id: { in: ids }, parentCoilId: { not: null } } });
    await prisma.coil.deleteMany({ where: { id: { in: ids } } });
  }
  section('Receiving: a receipt is real stock, and an upload says what it saved', { pass: findings.length === 0, summary: `${checks} checks, ${findings.length} problems`, findings });
}

// 19. Shop floor records (findings M-001 to M-008): the job screen showed a sample job, a job's
// history was guessed from four timestamps with nobody's name on it, a status note overwrote the
// job's notes, anyone's id could be written as the assignee, and a work order was created from
// whatever the browser sent and could be started or completed from any status.
{
  const findings = []; let checks = 0;
  const check = (name, ok, detail) => { checks++; if (!ok) findings.push(`${name}: ${detail}`); };
  const [adminT, csrT, operatorT, custT] = await Promise.all(['admin', 'csr', 'operator', 'custA'].map(tokenFor));
  const send = async (method, url, token, body) => {
    const res = await fetch(BASE + url, { method, headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` }, body: body ? JSON.stringify(body) : undefined, signal: AbortSignal.timeout(30000) });
    return { status: res.status, body: await res.json().catch(() => null), headers: res.headers };
  };
  const tag = `QA19-${Date.now().toString(36).toUpperCase()}`;
  const operator = await prisma.user.findUnique({ where: { email: QA_USERS.operator } });
  const csr = await prisma.user.findUnique({ where: { email: QA_USERS.csr } });
  const wc = await prisma.workCenter.findFirst({ where: { isActive: true, code: { startsWith: 'QA-L' } }, orderBy: { code: 'asc' } }); // at a branch the QA logins belong to
  const jobIds = []; const woIds = []; const inspectionIds = []; let idleUserId = null;
  const movesOf = (id) => prisma.auditLog.findMany({ where: { resourceType: 'Job', resourceId: id, eventType: 'JOB_STATUS_CHANGED' }, orderBy: { timestamp: 'asc' } });
  try {
    // --- Jobs: every move is recorded with who made it ---
    const start = new Date(); start.setHours(9, 0, 0, 0);
    const end = new Date(start.getTime() + 2 * 3600000);
    const made = await send('POST', '/api/jobs', csrT, { workCenterId: wc.id, operationType: 'SLITTING', instructions: `${tag} keep notes`, scheduledStart: start.toISOString(), scheduledEnd: end.toISOString(), status: 'SCHEDULED' });
    const jobId = made.body?.id; if (jobId) jobIds.push(jobId);
    check('a job can be created for the test', made.status === 201 && !!jobId, `status ${made.status} ${made.body?.error || ''}`);
    await prisma.job.update({ where: { id: jobId }, data: { notes: 'Customer wants paper interleave' } });

    const m1 = await send('POST', `/api/jobs/${jobId}/status`, operatorT, { status: 'IN_PROCESS', note: 'Saw is free' });
    let job = await prisma.job.findUnique({ where: { id: jobId } });
    let moves = await movesOf(jobId);
    check('a status note does not replace the notes on the job', m1.status === 200 && job?.notes === 'Customer wants paper interleave', `notes are now ${JSON.stringify(job?.notes ?? null)}`);
    check('a status change is recorded with who made it, from and to, and the note', moves.length === 1 && moves[0].userId === operator.id && moves[0].details?.from === 'SCHEDULED' && moves[0].details?.to === 'IN_PROCESS' && moves[0].details?.note === 'Saw is free', `${moves.length} records ${JSON.stringify(moves[0]?.details ?? null)}`);

    const m2 = await send('PATCH', `/api/jobs/${jobId}/status`, csrT, { status: 'ON_HOLD' });
    const m3 = await send('PUT', `/api/jobs/${jobId}`, csrT, { status: 'IN_PROCESS' });
    const m4 = await send('POST', `/api/jobs/${jobId}/complete`, operatorT, { note: 'Done, 2 skids' });
    moves = await movesOf(jobId);
    job = await prisma.job.findUnique({ where: { id: jobId } });
    check('every way of moving a job leaves a record', m2.status === 200 && m3.status === 200 && m4.status === 200 && moves.length === 4 && moves.map((m) => m.details?.to).join('>') === 'IN_PROCESS>ON_HOLD>IN_PROCESS>READY_TO_SHIP', `statuses ${m2.status}/${m3.status}/${m4.status}, records ${moves.map((m) => m.details?.to).join('>')}`);
    check('each record carries the right person', moves.length === 4 && moves[1].userId === csr.id && moves[2].userId === csr.id && moves[3].userId === operator.id, moves.map((m) => m.userId === operator.id ? 'operator' : m.userId === csr.id ? 'csr' : 'other').join(','));
    check('completing a job with a note still leaves its notes alone', job?.notes === 'Customer wants paper interleave', `notes are now ${JSON.stringify(job?.notes ?? null)}`);
    const same = await send('POST', `/api/jobs/${jobId}/status`, operatorT, { status: 'READY_TO_SHIP' });
    check('setting the status a job already has adds no record', same.status === 200 && (await movesOf(jobId)).length === 4, `status ${same.status}, ${(await movesOf(jobId)).length} records`);
    const refused = await send('POST', `/api/jobs/${jobId}/status`, operatorT, { status: 'SCHEDULED' });
    check('a refused move adds no record', refused.status === 409 && (await movesOf(jobId)).length === 4, `status ${refused.status}`);

    const hist = await send('GET', `/api/jobs/${jobId}/history`, csrT);
    const h = Array.isArray(hist.body) ? hist.body : [];
    const statusRows = h.filter((e) => e.type === 'STATUS');
    check('the job history lists every move in order', hist.status === 200 && h[0]?.type === 'CREATED' && statusRows.map((e) => e.status).join('>') === 'IN_PROCESS>ON_HOLD>IN_PROCESS>READY_TO_SHIP', JSON.stringify(h.map((e) => e.status ?? e.type ?? null)));
    check('the history names who made each move and carries the reason', statusRows.length === 4 && statusRows.every((e) => typeof e.by === 'string' && e.by.length > 1 && e.recorded === true) && statusRows[0]?.note === 'Saw is free' && statusRows[0]?.from === 'SCHEDULED', JSON.stringify(statusRows.map((e) => [e.by ?? null, e.note ?? null])));
    check('the history names who created the job', typeof h[0]?.by === 'string' && h[0].by.length > 1, JSON.stringify(h[0] ?? null));
    check('the history of a job that is not on file is a 404', (await send('GET', '/api/jobs/00000000-0000-0000-0000-000000000000/history', csrT)).status === 404, 'not 404');
    check('a customer login cannot read a job history', [401, 403].includes((await send('GET', `/api/jobs/${jobId}/history`, custT)).status), 'readable');

    // A job from before moves were recorded: times only, and it says nobody is on record.
    const old = await prisma.job.create({ data: { jobNumber: `${tag}-OLD`, workCenterId: wc.id, status: 'READY_TO_SHIP', priority: 3, actualStart: new Date(Date.now() - 7200000), actualEnd: new Date(Date.now() - 3600000) } });
    jobIds.push(old.id);
    const oldHist = (await send('GET', `/api/jobs/${old.id}/history`, csrT)).body;
    check('an older job shows its times and says who is not recorded', Array.isArray(oldHist) && oldHist.filter((e) => e.type === 'STATUS').length === 2 && oldHist.filter((e) => e.type === 'STATUS').every((e) => e.recorded === false && e.by === null), JSON.stringify(oldHist ?? null).slice(0, 200));

    // A job moved as a side effect (here, an inspector sending it back for rework) is recorded too,
    // and the rework instruction is added above the job's notes, not written over them.
    const rw = await prisma.job.create({ data: { jobNumber: `${tag}-RW`, status: 'WAITING_QC', priority: 3, notes: 'Ship on customer pallets' } });
    jobIds.push(rw.id);
    const insp = await send('POST', '/api/qc/inspections', adminT, { jobId: rw.id });
    const inspId = insp.body?.data?.id; if (inspId) inspectionIds.push(inspId);
    check('starting an inspection answers with the inspection it made', insp.status === 201 && !!inspId && (await prisma.jobInspection.count({ where: { jobId: rw.id } })) === 1, `status ${insp.status} ${insp.body?.error || ''}, ${await prisma.jobInspection.count({ where: { jobId: rw.id } })} on file`);
    const rework = await send('POST', `/api/qc/inspections/${inspId}/rework`, adminT, { reworkInstructions: 'Deburr both edges' });
    const rwJob = await prisma.job.findUnique({ where: { id: rw.id } });
    const rwMoves = await movesOf(rw.id);
    check('rework sends the job back with the instruction added to its notes, not over them', rework.status === 200 && rwJob?.status === 'SCHEDULED' && /Deburr both edges/.test(rwJob?.notes || '') && /Ship on customer pallets/.test(rwJob?.notes || ''), `status ${rework.status}, job ${rwJob?.status}, notes ${JSON.stringify(rwJob?.notes ?? null)}`);
    check('a move made by an inspection result is recorded with the inspector', rwMoves.length === 1 && rwMoves[0].details?.from === 'WAITING_QC' && rwMoves[0].details?.to === 'SCHEDULED' && rwMoves[0].details?.via === 'inspection' && !!rwMoves[0].userId, `${rwMoves.length} records ${JSON.stringify(rwMoves[0]?.details ?? null)}`);

    // --- Assigning a job ---
    const made2 = await send('POST', '/api/jobs', csrT, { workCenterId: wc.id, operationType: 'SHEARING', instructions: `${tag} assign`, status: 'SCHEDULED' });
    const job2 = made2.body?.id; if (job2) jobIds.push(job2);
    const idle = await prisma.user.create({ data: { email: `${tag.toLowerCase()}@qa.test`, firstName: 'Idle', lastName: 'Person', passwordHash: 'x', role: operator.role, organizationId: operator.organizationId, isActive: false } }).catch(() => null);
    idleUserId = idle?.id || null;
    check('a job cannot be assigned to someone who is not on file', (await send('POST', `/api/jobs/${job2}/assign`, csrT, { userId: '00000000-0000-0000-0000-000000000000' })).status === 400, 'accepted');
    check('a job cannot be assigned to something that is not a user id', (await send('POST', `/api/jobs/${job2}/assign`, csrT, { userId: { not: null } })).status === 400, 'accepted');
    if (idle) check('a job cannot be assigned to someone who is not active', (await send('POST', `/api/jobs/${job2}/assign`, csrT, { userId: idle.id })).status === 400, 'accepted');
    check('assigning a job that is not on file is a 404', (await send('POST', '/api/jobs/00000000-0000-0000-0000-000000000000/assign', csrT, { userId: operator.id })).status === 404, 'not 404');
    const asg = await send('POST', `/api/jobs/${job2}/assign`, csrT, { userId: operator.id });
    const asgRows = await prisma.auditLog.findMany({ where: { resourceType: 'Job', resourceId: job2, eventType: 'JOB_ASSIGNED' } });
    check('assigning a job works and is recorded with who did it', asg.status === 200 && asg.body?.job?.assignedTo?.id === operator.id && asgRows.length === 1 && asgRows[0].userId === csr.id && asgRows[0].details?.to === operator.id, `status ${asg.status}, ${asgRows.length} records`);
    const hist2 = (await send('GET', `/api/jobs/${job2}/history`, csrT)).body;
    check('the assignment is in the job history by name', Array.isArray(hist2) && hist2.some((e) => e.type === 'ASSIGNED' && /Assigned to \S+/.test(e.note || '') && !/no longer on file/.test(e.note || '')), JSON.stringify(hist2 ?? null).slice(0, 200));
    const un = await send('POST', `/api/jobs/${job2}/assign`, csrT, { userId: null });
    check('an assignment can be removed', un.status === 200 && (await prisma.job.findUnique({ where: { id: job2 } }))?.assignedToId === null, `status ${un.status}`);
    await prisma.job.update({ where: { id: job2 }, data: { status: 'CANCELLED' } });
    check('a cancelled job cannot be assigned', (await send('POST', `/api/jobs/${job2}/assign`, csrT, { userId: operator.id })).status === 409, 'accepted');

    // --- The schedule asks for one day of jobs ---
    const dayStart = new Date(start); dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(dayStart.getTime() + 86400000);
    const day = await send('GET', `/api/jobs?scheduledFrom=${encodeURIComponent(dayStart.toISOString())}&scheduledTo=${encodeURIComponent(dayEnd.toISOString())}&limit=2000`, csrT);
    check('jobs can be listed for one day, and only that day', day.status === 200 && Array.isArray(day.body) && day.body.some((j) => j.id === jobId) && day.body.every((j) => j.scheduledStart && new Date(j.scheduledStart) >= dayStart && new Date(j.scheduledStart) < dayEnd), `status ${day.status}, ${Array.isArray(day.body) ? day.body.length : 'no list'}`);
    const nextDay = await send('GET', `/api/jobs?scheduledFrom=${encodeURIComponent(dayEnd.toISOString())}&scheduledTo=${encodeURIComponent(new Date(dayEnd.getTime() + 86400000).toISOString())}`, csrT);
    check('a job is not on another day\'s schedule', nextDay.status === 200 && Array.isArray(nextDay.body) && !nextDay.body.some((j) => j.id === jobId), 'listed on the next day');
    check('a schedule date that is not a date is refused', (await send('GET', '/api/jobs?scheduledFrom=tuesday', csrT)).status === 400, 'accepted');

    // --- Work orders: checked input, real moves ---
    const coil = await prisma.coil.findFirst({ where: { status: 'AVAILABLE', location: { code: { startsWith: 'QA-L' } } }, orderBy: { coilNumber: 'asc' } }); // at a branch the operator belongs to
    // Stock that is reserved may be cut for its order; stock that is on hold, shipped or used up may not.
    const busy = await prisma.coil.findFirst({ where: { status: { in: ['HOLD', 'SHIPPED', 'CONSUMED'] } } });
    const forged = await send('POST', '/api/work-orders', operatorT, { woType: 'SLIT', sourceCoilId: coil.id, priority: 2, notes: tag, id: 'forged-id', woNumber: 'WO-FORGED', status: 'COMPLETE', completedAt: '2020-01-01', yieldPct: 150, outputWeightLb: 999999 });
    const woId = forged.body?.id; if (woId) woIds.push(woId);
    const wo = woId ? await prisma.workOrder.findUnique({ where: { id: woId } }) : null;
    check('a work order is created with only the fields the form has', forged.status === 201 && wo && wo.id !== 'forged-id' && wo.woNumber !== 'WO-FORGED' && wo.status === 'DRAFT' && wo.completedAt === null && wo.yieldPct === null && wo.outputWeightLb === null && wo.priority === 2, `status ${forged.status} ${JSON.stringify({ status: wo?.status ?? null, woNumber: wo?.woNumber ?? null, yield: wo?.yieldPct ?? null })}`);
    const coilOnHand = Number((await prisma.inventory.findUnique({ where: { coilId: coil.id } }))?.qtyOnHand ?? coil.netWeightLb);
    check('the work order takes its weight in from what the stock item holds now', wo && Number(wo.inputWeightLb) === coilOnHand, `${wo?.inputWeightLb ?? null} against ${coilOnHand}`);
    for (const [why, body] of [
      ['no type', { sourceCoilId: coil.id }], ['an unknown type', { woType: 'WELD', sourceCoilId: coil.id }], ['no stock item', { woType: 'SLIT' }],
      ['a stock item that is not on file', { woType: 'SLIT', sourceCoilId: '00000000-0000-0000-0000-000000000000' }], ['a priority of 9', { woType: 'SLIT', sourceCoilId: coil.id, priority: 9 }],
      ['a date that is not a date', { woType: 'SLIT', sourceCoilId: coil.id, scheduledDate: 'soon' }], ['a cut with no width', { woType: 'SLIT', sourceCoilId: coil.id, slitPattern: [{ width: 0 }] }],
    ]) {
      const r = await send('POST', '/api/work-orders', operatorT, { notes: tag, ...body });
      if (r.body?.id) woIds.push(r.body.id);
      check(`a work order with ${why} is refused with a reason`, r.status === 400 && typeof r.body?.error === 'string' && r.body.error.length > 8, `status ${r.status} ${r.body?.error || ''}`);
    }
    if (busy) {
      const r = await send('POST', '/api/work-orders', operatorT, { woType: 'SLIT', sourceCoilId: busy.id, notes: tag });
      if (r.body?.id) woIds.push(r.body.id);
      check('a work order cannot be raised on stock that is not available', r.status === 409, `status ${r.status}`);
    }
    check('a customer login cannot create a work order', [401, 403].includes((await send('POST', '/api/work-orders', custT, { woType: 'SLIT', sourceCoilId: coil.id })).status), 'accepted');
    check('a work order that has not started cannot be completed', (await send('PUT', `/api/work-orders/${woId}/complete`, operatorT, { outputWeightLb: 10 })).status === 409 && (await prisma.workOrder.findUnique({ where: { id: woId } }))?.status === 'DRAFT', 'completed from draft');
    check('starting a work order that is not on file is a 404', (await send('PUT', '/api/work-orders/00000000-0000-0000-0000-000000000000/start', operatorT, {})).status === 404, 'not 404');
    const st = await send('PUT', `/api/work-orders/${woId}/start`, operatorT, {});
    check('a work order can be started', st.status === 200 && st.body?.status === 'IN_PROGRESS' && !!st.body?.startedAt, `status ${st.status}`);
    check('a started work order cannot be started again', (await send('PUT', `/api/work-orders/${woId}/start`, operatorT, {})).status === 409, 'started twice');
    const input = Number(coil.netWeightLb);
    check('completing needs the weight out', (await send('PUT', `/api/work-orders/${woId}/complete`, operatorT, {})).status === 400, 'accepted with no weight');
    check('a negative weight is refused', (await send('PUT', `/api/work-orders/${woId}/complete`, operatorT, { outputWeightLb: -5 })).status === 400, 'accepted');
    check('more cannot come out than went in', (await send('PUT', `/api/work-orders/${woId}/complete`, operatorT, { outputWeightLb: input, scrapWeightLb: input })).status === 400 && (await prisma.workOrder.findUnique({ where: { id: woId } }))?.status === 'IN_PROGRESS', 'accepted');
    const out = Math.round(input * 0.9 * 100) / 100;
    const done = await send('PUT', `/api/work-orders/${woId}/complete`, operatorT, { outputWeightLb: out, scrapWeightLb: Math.round(input * 0.05 * 100) / 100, yieldPct: 150 });
    check('a work order completes with a yield worked out by the server', done.status === 200 && done.body?.status === 'COMPLETE' && Math.abs(Number(done.body?.yieldPct) - 90) < 0.05, `status ${done.status}, yield ${done.body?.yieldPct ?? null}`);
    check('a completed work order cannot be cancelled or restarted', (await send('PUT', `/api/work-orders/${woId}/cancel`, operatorT, {})).status === 409 && (await send('PUT', `/api/work-orders/${woId}/start`, operatorT, {})).status === 409, 'changed after completion');
    const view = await send('GET', `/api/work-orders/${woId}`, csrT);
    check('the work order shows its history with who did each step', view.status === 200 && Array.isArray(view.body?.history) && view.body.history.map((e) => e.to ?? e.type).join('>') === 'CREATED>IN_PROGRESS>COMPLETE' && view.body.history.every((e) => typeof e.by === 'string' && e.by.length > 1), JSON.stringify(view.body?.history ?? null).slice(0, 200));
    const list = await send('GET', `/api/work-orders?search=${encodeURIComponent(wo?.woNumber || 'none')}`, csrT);
    check('the work order list searches on the server and says how many there are', list.status === 200 && Array.isArray(list.body) && list.body.length === 1 && list.body[0].id === woId && list.headers.get('x-total-count') === '1', `status ${list.status}, ${Array.isArray(list.body) ? list.body.length : 'no list'} rows, count ${list.headers.get('x-total-count')}`);
    check('a work order list filter that is not a status is refused', (await send('GET', '/api/work-orders?status=NONSENSE', csrT)).status === 400, 'accepted');
  } finally {
    await prisma.auditLog.deleteMany({ where: { OR: [{ resourceType: 'Job', resourceId: { in: jobIds } }, { resourceType: 'WorkOrder', resourceId: { in: woIds } }] } });
    const stray = await prisma.workOrder.findMany({ where: { notes: tag }, select: { id: true } });
    await prisma.workOrder.deleteMany({ where: { id: { in: [...woIds, ...stray.map((w) => w.id)] } } });
    await prisma.jobInspection.deleteMany({ where: { OR: [{ id: { in: inspectionIds } }, { jobId: { in: jobIds } }] } });
    await prisma.job.deleteMany({ where: { id: { in: jobIds } } });
    if (idleUserId) await prisma.user.delete({ where: { id: idleUserId } }).catch(() => {});
  }
  section('Shop floor records: who moved a job, and work orders that follow the rules', { pass: findings.length === 0, summary: `${checks} checks, ${findings.length} problems`, findings });
}

// 20. Shipping and money records (findings F-001 to F-009): an accepted web order carried no tax
// and no total, so its invoices had none either; the shipment list sent every shipment with the
// customer's whole record; nothing said who created, dispatched or delivered a shipment, or who
// took a payment, issued a credit, paid a refund or cancelled an invoice; and a proof of delivery
// accepted any text of any size.
{
  const findings = []; let checks = 0;
  const check = (name, ok, detail) => { checks++; if (!ok) findings.push(`${name}: ${detail}`); };
  const [adminT, csrT, shipT, custT] = await Promise.all(['admin', 'csr', 'shipping', 'custA'].map(tokenFor));
  const send = async (method, url, token, body) => {
    const res = await fetch(BASE + url, { method, headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` }, body: body ? JSON.stringify(body) : undefined, signal: AbortSignal.timeout(30000) });
    return { status: res.status, body: await res.json().catch(() => null), headers: res.headers };
  };
  const cents = (n) => Math.round(Number(n) * 100);
  const tag = `QA20-${Date.now().toString(36).toUpperCase()}`;
  const [adminU, csrU, shipU] = await Promise.all(['admin', 'csr', 'shipping'].map((w) => prisma.user.findUnique({ where: { email: QA_USERS[w] } })));
  const onlineIds = []; let exemptId = null;
  try {
    // --- A web order, once accepted, carries tax and a total ---
    const rate = await prisma.salesTaxRate.findFirst({ where: { rate: { gt: 0 } }, orderBy: { state: 'asc' } });
    const branch = rate ? await prisma.location.findFirst({ where: { state: rate.state } }) : null;
    const customer = await prisma.organization.findFirst({ where: { code: 'QA-C04' } });
    if (!rate || !branch || !customer) findings.push('no tax rate, branch in that state, or test customer to check with');
    else {
      const items = [{ sku: `${tag}-A`, description: 'Web order flat bar', qty: 3, unitPrice: 40 }, { sku: `${tag}-B`, description: 'Web order plate, by weight', qty: 2, extended: 81.37 }];
      const web = (id, extra = {}) => prisma.onlineOrder.create({ data: { id, externalOrderId: id, customerName: 'QA Web Buyer', items, subtotal: 201.37, ...extra } });
      await web(`${tag}-1`); onlineIds.push(`${tag}-1`);
      const acc = await send('POST', `/api/orders/online/${tag}-1/accept`, csrT, { customerId: customer.id, locationId: branch.id });
      const order = acc.body?.internalOrderId ? await prisma.order.findUnique({ where: { id: acc.body.internalOrderId }, include: { lines: true } }) : null;
      const wantTax = Math.round(201.37 * Number(rate.rate) * 100);
      check('accepting a web order makes a sales order', acc.status === 200 && !!order, `status ${acc.status} ${acc.body?.error || ''}`);
      check('the sales order carries the subtotal of its lines', cents(order?.subtotal) === 20137, `subtotal ${order?.subtotal}`);
      check('the sales order carries tax at the selling branch rate', cents(order?.taxAmount) === wantTax && wantTax > 0, `tax ${order?.taxAmount}, expected ${wantTax / 100} (${rate.state})`);
      check('the sales order total is subtotal plus tax', cents(order?.totalAmount) === 20137 + wantTax, `total ${order?.totalAmount}`);
      check('the reply says which state was taxed and at what rate', acc.body?.totals?.taxState === rate.state && Math.abs(Number(acc.body?.totals?.taxRate) - Number(rate.rate)) < 1e-9 && cents(acc.body?.totals?.totalAmount) === 20137 + wantTax, JSON.stringify(acc.body?.totals ?? null));
      check('accepting the same web order twice is refused', (await send('POST', `/api/orders/online/${tag}-1/accept`, csrT, { customerId: customer.id, locationId: branch.id })).status === 409, 'accepted twice');

      const exempt = await prisma.organization.create({ data: { code: `${tag}-EX`, name: `${tag} Exempt Buyer`, type: 'FABRICATOR', taxExempt: true, state: rate.state } });
      exemptId = exempt.id;
      await web(`${tag}-2`); onlineIds.push(`${tag}-2`);
      const acc2 = await send('POST', `/api/orders/online/${tag}-2/accept`, csrT, { customerId: exempt.id, locationId: branch.id });
      const order2 = acc2.body?.internalOrderId ? await prisma.order.findUnique({ where: { id: acc2.body.internalOrderId } }) : null;
      check('a tax-exempt customer pays no tax on a web order', acc2.status === 200 && cents(order2?.taxAmount) === 0 && cents(order2?.totalAmount) === 20137 && acc2.body?.totals?.exempt === true, `status ${acc2.status}, tax ${order2?.taxAmount}, total ${order2?.totalAmount}`);

      // --- Shipping the accepted order ---
      const line = order?.lines?.find((l) => l.lineNumber === 1);
      await send('PUT', `/api/orders/${order.id}`, adminT, { status: 'CONFIRMED' });
      const look = await send('GET', `/api/shipments/shippable?orderNumber=${encodeURIComponent(order.orderNumber.toLowerCase())}`, shipT);
      check('the shipping desk can look up what is left to ship on an order', look.status === 200 && look.body?.orderId === order.id && look.body?.lines?.length === 2 && look.body.lines[0].qtyOpen === 3 && look.body.reason === null, `status ${look.status} ${JSON.stringify(look.body).slice(0, 200)}`);
      check('the lookup names the customer without credit terms or pricing', look.body?.customer?.name === customer.name && !/creditLimit|paymentTerms|priceLevel/.test(JSON.stringify(look.body)), JSON.stringify(look.body?.customer ?? null).slice(0, 160));
      check('the lookup needs an order number', (await send('GET', '/api/shipments/shippable', shipT)).status === 400, 'accepted');
      check('the lookup of an order not on file is a 404', (await send('GET', '/api/shipments/shippable?orderNumber=NO-SUCH-ORDER', shipT)).status === 404, 'not 404');
      check('a customer login cannot use the lookup', [401, 403].includes((await send('GET', `/api/shipments/shippable?orderNumber=${order.orderNumber}`, custT)).status), 'readable');
      const lookHeld = await send('GET', `/api/shipments/shippable?orderNumber=${order2.orderNumber}`, shipT);
      check('an order that is not confirmed says why it cannot ship', lookHeld.status === 200 && /Only confirmed orders/.test(lookHeld.body?.reason || ''), JSON.stringify(lookHeld.body?.reason ?? null));

      const made = await send('POST', '/api/shipments', shipT, { orderId: order.id, fromLocationId: branch.id, carrierName: `${tag} Freight`, items: [{ orderLineId: line.id, qtyShipped: 2, weightLb: 50 }] });
      const shipId = made.body?.id;
      check('a shipment can be created for part of a line', made.status === 201 && !!shipId, `status ${made.status} ${made.body?.error || ''}`);
      const after = await send('GET', `/api/shipments/shippable?orderNumber=${order.orderNumber}`, shipT);
      check('what is on an open shipment is no longer offered', after.body?.lines?.[0]?.qtyOpen === 1 && after.body?.lines?.[0]?.qtyOnOpenShipments === 2, JSON.stringify(after.body?.lines?.[0] ?? null));

      const list = await send('GET', `/api/shipments?search=${encodeURIComponent(`${tag} freight`)}`, shipT);
      check('the list searches on the server and reports the count', list.status === 200 && list.body?.length === 1 && list.body[0].id === shipId && list.headers.get('x-total-count') === '1', `status ${list.status}, ${list.body?.length} rows, count ${list.headers.get('x-total-count')}`);
      check('the list finds a shipment by its order number', ((await send('GET', `/api/shipments?search=${order.orderNumber}`, shipT)).body || []).some((s) => s.id === shipId), 'not found');
      check('the list does not send the customer credit terms', list.body?.[0]?.order?.buyer?.name === customer.name && !/creditLimit|paymentTerms|taxExempt/.test(JSON.stringify(list.body)), JSON.stringify(list.body?.[0]?.order?.buyer ?? null).slice(0, 200));
      check('an unknown status filter is refused', (await send('GET', '/api/shipments?status=NOPE', shipT)).status === 400, 'accepted');
      const capped = await send('GET', '/api/shipments?limit=100000', shipT);
      check('the list never sends more than 200 rows', capped.status === 200 && capped.body.length <= 200, `${capped.body?.length} rows`);

      const events = () => prisma.auditLog.findMany({ where: { resourceType: 'Shipment', resourceId: shipId, eventType: 'SHIPMENT_STATUS_CHANGED' }, orderBy: { timestamp: 'asc' } });
      let ev = await events();
      check('creating a shipment is recorded with who created it', ev.length === 1 && ev[0].userId === shipU.id && ev[0].details?.to === 'PENDING', JSON.stringify(ev.map((e) => [e.userId === shipU.id, e.details?.to])));
      // Everything that ships comes off reserved stock: with nothing reserved the dispatch is refused.
      const unreserved = await send('PUT', `/api/shipments/${shipId}/dispatch`, shipT, {});
      check('a shipment with nothing reserved is refused, and says to reserve the stock', unreserved.status === 409 && /reserve/i.test(unreserved.body?.error || ''), `status ${unreserved.status} ${unreserved.body?.error || ''}`);
      const stock = await prisma.inventory.findFirst({ where: { locationId: branch.id, qtyAvailable: { gte: 2 }, coil: { status: 'AVAILABLE', qcStatus: { notIn: ['FAILED', 'HOLD'] } } }, select: { coilId: true } });
      const held = await send('POST', `/api/orders/${order.id}/allocate`, adminT, { lineId: line.id, coilId: stock?.coilId, qty: 2 });
      check('the stock going out is reserved for the line', held.status === 201, `status ${held.status} ${held.body?.error || ''}`);
      const out = await send('PUT', `/api/shipments/${shipId}/dispatch`, shipT, {});
      ev = await events();
      check('dispatch is recorded with who dispatched', out.status === 200 && ev.length === 2 && ev[1].userId === shipU.id && ev[1].details?.from === 'PENDING' && ev[1].details?.to === 'IN_TRANSIT', `status ${out.status} ${out.body?.error || ''}, ${ev.length} records`);
      const invoiceId = out.body?.invoice?.id;
      const invoice = invoiceId ? await prisma.invoice.findUnique({ where: { id: invoiceId } }) : null;
      const wantInvTax = Math.round(80 * Number(rate.rate) * 100);
      check('the invoice for the shipment carries its share of the order tax', !!invoice && cents(invoice.subtotal) === 8000 && cents(invoice.taxAmount) === wantInvTax && cents(invoice.totalAmount) === 8000 + wantInvTax, `subtotal ${invoice?.subtotal}, tax ${invoice?.taxAmount}, expected tax ${wantInvTax / 100}`);

      const big = await send('PUT', `/api/shipments/${shipId}/deliver`, shipT, { podSignature: 'x'.repeat(201) });
      const script = await send('PUT', `/api/shipments/${shipId}/deliver`, shipT, { podSignature: 'J. Smith', podImageUrl: 'javascript:alert(1)' });
      const notText = await send('PUT', `/api/shipments/${shipId}/deliver`, shipT, { podSignature: { a: 1 } });
      check('a proof of delivery that is too long, not text, or not a safe address is refused', big.status === 400 && script.status === 400 && notText.status === 400 && (await prisma.shipment.findUnique({ where: { id: shipId } }))?.status === 'IN_TRANSIT', `statuses ${big.status}/${script.status}/${notText.status}`);
      const done = await send('PUT', `/api/shipments/${shipId}/deliver`, shipT, { podSignature: '  J. Smith  ' });
      ev = await events();
      check('delivery is recorded with who marked it and who signed', done.status === 200 && done.body?.podSignature === 'J. Smith' && done.body?.podCaptured === true && ev.length === 3 && ev[2].userId === shipU.id && ev[2].details?.to === 'DELIVERED' && /J\. Smith/.test(ev[2].details?.note || ''), `status ${done.status}, signature ${JSON.stringify(done.body?.podSignature ?? null)}, ${ev.length} records`);
      const one = await send('GET', `/api/shipments/${shipId}`, csrT);
      check('the shipment shows its history with names, and its invoice', one.status === 200 && one.body?.history?.length === 3 && one.body.history.every((h) => typeof h.by === 'string' && h.by.length > 1) && one.body.history.map((h) => h.to).join('>') === 'PENDING>IN_TRANSIT>DELIVERED' && one.body?.invoices?.[0]?.id === invoiceId, JSON.stringify(one.body?.history ?? null).slice(0, 240));
      check('the shipment does not send the customer credit terms', !/creditLimit|paymentTerms|taxExempt/.test(JSON.stringify(one.body)), 'sent');

      // A cancelled shipment is recorded, and a refused move is not.
      const made2 = await send('POST', '/api/shipments', shipT, { orderId: order.id, fromLocationId: branch.id, items: [{ orderLineId: line.id, qtyShipped: 1, weightLb: 25 }] });
      const cancel = await send('PATCH', `/api/shipments/${made2.body?.id}/status`, csrT, { status: 'CANCELLED' });
      const again = await send('PATCH', `/api/shipments/${made2.body?.id}/status`, csrT, { status: 'CANCELLED' });
      const ev2 = await prisma.auditLog.findMany({ where: { resourceType: 'Shipment', resourceId: made2.body?.id || 'none' }, orderBy: { timestamp: 'asc' } });
      check('cancelling a shipment is recorded with who cancelled; a refused move is not', cancel.status === 200 && again.status >= 400 && ev2.length === 2 && ev2[1].userId === csrU.id && ev2[1].details?.to === 'CANCELLED', `statuses ${cancel.status}/${again.status}, ${ev2.length} records`);

      // --- Money: who issued, took, credited, refunded and cancelled ---
      const money = (id) => prisma.auditLog.findMany({ where: { resourceType: 'Invoice', resourceId: id, category: 'FINANCIAL' }, orderBy: { timestamp: 'asc' } });
      let mv = await money(invoiceId);
      check('the invoice is recorded with who dispatched the shipment it bills', mv.length === 1 && mv[0].eventType === 'INVOICE_ISSUED' && mv[0].userId === shipU.id && cents(mv[0].details?.amount) === 8000 + wantInvTax, JSON.stringify(mv.map((m) => [m.eventType, m.userId === shipU.id, m.details?.amount])));
      const pay = await send('POST', `/api/invoices/${invoiceId}/payments`, csrT, { amount: 30, paymentMethod: 'CHECK', referenceNumber: `${tag}-CHK` });
      mv = await money(invoiceId);
      check('a payment is recorded with who took it, the amount, method and reference', pay.status === 201 && mv.length === 2 && mv[1].eventType === 'PAYMENT_RECORDED' && mv[1].userId === csrU.id && cents(mv[1].details?.amount) === 3000 && mv[1].details?.method === 'CHECK' && mv[1].details?.reference === `${tag}-CHK`, `status ${pay.status}, ${JSON.stringify(mv[1]?.details ?? null)}`);
      const over = await send('POST', `/api/invoices/${invoiceId}/payments`, csrT, { amount: 999999, paymentMethod: 'CHECK' });
      check('a refused payment leaves no record', over.status >= 400 && (await money(invoiceId)).length === 2, `status ${over.status}, ${(await money(invoiceId)).length} records`);
      const credit = await send('POST', `/api/invoices/${invoiceId}/credit`, adminT, { reason: `${tag} short one bar`, amount: 70 });
      mv = await money(invoiceId);
      const onCredit = credit.body?.id ? await money(credit.body.id) : [];
      check('a credit is recorded on the invoice and on the credit memo with who issued it and why', credit.status === 201 && mv.length === 3 && mv[2].eventType === 'CREDIT_ISSUED' && mv[2].userId === adminU.id && cents(mv[2].details?.amount) === 7000 && /short one bar/.test(mv[2].details?.note || '') && onCredit.length === 1 && onCredit[0].userId === adminU.id, `status ${credit.status} ${credit.body?.error || ''}, ${mv.length}/${onCredit.length} records`);
      const owed = Math.round(-(Number(credit.body?.totalAmount) - Number(credit.body?.paidAmount)) * 100) / 100;
      const refund = owed > 0 ? await send('POST', `/api/invoices/${credit.body.id}/refund`, adminT, { amount: owed, paymentMethod: 'CHECK', referenceNumber: `${tag}-RF` }) : { status: 0 };
      const afterRefund = credit.body?.id ? await money(credit.body.id) : [];
      check('a refund is recorded with who paid it back', refund.status === 201 && afterRefund.length === 2 && afterRefund[1].eventType === 'REFUND_RECORDED' && afterRefund[1].userId === adminU.id && cents(afterRefund[1].details?.amount) === cents(owed), `owed ${owed}, status ${refund.status} ${refund.body?.error || ''}, ${afterRefund.length} records`);
      const shown = await send('GET', `/api/invoices/${invoiceId}`, csrT);
      check('the invoice shows its history with names', shown.status === 200 && shown.body?.history?.map((h) => h.event).join('>') === 'INVOICE_ISSUED>PAYMENT_RECORDED>CREDIT_ISSUED' && shown.body.history.every((h) => typeof h.by === 'string' && h.by.length > 1), JSON.stringify(shown.body?.history ?? null).slice(0, 240));
      check('a customer login cannot read an invoice history', [401, 403].includes((await send('GET', `/api/invoices/${invoiceId}`, custT)).status), 'readable');

      // Cancel: an invoice with nothing on it.
      const made3 = await send('POST', '/api/shipments', shipT, { orderId: order.id, fromLocationId: branch.id, items: [{ orderLineId: line.id, qtyShipped: 1, weightLb: 25 }] });
      await send('POST', `/api/orders/${order.id}/allocate`, adminT, { lineId: line.id, coilId: stock?.coilId, qty: 1 }); // what ships must be reserved
      const out3 = await send('PUT', `/api/shipments/${made3.body?.id}/dispatch`, shipT, {});
      const inv3 = out3.body?.invoice?.id;
      const cancelled = inv3 ? await send('POST', `/api/invoices/${inv3}/cancel`, adminT, { reason: `${tag} billed in error` }) : { status: 0 };
      const mv3 = inv3 ? await money(inv3) : [];
      check('cancelling an invoice is recorded with who cancelled it and why', cancelled.status === 200 && mv3.length === 2 && mv3[1].eventType === 'INVOICE_CANCELLED' && mv3[1].userId === adminU.id && /billed in error/.test(mv3[1].details?.note || ''), `status ${cancelled.status} ${cancelled.body?.error || ''}, ${mv3.length} records`);

      // A counter sale is an invoice and a payment too.
      const each = await prisma.product.findFirst({ where: { priceUnit: 'EACH', basePriceCwt: { gt: 0 } } });
      if (!each) findings.push('no each-priced product to make a counter sale with');
      else {
        const sold = await send('POST', '/api/pos/quick-sale/process-payment', csrT, { sale: { id: `${tag}-QS`, locationId: branch.id, items: [{ productId: each.id, quantity: 1 }] }, payment: { method: 'CARD', reference: `${tag}-APPR` } });
        const saleInvoice = sold.body?.orderId ? await prisma.invoice.findFirst({ where: { orderId: sold.body.orderId } }) : null;
        const mvSale = saleInvoice ? await money(saleInvoice.id) : [];
        check('a counter sale records the cashier for the invoice and the money taken', sold.status === 201 && mvSale.map((m) => m.eventType).join('>') === 'INVOICE_ISSUED>PAYMENT_RECORDED' && mvSale.every((m) => m.userId === csrU.id) && cents(mvSale[1].details?.amount) === cents(saleInvoice.totalAmount) && mvSale[1].details?.method === 'CARD', `status ${sold.status} ${sold.body?.error || ''}, ${mvSale.map((m) => m.eventType).join('>')}`);
      }
    }
  } finally {
    await prisma.onlineOrder.deleteMany({ where: { id: { in: onlineIds } } });
    if (exemptId) await prisma.organization.update({ where: { id: exemptId }, data: { isActive: false } }).catch(() => {});
  }
  section('Shipping and money records: web order tax, shipments and who did what', { pass: findings.length === 0, summary: `${checks} checks, ${findings.length} problems`, findings });
}

report.pass = Object.values(report.sections).every((s) => s.pass);
fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, JSON.stringify(report, null, 1));
console.log(`\n${report.pass ? 'ALL SECTIONS PASS' : 'FINDINGS — see'} ${OUT}`);
await prisma.$disconnect();
