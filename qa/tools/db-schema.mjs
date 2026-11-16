#!/usr/bin/env node
// Reads the real PostgreSQL schema of the local QA database (never any other) from the
// system catalogues: tables, columns, keys, checks, indexes, views, triggers, functions,
// sequences, row-level security. Then audits it: reference columns with no foreign key
// (and whether any row points at nothing), business numbers with no unique index, amounts
// and quantities kept as floating point, tables with no rows, duplicate indexes.
// Writes qa/results/db-schema.json.
//   DATABASE_URL=postgresql://…/steelwise_qa node qa/tools/db-schema.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { prismaClient } from '../sim/lib.mjs';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const url = process.env.DATABASE_URL || '';
if (!/(localhost|127\.0\.0\.1).*qa/.test(url)) { console.error('Refusing: DATABASE_URL is not a local QA database'); process.exit(2); }
const prisma = prismaClient();
const num = (v) => (typeof v === 'bigint' ? Number(v) : v);
const q = async (sql) => (await prisma.$queryRawUnsafe(sql)).map((r) => Object.fromEntries(Object.entries(r).map(([k, v]) => [k, num(v)])));
const one = async (sql) => Object.values((await q(sql))[0])[0];

const identity = (await q(`SELECT current_database() AS db, current_user AS usr, inet_server_addr()::text AS addr, current_setting('server_version') AS version, current_setting('default_transaction_isolation') AS isolation, current_setting('max_connections') AS max_connections`))[0];
const tables = (await q(`SELECT c.relname AS name, c.relrowsecurity AS rls, pg_total_relation_size(c.oid) AS bytes FROM pg_class c WHERE c.relkind='r' AND c.relnamespace='public'::regnamespace ORDER BY 1`));
for (const t of tables) t.rows = await one(`SELECT count(*) FROM "${t.name}"`);
const columns = await q(`SELECT table_name AS t, column_name AS c, data_type AS type, udt_name AS udt, is_nullable='YES' AS nullable, column_default AS def, numeric_precision AS p, numeric_scale AS s FROM information_schema.columns WHERE table_schema='public' ORDER BY table_name, ordinal_position`);
const cons = await q(`SELECT conrelid::regclass::text AS t, conname AS name, contype AS kind, confrelid::regclass::text AS ref, confdeltype AS ondelete, convalidated AS valid, pg_get_constraintdef(oid) AS def,
    (SELECT array_agg(a.attname ORDER BY k.ord) FROM unnest(conkey) WITH ORDINALITY k(attnum, ord) JOIN pg_attribute a ON a.attrelid=conrelid AND a.attnum=k.attnum) AS cols
  FROM pg_constraint WHERE connamespace='public'::regnamespace ORDER BY 1,2`);
for (const c of cons) { c.t = c.t.replace(/"/g, ''); c.ref = c.ref === '-' ? null : c.ref.replace(/"/g, ''); }
const indexes = await q(`SELECT t.relname AS t, i.relname AS name, ix.indisunique AS uniq, ix.indisprimary AS pk, pg_get_indexdef(ix.indexrelid) AS def, pg_relation_size(i.oid) AS bytes,
    (SELECT array_agg(a.attname ORDER BY k.ord) FROM unnest(ix.indkey) WITH ORDINALITY k(attnum, ord) JOIN pg_attribute a ON a.attrelid=t.oid AND a.attnum=k.attnum) AS cols,
    ix.indpred IS NOT NULL AS partial
  FROM pg_index ix JOIN pg_class i ON i.oid=ix.indexrelid JOIN pg_class t ON t.oid=ix.indrelid WHERE t.relnamespace='public'::regnamespace ORDER BY 1,2`);
const other = {
  schemas: (await q(`SELECT nspname AS n FROM pg_namespace WHERE nspname NOT LIKE 'pg_%' AND nspname<>'information_schema'`)).map((r) => r.n),
  views: (await q(`SELECT viewname AS n FROM pg_views WHERE schemaname='public'`)).map((r) => r.n),
  materializedViews: (await q(`SELECT matviewname AS n FROM pg_matviews WHERE schemaname='public'`)).map((r) => r.n),
  triggers: (await q(`SELECT c.relname||'.'||t.tgname AS n FROM pg_trigger t JOIN pg_class c ON c.oid=t.tgrelid WHERE c.relnamespace='public'::regnamespace AND NOT t.tgisinternal`)).map((r) => r.n),
  functions: (await q(`SELECT proname AS n FROM pg_proc WHERE pronamespace='public'::regnamespace`)).map((r) => r.n),
  sequences: (await q(`SELECT sequencename AS n FROM pg_sequences WHERE schemaname='public'`)).map((r) => r.n),
  partitionedTables: (await q(`SELECT relname AS n FROM pg_class WHERE relkind='p' AND relnamespace='public'::regnamespace`)).map((r) => r.n),
  policies: (await q(`SELECT tablename||'.'||policyname AS n FROM pg_policies WHERE schemaname='public'`)).map((r) => r.n),
  enums: await one(`SELECT count(*) FROM pg_type WHERE typnamespace='public'::regnamespace AND typtype='e'`),
  migrationsApplied: await one(`SELECT count(*) FROM "_prisma_migrations" WHERE finished_at IS NOT NULL`),
  migrationsFailed: await one(`SELECT count(*) FROM "_prisma_migrations" WHERE finished_at IS NULL`),
};

// ── audit ─────────────────────────────────────────────────────────────────────────────────
const tableNames = new Set(tables.map((t) => t.name));
const rowsOf = Object.fromEntries(tables.map((t) => [t.name, t.rows]));
const fkCols = new Set(cons.filter((c) => c.kind === 'f').flatMap((c) => c.cols.map((col) => `${c.t}.${col}`)));
// A reference column is one named <something>Id. Its target is guessed from the name; a few need a table.
const TARGET = { createdById: 'User', updatedById: 'User', approvedById: 'User', verifiedById: 'User', assignedToId: 'User', userId: 'User', operatorId: 'User', targetUserId: 'User',
  locationId: 'Location', fromLocationId: 'Location', toLocationId: 'Location', homeLocationId: 'Location', orderId: 'Order', salesOrderId: 'Order', returnOfOrderId: 'Order', convertedOrderId: 'Order',
  orderLineId: 'OrderLine', lineId: 'OrderLine', returnOfLineId: 'OrderLine', creditOfInvoiceId: 'Invoice', customerId: 'Organization', buyerId: 'Organization', sellerId: 'Organization', supplierId: 'Organization', carrierId: 'Organization',
  assignedWorkCenterId: 'WorkCenter', parentCoilId: 'Coil', sourceCoilId: 'Coil' };
const guess = (col) => { if (TARGET[col]) return TARGET[col]; const base = col.replace(/Id$/, ''); const name = base[0].toUpperCase() + base.slice(1); return tableNames.has(name) ? name : null; };
const typeOf = Object.fromEntries(columns.map((c) => [`${c.t}.${c.c}`, c.type]));
const unconstrained = [];
for (const c of columns) {
  if (!/Id$/.test(c.c) || c.c === 'id' || fkCols.has(`${c.t}.${c.c}`)) continue;
  const target = guess(c.c);
  const e = { table: c.t, column: c.c, nullable: c.nullable, target, rows: rowsOf[c.t], set: null, orphans: null };
  if (rowsOf[c.t] > 0) e.set = await one(`SELECT count(*) FROM "${c.t}" WHERE "${c.c}" IS NOT NULL`);
  if (target && c.type === 'text' && typeOf[`${target}.id`] === 'text' && e.set) e.orphans = await one(`SELECT count(*) FROM "${c.t}" x WHERE x."${c.c}" IS NOT NULL AND NOT EXISTS (SELECT 1 FROM "${target}" p WHERE p.id = x."${c.c}")`);
  unconstrained.push(e);
}
const floats = columns.filter((c) => ['double precision', 'real'].includes(c.type)).map((c) => `${c.t}.${c.c}`);
const uniqueCols = new Set(indexes.filter((i) => i.uniq && i.cols?.length === 1).map((i) => `${i.t}.${i.cols[0]}`));
const numberCols = columns.filter((c) => /(Number|Code|sku)$/.test(c.c) && c.type === 'text' && !/^(phone|po|tracking|pro|bol|serial|reference|customerPo|account|routing|tax|zip|postal|part|vin|license|truck|trailer|invoice|order|quote|job|heat|lot|coil|shipment|rfq|wo|mill|seal|carrier)/i.test(c.c) === false);
const businessNumbers = columns.filter((c) => { const own = c.t[0].toLowerCase() + c.t.slice(1); return [`${own}Number`, 'code', 'sku'].includes(c.c) || (c.t === 'WorkOrder' && c.c === 'woNumber') || (c.t === 'RFQ' && c.c === 'rfqNumber'); })
  .map((c) => ({ column: `${c.t}.${c.c}`, unique: uniqueCols.has(`${c.t}.${c.c}`), duplicates: null }));
for (const b of businessNumbers) { const [t, c] = b.column.split('.'); if (!b.unique && rowsOf[t]) b.duplicates = await one(`SELECT count(*) FROM (SELECT "${c}" FROM "${t}" WHERE "${c}" IS NOT NULL GROUP BY 1 HAVING count(*)>1) d`); }
// two indexes on exactly the same columns in the same order
const seen = {}; const duplicateIndexes = [];
for (const i of indexes) { if (!i.cols || i.partial) continue; const k = `${i.t}(${i.cols.join(',')})`; if (seen[k]) duplicateIndexes.push(`${k}: ${seen[k]} and ${i.name}`); else seen[k] = i.name; }
// an index whose columns are the leading columns of another on the same table
const prefixIndexes = [];
for (const a of indexes) { if (!a.cols || a.uniq || a.partial) continue; const b = indexes.find((x) => x !== a && x.t === a.t && x.cols && !x.partial && x.cols.length > a.cols.length && a.cols.every((c, n) => x.cols[n] === c)); if (b) prefixIndexes.push(`${a.t}: ${a.name} is covered by ${b.name}`); }
const fk = cons.filter((c) => c.kind === 'f');
const audit = {
  referenceColumnsWithNoForeignKey: unconstrained.length,
  ofWhichTargetKnown: unconstrained.filter((u) => u.target).length,
  ofWhichHaveOrphans: unconstrained.filter((u) => u.orphans > 0).map((u) => `${u.table}.${u.column} → ${u.target}: ${u.orphans} of ${u.set}`),
  floatingPointColumns: floats,
  businessNumbers, duplicateIndexes, prefixIndexes,
  foreignKeysNotValidated: fk.filter((c) => !c.valid).map((c) => c.name),
  foreignKeyDeleteRules: fk.reduce((a, c) => { const k = { c: 'cascade', n: 'set null', r: 'restrict', a: 'no action', d: 'set default' }[c.ondelete]; a[k] = (a[k] || 0) + 1; return a; }, {}),
  cascadesIntoMoneyOrStock: fk.filter((c) => c.ondelete === 'c' && ['Invoice', 'InvoiceLine', 'Payment', 'MaterialMovement', 'Inventory', 'ShipmentItem', 'AuditLog'].includes(c.t)).map((c) => `${c.t}.${c.cols.join(',')} → ${c.ref}`),
  emptyTables: tables.filter((t) => t.rows === 0).map((t) => t.name),
  tablesWithLocationColumnButNoForeignKey: unconstrained.filter((u) => /ocationId$/.test(u.column)).map((u) => `${u.table}.${u.column}`),
};
const out = { at: new Date().toISOString(), identity, counts: { tables: tables.length, columns: columns.length, primaryKeys: cons.filter((c) => c.kind === 'p').length, foreignKeys: fk.length, uniqueIndexes: indexes.filter((i) => i.uniq && !i.pk).length, checks: cons.filter((c) => c.kind === 'c').length, indexes: indexes.length, ...Object.fromEntries(Object.entries(other).map(([k, v]) => [k, Array.isArray(v) ? v.length : v])) },
  other, tables, columns, constraints: cons, indexes, unconstrained, audit };
void numberCols;
fs.writeFileSync(path.join(root, 'qa/results/db-schema.json'), `${JSON.stringify(out, null, 1)}\n`);
console.log(JSON.stringify({ identity, counts: out.counts, audit: { ...audit, emptyTables: audit.emptyTables.length, businessNumbers: businessNumbers.filter((b) => !b.unique).map((b) => `${b.column} dup ${b.duplicates}`), prefixIndexes: prefixIndexes.length } }, null, 1));
await prisma.$disconnect();
