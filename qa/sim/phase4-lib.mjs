// Shared pieces of the Phase 4 integration scenarios: the recorder, a stand-in for every
// outside service (a partner's webhook address, the speech provider, the AI provider), partner
// accounts with keys, and the business building blocks (order, reservation, shipment).
// Everything runs against the local QA server and QA database only.
import http from 'node:http';
import net from 'node:net';
import crypto from 'node:crypto';
import { prismaClient, api, QA_USERS, QA_PASSWORD } from './lib.mjs';

export const arg = (n, d) => { const i = process.argv.indexOf(`--${n}`); return i > -1 ? process.argv[i + 1] : d; };
export const BASE = arg('base', 'http://localhost:3011');
export const STUB_PORT = Number(arg('stub-port', 3056));
export const STUB = `http://127.0.0.1:${STUB_PORT}`;
export const TASKS_SECRET = 'qa-tasks-secret-not-real';
export const prisma = prismaClient();
export const A = api(BASE);
export const run = Date.now().toString(36).toUpperCase();
export const num = (v) => Number(v || 0);
export const ok2 = (r) => r.status >= 200 && r.status < 300;
export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let seq = 0;
export const tag = (p = 'P4') => `${p}-${run}-${++seq}`;
export { QA_USERS, QA_PASSWORD };
/** True once the first attempt of a delivery has been answered and written down (not merely claimed). */
export const tried = (r, n = 1) => Boolean(r && r.attempts >= n && (r.httpStatus || r.errorMessage) && r.status !== 'PENDING');

// ── recording ────────────────────────────────────────────────────────────
export const scenarios = [];
export async function scenario(group, name, fn, { status } = {}) {
  const sc = { group, name, asserts: [], pass: true, ms: 0, ...(status && { status }) };
  const t0 = Date.now();
  const ok = (what, cond, detail) => { sc.asserts.push({ what, ok: !!cond, ...(cond ? {} : { detail: String(detail ?? '').slice(0, 300) }) }); if (!cond) sc.pass = false; return !!cond; };
  try { await fn(ok, sc); } catch (e) { sc.pass = false; sc.asserts.push({ what: 'scenario ran to the end', ok: false, detail: String(e?.stack || e?.message || e).slice(0, 500) }); }
  if (!sc.asserts.length) { sc.pass = false; sc.asserts.push({ what: 'at least one check', ok: false }); }
  sc.ms = Date.now() - t0;
  scenarios.push(sc);
  return sc;
}

// ── raw HTTP, with any headers ─────────────────────────────────────────────────────
const tokens = {};
export async function tokenOf(who = 'admin') {
  if (!tokens[who]) {
    const l = await fetch(`${BASE}/api/auth/login`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email: QA_USERS[who], password: QA_PASSWORD }) });
    const b = await l.json(); if (!b.token) throw new Error(`login ${who}: ${l.status}`);
    tokens[who] = b.token;
  }
  return tokens[who];
}
export async function http1(method, url, { body, headers = {}, token, text = false, timeoutMs = 30000 } = {}) {
  const res = await fetch(url.startsWith('http') ? url : BASE + url, {
    method, headers: { ...(body !== undefined && typeof body !== 'string' && { 'content-type': 'application/json' }), ...(token && { authorization: `Bearer ${token}` }), ...headers },
    body: body === undefined ? undefined : typeof body === 'string' ? body : JSON.stringify(body), signal: AbortSignal.timeout(timeoutMs), redirect: 'manual',
  });
  const raw = await res.text(); let json = null; try { json = raw ? JSON.parse(raw) : null; } catch { json = text ? null : { raw: raw.slice(0, 200) }; }
  return { status: res.status, body: json, raw, headers: res.headers, replayed: res.headers.get('idempotency-replayed') === 'true' };
}
export const raw = async (method, url, body, who = 'admin', headers = {}) => http1(method, url, { body, headers, token: await tokenOf(who) });

/**
 * Send a request and drop the connection without reading the answer: what a browser does when
 * the network fails after the request has left. Resolves once the bytes are written.
 */
export function sendAndHangUp(method, path, body, headers = {}) {
  const u = new URL(BASE);
  const payload = JSON.stringify(body);
  return new Promise((resolve, reject) => {
    const socket = net.connect(Number(u.port || 80), u.hostname, () => {
      const head = [`${method} ${path} HTTP/1.1`, `Host: ${u.host}`, 'Content-Type: application/json', `Content-Length: ${Buffer.byteLength(payload)}`, 'Connection: close', ...Object.entries(headers).map(([k, v]) => `${k}: ${v}`), '', ''].join('\r\n');
      socket.write(head + payload, () => { setTimeout(() => { socket.destroy(); resolve(); }, 5); });
    });
    socket.on('error', reject);
  });
}

// ── the stand-in for outside services ─────────────────────────────────────────
// Each address behaves the way the scenario sets it: { status, delayMs, redirect, body }.
export const stub = { hits: [], modes: new Map(), server: null };
export const setMode = (name, mode) => stub.modes.set(name, mode);
export const hitsOf = (name) => stub.hits.filter((h) => h.name === name);
export const clearHits = (name) => { stub.hits = name ? stub.hits.filter((h) => h.name !== name) : []; };
export async function startStub() {
  stub.server = http.createServer((req, res) => {
    const chunks = [];
    req.on('data', (c) => chunks.push(c));
    req.on('end', async () => {
      const body = Buffer.concat(chunks).toString('utf8');
      const url = new URL(req.url, STUB);
      const parts = url.pathname.split('/').filter(Boolean);
      const name = parts[0] === 'hook' ? `hook:${parts[1]}` : parts[0];
      const mode = stub.modes.get(name) || { status: 200 };
      stub.hits.push({ name, path: url.pathname, method: req.method, headers: req.headers, body, at: Date.now() });
      if (mode.delayMs) await sleep(mode.delayMs);
      if (res.destroyed) return;
      if (mode.redirect) { res.writeHead(302, { location: mode.redirect }); return res.end(); }
      const status = mode.status || 200;
      if (name === 'speech' && status === 200 && req.method === 'POST') { res.writeHead(200, { 'content-type': 'audio/mpeg' }); return res.end(Buffer.from('ID3-QA-AUDIO')); }
      if (name === 'ai' && status === 200) {
        res.writeHead(200, { 'content-type': 'application/json' });
        return res.end(JSON.stringify({ id: 'qa', object: 'chat.completion', created: 1, model: 'deepseek-chat', choices: [{ index: 0, message: { role: 'assistant', content: 'QA stand-in answer' }, finish_reason: 'stop' }], usage: { prompt_tokens: 1, completion_tokens: 1, total_tokens: 2 } }));
      }
      res.writeHead(status, { 'content-type': 'application/json' });
      res.end(mode.body !== undefined ? mode.body : JSON.stringify(status < 300 ? { received: true } : { error: { message: `stand-in ${status}` } }));
    });
  });
  await new Promise((resolve, reject) => { stub.server.once('error', reject); stub.server.listen(STUB_PORT, '127.0.0.1', resolve); });
}
export const stopStub = () => new Promise((r) => (stub.server ? stub.server.close(() => r()) : r()));
export const hookUrl = (name) => `${STUB}/hook/${name}`;

// ── partner accounts ─────────────────────────────────────────────────────────────
export async function partnerCall(token, method, path, body, headers = {}) {
  return http1(method, `/api/v1/partner${path}`, { body, headers, token });
}
/** A partner account for an organisation, with a key and a token. Limits are raised so the scenarios are not slowed. */
export async function partner(org, type, { scopes, limits = true } = {}) {
  let p = await A.post('/api/v1/admin/partners', { organizationId: org.id, partnerType: type });
  if (p.status === 409) p = { status: 200, body: await prisma.partner.findFirst({ where: { organizationId: org.id, partnerType: type } }) };
  if (!p.body?.id) throw new Error(`partner ${type}: ${p.status} ${JSON.stringify(p.body).slice(0, 200)}`);
  await prisma.partner.update({ where: { id: p.body.id }, data: { status: 'ACTIVE', ...(limits && { rateLimitPerMin: 1_000_000, rateLimitPerHour: 10_000_000, burstLimit: 100_000 }) } });
  const k = await A.post(`/api/v1/admin/partners/${p.body.id}/keys`, { keyName: tag('KEY'), ...(scopes && { scopes }) });
  if (k.status !== 201) throw new Error(`key: ${k.status} ${JSON.stringify(k.body).slice(0, 200)}`);
  const t = await http1('POST', '/api/v1/partner/auth/token', { body: { grant_type: 'client_credentials', client_id: k.body.clientId, client_secret: k.body.clientSecret } });
  if (t.status !== 200) throw new Error(`token: ${t.status} ${JSON.stringify(t.body).slice(0, 200)}`);
  const token = t.body.access_token;
  return { id: p.body.id, org, type, keyId: k.body.clientId, secret: k.body.clientSecret, token, call: (m, path, body, headers) => partnerCall(token, m, path, body, headers) };
}
/** A webhook subscription for a partner at a stand-in address. Returns { id, secret, name }. */
export async function subscribe(p, events, name = tag('HK').toLowerCase()) {
  // A partner may hold ten subscriptions. Older ones from earlier scenarios are removed through the partner's own API.
  const held = await prisma.partnerWebhook.findMany({ where: { partnerId: p.id }, orderBy: { createdAt: 'asc' }, select: { id: true } });
  for (const old of held.slice(0, Math.max(0, held.length - 6))) await p.call('DELETE', `/webhooks/${old.id}`);
  const r = await p.call('POST', '/webhooks', { url: hookUrl(name), events });
  if (r.status !== 201) throw new Error(`subscribe: ${r.status} ${JSON.stringify(r.body).slice(0, 200)}`);
  return { id: r.body.id, secret: r.body.secret, name: `hook:${name}`, path: name };
}
export const deliveriesOf = (webhookId, where = {}) => prisma.webhookDelivery.findMany({ where: { webhookId, ...where }, orderBy: { createdAt: 'asc' } });
export const runTasks = () => http1('POST', '/api/internal/tasks/run', { headers: { authorization: `Bearer ${TASKS_SECRET}` } });
/** Make every waiting delivery of a subscription due now (the scenarios do not wait out the real backoff). */
export const makeDue = (webhookId) => prisma.webhookDelivery.updateMany({ where: { webhookId, status: { in: ['PENDING', 'RETRYING'] } }, data: { nextRetryAt: new Date(Date.now() - 1000) } });
/** Wait until `fn` returns something truthy, or give up. */
export async function until(fn, { ms = 6000, every = 100 } = {}) {
  const end = Date.now() + ms;
  for (;;) { const v = await fn(); if (v) return v; if (Date.now() > end) return v; await sleep(every); }
}
export const hmac = (secret, text) => crypto.createHmac('sha256', secret).update(text).digest('hex');

// ── business building blocks (the same calls the screens make) ───────────────────────
export async function world() {
  for (const who of Object.keys(QA_USERS)) await A.login(who).catch(() => {});
  const locs = await prisma.location.findMany({ where: { code: { startsWith: 'QA-L' }, isActive: true }, orderBy: { code: 'asc' } });
  const byCode = Object.fromEntries(locs.map((l) => [l.code, l]));
  const customers = await prisma.organization.findMany({ where: { code: { startsWith: 'QA-C' }, parentId: null }, orderBy: { code: 'asc' } });
  const limited = new Set((await prisma.customerPricingTier.findMany({ where: { creditLimit: { not: null } }, select: { customerId: true } })).map((t) => t.customerId));
  const free = customers.filter((c) => !limited.has(c.id) && !/-D\d/.test(c.code));
  const heat = await prisma.heat.findFirst({ where: { coils: { some: { location: { code: { startsWith: 'QA-L' } } } } }, include: { grade: true } });
  const users = Object.fromEntries(await Promise.all(Object.entries(QA_USERS).map(async ([k, email]) => [k, await prisma.user.findUnique({ where: { email } })])));
  const mkOrg = (code, name, type) => prisma.organization.upsert({ where: { code }, update: {}, create: { code, name, type } });
  const carrierOrg = await mkOrg('QA-CARRIER-1', 'QA Carrier One', 'BROKER');
  const carrierOrg2 = await mkOrg('QA-CARRIER-2', 'QA Carrier Two', 'BROKER');
  const supplierOrg = await mkOrg('QA-MILL-1', 'QA Mill One', 'MILL');
  const supplierOrg2 = await mkOrg('QA-MILL-2', 'QA Mill Two', 'MILL');
  return { locs, L1: byCode['QA-L01'], L2: byCode['QA-L02'], custA: free[0], custB: free[1], custC: free[2], heat, users, carrierOrg, carrierOrg2, supplierOrg, supplierOrg2 };
}

export function blocks(w) {
  const { heat, L1 } = w;
  const receiptBody = (over = {}) => ({ coilNumber: tag('RC'), form: 'PLATE', heatNumber: heat.heatNumber, gradeCode: heat.grade.code, thicknessIn: 0.5, widthIn: 48, lengthIn: 96, weightLb: 5000, locationId: L1.id, ...over });
  async function received(over = {}) {
    const r = await A.post('/api/inventory/receipts', receiptBody(over));
    if (r.status !== 201) throw new Error(`receipt ${r.status} ${JSON.stringify(r.body).slice(0, 200)}`);
    return r.body.item.id;
  }
  const line = (qty, price = 0.65, over = {}) => ({ gradeId: heat.gradeId, description: `QA phase 4 ${run}`, thicknessIn: 0.5, widthIn: 48, lengthIn: 96, qtyOrdered: qty, unit: 'LB', unitPrice: price, priceUnit: 'LB', extendedPrice: +(qty * price).toFixed(2), ...over });
  const orderBody = (lines, { customer = w.custA, taxRate = 0, freight = 0, extra = {} } = {}) => {
    const subtotal = +lines.reduce((s, l) => s + l.extendedPrice, 0).toFixed(2);
    const taxAmount = +(subtotal * taxRate).toFixed(2);
    return { orderType: 'SO', buyerId: customer.id, status: 'DRAFT', subtotal, taxAmount, freightAmount: freight, totalAmount: +(subtotal + taxAmount + freight).toFixed(2), poReference: tag('PO'), locationId: L1.id, lines, ...extra };
  };
  async function order(lines, opts = {}) {
    const r = await A.post('/api/orders', orderBody(lines, opts), opts.who || 'csr');
    if (r.status !== 201) throw new Error(`order ${r.status} ${JSON.stringify(r.body).slice(0, 200)}`);
    if (opts.status !== 'DRAFT') { const c = await A.put(`/api/orders/${r.body.id}`, { status: 'CONFIRMED' }); if (!ok2(c) || c.body?.status !== 'CONFIRMED') throw new Error(`confirm ${c.status} ${JSON.stringify(c.body).slice(0, 200)}`); }
    return prisma.order.findUnique({ where: { id: r.body.id }, include: { lines: { orderBy: { lineNumber: 'asc' } } } });
  }
  const reserve = (o, l, coilId, qty, who = 'admin') => A.post(`/api/orders/${o.id}/allocate`, { lineId: l.id, coilId, qty }, who);
  const shipment = (o, items, extra = {}) => A.post('/api/shipments', { orderId: o.id, fromLocationId: L1.id, carrierName: 'Own Truck', items: items.map(([l, q]) => ({ orderLineId: l.id, qtyShipped: q, weightLb: q })), ...extra }, 'shipping');
  const dispatch = (s) => A.put(`/api/shipments/${s.id}/dispatch`, {}, 'shipping');
  const deliver = (s) => A.put(`/api/shipments/${s.id}/deliver`, { podSignature: 'QA Receiver' }, 'shipping');
  /** An order with stock reserved and a shipment ready to dispatch. */
  async function readyToShip(qty = 1000, { customer, carrierId, price = 0.65 } = {}) {
    const coilId = await received({ weightLb: qty + 500 });
    const o = await order([line(qty, price)], { customer });
    const rz = await reserve(o, o.lines[0], coilId, qty);
    if (!ok2(rz)) throw new Error(`reserve ${rz.status} ${JSON.stringify(rz.body).slice(0, 200)}`);
    const s = await shipment(o, [[o.lines[0], qty]], carrierId ? { carrierId } : {});
    if (s.status !== 201) throw new Error(`shipment ${s.status} ${JSON.stringify(s.body).slice(0, 200)}`);
    return { coilId, order: o, shipment: s.body };
  }
  const invoicesOf = (orderId) => prisma.invoice.findMany({ where: { orderId }, include: { lines: true, payments: true }, orderBy: { createdAt: 'asc' } });
  return { receiptBody, received, line, orderBody, order, reserve, shipment, dispatch, deliver, readyToShip, invoicesOf };
}

export function finish(title, out, fs) {
  const groups = {};
  for (const s of scenarios) { groups[s.group] ||= { scenarios: 0, passed: 0, checks: 0 }; groups[s.group].scenarios++; groups[s.group].checks += s.asserts.length; if (s.pass) groups[s.group].passed++; }
  const failed = scenarios.filter((s) => !s.pass);
  const report = { at: new Date().toISOString(), base: BASE, scenarios: scenarios.length, passed: scenarios.length - failed.length, checks: scenarios.reduce((n, s) => n + s.asserts.length, 0), groups, results: scenarios };
  fs.writeFileSync(out, `${JSON.stringify(report, null, 1)}\n`);
  for (const s of failed) { console.log(`✗ [${s.group}] ${s.name}`); for (const a of s.asserts.filter((x) => !x.ok)) console.log(`    - ${a.what}${a.detail ? ` — ${a.detail}` : ''}`); }
  console.log(`${failed.length ? '✗' : '✓'} ${title}: ${report.passed} of ${report.scenarios} pass, ${report.checks} checks; ${Object.entries(groups).map(([g, v]) => `${g} ${v.passed}/${v.scenarios}`).join('; ')}`);
  return failed.length;
}
