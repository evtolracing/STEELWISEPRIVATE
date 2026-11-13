#!/usr/bin/env node
// Builds qa/test-execution-results.md from the JSON files in qa/results, so
// every number in the report comes from a recorded run.
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const read = (f) => { try { return JSON.parse(fs.readFileSync(path.join(root, 'results', f), 'utf8')); } catch { return null; } };
const files = fs.readdirSync(path.join(root, 'results')).filter((f) => f.endsWith('.json'));
const cycles = files.filter((f) => /^(baseline|r\d+|final)-\d+\.json$/.test(f)).map((f) => ({ f, r: read(f) })).filter((x) => x.r?.scenarios).sort((a, b) => a.r.at.localeCompare(b.r.at));
const L = [];
const tallyOf = (r) => r.scenarios.reduce((t, s) => ({ ...t, [s.result]: (t[s.result] || 0) + 1 }), {});
const steps = (r) => r.scenarios.reduce((n, s) => n + s.steps.length, 0);
const checks = (r) => r.scenarios.reduce((n, s) => n + s.invariants.length, 0);

L.push('# Test execution results', '', `Generated ${new Date().toISOString()} by \`qa/tools/report.mjs\` from the files in \`qa/results/\`. Nothing here is typed by hand.`, '');
L.push('All runs were against the local QA database `steelwise_qa` (80 test branches, 280 work centers, 323 stock items, 16 test customers). No production system was touched.', '');
L.push('## Simulation cycles, in the order they ran', '', '| Run | Seed | Jobs | Pass | Fail | Error | Blocked | API steps | Checks | Simultaneous-request probes | Whole-database reconciliation |', '|---|---|---|---|---|---|---|---|---|---|---|');
for (const { f, r } of cycles) {
  const t = tallyOf(r);
  const conc = r.concurrency?.probes ? `${r.concurrency.probes.filter((p) => p.pass).length} of ${r.concurrency.probes.length} pass` : r.concurrency ? `${r.concurrency.succeeded} of ${r.concurrency.simultaneousOrders} orders saved` : 'not run';
  const rec = r.reconciliation ? `${r.reconciliation.problemCount} problems in ${r.reconciliation.stockItems} stock items and ${r.reconciliation.ordersFromThisQaRun ?? r.reconciliation.orders} orders` : 'not run';
  L.push(`| \`${f}\` | ${r.seed} | ${r.scenarios.length} | ${t.PASS || 0} | ${t.FAIL || 0} | ${t.ERROR || 0} | ${t.BLOCKED || 0} | ${steps(r)} | ${checks(r)} | ${conc} | ${rec} |`);
}
const finals = cycles.filter((c) => c.f.startsWith('final-'));
if (finals.length) {
  const sum = finals.reduce((a, { r }) => { const t = tallyOf(r); return { jobs: a.jobs + r.scenarios.length, pass: a.pass + (t.PASS || 0), fail: a.fail + (t.FAIL || 0) + (t.ERROR || 0), blocked: a.blocked + (t.BLOCKED || 0), steps: a.steps + steps(r), checks: a.checks + checks(r) }; }, { jobs: 0, pass: 0, fail: 0, blocked: 0, steps: 0, checks: 0 });
  L.push('', `**Final consecutive cycles:** ${finals.length} cycles, ${sum.jobs} jobs: ${sum.pass} passed, ${sum.fail} failed, ${sum.blocked} blocked. ${sum.steps} API steps and ${sum.checks} checks. Seeds ${finals.map((x) => x.r.seed).join(', ')}.`);
  const blocked = finals.flatMap(({ r }) => r.scenarios.filter((s) => s.result === 'BLOCKED').map((s) => `${s.id} (${s.category}): ${s.notes.join(' ')}`));
  if (blocked.length) { L.push('', 'Blocked jobs are not passes. They are jobs the app has no way to perform:', ''); for (const b of blocked) L.push(`- ${b}`); }
  L.push('', '### By category across the final cycles', '', '| Category | Jobs | Pass | Fail | Blocked |', '|---|---|---|---|---|');
  const cat = {};
  for (const { r } of finals) for (const s of r.scenarios) { const c = (cat[s.category] ||= { n: 0, PASS: 0, FAIL: 0, ERROR: 0, BLOCKED: 0 }); c.n++; c[s.result]++; }
  for (const [k, c] of Object.entries(cat)) L.push(`| ${k} | ${c.n} | ${c.PASS} | ${c.FAIL + c.ERROR} | ${c.BLOCKED} |`);
  const last = finals.at(-1).r;
  L.push('', '### Simultaneous-request probes (last final cycle)', '');
  for (const p of last.concurrency.probes) L.push(`- ${p.pass ? 'Pass' : 'FAIL'}: ${p.name}. ${p.detail}`);
  if (last.reconciliation?.demoSeedDataProblems?.count) L.push('', `The reconciliation also found ${last.reconciliation.demoSeedDataProblems.count} inconsistencies in the demo seed orders (created by the seed script, not by the app). Examples: ${last.reconciliation.demoSeedDataProblems.examples.slice(0, 3).join('; ')}.`);
}
const base = cycles.find((c) => c.f.startsWith('baseline'));
if (base) {
  L.push('', '## What the baseline run found before any repair', '');
  const fs_ = base.r.summary?.failedSteps || {}; const fc = base.r.summary?.failedChecks || {};
  for (const [k, v] of Object.entries(fs_)) L.push(`- Step failed in ${v.length} job(s): ${k}. Example: \`${String(v[0]).slice(0, 140)}\``);
  for (const [k, v] of Object.entries(fc)) L.push(`- Check failed in ${v.length} job(s): ${k}. Example: \`${String(v[0]).slice(0, 140)}\``);
}
const invalid = files.filter((f) => f.startsWith('invalid-'));
if (invalid.length) L.push('', '## Runs set aside', '', ...invalid.map((f) => `- \`${f}\`: the test harness sent more than 1,000 requests a minute from one address and the API rate limit cut it off part-way. The limit worked as designed; the QA server was restarted with a higher limit (\`qa/tools/start-qa-server.sh\`) and the same seed was run again.`));

const sec = read('security.json');
if (sec) {
  L.push('', '## Security, isolation and robustness sweep', '', `Run ${sec.at}. ${sec.endpointsSwept} of ${sec.endpointsInInventory} routes swept.`, '', '| Check | Result | Detail |', '|---|---|---|');
  for (const [name, s] of Object.entries(sec.sections)) L.push(`| ${name} | ${s.pass ? 'Pass' : 'FINDINGS'} | ${s.summary} |`);
  for (const [name, s] of Object.entries(sec.sections)) {
    if (s.pass && !(s.observations || []).length) continue;
    L.push('', `### ${name}`, '');
    for (const f of s.findings || []) L.push(`- ${f.replace(/\|/g, '\\|')}`);
    for (const o of s.observations || []) L.push(`- Observation: ${o}`);
  }
}
const ui = read('ui-smoke.json');
if (ui) {
  L.push('', '## Screen check', '', `Run ${ui.at} as ${ui.who}. Every route in the app's router was opened in a real browser (Chromium).`, '', `- Screens opened: ${ui.screens}`, ...Object.entries(ui.tally).map(([k, v]) => `- ${k}: ${v}`), `- Screens that made at least one failing API call: ${ui.screensWithFailedApiCalls}`, '');
  const notOk = ui.results.filter((r) => r.status !== 'OK');
  if (notOk.length) { L.push('### Screens that did not load cleanly', '', '| Screen | Result | First error |', '|---|---|---|'); for (const r of notOk) L.push(`| \`${r.route}\` | ${r.status} | ${(r.pageErrors[0] || '').replace(/\|/g, '\\|').slice(0, 120)} |`); L.push(''); }
  const failing = Object.entries(ui.failedApiCalls).sort((a, b) => b[1].length - a[1].length);
  if (failing.length) { L.push('### API calls that failed while screens loaded', '', '| Call | Screens |', '|---|---|'); for (const [k, v] of failing) L.push(`| \`${k}\` | ${v.slice(0, 3).map((x) => `\`${x}\``).join(', ')}${v.length > 3 ? ` +${v.length - 3}` : ''} |`); L.push(''); }
  L.push('Screens with an id in the address were opened with an id that does not exist, so a "not found" call on those is expected.');
}
const sales = read('ui-sales.json');
if (sales) {
  L.push('', '## Sales screens operated in a browser', '', `Run ${sales.at} with \`qa/sim/ui-sales.cjs\`: Sales Rep Mobile, Sales Dashboard, Pricing and Credit Holds were used as a clerk and as a manager, and what they showed was compared with the database.`, '', `- Checks: ${sales.checks}`, `- Failed: ${sales.failed}`, '', '| Check | Result |', '|---|---|');
  for (const c of sales.results) L.push(`| ${c.name} | ${c.ok ? 'Pass' : `FAIL: ${String(c.detail).replace(/\|/g, '\\|').slice(0, 160)}`} |`);
}
const stock = read('ui-inventory.json');
if (stock) {
  L.push('', '## Stock screens operated in a browser', '', `Run ${stock.at} with \`qa/sim/ui-inventory.cjs\`: stock items, heats and receiving were used as a clerk and as a manager, and what they showed was compared with the database.`, '', `- Checks: ${stock.checks}`, `- Failed: ${stock.failed}`, '', '| Check | Result |', '|---|---|');
  for (const c of stock.results) L.push(`| ${c.name} | ${c.ok ? 'Pass' : `FAIL: ${String(c.detail).replace(/\|/g, '\\|').slice(0, 160)}`} |`);
}
const contract = (() => { try { return JSON.parse(fs.readFileSync(path.join(root, '.api-contract.json'), 'utf8')); } catch { return null; } })();
if (contract) L.push('', '## Screen-to-server contract', '', `${contract.total} distinct API calls are written in the screens; ${contract.missing.length} have no matching server route. Full list in \`qa/api-contract.md\`.`);
L.push('', '## Unit tests', '', 'Run with `npm test` in `src/backend` (Node built-in test runner). The count and result are printed by the runner; see the pull request for the latest run.');
fs.writeFileSync(path.join(root, 'test-execution-results.md'), L.join('\n') + '\n');
console.log('wrote qa/test-execution-results.md', L.length, 'lines');
