// Phase 11 measurement: how many dispatches with their invoice the system completes per second when
// nothing else is running, at several numbers of dispatches in flight. Invoice numbers are never skipped
// or repeated, so invoices are written one at a time company-wide; this measures what that costs.
//   node qa/sim/phase11/invoice-capacity.mjs --base http://localhost:3110 [--each 60] [--levels 1,4,16,48] [--out file]
// Local QA database only. Every shipment is a real order, reserved and put together through the server.
import fs from 'node:fs';
import * as ctx from '../phase10/ctx.mjs';
import { pool, summary } from './engine.mjs';

const EACH = Number(ctx.arg('each', '60')); const LEVELS = ctx.arg('levels', '1,4,16,48').split(',').map(Number); const OUT = ctx.arg('out', '');
await ctx.ensureLedger();
const lot = await ctx.costed(EACH * LEVELS.length * 110 + 5000, 0.4);
const out = { at: new Date().toISOString(), base: ctx.BASE, serverCopies: await fetch(`${ctx.BASE}/__cluster/state`).then((r) => r.json()).then((s) => s.workers.filter((w) => w.up).length).catch(() => 1), levels: [] };
for (const level of LEVELS) {
  const ready = [];
  await pool(Array.from({ length: EACH }), 6, async () => { ready.push(await ctx.readyToShip(100, { coilId: lot.coilId })); });
  const before = Number((await ctx.prisma.$queryRawUnsafe('SELECT xact_rollback::int AS n FROM pg_stat_database WHERE datname = current_database()'))[0].n);
  const ms = []; let failed = 0; const t = performance.now();
  await pool(ready, level, async (r) => { const t0 = performance.now(); const d = await ctx.B.dispatch(r.shipment); ms.push(performance.now() - t0); if (d.status !== 200 || !d.body.invoice) failed += 1; });
  const sec = (performance.now() - t) / 1000;
  const after = Number((await ctx.prisma.$queryRawUnsafe('SELECT xact_rollback::int AS n FROM pg_stat_database WHERE datname = current_database()'))[0].n);
  out.levels.push({ inFlight: level, dispatches: EACH, failed, seconds: +sec.toFixed(2), perSecond: +(EACH / sec).toFixed(1), rolledBack: after - before, ...summary(ms) });
  console.log(`${String(level).padStart(3)} in flight: ${(EACH / sec).toFixed(1)} dispatches/s, p50 ${summary(ms).p50} ms, p95 ${summary(ms).p95} ms, failed ${failed}, rolled back ${after - before}`);
}
const dup = Number((await ctx.prisma.$queryRawUnsafe('SELECT count(*)::int AS n FROM (SELECT "invoiceNumber" FROM "Invoice" GROUP BY 1 HAVING count(*) > 1) x'))[0].n);
const gaps = (await ctx.prisma.$queryRawUnsafe(`SELECT (max(substring("invoiceNumber" from '[0-9]+$')::int) - min(substring("invoiceNumber" from '[0-9]+$')::int) + 1 - count(*))::int AS n FROM "Invoice" WHERE "invoiceNumber" ~ '^INV-[0-9]+$'`))[0].n;
out.invoiceNumbersUsedTwice = dup; out.invoiceNumbersSkipped = gaps;
console.log(`invoice numbers used twice: ${dup}; skipped: ${gaps}`);
if (OUT) fs.writeFileSync(OUT, `${JSON.stringify(out, null, 1)}\n`);
await ctx.closeDb(); await ctx.prisma.$disconnect(); process.exit(dup || gaps ? 1 : 0);
