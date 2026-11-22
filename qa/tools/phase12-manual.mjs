#!/usr/bin/env node
// Phase 12: the in-app manual is checked against the product, so that it documents no screen that does
// not exist and does not present a sample screen as a working one (X-010, M-018, S-024, AA-006).
//   1. every route a chapter names is in the router (a wildcard route covers its children);
//   2. a chapter whose screens are sample screens is flagged `sample` (the page then shows a notice),
//      and a chapter with some sample screens names them in `sampleRoutes`;
//   3. every real screen on the menu has a chapter;
//   4. the chapters Phase 12 requires exist.
//   node qa/tools/phase12-manual.mjs [--out qa/results/phase12-manual.json]
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const arg = (k, d) => { const i = process.argv.indexOf(`--${k}`); return i > 0 ? process.argv[i + 1] : d; };
const OUT = arg('out', 'qa/results/phase12-manual.json');
const manual = (await import(pathToFileURL(path.join(root, 'src/frontend/src/help/manualContent.js')).href)).default;
const audit = JSON.parse(fs.readFileSync(path.join(root, 'qa/.screen-audit.json'), 'utf8'));
const router = fs.readFileSync(path.join(root, 'src/frontend/src/router/AppRouter.jsx'), 'utf8');
const paths = [...router.matchAll(/path:\s*'([^']*)'/g)].map((m) => `/${m[1].replace(/^\//, '')}`);
const exact = new Set(paths.filter((p) => !p.includes('*') && !p.includes(':')));
const wild = paths.filter((p) => p.endsWith('/*')).map((p) => p.slice(0, -2));
const exists = (r) => exact.has(r) || wild.some((w) => r === w || r.startsWith(`${w}/`));
const verdict = Object.fromEntries(audit.rows.map((r) => [`/${r.route.replace(/^\//, '')}`, r.verdict]));
const isSample = (r) => /SAMPLE/.test(verdict[r] || '');
const checks = []; const ok = (what, cond, detail = '') => { checks.push({ what, ok: Boolean(cond), detail: String(detail).slice(0, 600) }); if (!cond) console.log(`✗ ${what}: ${detail}`); };

const chapters = manual.map((m) => { const routes = m.routes || []; const samples = routes.filter(isSample); return { id: m.moduleId, title: m.title, routes, missing: routes.filter((r) => !exists(r)), samples, allSample: routes.length > 0 && samples.length === routes.length, flagged: m.sample === true, named: m.sampleRoutes || [] }; });
for (const c of chapters) {
  ok(`${c.id}: every route named exists`, c.missing.length === 0, c.missing.join(', '));
  if (c.allSample) ok(`${c.id}: all its screens are samples, so the chapter is flagged as a sample`, c.flagged, `${c.samples.length} sample screens`);
  else if (c.samples.length) ok(`${c.id}: its sample screens are named so the page can say which`, c.samples.every((r) => c.named.includes(r)), c.samples.filter((r) => !c.named.includes(r)).join(', '));
  if (!c.samples.length) ok(`${c.id}: not flagged as a sample when none of its screens is`, !c.flagged && c.named.length === 0, 'flagged');
  ok(`${c.id}: has sections with content`, (manual.find((m) => m.moduleId === c.id).sections || []).every((s) => s.id && s.title && s.blocks?.length), 'an empty section');
}
ok('chapter ids are unique', new Set(chapters.map((c) => c.id)).size === chapters.length);
const covered = new Set(chapters.flatMap((c) => c.routes));
const uncovered = audit.rows.filter((r) => r.verdict === 'REAL' && r.onMenu && !covered.has(`/${r.route}`) && !chapters.some((c) => c.routes.some((x) => `/${r.route}`.startsWith(`${x}/`)))).map((r) => r.route);
ok('every real screen on the menu has a chapter', uncovered.length === 0, uncovered.join(', '));
for (const need of ['finance-ledger', 'purchasing', 'transfers', 'work-orders', 'invoices-returns', 'when-something-goes-wrong']) ok(`required chapter present: ${need}`, chapters.some((c) => c.id === need));
// 2026-11-22: the screens rebuilt on real data are documented as they now work, section by section.
const section = (chapter, id) => (manual.find((m) => m.moduleId === chapter)?.sections || []).find((x) => x.id === id);
const says = (chapter, id, pattern) => pattern.test(JSON.stringify(section(chapter, id) || ''));
ok('admin-settings: adding, changing and switching off a location is described', says('admin-settings', 'configure-locations', /Add location/) && says('admin-settings', 'configure-locations', /Switch off/));
ok('admin-settings: staff with no branch is described', says('admin-settings', 'staff-with-no-branch', /Show them/));
ok('admin-settings: cut-off times point to Online Settings, not to a screen that does not exist', says('admin-settings', 'set-cutoff-times', /Online Settings/) && !says('admin-settings', 'set-cutoff-times', /Locations → select/));
ok('online settings: says a branch with no times promises nothing', [...manual].some((m) => /promises nothing/.test(JSON.stringify((m.sections || []).find((x) => x.id === 'online-settings') || ''))));
ok('freight: the planner, board, inbox and proof of delivery are described from real records', says('freight-delivery', 'shipment-planner', /Plan shipment/) && says('freight-delivery', 'tracking-board', /Show more/) && says('freight-delivery', 'exception-inbox', /no proof of delivery/) && Boolean(section('freight-delivery', 'proof-of-delivery')));
ok('freight: no carrier scan events, live rates or customer emails are promised', !/carrier scan events|Send Update to Customer|queries connected carriers/.test(JSON.stringify(manual.find((m) => m.moduleId === 'freight-delivery'))));
ok('demand shaping: how busy a branch is, is explained', /active machines times 10 hours/.test(JSON.stringify(manual)));
const text = JSON.stringify(manual);
for (const [bad, why] of [[/Alro/i, 'another company\'s name'], [/lorem ipsum/i, 'placeholder text'], [/\bTODO\b|\bTBD\b/, 'unfinished text']]) ok(`no ${why} in the manual`, !bad.test(text), (text.match(bad) || [''])[0]);

// The page must show the flag: the notice is in the component both the manual page and the help drawer use.
{ const src = fs.readFileSync(path.join(root, 'src/frontend/src/components/help/HelpAccordion.jsx'), 'utf8');
  ok('the manual page shows a notice above a sample chapter', /module\.sample \|\| module\.sampleRoutes/.test(src) && /manual-sample-notice/.test(src) && /design samples/.test(src)); }
const failed = checks.filter((c) => !c.ok).length;
fs.writeFileSync(path.resolve(root, OUT), `${JSON.stringify({ ranAt: new Date().toISOString(), chapters: chapters.length, sampleChapters: chapters.filter((c) => c.flagged).map((c) => c.id), partSampleChapters: chapters.filter((c) => c.named.length).map((c) => c.id), realScreensOnMenu: audit.rows.filter((r) => r.verdict === 'REAL' && r.onMenu).length, checks: checks.length, failed, results: checks }, null, 1)}\n`);
console.log(`Manual: ${chapters.length} chapters, ${checks.length} checks, ${failed} failed → ${OUT}`);
process.exit(failed ? 1 : 0);
