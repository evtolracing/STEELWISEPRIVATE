// Phase 11 scenarios: the 80-branch enterprise under people working at the same moment, on several server
// copies, with failures injected. At least 300 scenarios in eight groups, each with its minimum.
//   node qa/sim/phase11-scenarios.mjs --base http://localhost:3110 [--group 1,2] [--match "text"] [--out file]
// Local QA database only. Run it against the cluster (qa/tools/qa-cluster.mjs) for the multi-copy scenarios.
import fs from 'node:fs';
import * as c from './phase11/sctx.mjs';
import { scenarios, finish } from './phase4-lib.mjs';

const OUT = c.arg('out', 'qa/results/phase11-scenarios.json');
await c.startStub();
const files = ['s1-conc', 's2-shop', 's3-ship', 's4-ledger', 's5-sec', 's6-integ', 's7-fail', 's8-report'];
for (const [i, f] of files.entries()) {
  if (!c.wants(c.GROUPS11[i])) continue;
  if (!fs.existsSync(new URL(`./phase11/${f}.mjs`, import.meta.url))) continue;
  const t = Date.now();
  try { await (await import(`./phase11/${f}.mjs`)).default(c); } catch (e) { await c.S(c.GROUPS11[i], `the group ran to the end (${f})`, {}, async (ok) => ok('no error outside a scenario', false, String(e?.stack || e).slice(0, 500))); }
  console.error(`  ${c.GROUPS11[i]}: ${scenarios.filter((s) => s.group === c.GROUPS11[i]).length} scenarios in ${((Date.now() - t) / 1000).toFixed(0)}s`);
}
await c.stopStub();
const failed = finish('Phase 11 scenarios', OUT, fs);
const report = JSON.parse(fs.readFileSync(OUT, 'utf8'));
report.serverCopies = c.copies;
report.minimums = Object.fromEntries(Object.entries(c.MIN11).map(([k, min]) => { const g = report.groups[c.G11[k]] || { scenarios: 0, passed: 0 }; return [c.G11[k], { minimum: min, ran: g.scenarios, passed: g.passed, met: g.passed >= min }]; }));
report.totalMinimum = { minimum: 300, passed: report.passed, met: report.passed >= 300 };
fs.writeFileSync(OUT, `${JSON.stringify(report, null, 1)}\n`);
const partial = c.arg('group', '') || c.arg('match', '');
if (!partial) for (const [g, m] of Object.entries(report.minimums)) console.log(`${m.met ? '✓' : '✗'} ${g}: ${m.passed} passed of ${m.ran} (minimum ${m.minimum})`);
await c.closeDb(); await c.prisma.$disconnect();
process.exit(failed || (!partial && (!report.totalMinimum.met || Object.values(report.minimums).some((m) => !m.met))) ? 1 : 0);
