#!/usr/bin/env node
// Prints what a ui-audit result still finds, grouped, a line per group.  node qa/tools/ui-audit-report.cjs [file]
const r = require(require('node:path').resolve(process.argv[2] || 'qa/results/ui-audit.json')).results;
const d = r.filter((x) => x.viewport === 'desktop');
const group = (key) => { const m = {}; for (const x of d) for (const u of x[key] || []) { const k = `${u.kind} ${u.icon || u.placeholder || '-'}`; (m[`${x.route} ${k}`] ||= 0); m[`${x.route} ${k}`] += 1; } return Object.entries(m).map(([k, n]) => `${n}x ${k}`); };
console.log('UNNAMED:', group('unnamed').join(' | ') || 'none');
console.log('UNLABELLED:', group('unlabelled').join(' | ') || 'none');
console.log('NO H1:', d.filter((x) => x.h1 === 0).map((x) => `${x.route}${x.hasParam ? `(${x.onRealRecord ? 'real' : 'no record'})` : ''}[${x.firstHeading}]`).join(' | ') || 'none');
console.log('SEVERAL H1:', d.filter((x) => x.h1 > 1).map((x) => `${x.route} ${x.h1}`).join(' | ') || 'none');
for (const v of ['desktop', 'tablet', 'phone']) console.log(`OVERFLOW ${v}:`, r.filter((x) => x.viewport === v && x.overflowX > 1).map((x) => `${x.route} +${x.overflowX}`).join(' | ') || 'none');
console.log('SMALL TARGETS:', r.filter((x) => x.viewport === 'phone' && (x.smallTargets || []).length).map((x) => `${x.route} ${x.smallTargets.length} e.g. ${x.smallTargets[0].kind} "${x.smallTargets[0].name}" ${x.smallTargets[0].w}x${x.smallTargets[0].h}`).join(' | ') || 'none');
console.log('PAGE ERRORS:', r.filter((x) => x.pageErrors.length).map((x) => `${x.viewport} ${x.route}: ${x.pageErrors[0]}`).join(' | ') || 'none');
const t = {}; for (const x of d) (t[x.title] ||= []).push(x.route);
console.log('SHARED TITLES:', Object.entries(t).filter(([, v]) => v.length > 1).map(([k, v]) => `${k} (${v.length})`).join(' | ') || 'none');
