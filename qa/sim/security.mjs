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
    return { status: res.status, text: text.slice(0, 200) };
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
  section('Customers cannot see each other', { pass: findings.length === 0, summary: `${tries.length + 2} checks, ${findings.length} problems`, findings });
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
  // Not a failure by today's rules, but recorded: the API does not limit staff roles by department.
  const adminToken = await tokenFor('admin');
  const buyer = await prisma.organization.findFirst({ where: { code: 'QA-C05' } });
  const made = await fetch(`${BASE}/api/orders`, { method: 'POST', headers: { 'content-type': 'application/json', authorization: `Bearer ${adminToken}` }, body: JSON.stringify({ buyerId: buyer.id, poReference: 'QA-SECURITY', lines: [{ qtyOrdered: 10, description: 'security probe' }] }) }).then((r) => r.json());
  const order = made?.id ? made : null;
  if (order) {
    const r = await raw('PUT', `/api/orders/${order.id}`, { token: op, body: { notes: 'edited by operator (QA probe)' } });
    observations.push(`A saw-operator login edited a sales order through the API → ${r.status}. Screens are limited by role, but the API lets any signed-in staff member use any staff route.`);
  }
  section('Staff roles', { pass: findings.length === 0, summary: `${findings.length} problems, ${observations.length} observation(s) needing a policy decision`, findings, observations });
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

// 9. Nothing above may have answered with database or server internals.
section('Error replies do not expose internals', { pass: leaks.size === 0, summary: `${leaks.size} replies exposed internal detail`, findings: [...leaks] });

report.pass = Object.values(report.sections).every((s) => s.pass);
fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, JSON.stringify(report, null, 1));
console.log(`\n${report.pass ? 'ALL SECTIONS PASS' : 'FINDINGS — see'} ${OUT}`);
await prisma.$disconnect();
