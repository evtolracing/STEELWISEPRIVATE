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
  }

  section('Platform safeguards: bounded lists, tracing, real figures, database rules', { pass: findings.length === 0, summary: `${checks} checks, ${findings.length} problems`, findings });
}

// 9. Nothing above may have answered with database or server internals.
section('Error replies do not expose internals', { pass: leaks.size === 0, summary: `${leaks.size} replies exposed internal detail`, findings: [...leaks] });

report.pass = Object.values(report.sections).every((s) => s.pass);
fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, JSON.stringify(report, null, 1));
console.log(`\n${report.pass ? 'ALL SECTIONS PASS' : 'FINDINGS — see'} ${OUT}`);
await prisma.$disconnect();
