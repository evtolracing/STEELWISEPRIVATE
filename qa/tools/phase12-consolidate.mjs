#!/usr/bin/env node
// Phase 12: consolidates Phases 1 to 11 and 9.5 from the files on record, and audits the evidence behind
// every finding marked VERIFIED FIXED. It trusts no report: for each fixed finding it looks for the named
// test in the test code itself, and says which of three kinds of evidence the finding has.
//   named    the verification quotes a test name that is in the test code
//   suite    it names a test file that exists, but no test by name
//   words    it describes evidence in words only (a code read, a run by hand)
// It changes nothing.   node qa/tools/phase12-consolidate.mjs [--out qa/results/phase12-consolidation.json]
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const arg = (k, d) => { const i = process.argv.indexOf(`--${k}`); return i > 0 ? process.argv[i + 1] : d; };
const OUT = arg('out', 'qa/results/phase12-consolidation.json');
const X = (p) => path.join(root, p);
const walk = (d, o = []) => { for (const f of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, f.name); if (f.isDirectory()) { if (f.name !== 'node_modules') walk(p, o); } else if (/\.(mjs|cjs|js|sh)$/.test(f.name)) o.push(p); } return o; };
const testFiles = [...walk(X('qa/sim')), ...walk(X('qa/tools')), ...walk(X('src/backend/test'))];
const corpus = testFiles.map((f) => fs.readFileSync(f, 'utf8')).join('\n').replace(/\\'/g, "'");
const reg = JSON.parse(fs.readFileSync(X('qa/enterprise-excellence/findings.json'), 'utf8')).findings;
const state = JSON.parse(fs.readFileSync(X('qa/enterprise-excellence/phase-state.json'), 'utf8'));

// ── the phases, from their own reports ───────────────────────────────────────────────────────
const PHASES = [['1', '01', 'Discovery and baseline'], ['2', '02', 'Architecture and code quality'], ['3', '03', 'Database and data integrity'], ['4', '04', 'API, events and integrations'], ['5', '05', 'Sales, CRM, POS and e-commerce'], ['6', '06', 'Inventory, purchasing and warehouse'], ['7', '07', 'Manufacturing and quality'], ['8', '08', 'Shipping, logistics and invoicing'], ['9', '09', 'User experience and productivity'], ['9.5', '09-5', 'Financial ledger'], ['10', '10', 'Security, reliability and recovery'], ['11', '11', '80-location enterprise simulation']];
const STATUS = /VERIFIED COMPLETE|PARTIALLY COMPLETE|IMPLEMENTED — VERIFICATION INCOMPLETE/;
const phases = PHASES.map(([n, file, name]) => {
  const p = X(`qa/enterprise-excellence/phase-${file}-report.md`); const text = fs.existsSync(p) ? fs.readFileSync(p, 'utf8') : '';
  const line = text.split('\n').find((l) => /completion status|^\*\*(PARTIALLY|IMPLEMENTED|VERIFIED)/i.test(l) && STATUS.test(l)) || text.split('\n').find((l) => STATUS.test(l) && !/not VERIFIED COMPLETE|from VERIFIED COMPLETE/.test(l)) || '';
  const status = (line.match(/PARTIALLY COMPLETE|IMPLEMENTED — VERIFICATION INCOMPLETE|VERIFIED COMPLETE/) || ['NOT ON FILE'])[0];
  const docs = fs.readdirSync(X('qa/enterprise-excellence')).filter((f) => f.startsWith(`phase-${file}-`) && f.endsWith('.md')).length;
  return { phase: n, name, reportOnFile: Boolean(text), reportedStatus: status, documents: docs };
});

// ── findings by phase letter ─────────────────────────────────────────────────────────────────
const open = (f) => !['VERIFIED FIXED', 'NOT APPLICABLE'].includes(f.status);
const count = (list, key) => list.reduce((a, f) => ({ ...a, [key(f)]: (a[key(f)] || 0) + 1 }), {});
const bySeries = {}; for (const f of reg) { const s = f.id.split('-')[0]; (bySeries[s] ||= { total: 0, open: 0, openP0P1: 0 }); bySeries[s].total++; if (open(f)) { bySeries[s].open++; if (/P0|P1/.test(f.severity)) bySeries[s].openP0P1++; } }

// ── the evidence behind each fixed finding ───────────────────────────────────────────────────
const classes = { named: [], suite: [], words: [], none: [] }; const missingFiles = []; const contradictions = [];
for (const f of reg) {
  const v = String(f.verification || ''); const all = `${v} ${f.statusNote || ''} ${f.correction || ''}`;
  if (f.status === 'VERIFIED FIXED') {
    const quotes = [...v.matchAll(/"([^"]{12,})"/g)].map((m) => m[1]);
    const hit = quotes.some((q) => corpus.includes(q) || corpus.includes(q.slice(0, 28)));
    const refs = [...v.matchAll(/((?:qa|src)\/[\w./-]+\.(?:mjs|cjs|sh|js(?!on)))/g)].map((m) => m[1]);
    const there = refs.filter((r) => fs.existsSync(X(r))); refs.filter((r) => !fs.existsSync(X(r))).forEach((r) => missingFiles.push({ id: f.id, file: r }));
    (hit ? classes.named : there.length ? classes.suite : v.trim() ? classes.words : classes.none).push(f.id);
    if (/NOT VERIFIED|not exercised|not yet run|awaiting verification|no automated check/i.test(all)) contradictions.push({ id: f.id, severity: f.severity, status: f.status, answeredInPhase12: (String(f.statusNote || '').match(/Phase 12: [^]*$/) || [''])[0].slice(0, 400), says: (all.match(/[^.]*(NOT VERIFIED|not exercised|not yet run|awaiting verification|no automated check)[^.]*\.?/i) || [''])[0].trim().slice(0, 240) });
  }
  if (/DEFERRED/.test(f.status) && !/approv/i.test(f.status === 'DEFERRED WITH APPROVAL' ? 'approv' : '')) { /* counted below */ }
}
const notAllowed = reg.filter((f) => !['VERIFIED FIXED', 'FIXED — NOT VERIFIED', 'IN PROGRESS', 'BLOCKED', 'DEFERRED WITH APPROVAL', 'REQUIRES BUSINESS DECISION', 'ACCEPTED RISK WITH APPROVAL', 'NOT APPLICABLE'].includes(f.status)).map((f) => ({ id: f.id, severity: f.severity, status: f.status }));

// ── documents outside the program that claim more than the evidence ──────────────────────────
const CLAIMS = [/production[- ]ready/i, /✅\s*(deployment )?complete/i, /fully (implemented|functional|operational)/i, /100% (complete|coverage)/i, /enterprise[- ]grade/i, /Alro/i];
const tracked = execSync('git ls-files "*.md"', { cwd: root }).toString().split('\n').filter((f) => f && !f.startsWith('qa/') && !f.includes('node_modules'));
const overclaims = [];
for (const f of tracked) { const t = fs.readFileSync(X(f), 'utf8'); const hits = CLAIMS.map((re) => (t.match(new RegExp(re.source, 'gi')) || []).length); const n = hits.reduce((a, b) => a + b, 0); if (n) overclaims.push({ file: f, claims: n, carriesStatusNotice: /Status notice \(2026-11-19, Phase 12 certification\)/.test(t), example: (t.split('\n').find((l) => CLAIMS.some((re) => re.test(l))) || '').trim().slice(0, 160) }); }
overclaims.sort((a, b) => b.claims - a.claims);

const out = {
  ranAt: new Date().toISOString(), commit: execSync('git rev-parse --short HEAD', { cwd: root }).toString().trim(),
  phases, phasesVerifiedComplete: phases.filter((p) => p.reportedStatus === 'VERIFIED COMPLETE').length,
  findings: { total: reg.length, open: reg.filter(open).length, byStatus: count(reg, (f) => f.status), bySeverity: count(reg, (f) => f.severity), openBySeverity: count(reg.filter(open), (f) => f.severity), bySeries },
  openP0P1: reg.filter((f) => open(f) && /P0|P1/.test(f.severity)).map((f) => ({ id: f.id, severity: f.severity, status: f.status, module: f.module })),
  statusesNotAllowedInPhase12: notAllowed,
  evidence: { verifiedFixed: reg.filter((f) => f.status === 'VERIFIED FIXED').length, testFilesRead: testFiles.length, named: classes.named.length, suite: classes.suite.length, words: classes.words.length, none: classes.none.length, suiteOnly: classes.suite, wordsOnly: classes.words, noEvidence: classes.none, filesNamedButMissing: missingFiles },
  contradictions, documentsThatOverclaim: overclaims,
  pullRequests: [...(state.previousPullRequests || []), state.pullRequest].filter(Boolean),
  unverifiedAreasCarried: state.unverifiedAreas || [], blockersCarried: state.currentBlockers || [],
};
fs.writeFileSync(path.resolve(root, OUT), `${JSON.stringify(out, null, 1)}\n`);
console.log(`Consolidation: ${phases.length} phases (${out.phasesVerifiedComplete} verified complete), ${reg.length} findings (${out.findings.open} open, ${out.openP0P1.length} open P0 or P1), ${notAllowed.length} with a status Phase 12 does not allow`);
console.log(`Evidence behind ${out.evidence.verifiedFixed} fixed findings: ${classes.named.length} name a test that exists, ${classes.suite.length} name a suite only, ${classes.words.length} are words only, ${classes.none.length} have none; ${contradictions.length} carry an earlier note that contradicts their status (${contradictions.filter((c) => c.answeredInPhase12).length} answered by a Phase 12 note); ${missingFiles.length} name a file that is not there; ${overclaims.length} documents outside qa/ overclaim`);
