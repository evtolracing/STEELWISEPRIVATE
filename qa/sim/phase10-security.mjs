#!/usr/bin/env node
// Phase 10: security, reliability, financial integrity, backup, recovery and deployment scenarios.
//   DATABASE_URL=...steelwise_qa node qa/sim/phase10-security.mjs --base http://localhost:3011 [--group N] [--match text] [--server-log file]
// Runs on the local QA database only. The QA server should connect as steelwise_runtime (qa/tools/run-gates.sh does).
// Group 8 needs a separate PostgreSQL server on port 5433 for the restore (see phase-10-restore-test.md).
// Results: qa/results/phase10-security.json (every scenario with the record the Phase 10 prompt asks for).
import fs from 'node:fs';
import { finish, scenarios, startStub, stopStub } from './phase4-lib.mjs';
import * as ctx from './phase10/ctx.mjs';
import auth from './phase10/g1-auth.mjs';
import isolation from './phase10/g2-isolation.mjs';
import api from './phase10/g3-api.mjs';
import ledger from './phase10/g4-ledger.mjs';
import recon from './phase10/g5-recon.mjs';
import integ from './phase10/g6-integrations.mjs';
import conc from './phase10/g7-concurrency.mjs';
import recovery from './phase10/g8-recovery.mjs';
import obs from './phase10/g9-observability.mjs';

const OUT = ctx.arg('out', 'qa/results/phase10-security.json');
// The minimum number of scenarios per category, from the Phase 10 prompt.
const MINIMUM = { [ctx.G10.auth]: 30, [ctx.G10.iso]: 30, [ctx.G10.api]: 30, [ctx.G10.ledger]: 40, [ctx.G10.recon]: 30, [ctx.G10.integ]: 25, [ctx.G10.conc]: 25, [ctx.G10.dr]: 20, [ctx.G10.obs]: 20 };

await startStub();
const ledgerState = await ctx.ensureLedger();
const settled = await ctx.settleHeldReceipts();
console.log(`ledger: ${ledgerState}; receipts with no purchase order left held by earlier suites: ${settled.held}, posted by the CFO naming 2000: ${settled.posted}, still held for want of a cost: ${settled.noCost}, nothing to post: ${settled.nothingToPost.length}`);
const state = { ledgerState, settled };

const PICK = ctx.arg('group', '');
for (const [i, group] of [auth, isolation, api, ledger, recon, integ, conc, recovery, obs].entries()) {
  if (PICK && Number(PICK) !== i + 1) continue;
  try { await group(ctx, state); } catch (e) {
    scenarios.push({ group: group.name, name: `${group.name}: the group ran to the end`, asserts: [{ what: 'set-up', ok: false, detail: String(e?.stack || e).slice(0, 500) }], pass: false, ms: 0 });
  }
}
const failed = finish('Phase 10 security', OUT, fs);
// The per-category minimum: counted from scenarios that ran and passed, never from ones that did not run.
const by = {};
for (const s of scenarios) { by[s.group] ||= { ran: 0, passed: 0 }; by[s.group].ran += 1; if (s.pass) by[s.group].passed += 1; }
const short = Object.entries(MINIMUM).filter(([gName, n]) => (by[gName]?.passed || 0) < n && !ctx.arg('group', '') && !ctx.arg('match', ''));
const report = JSON.parse(fs.readFileSync(OUT, 'utf8'));
report.minimum = Object.fromEntries(Object.entries(MINIMUM).map(([gName, n]) => [gName, { required: n, ran: by[gName]?.ran || 0, passed: by[gName]?.passed || 0, met: (by[gName]?.passed || 0) >= n }]));
report.restore = state.restore || null;
fs.writeFileSync(OUT, `${JSON.stringify(report, null, 1)}\n`);
for (const [gName, n] of short) console.log(`✗ minimum not met: ${gName} has ${by[gName]?.passed || 0} passing of the ${n} required`);
await stopStub();
await ctx.closeDb();
await ctx.prisma.$disconnect();
process.exit(failed || short.length ? 1 : 0);
