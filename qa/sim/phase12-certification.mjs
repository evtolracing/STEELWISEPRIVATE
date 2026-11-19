// Phase 12 certification scenarios: the ten cross-module workflows end to end, the twenty points of the ledger
// certification, reconciliation, dashboards against the records, the AI assistants, a revalidation of access
// control, multi-location readiness, and the evidence gaps found when the program was consolidated.
//   node qa/sim/phase12-certification.mjs --base http://localhost:3110 --stub-port 3166 [--group 1,2] [--match "text"] [--out file]
// Local QA database only. Run it against the cluster (qa/tools/phase11-cluster.sh) so that several server copies answer.
import fs from 'node:fs';
import * as c from './phase12/ctx.mjs';
import { scenarios, finish } from './phase4-lib.mjs';

const OUT = c.arg('out', 'qa/results/phase12-certification.json');
await c.startStub();
const files = ['f1-flows', 'f2-finance', 'f4-recon', 'f5-dash', 'f3-ai', 'f6-sec', 'f7-multi', 'f8-gaps'];
for (const [i, f] of files.entries()) {
  if (!c.wants12(c.GROUPS12[i])) continue;
  if (!fs.existsSync(new URL(`./phase12/${f}.mjs`, import.meta.url))) continue;
  const t = Date.now();
  try { await (await import(`./phase12/${f}.mjs`)).default(c); } catch (e) { await c.W(c.GROUPS12[i], `the group ran to the end (${f})`, {}, async (ok) => ok('no error outside a scenario', false, String(e?.stack || e).slice(0, 600))); }
  console.error(`  ${c.GROUPS12[i]}: ${scenarios.filter((s) => s.group === c.GROUPS12[i]).length} scenarios in ${((Date.now() - t) / 1000).toFixed(0)}s`);
}
await c.stopStub();
const failed = finish('Phase 12 certification', OUT, fs);
const report = JSON.parse(fs.readFileSync(OUT, 'utf8'));
report.serverCopies = c.copies;
report.ledgerEventsHeldBeforeTheRun = c.heldBefore;
fs.writeFileSync(OUT, `${JSON.stringify(report, null, 1)}\n`);
await c.closeDb(); await c.prisma.$disconnect();
process.exit(failed ? 1 : 0);
