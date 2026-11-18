/**
 * Request limits counted once for every server copy (E-014, Z-007).
 *
 * A limit counted in memory is counted once per running copy of the server: three copies, three times
 * the limit. Here one statement adds to a row of "RateWindow" and returns the new count, so every copy
 * adds to the same number. Windows are fixed (they begin on a multiple of their length), which keeps it
 * to one statement and no lock held between statements.
 *
 * When the table is not there yet (the code deployed before database update 18) or the database does
 * not answer, the count falls back to this copy's memory: the limit still exists, per copy, as it was
 * before, and the fact is logged once. A limiter must never be the reason a request fails.
 */
import prisma from './db.js';

const memory = new Map(); // `${key} ${windowStart}` -> count, for the fallback only
let warned = false;
let lastSweep = 0;

export const windowStartOf = (now, windowMs) => now - (now % windowMs);

function countInMemory(windows, now) {
  if (now - lastSweep > 60_000) { lastSweep = now; for (const [k, v] of memory) if (v.until < now) memory.delete(k); }
  return windows.map(({ key, windowMs }) => {
    const start = windowStartOf(now, windowMs); const id = `${key} ${start}`;
    const row = memory.get(id) || { count: 0, until: start + windowMs };
    row.count += 1; memory.set(id, row);
    return { key, count: row.count, resetAt: start + windowMs, shared: false };
  });
}

/** The database statement: adds one to each window and returns the counts in the order given. */
export async function countInDatabase(windows, now, db = prisma) {
  const params = []; const rows = [];
  windows.forEach(({ key, windowMs }, i) => { params.push(key, new Date(windowStartOf(now, windowMs))); rows.push(`($${2 * i + 1}, $${2 * i + 2}, 1)`); });
  const out = await db.$queryRawUnsafe(
    `INSERT INTO "RateWindow" ("key", "windowStart", "count") VALUES ${rows.join(', ')} ON CONFLICT ("key", "windowStart") DO UPDATE SET "count" = "RateWindow"."count" + 1 RETURNING "key", "count"`,
    ...params,
  );
  const by = new Map(out.map((r) => [r.key, Number(r.count)]));
  return windows.map(({ key, windowMs }) => ({ key, count: by.get(key) ?? 1, resetAt: windowStartOf(now, windowMs) + windowMs, shared: true }));
}

let counter = countInDatabase;
/** Tests put another counter in; `null` puts the database's back. */
export function useRateCounter(fn) { counter = fn || countInDatabase; }

/**
 * Adds one to each of the given windows ({ key, windowMs }) and returns [{ key, count, resetAt, shared }].
 * The keys of one call must differ. Never throws.
 */
export async function hit(windows, now = Date.now()) {
  if (!windows.length) return [];
  try {
    return await counter(windows, now);
  } catch (error) {
    if (!warned) { warned = true; console.warn(`[rateWindow] counting per server copy: ${/does not exist|P2021/.test(`${error?.code} ${error?.message}`) ? 'database update 18 (shared request limits) is not applied' : error?.message}`); }
    return countInMemory(windows, now);
  }
}

/** Takes one back (a request that should not count, for example a successful sign-in when only failures count). */
export async function unhit(key, windowMs, now = Date.now()) {
  try { await prisma.$executeRawUnsafe('UPDATE "RateWindow" SET "count" = GREATEST("count" - 1, 0) WHERE "key" = $1 AND "windowStart" = $2', key, new Date(windowStartOf(now, windowMs))); } catch { /* the fallback count is short-lived */ }
}

/** Removes windows that began more than two hours ago. Called by the scheduled run. */
export async function sweep(now = Date.now()) {
  try { return (await prisma.$executeRawUnsafe('DELETE FROM "RateWindow" WHERE "windowStart" < $1', new Date(now - 2 * 60 * 60_000))) || 0; } catch { return 0; }
}

/**
 * A store for express-rate-limit that counts in "RateWindow". One per limiter; `prefix` keeps two
 * limiters apart.
 */
export class SharedRateStore {
  constructor(prefix) { this.prefix = prefix; this.windowMs = 60_000; this.localKeys = false; }
  init(options) { this.windowMs = options.windowMs; }
  async increment(key) {
    const [r] = await hit([{ key: `${this.prefix}:${key}`, windowMs: this.windowMs }]);
    return { totalHits: r.count, resetTime: new Date(r.resetAt) };
  }
  async decrement(key) { await unhit(`${this.prefix}:${key}`, this.windowMs); }
  async resetKey(key) { try { await prisma.$executeRawUnsafe('DELETE FROM "RateWindow" WHERE "key" = $1', `${this.prefix}:${key}`); } catch { /* nothing to reset */ } }
}
