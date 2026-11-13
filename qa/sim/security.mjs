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
      const total = await prisma.coil.count();
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
        const got = (await send('GET', `/api/coils/${priced.id}`, csrT)).body;
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

report.pass = Object.values(report.sections).every((s) => s.pass);
fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, JSON.stringify(report, null, 1));
console.log(`\n${report.pass ? 'ALL SECTIONS PASS' : 'FINDINGS — see'} ${OUT}`);
await prisma.$disconnect();
