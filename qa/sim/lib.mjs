// Shared helpers for the QA simulation. Everything here refuses to run unless
// DATABASE_URL points at a local database whose name contains "qa".
import { createRequire } from 'node:module';
import path from 'node:path';

const here = path.dirname(new URL(import.meta.url).pathname);
export const backendDir = path.resolve(here, '../../src/backend');
const require = createRequire(path.join(backendDir, 'package.json'));

export function assertSafeDatabase() {
  const url = process.env.DATABASE_URL || '';
  let u;
  try { u = new URL(url); } catch { throw new Error('DATABASE_URL is not set'); }
  const local = ['localhost', '127.0.0.1', '::1'].includes(u.hostname);
  const name = u.pathname.replace(/^\//, '');
  if (!local || !/qa/i.test(name)) {
    throw new Error(`Refusing to run: DATABASE_URL must be a local database with "qa" in its name (got ${u.hostname}/${name}).`);
  }
}

export function prismaClient() {
  assertSafeDatabase();
  const { PrismaClient } = require('@prisma/client');
  return new PrismaClient();
}
export const bcrypt = () => require('bcryptjs');

/** Deterministic PRNG (mulberry32) so every run can be replayed from its seed. */
export function rng(seed) {
  let a = seed >>> 0;
  const next = () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  return {
    next,
    int: (lo, hi) => lo + Math.floor(next() * (hi - lo + 1)),
    pick: (arr) => arr[Math.floor(next() * arr.length)],
    chance: (p) => next() < p,
  };
}

export const QA_PASSWORD = 'qa-password-1'; // test-only logins in the QA database
export const QA_USERS = {
  admin: 'qa-admin@qa.test',
  csr: 'qa-csr@qa.test',
  operator: 'qa-operator@qa.test',
  shipping: 'qa-shipping@qa.test',
  custA: 'qa-cust-a@qa.test',
  custB: 'qa-cust-b@qa.test',
  custDiv: 'qa-cust-div@qa.test', // a login on one division of customer A
};

/** Minimal API client with per-user tokens. */
export function api(base) {
  const tokens = {};
  async function call(method, url, body, who = 'admin') {
    const res = await fetch(base + url, {
      method,
      headers: { 'content-type': 'application/json', ...(tokens[who] ? { authorization: `Bearer ${tokens[who]}` } : {}) },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const text = await res.text();
    let json = null;
    try { json = text ? JSON.parse(text) : null; } catch { json = { raw: text.slice(0, 300) }; }
    return { status: res.status, body: json };
  }
  async function login(who) {
    const r = await call('POST', '/api/auth/login', { email: QA_USERS[who], password: QA_PASSWORD }, null);
    if (r.status !== 200 || !r.body?.token) throw new Error(`login ${who} failed: ${r.status} ${JSON.stringify(r.body)}`);
    tokens[who] = r.body.token;
  }
  return { call, login, get: (u, w) => call('GET', u, undefined, w), post: (u, b, w) => call('POST', u, b, w), put: (u, b, w) => call('PUT', u, b, w), patch: (u, b, w) => call('PATCH', u, b, w) };
}
