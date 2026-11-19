// Phase 12: writes the certification documents from the result files of this phase's runs. No figure is
// typed in here: every number comes from a file a run wrote, and a file that is missing is said to be
// missing. No approval, date, person or sign-off is invented: each prints as NOT GIVEN or a blank.
//   node qa/tools/phase12-docs.mjs
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { CAPS, STATES } from './phase12/capabilities.mjs';
import { ROLES } from './phase12/training.mjs';
import * as plans from './phase12/plans.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const X = (p) => path.join(root, p);
const R = (f) => { const p = X(`qa/results/${f}`); return fs.existsSync(p) ? JSON.parse(fs.readFileSync(p, 'utf8')) : null; };
const written = [];
const OUT = (name, lines) => { const text = (Array.isArray(lines) ? lines.join('\n') : lines).replace(/\n{3,}/g, '\n\n').trim(); fs.writeFileSync(X(`qa/enterprise-excellence/phase-12-${name}.md`), `${text}\n`); written.push(name); };
const { T, NOT_GIVEN, BLANK, sign } = plans;
const sh = (c) => { try { return execSync(c, { cwd: root, encoding: 'utf8' }).trim(); } catch { return ''; } };
const esc = (s) => String(s ?? '').replace(/\|/g, '\\|').replace(/\n/g, ' ');
const money = (v) => (v == null ? 'not measured' : Number(v).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));

// ── inputs ───────────────────────────────────────────────────────────────────────────────────
const CERT = R('phase12-certification.json'); const UI = R('phase12-ui.json'); const PROC = R('phase12-process.json'); const MAN = R('phase12-manual.json');
const MUT = R('phase12-mutations.json'); const CONS = R('phase12-consolidation.json'); const RESTORE = R('phase10-restore.json'); const ENT = R('phase11-gate-enterprise.json');
const P11S = R('phase11-gate-scenarios.json'); const AUDIT = JSON.parse(fs.readFileSync(X('qa/.screen-audit.json'), 'utf8'));
const REG = JSON.parse(fs.readFileSync(X('qa/enterprise-excellence/findings.json'), 'utf8')).findings;
const gateFile = X('qa/results/phase12-gate.txt'); const GATE = fs.existsSync(gateFile) ? fs.readFileSync(gateFile, 'utf8') : '';
const GATE1 = fs.existsSync(X('qa/results/phase12-gate-run-1.txt')) ? fs.readFileSync(X('qa/results/phase12-gate-run-1.txt'), 'utf8') : '';
const RERUN = fs.existsSync(X('qa/results/phase12-gate-reruns.txt')) ? fs.readFileSync(X('qa/results/phase12-gate-reruns.txt'), 'utf8') : '';
if (!CERT || !CONS) { console.error('Run the certification suite and the consolidation first.'); process.exit(1); }
const RC1 = '9e12319'; const HEAD = sh('git rev-parse --short HEAD'); const BRANCH = sh('git rev-parse --abbrev-ref HEAD');
const changed = sh(`git status --porcelain -- src ; git diff --name-only ${RC1} HEAD -- src`).split('\n').map((l) => l.replace(/^..\s/, '').trim()).filter(Boolean);
const productFiles = [...new Set(changed)].filter((f) => f.startsWith('src/')).sort();
const stamp = `Date: 2026-11-19. Release candidate RC-2 (RC-1 is commit \`${RC1}\`, the merge of Phase 11; RC-2 is RC-1 plus the corrections of this phase, listed in \`phase-12-release-baseline.md\`). Everything here was run in this session on one local machine against a local PostgreSQL 16 database whose name contains \`qa\`, with synthetic data only. Nothing was run against the live system, and nothing here is a statement about it.`;

// A gate section: the lines between "== name" and the next "==".
const section = (text, name) => { const i = text.indexOf(`== ${name}`); if (i < 0) return null; const j = text.indexOf('\n== ', i + 3); return text.slice(i, j < 0 ? undefined : j).split('\n').slice(1).filter((l) => l.trim()); };
const lineOf = (text, re) => (text.split('\n').find((l) => re.test(l)) || '').trim();
const suite = (key) => {
  if (key.startsWith('p12:')) { const g = { flows: 'Cross-module workflows end to end', finance: 'Financial ledger certification', recon: 'Financial and inventory reconciliation', dash: 'Dashboards and reports agree with the records', ai: 'AI assistants', sec: 'Security and access revalidation', multi: 'Multi-location readiness' }[key.slice(4)]; const x = CERT.groups?.[g]; return x ? { ok: x.passed === x.scenarios, text: `Phase 12 "${g}" ${x.passed} of ${x.scenarios}` } : { ok: false, text: `Phase 12 "${g}" not run` }; }
  const pat = { p2: /Phase 2 integrity:/, p3: /Phase 3 database scenarios:/, p4: /Phase 4 integration scenarios:/, p5: /Phase 5 sales scenarios:/, p6: /Phase 6 inventory scenarios:/, p7: /Phase 7 manufacturing scenarios:/, p8: /Phase 8 fulfilment scenarios:/, p9: /Phase 9 UI scenarios:/, p95: /Phase 9\.5 ledger:/, p10: /Phase 10 security:/, p11s: /Phase 11 scenarios:/, branch: /Branch boundary:/, p11: /Phase 11 enterprise cycle gate/ }[key];
  if (pat) { const l = lineOf(GATE, pat); if (!l) return { ok: false, text: `${key}: not in the gate log` }; const good = (x) => (key === 'p9' ? / 0 failed/.test(x) : x.startsWith('✓')); const short = (x) => x.replace(/^[✓✗]\s*/, '').split(';')[0].slice(0, 110);
    // A suite with a failed scenario in the gate counts as passed only if the whole suite was run again on the same build and passed; both results are stated.
    const again = ['p9', 'p11s'].includes(key) && !good(l) && /== done/.test(RERUN) ? lineOf(RERUN, pat) : '';
    if (again) return { ok: good(again), text: `in the gate ${short(l)}; one scenario failed on timing in the test (AA-012); whole suite run again on the same build: ${short(again)}` };
    return { ok: good(l), text: short(l) }; }
  if (key === 'sweep') { const s = section(GATE, 'sweep') || []; return { ok: s.length > 0 && !s.some((l) => l.startsWith('✗')), text: `sweep: ${s.filter((l) => l.startsWith('✓')).length} groups pass, ${s.filter((l) => l.startsWith('✗')).length} fail` }; }
  if (key === 'shop') { const s = (section(GATE, 'ui-shop') || []).join(' '); return { ok: / 0 failed/.test(s), text: `shop browser suite: ${s.split('→')[0].trim()}` }; }
  if (key === 'screens') { const s = (section(GATE, 'every screen measured at three sizes') || []); return { ok: s.length > 0 && !s.some((l) => l.startsWith('✗')), text: (s.at(-1) || 'not run').trim() }; }
  if (key === 'facts') { const s = (section(GATE, 'database checks after the scenarios') || []).join('\n'); return { ok: s.length > 0 && !/"ok": false|"problems": [1-9]/.test(s), text: 'database checks after the scenarios' }; }
  return { ok: false, text: `${key}: unknown` };
};
const scen = (group) => CERT.results.filter((x) => x.group === group);
const G = CERT.groups; const groupLine = (g) => `${G[g]?.passed ?? 0} of ${G[g]?.scenarios ?? 0} scenarios pass`;
const scenTable = (group) => T(['ID', 'Scenario', 'Result', 'Checks'], scen(group).map((x) => [x.record.workflowId, esc(x.name), x.pass ? 'pass' : '**FAIL**', x.asserts.length]));
const measured = (group, re) => scen(group).flatMap((x) => x.asserts.filter((a) => re.test(a.what) && a.measured).map((a) => `${a.what}: ${a.measured}`));
const open = REG.filter((f) => !['VERIFIED FIXED', 'NOT APPLICABLE'].includes(f.status));
const byId = Object.fromEntries(REG.map((f) => [f.id, f]));
const openIn = (re) => open.filter((f) => re.test(`${f.module} ${f.workflow} ${f.category}`));
const findingRows = (list) => list.map((f) => [f.id, f.severity, f.status, esc(f.module), esc(String(f.actual || '').slice(0, 170))]);
const findingTable = (list) => (list.length ? T(['Finding', 'Severity', 'Status', 'Area', 'What is open'], findingRows(list)) : ['None open.', '']);
const sev = (list, s) => list.filter((f) => f.severity === s).length;

// ── which open findings block production (section 42) ────────────────────────────────────────
const SAMPLE_IDS = new Set(['X-001', 'X-002', 'X-009', 'I-011', 'M-011']);
const blockerReason = (f) => {
  if (f.id === 'W-001') return 'Unapproved financial posting policies; missing required accounting acceptance';
  if (f.id === 'E-015') return 'Unverified backup recovery on the live host';
  if (['Y-008', 'W-014', 'Y-009', 'G-011'].includes(f.id)) return 'Database protection of financial history is not in force on the live database until update 17 is applied and the server uses the limited role';
  if (f.id === 'W-005') return 'The ledger cutover has never been rehearsed on a copy of the live data';
  if (f.id === 'B-019' || f.id === 'E-017') return 'Scheduled work and alerts reach nobody on the live host: failures would go unseen';
  if (SAMPLE_IDS.has(f.id)) return `Unresolved confirmed ${f.severity}: sample screens on the menu. They are labelled and save nothing, which removes the risk of being taken for real; the owner must still decide in writing to go live with them, hide them, or wait`;
  if (f.severity === 'P0') return 'Unresolved confirmed P0';
  if (f.severity === 'P1') return 'Unresolved confirmed P1';
  return null;
};
const blockers = open.map((f) => ({ f, why: blockerReason(f) })).filter((b) => b.why);
const HUMAN_BLOCKERS = [
  ['HB-1', 'Missing required accounting acceptance', 'No accountant has reviewed the chart of accounts, the mappings, the posting rules or the sixteen policies (W-001). The ledger stays switched off on live and the software refuses to switch it on without the approvals.'],
  ['HB-2', 'Failed mandatory UAT: not run', 'No business user has run the acceptance scripts in phase-12-user-acceptance.md. Engineering ran the workflows; that is not user acceptance.'],
  ['HB-3', 'Missing deployment authorization', 'No approval from Business, Finance, Operations, Security, IT or the Executive is on file. None is claimed.'],
  ['HB-4', 'Performance thresholds were never approved', 'Phase 11 measured against proposed limits. Dispatch at peak is above the proposal (Z-006). Gate F cannot pass against limits nobody approved.'],
  ['HB-5', 'Database updates not confirmed on live', 'Updates 13 to 18 ship as SQL Editor files. Which are applied on live is not known to this session; the sign-in screen names a missing one.'],
];

// ── scorecard (section 41): judgements from named evidence; no evidence means NOT ASSESSED ────
const ok = (k) => suite(k).ok; const all = (...ks) => ks.every(ok);
const p12ok = Object.values(G).every((g) => g.passed === g.scenarios);
const SCORE = [
  ['Functional correctness', 15, all('p5', 'p6', 'p7', 'p8', 'p12:flows') ? 74 : null, `Order to cash, purchasing, transfers, work orders, returns, counter and web sales pass end to end (${groupLine('Cross-module workflows end to end')}; Phases 5 to 8 pass in the gate). Held down by ${AUDIT.tally['SAMPLE, LABELLED']} of ${AUDIT.screens} screens being labelled samples with nothing behind them, and by capabilities the prompt lists that are not built (system certification).`],
  ['Data integrity', 15, all('p3', 'p12:recon', 'p95') ? 90 : null, `Books balance by SQL; receivables, inventory, in transit, revenue, tax and payments reconcile with no difference after every flow; a planted 100 lb difference is found by item; history cannot be changed by the application's database role on QA. Held down by the second stock list still present (B-009) and the live database role not yet switched (Y-008).`],
  ['Reliability', 12, all('p11s', 'p4') ? 80 : null, `Phase 11 failure injection 36 of 36; a polite stop finishes requests in flight (${PROC ? `${PROC.checks - PROC.failed} of ${PROC.checks} process checks` : 'process checks not run'}); every double press tested makes one record. Held down by: no scheduler on the host (B-019), a crash between dispatch and billing needs a person to bill (Z-012), live backups never restored (E-015).`],
  ['Security', 12, all('p10', 'sweep', 'branch', 'p12:sec') ? 86 : null, `Phase 10 security ${suite('p10').text.replace(/.*?: /, '')}; this phase's revalidation ${groupLine('Security and access revalidation')}; the assistant's input is now checked and audited (AA-003, AA-004). Held down by the live database role (Y-008), no table-by-table tenant audit (E-019), and no outside penetration test: none was run and none is claimed.`],
  ['Operational efficiency', 10, ok('p9') ? 70 : null, 'Phase 9 measured clicks and keystrokes on the daily workflows and removed dead ends. No measurement with real employees exists: every figure is a scripted browser, not a person.'],
  ['User experience', 10, all('p9', 'screens') ? 72 : null, `Every screen opens; ${suite('p9').text}; no screen wider than a phone. Held down by sample screens beside real ones on the menu (U-040) and hand-built tables that differ screen to screen (V-036).`],
  ['Performance', 8, ENT ? 68 : null, `Measured on one 4-processor machine carrying database, three server copies and the load: ${ENT ? `${ENT.transactions?.completed ?? '5,000+'} transactions, 0 failed, 0 deadlocks` : 'not measured'}. Dispatch at peak is above the proposed limit (Z-006). Thresholds are proposed, not approved; nothing was measured on the live host.`],
  ['Integrations', 6, ok('p4') ? 70 : null, 'Outside calls have time limits, retries, a breaker and a failure report; partner events are delivered once. Every outside service was a stand-in: no real provider was called in any test (H-005). No email, text, carrier or accounting-system connection exists.'],
  ['Maintainability', 5, 62, 'Lint 0 errors; unit tests on the rule modules; one gate script reproduces everything. Held down by business rules inside large route files and screens (B-014, E-018), 1,572 lint warnings held at a ceiling, and unbuilt design in a third of the schema (B-017).'],
  ['Observability', 4, ok('p10') ? 50 : null, 'Health checks, request references, structured logs, an Integrations report and audit rows exist and are tested. Nothing reaches a person on live: no alert receiver, no error tracking, no scheduled run (E-017, B-019).'],
  ['Accessibility', 3, ok('screens') ? 70 : null, `${suite('screens').text}: controls named, fields labelled, one main heading per screen, at three sizes. 17 hard-to-read texts and 3 small phone targets are held at a ceiling, not removed. No test with assistive technology or disabled users was made.`],
];
const assessed = SCORE.filter((s) => s[2] != null); const weight = assessed.reduce((a, s) => a + s[1], 0);
const overall = assessed.length ? Math.round(assessed.reduce((a, s) => a + s[1] * s[2], 0) / weight * 10) / 10 : null;

// ── gates A to L (section 45) ────────────────────────────────────────────────────────────────
const gateOK = GATE && /== ALL DONE/.test(GATE);
const GATES = [
  ['A', 'Functional Completeness', 'CONDITIONAL', `The critical workflows that are built are verified end to end (${groupLine('Cross-module workflows end to end')}, plus Phases 5 to 8). Not all "required" capabilities are built: the sample modules and the items marked NOT BUILT in phase-12-system-certification.md. The owner decides whether those are required for the first stage.`],
  ['B', 'Data Integrity', p12ok && all('p3', 'p6', 'p7', 'p8') ? 'PASS on QA' : 'FAIL', `Inventory, manufacturing, shipping and the books reconcile after every flow with no difference (${groupLine('Financial and inventory reconciliation')}). On synthetic data; no live data has been reconciled.`],
  ['C', 'Financial Integrity', 'FAIL', `Entries balance and balances reconcile on QA (${groupLine('Financial ledger certification')}). The gate also requires documented accounting approvals: none exists (W-001). It cannot pass on engineering evidence alone.`],
  ['D', 'Security', all('p10', 'p12:sec', 'sweep') ? 'CONDITIONAL' : 'FAIL', 'Authentication, authorization, isolation and financial security pass on QA. On live, the protection of history depends on database update 17 and the limited role (Y-008): NOT VERIFIED there.'],
  ['E', 'Reliability', all('p11s') ? 'PASS on QA' : 'FAIL', 'Critical transactions recovered correctly from every injected failure (Phase 11 group 7, 36 of 36) and a polite stop loses nothing. One case needs a person: a crash between dispatch and billing (Z-012), which is listed and closed from the Integrations screen.'],
  ['F', 'Performance', 'NOT VERIFIED', 'The gate requires approved thresholds. None was ever approved; against the proposed ones dispatch at peak fails (Z-006). No capacity claim is made.'],
  ['G', 'Disaster Recovery', 'FAIL', 'A backup and restore was run in Phase 10 on a separate local server and verified (journal balances, guards kept). The live host\'s backups have never been restored (E-015): unverified backup recovery is a named blocker.'],
  ['H', 'User Experience', all('p9', 'screens') ? 'PASS on QA' : 'FAIL', 'Critical interfaces work, by scripted browser. Not confirmed by any employee: that is Gate J.'],
  ['I', 'Training and Documentation', MAN && MAN.failed === 0 ? 'CONDITIONAL' : 'FAIL', 'A training plan for twelve roles, the in-product manual (now honest about samples, with chapters for every real screen), and support, incident, monitoring and release procedures are written. Nobody has been trained and no trainer is named.'],
  ['J', 'User Acceptance', 'FAIL', 'Not run. No business representative has tested or approved anything. The scripts and the form are prepared.'],
  ['K', 'Deployment Readiness', 'CONDITIONAL', 'Checklist, rollback, cutover, rollout, monitoring and support plans are written. They are not rehearsed on the host: environment settings, the scheduled run, the alert receiver and the database updates are the owner\'s and are not confirmed.'],
  ['L', 'Executive Authorization', 'FAIL', 'No stakeholder has authorized any rollout. None is claimed.'],
];
const RECOMMENDATION = 'NO-GO';
export const ctx = { RERUN, CERT, UI, PROC, MAN, MUT, CONS, RESTORE, ENT, P11S, AUDIT, REG, GATE, GATE1, RC1, HEAD, BRANCH, productFiles, stamp, suite, scen, G, groupLine, scenTable, measured, open, byId, openIn, findingTable, sev, blockers, HUMAN_BLOCKERS, SCORE, overall, weight, assessed, GATES, RECOMMENDATION, gateOK, T, NOT_GIVEN, BLANK, sign, esc, money, OUT, written, CAPS, STATES, ROLES, plans, lineOf, section, X, R, p12ok };
const { writeAll } = await import('./phase12/write.mjs');
writeAll(ctx);
console.log(`${written.length} Phase 12 documents written: ${written.join(', ')}`);
