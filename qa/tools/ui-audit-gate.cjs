#!/usr/bin/env node
// Phase 9 ratchet over a ui-audit result: the counts may fall and may not rise.
//   node qa/tools/ui-audit-gate.cjs [result file]        compares with qa/ui-audit-ceilings.json
//   node qa/tools/ui-audit-gate.cjs [result file] --set  writes the ceilings from this result (do this only after a fix)
const fs = require('node:fs'); const path = require('node:path');
const file = path.resolve(process.argv[2] && !process.argv[2].startsWith('--') ? process.argv[2] : 'qa/results/ui-audit.json'); const CEIL = path.resolve('qa/ui-audit-ceilings.json');
const r = JSON.parse(fs.readFileSync(file)).results; const d = r.filter((x) => x.viewport === 'desktop'); const sum = (rows, f) => rows.reduce((s, x) => s + f(x), 0);
const now = {
  screens: d.length,
  controlsWithNoName: sum(d, (x) => (x.unnamed || []).length),
  fieldsWithNoLabel: sum(d, (x) => (x.unlabelled || []).length),
  hardToReadTexts: sum(d, (x) => (x.contrast || []).reduce((s, c) => s + c.count, 0)),
  screensWithNoMainHeading: d.filter((x) => x.h1 === 0).length,
  screensWithSeveralMainHeadings: d.filter((x) => x.h1 > 1).length,
  screensWiderThanTheWindow: r.filter((x) => x.overflowX > 1).length,
  smallTargetsOnAPhone: sum(r.filter((x) => x.viewport === 'phone'), (x) => (x.smallTargets || []).length),
  screensWithAPageError: r.filter((x) => (x.pageErrors || []).length).length,
  screensSharingATitle: (() => { const t = {}; for (const x of d) t[x.title] = (t[x.title] || 0) + 1; return Object.values(t).filter((n) => n > 1).reduce((s, n) => s + n, 0); })(),
};
if (process.argv.includes('--set')) { const { screens, ...ceil } = now; fs.writeFileSync(CEIL, JSON.stringify({ note: 'Ceilings for qa/tools/ui-audit-gate.cjs. Lower them when a count falls; never raise one to pass.', screensMeasured: screens, ceilings: ceil }, null, 1)); console.log('ceilings written', JSON.stringify(ceil)); process.exit(0); }
const { ceilings } = JSON.parse(fs.readFileSync(CEIL)); let bad = 0;
for (const [k, max] of Object.entries(ceilings)) { const over = now[k] > max; if (over) bad += 1; console.log(`${over ? '✗' : '✓'} ${k}: ${now[k]} (ceiling ${max})`); }
console.log(`${now.screens} screens measured; ${bad} count${bad === 1 ? '' : 's'} over the ceiling`); process.exit(bad ? 1 : 0);
