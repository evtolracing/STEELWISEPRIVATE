#!/usr/bin/env node
// Phase 9: a button on a sample screen that has no action says, when pressed, that it is not built.
// Run from src/frontend:  node ../../qa/tools/codemods/phase9-not-built.cjs [--write]
// Buttons on real screens are not touched: each of those was connected or removed by hand.
const fs = require('node:fs');
const path = require('node:path');
const parser = require(path.resolve('node_modules/@babel/parser'));
const traverse = require(path.resolve('node_modules/@babel/traverse')).default;
const WRITE = process.argv.includes('--write');
const SRC = path.resolve('src');
const audit = JSON.parse(fs.readFileSync(path.resolve('../../qa/.screen-audit.json'), 'utf8'));
const files = new Set(audit.rows.filter((r) => ['SAMPLE, LABELLED', 'MIXED'].includes(r.verdict) && r.file).map((r) => path.join(SRC, r.file)));
// The screens of the sample sub-applications.
for (const dir of ['apps/safety']) for (const f of fs.readdirSync(path.join(SRC, dir))) if (/\.jsx$/.test(f)) files.add(path.join(SRC, dir, f));
const nameOf = (n) => (n.type === 'JSXIdentifier' ? n.name : '');
const has = (el, n) => el.openingElement.attributes.some((a) => a.type === 'JSXAttribute' && a.name.name === n);
let total = 0; let changed = 0; const left = [];
for (const file of [...files].filter((f) => fs.existsSync(f))) {
  const text = fs.readFileSync(file, 'utf8');
  const ast = parser.parse(text, { sourceType: 'module', plugins: ['jsx'] });
  const edits = [];
  traverse(ast, {
    JSXElement(p) {
      const el = p.node; const n = nameOf(el.openingElement.name);
      if (!['Button', 'IconButton', 'Fab'].includes(n)) return;
      if (el.openingElement.attributes.some((a) => a.type === 'JSXSpreadAttribute')) return;
      if (['onClick', 'href', 'to', 'component', 'onMouseDown', 'type', 'form', 'disabled'].some((k) => has(el, k))) return;
      // A button inside something that takes the click itself (a row, a card, an accordion header) acts through it.
      for (let q = p.parentPath, i = 0; q && i < 8; q = q.parentPath) {
        if (q.node.type !== 'JSXElement') continue; i += 1;
        const pn = nameOf(q.node.openingElement.name);
        if ((has(q.node, 'onClick') && pn !== 'TableCell') || ['AccordionSummary', 'label', 'CardActionArea', 'ListItemButton'].includes(pn)) { left.push(`${path.relative(SRC, file)}:${el.loc.start.line} acts through <${pn}>`); return; }
      }
      edits.push({ at: el.openingElement.name.end, text: ' onClick={notBuilt}' });
    },
  });
  if (!edits.length) continue;
  total += edits.length; changed += 1;
  if (!WRITE) continue;
  let out = text;
  for (const e of edits.sort((a, b) => b.at - a.at)) out = out.slice(0, e.at) + e.text + out.slice(e.at);
  if (!/from ['"][./]+\/utils\/notBuilt['"]/.test(out)) {
    let rel = path.relative(path.dirname(file), path.join(SRC, 'utils/notBuilt')).replace(/\\/g, '/'); if (!rel.startsWith('.')) rel = `./${rel}`;
    const imports = ast.program.body.filter((b) => b.type === 'ImportDeclaration');
    const at = imports.length ? imports[imports.length - 1].end : 0;
    out = `${out.slice(0, at)}\nimport { notBuilt } from '${rel}'${out.slice(at)}`;
  }
  parser.parse(out, { sourceType: 'module', plugins: ['jsx'] });
  fs.writeFileSync(file, out);
}
console.log(JSON.stringify({ write: WRITE, sampleFiles: files.size, filesChanged: changed, buttonsGivenTheNotice: total, actThroughTheirContainer: left.length }));
for (const l of left) console.log(`  ${l}`);
