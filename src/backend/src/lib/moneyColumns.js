/**
 * Decimal values are saved exactly, and amounts to the cent (finding G-001).
 *
 * The server does its arithmetic in JavaScript numbers. The database client used to send a
 * number such as 9.38 to a decimal column with every binary digit it carries, and the column
 * keeps thirty decimal places, so 9.380000000000001 was saved. It never showed on a screen,
 * but an invoice whose tax is 9.380000000000001 does not equal one whose tax is 9.38, and
 * sums over many rows drift.
 *
 * This is applied by the database client (lib/db.js) to every create and update, including
 * rows written inside another row's create:
 *   - every number bound for a decimal column is sent as the exact decimal a person would
 *     write (9.38), with no rounding of the value;
 *   - money totals (the AMOUNTS below) are also rounded to the cent first.
 * Values that are already exact (strings, Decimal objects) are left alone.
 */
import pkg from '@prisma/client';
const { Prisma } = pkg;

const AMOUNT = 2;
// Columns that hold a sum of money. Unit prices are not here: a price per pound can have four places.
const AMOUNTS = {
  Order: ['subtotal', 'taxAmount', 'freightAmount', 'totalAmount'],
  OrderLine: ['extendedPrice'],
  Invoice: ['subtotal', 'taxAmount', 'freightAmount', 'totalAmount', 'paidAmount'],
  InvoiceLine: ['extendedPrice'],
  Payment: ['amount'],
  Quote: ['subtotal', 'taxAmount', 'freightAmount', 'totalAmount'],
  QuoteLine: ['extendedPrice'],
};
// From the schema: which columns of each table are decimals, and which fields are rows of another table.
const DECIMALS = {};
const CHILDREN = {};
for (const model of Prisma.dmmf.datamodel.models) {
  const decimals = model.fields.filter((f) => f.kind === 'scalar' && f.type === 'Decimal' && !f.isList).map((f) => f.name);
  if (decimals.length) DECIMALS[model.name] = new Map(decimals.map((name) => [name, (AMOUNTS[model.name] || []).includes(name) ? AMOUNT : null]));
  const kids = model.fields.filter((f) => f.kind === 'object');
  if (kids.length) CHILDREN[model.name] = Object.fromEntries(kids.map((f) => [f.name, f.type]));
}
const WRITES = new Set(['create', 'createMany', 'createManyAndReturn', 'update', 'updateMany', 'upsert']);
const NESTED = ['create', 'createMany', 'update', 'updateMany', 'upsert', 'connectOrCreate'];
const MATHS = ['set', 'increment', 'decrement', 'multiply', 'divide'];

export const roundTo = (n, places) => { const f = 10 ** places; return Math.round((n + Number.EPSILON * Math.sign(n)) * f) / f; };

/** 9.38 the number becomes '9.38' the exact decimal. With places, it is rounded first. */
export function exact(n, places = null) {
  const value = places == null ? n : roundTo(n, places);
  return new Prisma.Decimal(String(value)).toFixed();
}

function fix(value, places) {
  if (typeof value === 'number' && Number.isFinite(value)) return exact(value, places);
  if (value && typeof value === 'object' && !Array.isArray(value) && value.constructor === Object) {
    let out = value;
    for (const op of MATHS) {
      if (typeof value[op] === 'number' && Number.isFinite(value[op])) { if (out === value) out = { ...value }; out[op] = exact(value[op], op === 'multiply' || op === 'divide' ? null : places); }
    }
    return out;
  }
  return value;
}

function fixRow(model, row, depth = 0) {
  if (!row || typeof row !== 'object' || depth > 6) return row;
  if (Array.isArray(row)) { const rows = row.map((r) => fixRow(model, r, depth)); return rows.some((r, i) => r !== row[i]) ? rows : row; }
  const cols = DECIMALS[model];
  const kids = CHILDREN[model] || {};
  let out = row;
  for (const key of Object.keys(row)) {
    let next = row[key];
    if (cols?.has(key)) next = fix(row[key], cols.get(key));
    else if (key in kids && row[key] && typeof row[key] === 'object') next = fixNested(kids[key], row[key], depth + 1);
    if (next !== row[key]) { if (out === row) out = { ...row }; out[key] = next; }
  }
  return out;
}

function fixNested(model, nested, depth) {
  let out = nested;
  for (const op of NESTED) {
    if (nested[op] == null) continue;
    const each = (item) => {
      if (!item || typeof item !== 'object') return item;
      const part = (k) => { const fixed = fixRow(model, item[k], depth); return fixed === item[k] ? null : fixed; };
      if (op === 'createMany' || ((op === 'update' || op === 'updateMany') && 'data' in item)) { const d = part('data'); return d ? { ...item, data: d } : item; }
      if (op === 'upsert') { const c = part('create'); const u = part('update'); return c || u ? { ...item, ...(c && { create: c }), ...(u && { update: u }) } : item; }
      if (op === 'connectOrCreate') { const c = part('create'); return c ? { ...item, create: c } : item; }
      return fixRow(model, item, depth);
    };
    const next = Array.isArray(nested[op]) ? nested[op].map(each) : each(nested[op]);
    const changed = Array.isArray(next) ? next.some((n, i) => n !== nested[op][i]) : next !== nested[op];
    if (changed) { if (out === nested) out = { ...nested }; out[op] = next; }
  }
  return out;
}

/** The same arguments with decimal columns made exact. Returns `args` itself when nothing changes. */
export function roundedArgs(model, operation, args) {
  if (!WRITES.has(operation) || !args || (!DECIMALS[model] && !CHILDREN[model])) return args;
  if (operation === 'upsert') {
    const create = fixRow(model, args.create); const update = fixRow(model, args.update);
    return create === args.create && update === args.update ? args : { ...args, create, update };
  }
  const data = fixRow(model, args.data);
  return data === args.data ? args : { ...args, data };
}
