#!/usr/bin/env node
// Reads facts from the local QA database (never any other): rows per table, the rules the
// database itself enforces, foreign keys without an index, and a set of read-only consistency
// checks on stock, orders, shipments and invoices. Writes qa/results/db-facts.json.
//   DATABASE_URL=postgresql://…/steelwise_qa node qa/tools/db-facts.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { prismaClient } from '../sim/lib.mjs';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const url = process.env.DATABASE_URL || '';
if (!/(localhost|127\.0\.0\.1).*qa/.test(url)) { console.error('Refusing: DATABASE_URL is not a local QA database'); process.exit(2); }
const prisma = prismaClient();
const q = (sql) => prisma.$queryRawUnsafe(sql);
const num = (v) => (typeof v === 'bigint' ? Number(v) : v);
const rows = (await q(`SELECT relname AS t, n_live_tup AS n FROM pg_stat_user_tables WHERE schemaname='public' ORDER BY 1`)).map((r) => ({ table: r.t, rows: num(r.n) }));
// exact counts (the statistic can lag)
for (const r of rows) r.rows = num((await q(`SELECT count(*) AS n FROM "${r.table}"`))[0].n);
const constraints = (await q(`SELECT conrelid::regclass::text AS t, conname AS name, contype AS kind, pg_get_constraintdef(oid) AS def FROM pg_constraint WHERE connamespace='public'::regnamespace ORDER BY 1,2`)).map((c) => ({ table: c.t.replace(/"/g, ''), name: c.name, kind: { c: 'check', f: 'foreign key', p: 'primary key', u: 'unique', x: 'exclusion' }[c.kind] || c.kind, def: c.def.slice(0, 200) }));
const fkNoIndex = (await q(`
  SELECT c.conrelid::regclass::text AS t, a.attname AS col
  FROM pg_constraint c JOIN pg_attribute a ON a.attrelid=c.conrelid AND a.attnum=c.conkey[1]
  WHERE c.contype='f' AND c.connamespace='public'::regnamespace AND array_length(c.conkey,1)=1
    AND NOT EXISTS (SELECT 1 FROM pg_index i WHERE i.indrelid=c.conrelid AND i.indkey[0]=c.conkey[1]) ORDER BY 1,2`)).map((r) => `${r.t.replace(/"/g, '')}.${r.col}`);
const indexes = num((await q(`SELECT count(*) AS n FROM pg_indexes WHERE schemaname='public'`))[0].n);
const views = (await q(`SELECT viewname AS v FROM pg_views WHERE schemaname='public'`)).map((r) => r.v);
const triggers = (await q(`SELECT tgname AS n, tgrelid::regclass::text AS t FROM pg_trigger WHERE NOT tgisinternal`)).map((r) => `${r.t}.${r.n}`);
const jsonCols = (await q(`SELECT table_name AS t, column_name AS c FROM information_schema.columns WHERE table_schema='public' AND data_type IN ('json','jsonb') ORDER BY 1,2`)).map((r) => `${r.t}.${r.c}`);
// Read-only consistency checks. Each returns the number of rows that break the rule.
const one = async (sql) => { try { return num((await q(sql))[0].n); } catch (e) { return `could not run: ${String(e.message).split('\n').pop().slice(0, 120)}`; } };
const checks = {
  'stock balance: on hand = available + allocated + on hold': await one(`SELECT count(*) AS n FROM "Inventory" WHERE abs("qtyOnHand" - ("qtyAvailable"+"qtyAllocated"+"qtyOnHold")) > 0.0001`),
  'stock: any quantity below zero': await one(`SELECT count(*) AS n FROM "Inventory" WHERE "qtyOnHand"<0 OR "qtyAvailable"<0 OR "qtyAllocated"<0 OR "qtyOnHold"<0`),
  'order lines shipped more than ordered': await one(`SELECT count(*) AS n FROM "OrderLine" WHERE "qtyShipped" > "qtyOrdered" + 0.0001`),
  // A shipment counts once it has left. A counter quick sale has no shipment by design (B-025) and is counted on its own line.
  'order line shipped quantity differs from its dispatched shipment items': await one(`SELECT count(*) AS n FROM "OrderLine" l JOIN "Order" o ON o.id=l."orderId" WHERE COALESCE(o.notes,'') NOT LIKE 'Counter quick sale%' AND  abs(l."qtyShipped" - COALESCE((SELECT sum(si."qtyShipped") FROM "ShipmentItem" si JOIN "Shipment" s ON s.id=si."shipmentId" WHERE si."orderLineId"=l.id AND s.status IN ('IN_TRANSIT','DELIVERED','EXCEPTION')),0)) > 0.0001`),
  'order line shipped quantity differs from its dispatched shipment items, outside the demo seed orders': await one(`SELECT count(*) AS n FROM "OrderLine" l JOIN "Order" o ON o.id=l."orderId" WHERE o."orderNumber" !~ '^SO-[A-Z]' AND COALESCE(o.notes,'') NOT LIKE 'Counter quick sale%' AND  abs(l."qtyShipped" - COALESCE((SELECT sum(si."qtyShipped") FROM "ShipmentItem" si JOIN "Shipment" s ON s.id=si."shipmentId" WHERE si."orderLineId"=l.id AND s.status IN ('IN_TRANSIT','DELIVERED','EXCEPTION')),0)) > 0.0001`),
  'counter quick sale lines marked shipped with no shipment and no stock movement (B-025)': await one(`SELECT count(*) AS n FROM "OrderLine" l JOIN "Order" o ON o.id=l."orderId" WHERE o.notes LIKE 'Counter quick sale%' AND l."qtyShipped" > 0`),
  'invoice paid amount differs from its payments, outside the demo seed invoices': await one(`SELECT count(*) AS n FROM "Invoice" i WHERE i."invoiceNumber" !~ '^INV-[A-Z]' AND abs(i."paidAmount" - COALESCE((SELECT sum(p.amount) FROM "Payment" p WHERE p."invoiceId"=i.id),0)) > 0.005`),
  'invoices paid more than their total': await one(`SELECT count(*) AS n FROM "Invoice" WHERE abs("paidAmount") > abs("totalAmount") + 0.005`),
  'invoice total differs from subtotal + tax + freight': await one(`SELECT count(*) AS n FROM "Invoice" WHERE abs("totalAmount" - (COALESCE("subtotal",0)+COALESCE("taxAmount",0)+COALESCE("freightAmount",0))) > 0.011`),
  'invoice paid amount differs from its payments': await one(`SELECT count(*) AS n FROM "Invoice" i WHERE abs(i."paidAmount" - COALESCE((SELECT sum(p.amount) FROM "Payment" p WHERE p."invoiceId"=i.id),0)) > 0.005`),
  'orders with no lines (not draft or cancelled), outside seed and fixture orders': await one(`SELECT count(*) AS n FROM "Order" o WHERE o.status NOT IN ('DRAFT','CANCELLED') AND o."orderNumber" !~ '^(SO-[A-Z]|QA-)' AND NOT EXISTS (SELECT 1 FROM "OrderLine" l WHERE l."orderId"=o.id)`),
  'jobs with no order and no order line': await one(`SELECT count(*) AS n FROM "Job" WHERE "orderId" IS NULL AND "orderLineId" IS NULL`),
  'stock items (coils) with no heat': await one(`SELECT count(*) AS n FROM "Coil" WHERE "heatId" IS NULL`),
  'stock items with no location': await one(`SELECT count(*) AS n FROM "Coil" WHERE "locationId" IS NULL`),
  'shipments delivered with no proof of delivery name': await one(`SELECT count(*) AS n FROM "Shipment" WHERE status='DELIVERED' AND COALESCE("podSignature",'')='' AND "podCaptured" = false`),
  'users with no home branch': await one(`SELECT count(*) AS n FROM "User" WHERE "homeLocationId" IS NULL AND role::text NOT LIKE 'CUSTOMER%'`),
  'invoices and credit memos with no record of who raised them, outside the demo seed': await one(`SELECT count(*) AS n FROM "Invoice" i WHERE i."invoiceNumber" !~ '^INV-[A-Z]' AND NOT EXISTS (SELECT 1 FROM "AuditLog" a WHERE a."resourceId"=i.id AND a."eventType" IN ('INVOICE_ISSUED','CREDIT_ISSUED'))`),
};
const out = { at: new Date().toISOString(), database: url.replace(/\/\/[^@]*@/, '//').split('?')[0], tables: rows.length, totalRows: rows.reduce((s, r) => s + r.rows, 0), emptyTables: rows.filter((r) => r.rows === 0).map((r) => r.table), rows, indexes, views, triggers, jsonCols, fkNoIndex, constraintCounts: constraints.reduce((a, c) => { a[c.kind] = (a[c.kind] || 0) + 1; return a; }, {}), checkConstraints: constraints.filter((c) => c.kind === 'check'), checks };
fs.writeFileSync(path.join(root, 'qa/results/db-facts.json'), JSON.stringify(out, null, 1));
console.log(JSON.stringify({ tables: out.tables, totalRows: out.totalRows, empty: out.emptyTables.length, indexes, views, triggers: triggers.length, jsonCols: jsonCols.length, fkNoIndex: fkNoIndex.length, constraintCounts: out.constraintCounts, checks }, null, 1));
await prisma.$disconnect();
